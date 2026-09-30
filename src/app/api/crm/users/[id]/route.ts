// PATCH  /api/crm/users/:id — edit name, email, phone, role, password, quota, active.
// DELETE /api/crm/users/:id — permanently remove (owner only; history is kept).
import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  adminClient, audit, canManage, errorResponse, HttpError, NO_STORE, readJson, requireCaller,
} from '@/lib/server/crmServer';
import { isEmail, isPhoneOnlyEmail, normalizePhone, passwordProblem, phoneOnlyEmail } from '@/lib/crm/normalize';
import type { AppRole, Database } from '@/lib/database.types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const Body = z
  .object({
    full_name: z.string().trim().min(2, 'Enter the full name.').max(80).optional(),
    email: z.string().trim().max(200).nullable().optional(),
    phone: z.string().trim().max(32).nullable().optional(),
    role: z.enum(['owner', 'admin', 'member']).optional(),
    password: z.string().max(200).optional(),
    is_active: z.boolean().optional(),
    daily_lead_quota: z.number().int().min(0).max(500).nullable().optional(),
  })
  .strict();

type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

async function otherActiveOwners(excludeId: string): Promise<number> {
  const { count } = await adminClient()
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('role', 'owner')
    .eq('is_active', true)
    .neq('id', excludeId);
  return count ?? 0;
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const params = await ctx.params;
  try {
    const caller = await requireCaller(req);
    if (!UUID.test(params.id)) throw new HttpError(404, 'not_found', 'User not found.');
    const parsed = Body.safeParse(await readJson(req));
    if (!parsed.success) throw new HttpError(400, 'invalid_input', parsed.error.issues[0]?.message ?? 'Check the form.');
    const b = parsed.data;

    const admin = adminClient();
    const { data: target } = await admin.from('profiles').select('*').eq('id', params.id).maybeSingle();
    if (!target) throw new HttpError(404, 'not_found', 'User not found.');

    const isSelf = target.id === caller.id;
    if (isSelf) {
      if (b.role !== undefined || b.is_active !== undefined || b.password !== undefined || b.daily_lead_quota !== undefined) {
        throw new HttpError(403, 'not_authorized', 'Change your own password from "My account". Role and status are set by an owner.');
      }
    } else if (!canManage(caller.role, target.role as AppRole)) {
      throw new HttpError(403, 'not_authorized', 'You cannot manage this account.');
    }
    if (b.role && !isSelf && !canManage(caller.role, b.role)) {
      throw new HttpError(403, 'not_authorized', 'You cannot give that role.');
    }
    const losingOwner = target.role === 'owner' && ((b.role && b.role !== 'owner') || b.is_active === false);
    if (losingOwner && (await otherActiveOwners(target.id)) === 0) {
      throw new HttpError(409, 'last_owner', 'There must always be at least one active owner.');
    }

    const { data: authUser, error: getErr } = await admin.auth.admin.getUserById(target.id);
    if (getErr || !authUser.user) throw new HttpError(404, 'not_found', 'User not found.');
    const currentAuthEmail = authUser.user.email ?? '';

    const profile: ProfileUpdate = {};
    const authPatch: {
      email?: string; email_confirm?: boolean; password?: string; ban_duration?: string;
      app_metadata?: Record<string, unknown>; user_metadata?: Record<string, unknown>;
    } = {};
    const changed: string[] = [];

    if (b.full_name !== undefined && b.full_name !== target.full_name) {
      profile.full_name = b.full_name;
      authPatch.user_metadata = { full_name: b.full_name };
      changed.push('full_name');
    }

    let newPhone = target.phone;
    if (b.phone !== undefined) {
      newPhone = b.phone ? normalizePhone(b.phone) : null;
      if (b.phone && !newPhone) throw new HttpError(400, 'invalid_input', 'Enter a valid phone number.');
      if (newPhone && newPhone !== target.phone) {
        const { data: taken } = await admin.from('profiles').select('id').eq('phone', newPhone).neq('id', target.id).maybeSingle();
        if (taken) throw new HttpError(409, 'phone_taken', 'That phone number already belongs to a team member.');
      }
      if (newPhone !== target.phone) {
        profile.phone = newPhone;
        changed.push('phone');
      }
    }

    if (b.email !== undefined) {
      const wanted = b.email ? b.email.toLowerCase() : null;
      if (wanted && !isEmail(wanted)) throw new HttpError(400, 'invalid_input', 'Enter a valid email address.');
      if (wanted && wanted !== currentAuthEmail) {
        authPatch.email = wanted;
        authPatch.email_confirm = true;
        profile.email = wanted;
        changed.push('email');
      } else if (!wanted && !isPhoneOnlyEmail(currentAuthEmail)) {
        if (!newPhone) throw new HttpError(400, 'invalid_input', 'Keep an email or a phone number to sign in with.');
        const synthetic = phoneOnlyEmail(newPhone);
        authPatch.email = synthetic;
        authPatch.email_confirm = true;
        profile.email = synthetic;
        changed.push('email');
      }
    }
    const finalEmail = authPatch.email ?? currentAuthEmail;
    if (isPhoneOnlyEmail(finalEmail) && !newPhone) {
      throw new HttpError(400, 'invalid_input', 'Keep an email or a phone number to sign in with.');
    }

    if (b.role !== undefined && b.role !== target.role) {
      profile.role = b.role;
      if (b.role !== 'member') profile.daily_lead_quota = null;
      authPatch.app_metadata = { ...(authUser.user.app_metadata ?? {}), crm_role: b.role };
      changed.push('role');
    }
    if (b.daily_lead_quota !== undefined && b.daily_lead_quota !== target.daily_lead_quota) {
      if ((b.role ?? target.role) !== 'member' && b.daily_lead_quota !== null) {
        throw new HttpError(400, 'invalid_input', 'Only members have a daily lead quota.');
      }
      profile.daily_lead_quota = b.daily_lead_quota;
      changed.push('daily_lead_quota');
    }
    if (b.password !== undefined) {
      const pwErr = passwordProblem(b.password);
      if (pwErr) throw new HttpError(400, 'invalid_input', pwErr);
      authPatch.password = b.password;
      changed.push('password');
    }
    if (b.is_active !== undefined && b.is_active !== target.is_active) {
      profile.is_active = b.is_active;
      // Banning also stops token refresh; RLS already refuses an inactive profile.
      authPatch.ban_duration = b.is_active ? 'none' : '876000h';
      changed.push(b.is_active ? 'reactivated' : 'deactivated');
    }

    if (changed.length === 0) return NextResponse.json({ ok: true, changed }, { headers: NO_STORE });

    if (Object.keys(authPatch).length > 0) {
      const { error } = await admin.auth.admin.updateUserById(target.id, authPatch);
      if (error) {
        if (/already|registered|exists/i.test(error.message)) {
          throw new HttpError(409, 'email_taken', 'That email already has an account.');
        }
        throw new HttpError(400, 'auth_error', error.message);
      }
    }
    if (Object.keys(profile).length > 0) {
      const { error } = await admin.from('profiles').update(profile).eq('id', target.id);
      if (error) throw new HttpError(500, 'profile_failed', 'Saved the sign-in details but not the profile. Try again.');
    }
    if (b.is_active === false) {
      // A deactivated member's open pipeline goes back to the pool.
      await admin.from('leads').update({ owner_id: null }).eq('owner_id', target.id).is('deleted_at', null)
        .not('stage', 'in', '(won,lost,dnc)');
    }

    await audit(caller.id, 'user.update', 'profile', target.id, { changed });
    return NextResponse.json({ ok: true, changed }, { headers: NO_STORE });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const params = await ctx.params;
  try {
    const caller = await requireCaller(req);
    if (caller.role !== 'owner') throw new HttpError(403, 'not_authorized', 'Only an owner can delete accounts.');
    if (!UUID.test(params.id)) throw new HttpError(404, 'not_found', 'User not found.');
    if (params.id === caller.id) throw new HttpError(409, 'self', 'You cannot delete your own account.');

    const admin = adminClient();
    const { data: target } = await admin.from('profiles').select('id, role, full_name, email').eq('id', params.id).maybeSingle();
    if (!target) throw new HttpError(404, 'not_found', 'User not found.');
    if (target.role === 'owner' && (await otherActiveOwners(target.id)) === 0) {
      throw new HttpError(409, 'last_owner', 'There must always be at least one active owner.');
    }

    // Leads go back to the pool; history rows keep their text and lose the link.
    await admin.from('leads').update({ owner_id: null }).eq('owner_id', target.id);
    const { error } = await admin.auth.admin.deleteUser(target.id);
    if (error) throw new HttpError(500, 'auth_error', 'Could not delete the account. Try deactivating it instead.');

    await audit(caller.id, 'user.delete', 'profile', target.id, { name: target.full_name, email: target.email, role: target.role });
    return NextResponse.json({ ok: true }, { headers: NO_STORE });
  } catch (e) {
    return errorResponse(e);
  }
}
