// ─────────────────────────────────────────────────────────────────────
// POST /api/app/auth/email  { mode: 'signup' | 'signin', email, password, name? }
//   → { session }
// Brute force: 5 failures for one email inside 15 minutes lock it for 15
// minutes (same login_throttle table and rule as the CRM, separate keys).
// ─────────────────────────────────────────────────────────────────────
import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { anon, db, errorResponse, HttpError, NO_STORE, readJson } from '@/lib/server/appServer';
import { ensureUser } from '@/lib/server/appAuth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const Body = z.object({
  mode: z.enum(['signup', 'signin']),
  email: z.string().trim().toLowerCase().email().max(200),
  password: z.string().min(1).max(200),
  name: z.string().trim().max(100).optional(),
});

const MAX_FAILS = 5;
const WINDOW_MS = 15 * 60_000;
const LOCK_MS = 15 * 60_000;

const keyFor = (email: string) => createHash('sha256').update('app-login:' + email).digest('hex');

async function lockedFor(key: string): Promise<number> {
  const { data } = await db().from('login_throttle').select('locked_until').eq('key', key).maybeSingle();
  const until = data?.locked_until ? new Date(data.locked_until as string).getTime() : 0;
  return Math.max(0, until - Date.now());
}

async function recordFailure(key: string): Promise<void> {
  const { data } = await db().from('login_throttle').select('*').eq('key', key).maybeSingle();
  const row = data as { fail_count: number; first_fail_at: string } | null;
  const now = Date.now();
  const fresh = !row || now - new Date(row.first_fail_at).getTime() > WINDOW_MS;
  const count = fresh ? 1 : row.fail_count + 1;
  await db().from('login_throttle').upsert({
    key,
    fail_count: count,
    first_fail_at: fresh ? new Date(now).toISOString() : row.first_fail_at,
    locked_until: count >= MAX_FAILS ? new Date(now + LOCK_MS).toISOString() : null,
  });
}

export async function POST(req: Request) {
  try {
    const parsed = Body.safeParse(await readJson(req));
    if (!parsed.success) throw new HttpError(400, 'invalid_input', 'Enter a valid email address and password.');
    const { mode, email, password, name } = parsed.data;
    const key = keyFor(email);

    const wait = await lockedFor(key);
    if (wait > 0) {
      const m = Math.ceil(wait / 60_000);
      throw new HttpError(429, 'locked', `Too many attempts. Try again in ${m} minute${m === 1 ? '' : 's'}.`);
    }

    if (mode === 'signup') {
      if (password.length < 8) throw new HttpError(400, 'weak_password', 'Use at least 8 characters for your password.');
      const created = await ensureUser(email, name || null, password);
      if (!created) throw new HttpError(409, 'exists', 'You already have an account. Sign in instead.');
    }

    const { data, error } = await anon().auth.signInWithPassword({ email, password });
    if (error || !data.session) {
      await recordFailure(key);
      throw new HttpError(401, 'bad_credentials', 'Wrong email or password. Forgot it? Use “Forgot password”.');
    }
    await db().from('login_throttle').delete().eq('key', key);
    const s = data.session;
    return NextResponse.json(
      { session: { access_token: s.access_token, refresh_token: s.refresh_token, expires_at: s.expires_at ?? null } },
      { headers: NO_STORE },
    );
  } catch (e) {
    return errorResponse(e);
  }
}
