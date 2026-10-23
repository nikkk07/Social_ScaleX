// ─────────────────────────────────────────────────────────────────────
// POST /api/app/auth/register
//   { name, mobile, whatsappSame, whatsapp?, email, password, confirm, website? }
//   → { session }
// Creates the customer, saves name / mobile / WhatsApp, signs them in.
// Worst cases handled: email already registered, mobile already used by
// another account, the two racing each other, bots (hidden field + per-IP
// limit), and a half-created account if saving the profile fails.
// ─────────────────────────────────────────────────────────────────────
import { NextResponse } from 'next/server';
import { anon, db, errorResponse, HttpError, NO_STORE, readJson } from '@/lib/server/appServer';
import { ensureUser } from '@/lib/server/appAuth';
import { assertNotLocked, clientIp, hit, throttleKey } from '@/lib/server/throttle';
import { fieldErrors, RegisterInput } from '@/lib/app/forms';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const body = (await readJson(req)) as Record<string, unknown> | null;
    // Hidden "website" field: people never fill it, bots do.
    if (body && typeof body.website === 'string' && body.website.trim()) throw new HttpError(400, 'invalid_input', 'Please try again.');
    const parsed = RegisterInput.safeParse(body);
    if (!parsed.success) {
      const errors = fieldErrors(parsed.error);
      return NextResponse.json({ error: 'invalid_input', message: Object.values(errors)[0], fields: errors }, { status: 400, headers: NO_STORE });
    }
    const v = parsed.data;

    const ipKey = throttleKey('app-register-ip', clientIp(req));
    await assertNotLocked(ipKey, 'sign-ups from this network');
    await hit(ipKey, 10, 60 * 60_000, 60 * 60_000);

    const sb = db();
    const { data: taken } = await sb.from('app_customers').select('user_id').eq('phone', v.mobile).maybeSingle();
    if (taken) {
      return NextResponse.json(
        { error: 'mobile_taken', message: 'This mobile number already has an account. Sign in instead.', fields: { mobile: 'Already registered — sign in instead.' } },
        { status: 409, headers: NO_STORE },
      );
    }

    const created = await ensureUser(v.email, v.name, v.password);
    if (!created) {
      return NextResponse.json(
        { error: 'email_taken', message: 'This email already has an account. Sign in instead.', fields: { email: 'Already registered — sign in instead.' } },
        { status: 409, headers: NO_STORE },
      );
    }

    const { data: s, error: signErr } = await anon().auth.signInWithPassword({ email: v.email, password: v.password });
    if (signErr || !s.session) throw new HttpError(500, 'session_failed', 'Account created. Please sign in.');

    const { error: profErr } = await sb.from('app_customers').insert({ user_id: s.session.user.id, full_name: v.name, phone: v.mobile, whatsapp: v.whatsapp });
    if (profErr) {
      // Someone registered the same number a moment ago: undo this account.
      await sb.auth.admin.deleteUser(s.session.user.id);
      if (profErr.code === '23505') {
        return NextResponse.json(
          { error: 'mobile_taken', message: 'This mobile number already has an account. Sign in instead.', fields: { mobile: 'Already registered — sign in instead.' } },
          { status: 409, headers: NO_STORE },
        );
      }
      throw profErr;
    }

    const ss = s.session;
    return NextResponse.json(
      { session: { access_token: ss.access_token, refresh_token: ss.refresh_token, expires_at: ss.expires_at ?? null } },
      { headers: NO_STORE },
    );
  } catch (e) {
    return errorResponse(e);
  }
}
