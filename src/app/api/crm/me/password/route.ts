// POST /api/crm/me/password — change your own password (current one required).
import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  adminClient, anonClient, audit, errorResponse, HttpError, NO_STORE, readJson, requireCaller,
} from '@/lib/server/crmServer';
import { passwordProblem } from '@/lib/crm/normalize';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const Body = z.object({
  current_password: z.string().min(1).max(200),
  new_password: z.string().max(200),
});

export async function POST(req: Request) {
  try {
    const caller = await requireCaller(req);
    const parsed = Body.safeParse(await readJson(req));
    if (!parsed.success) throw new HttpError(400, 'invalid_input', 'Fill in both passwords.');
    const { current_password, new_password } = parsed.data;
    const pwErr = passwordProblem(new_password);
    if (pwErr) throw new HttpError(400, 'invalid_input', pwErr);
    if (new_password === current_password) {
      throw new HttpError(400, 'invalid_input', 'The new password must be different.');
    }

    const admin = adminClient();
    const { data: u } = await admin.auth.admin.getUserById(caller.id);
    if (!u.user) throw new HttpError(401, 'unauthenticated', 'Sign in again.');
    const creds = u.user.email
      ? { email: u.user.email, password: current_password }
      : { phone: '+' + (u.user.phone ?? '').replace(/^\+/, ''), password: current_password };
    const { error: verifyErr } = await anonClient().auth.signInWithPassword(creds);
    if (verifyErr) throw new HttpError(400, 'wrong_password', 'Your current password is not correct.');

    const { error } = await admin.auth.admin.updateUserById(caller.id, { password: new_password });
    if (error) throw new HttpError(400, 'auth_error', error.message);
    await audit(caller.id, 'user.password', 'profile', caller.id, { self: true });
    return NextResponse.json({ ok: true }, { headers: NO_STORE });
  } catch (e) {
    return errorResponse(e);
  }
}
