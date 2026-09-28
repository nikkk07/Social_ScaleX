// POST /api/crm/users — create a staff account (owner: any role; admin: members).
import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  adminClient, audit, canManage, errorResponse, HttpError, NO_STORE, readJson, requireCaller,
} from '@/lib/server/crmServer';
import { isEmail, normalizePhone, passwordProblem, phoneOnlyEmail } from '@/lib/crm/normalize';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const Body = z.object({
  full_name: z.string().trim().min(2, 'Enter the full name.').max(80),
  email: z.string().trim().max(200).optional().or(z.literal('')),
  phone: z.string().trim().max(32).optional().or(z.literal('')),
  password: z.string().max(200),
  role: z.enum(['owner', 'admin', 'member']),
  daily_lead_quota: z.number().int().min(0).max(500).nullable().optional(),
});

export async function POST(req: Request) {
  try {
    const caller = await requireCaller(req);
    const parsed = Body.safeParse(await readJson(req));
    if (!parsed.success) {
      throw new HttpError(400, 'invalid_input', parsed.error.issues[0]?.message ?? 'Check the form.');
    }
    const b = parsed.data;
    if (!canManage(caller.role, b.role)) {
      throw new HttpError(403, 'not_authorized', 'You cannot create an account with that role.');
    }
    const email = b.email ? b.email.toLowerCase() : null;
    if (email && !isEmail(email)) throw new HttpError(400, 'invalid_input', 'Enter a valid email address.');
    const phone = b.phone ? normalizePhone(b.phone) : null;
    if (b.phone && !phone) throw new HttpError(400, 'invalid_input', 'Enter a valid phone number, e.g. 98765 43210.');
    if (!email && !phone) throw new HttpError(400, 'invalid_input', 'Add an email or a phone number to sign in with.');
    const pwErr = passwordProblem(b.password);
    if (pwErr) throw new HttpError(400, 'invalid_input', pwErr);

    const admin = adminClient();
    if (phone) {
      const { data: taken } = await admin.from('profiles').select('id').eq('phone', phone).maybeSingle();
      if (taken) throw new HttpError(409, 'phone_taken', 'That phone number already belongs to a team member.');
    }
    const quota = b.role === 'member' ? (b.daily_lead_quota ?? null) : null;

    const { data, error } = await admin.auth.admin.createUser({
      email: email ?? phoneOnlyEmail(phone as string),
      password: b.password,
      email_confirm: true,
      user_metadata: { full_name: b.full_name },
      app_metadata: {
        crm_role: b.role,
        full_name: b.full_name,
        crm_phone: phone,
        daily_lead_quota: quota,
      },
    });
    if (error || !data.user) {
      if (/already|registered|exists/i.test(error?.message ?? '')) {
        throw new HttpError(409, 'email_taken', 'That email already has an account.');
      }
      throw new HttpError(400, 'auth_error', error?.message ?? 'Could not create the account.');
    }

    // The auth trigger creates the profile; make sure it exists and is exact.
    const { error: upErr } = await admin.from('profiles').upsert({
      id: data.user.id,
      email: data.user.email ?? '',
      full_name: b.full_name,
      role: b.role,
      phone,
      daily_lead_quota: quota,
      is_active: true,
    });
    if (upErr) {
      await admin.auth.admin.deleteUser(data.user.id).catch(() => undefined);
      if (/phone/i.test(upErr.message)) {
        throw new HttpError(409, 'phone_taken', 'That phone number already belongs to a team member.');
      }
      throw new HttpError(500, 'profile_failed', 'Could not create the profile. Nothing was saved.');
    }

    await audit(caller.id, 'user.create', 'profile', data.user.id, {
      role: b.role, email: email ?? null, phone, quota,
    });
    return NextResponse.json({ id: data.user.id }, { status: 201, headers: NO_STORE });
  } catch (e) {
    return errorResponse(e);
  }
}
