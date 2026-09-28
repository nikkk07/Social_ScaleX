// ─────────────────────────────────────────────────────────────────────
// POST /api/auth/sign-in   { identifier: email | phone, password }
//
// Staff sign in with EITHER an email address OR a phone number, plus a
// password — no OTP, no SMS provider. A phone number is resolved to its
// account on the server, so the email behind it is never revealed to the
// browser, and every failure returns the same generic message.
//
// Brute force: 5 failures for one identifier inside 15 minutes lock it for
// 15 minutes (login_throttle, service-role only). Supabase Auth's own
// per-IP rate limits apply on top.
// ─────────────────────────────────────────────────────────────────────
import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { adminClient, anonClient, audit, errorResponse, HttpError, NO_STORE, readJson } from '@/lib/server/crmServer';
import { isEmail, normalizePhone } from '@/lib/crm/normalize';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const Body = z.object({
  identifier: z.string().trim().min(3).max(200),
  password: z.string().min(1).max(200),
});

const MAX_FAILS = 5;
const WINDOW_MS = 15 * 60_000;
const LOCK_MS = 15 * 60_000;
const GENERIC = 'Incorrect email/phone or password.';

function throttleKey(id: string): string {
  return createHash('sha256').update('crm-login:' + id).digest('hex');
}

async function lockedFor(key: string): Promise<number> {
  const { data } = await adminClient().from('login_throttle').select('locked_until').eq('key', key).maybeSingle();
  const until = data?.locked_until ? new Date(data.locked_until).getTime() : 0;
  return Math.max(0, until - Date.now());
}

async function recordFailure(key: string): Promise<void> {
  const admin = adminClient();
  const { data } = await admin.from('login_throttle').select('*').eq('key', key).maybeSingle();
  const now = Date.now();
  const fresh = !data || now - new Date(data.first_fail_at).getTime() > WINDOW_MS;
  const count = fresh ? 1 : data.fail_count + 1;
  await admin.from('login_throttle').upsert({
    key,
    fail_count: count,
    first_fail_at: fresh ? new Date(now).toISOString() : data.first_fail_at,
    locked_until: count >= MAX_FAILS ? new Date(now + LOCK_MS).toISOString() : null,
  });
}

export async function POST(req: Request) {
  try {
    const parsed = Body.safeParse(await readJson(req));
    if (!parsed.success) throw new HttpError(400, 'invalid_input', GENERIC);
    const { identifier, password } = parsed.data;

    const byEmail = isEmail(identifier);
    const phone = byEmail ? null : normalizePhone(identifier);
    if (!byEmail && !phone) throw new HttpError(400, 'invalid_input', 'Enter a valid email address or phone number.');
    const idNorm = byEmail ? identifier.trim().toLowerCase() : (phone as string);
    const key = throttleKey(idNorm);

    const wait = await lockedFor(key);
    if (wait > 0) {
      const minutes = Math.ceil(wait / 60_000);
      return NextResponse.json(
        { error: 'locked', message: `Too many attempts. Try again in ${minutes} minute${minutes === 1 ? '' : 's'}.` },
        { status: 429, headers: { ...NO_STORE, 'Retry-After': String(Math.ceil(wait / 1000)) } },
      );
    }

    const admin = adminClient();

    // Resolve the credentials Supabase Auth expects.
    let credentials: { email: string; password: string } | { phone: string; password: string } | null = null;
    if (byEmail) {
      credentials = { email: idNorm, password };
    } else {
      const { data: prof } = await admin.from('profiles').select('id').eq('phone', idNorm).maybeSingle();
      if (prof) {
        const { data: u } = await admin.auth.admin.getUserById(prof.id);
        if (u.user?.email) credentials = { email: u.user.email, password };
        else if (u.user?.phone) credentials = { phone: '+' + u.user.phone.replace(/^\+/, ''), password };
      }
    }

    if (!credentials) {
      await recordFailure(key);
      throw new HttpError(401, 'invalid_credentials', GENERIC);
    }

    const { data, error } = await anonClient().auth.signInWithPassword(credentials);
    if (error || !data.session || !data.user) {
      if (error?.status === 429) {
        throw new HttpError(429, 'rate_limited', 'Too many attempts. Please wait a moment and try again.');
      }
      await recordFailure(key);
      throw new HttpError(401, 'invalid_credentials', GENERIC);
    }

    // Only ACTIVE staff may hold a session.
    const { data: profile } = await admin
      .from('profiles')
      .select('is_active')
      .eq('id', data.user.id)
      .maybeSingle();
    if (!profile || !profile.is_active) {
      await admin.auth.admin.signOut(data.session.access_token, 'global').catch(() => undefined);
      await recordFailure(key);
      throw new HttpError(401, 'invalid_credentials', GENERIC);
    }

    await admin.from('login_throttle').delete().eq('key', key);
    await audit(data.user.id, 'auth.sign_in', 'profile', data.user.id, { via: byEmail ? 'email' : 'phone' });

    return NextResponse.json(
      { access_token: data.session.access_token, refresh_token: data.session.refresh_token },
      { headers: NO_STORE },
    );
  } catch (e) {
    return errorResponse(e);
  }
}
