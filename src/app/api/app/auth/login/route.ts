// ─────────────────────────────────────────────────────────────────────
// POST /api/app/auth/login  { identifier: email | mobile, password } → { session }
// A mobile number is resolved to its account on the server, so the email
// behind it is never revealed, and every failure gives the same message.
// Brute force: 5 wrong tries for one email/mobile in 15 min lock it for
// 15 min; 30 tries from one network in 15 min lock that network.
// ─────────────────────────────────────────────────────────────────────
import { NextResponse } from 'next/server';
import { anon, db, errorResponse, HttpError, NO_STORE, readJson } from '@/lib/server/appServer';
import { assertNotLocked, clear, clientIp, hit, throttleKey } from '@/lib/server/throttle';
import { isEmail, LoginInput, normalizeMobile } from '@/lib/app/forms';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Accounts made with Google have no password, hence the hint.
const GENERIC = 'Wrong email/mobile or password. Signed up with Google? Use “Continue with Google”.';
const WINDOW = 15 * 60_000;

export async function POST(req: Request) {
  try {
    const parsed = LoginInput.safeParse(await readJson(req));
    if (!parsed.success) throw new HttpError(400, 'invalid_input', 'Enter your email or mobile number, and your password.');
    const { identifier, password } = parsed.data;

    const byEmail = isEmail(identifier);
    const mobile = byEmail ? null : normalizeMobile(identifier);
    if (!byEmail && !mobile) throw new HttpError(400, 'invalid_input', 'Enter a valid email address or 10-digit mobile number.');
    const id = byEmail ? identifier.trim().toLowerCase() : (mobile as string);

    const idKey = throttleKey('app-login', id);
    const ipKey = throttleKey('app-login-ip', clientIp(req));
    await assertNotLocked(idKey, 'attempts');
    await assertNotLocked(ipKey, 'attempts from this network');

    let email: string | null = byEmail ? id : null;
    if (mobile) {
      const { data } = await db().from('app_customers').select('user_id').eq('phone', mobile).maybeSingle();
      const uid = (data as { user_id: string } | null)?.user_id;
      if (uid) {
        const { data: u } = await db().auth.admin.getUserById(uid);
        email = u.user?.email ?? null;
      }
    }

    const fail = async () => {
      await hit(idKey, 5, WINDOW, WINDOW);
      await hit(ipKey, 30, WINDOW, WINDOW);
      throw new HttpError(401, 'bad_credentials', GENERIC);
    };
    if (!email) return await fail();

    const { data: s, error } = await anon().auth.signInWithPassword({ email, password });
    if (error || !s.session) return await fail();
    await clear(idKey);
    const ss = s.session;
    return NextResponse.json(
      { session: { access_token: ss.access_token, refresh_token: ss.refresh_token, expires_at: ss.expires_at ?? null } },
      { headers: NO_STORE },
    );
  } catch (e) {
    return errorResponse(e);
  }
}
