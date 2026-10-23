import 'server-only';
// Counting limiter on the existing login_throttle table (service role only).
// `max` hits inside `windowMs` lock the key for `lockMs`.
import { createHash } from 'node:crypto';
import { db, HttpError } from '@/lib/server/appServer';

export const throttleKey = (scope: string, id: string) => createHash('sha256').update(`${scope}:${id}`).digest('hex');

interface Row {
  fail_count: number;
  first_fail_at: string;
  locked_until: string | null;
}

/** Throws 429 while the key is locked. */
export async function assertNotLocked(key: string, what = 'attempts'): Promise<void> {
  const { data } = await db().from('login_throttle').select('locked_until').eq('key', key).maybeSingle();
  const until = data?.locked_until ? new Date(data.locked_until as string).getTime() : 0;
  const wait = until - Date.now();
  if (wait > 0) {
    const m = Math.ceil(wait / 60_000);
    throw new HttpError(429, 'locked', `Too many ${what}. Try again in ${m} minute${m === 1 ? '' : 's'}.`);
  }
}

/** Records one hit; locks the key once `max` is reached in the window. */
export async function hit(key: string, max: number, windowMs: number, lockMs: number): Promise<void> {
  const sb = db();
  const { data } = await sb.from('login_throttle').select('*').eq('key', key).maybeSingle();
  const row = data as Row | null;
  const now = Date.now();
  const fresh = !row || now - new Date(row.first_fail_at).getTime() > windowMs;
  const count = fresh ? 1 : row.fail_count + 1;
  await sb.from('login_throttle').upsert({
    key,
    fail_count: count,
    first_fail_at: fresh ? new Date(now).toISOString() : row.first_fail_at,
    locked_until: count >= max ? new Date(now + lockMs).toISOString() : null,
  });
}

export async function clear(key: string): Promise<void> {
  await db().from('login_throttle').delete().eq('key', key);
}

/** Best-effort client IP (Vercel sets x-forwarded-for). */
export function clientIp(req: Request): string {
  return (req.headers.get('x-forwarded-for') ?? '').split(',')[0]?.trim() || 'unknown';
}
