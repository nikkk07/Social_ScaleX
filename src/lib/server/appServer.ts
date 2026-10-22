import 'server-only';
// ─────────────────────────────────────────────────────────────────────
// Server helpers for the customer app (/api/app/*, webhooks, callbacks).
//
// Customers are Supabase Auth users without a CRM profile. Every route
// proves who is calling with the Supabase access token, then reads and
// writes ONLY rows owned by that user, through the service-role client.
// The ig_* tables have RLS on and no policies, so nothing else can reach them.
// ─────────────────────────────────────────────────────────────────────
import { createCipheriv, createDecipheriv, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { ConfigError, HttpError } from '@/lib/server/crmServer';

export { ConfigError, HttpError, errorResponse, NO_STORE, readJson } from '@/lib/server/crmServer';

// The ig_* tables are not in the generated CRM types, so this client is
// untyped; every query result is cast to the row interfaces in appTypes.ts.
let cached: SupabaseClient | null = null;
export function db(): SupabaseClient {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new ConfigError('Server is missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  cached = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
  return cached;
}

export function anon(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new ConfigError('Server is missing the public Supabase env vars.');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
}

export function env(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new ConfigError(`Server is missing ${name}.`);
  return v;
}

export interface AppUser {
  id: string;
  email: string | null;
  name: string | null;
}

/** Verifies the bearer token sent by the customer app. */
export async function requireUser(req: Request): Promise<AppUser> {
  const header = req.headers.get('authorization') ?? '';
  const m = /^Bearer\s+(.+)$/i.exec(header);
  if (!m?.[1]) throw new HttpError(401, 'unauthenticated', 'Please sign in again.');
  const { data, error } = await db().auth.getUser(m[1]);
  if (error || !data.user) throw new HttpError(401, 'unauthenticated', 'Please sign in again.');
  const meta = (data.user.user_metadata ?? {}) as Record<string, unknown>;
  const name = typeof meta.full_name === 'string' ? meta.full_name : typeof meta.name === 'string' ? meta.name : null;
  return { id: data.user.id, email: data.user.email ?? null, name };
}

// ── Token encryption (AES-256-GCM) ───────────────────────────────────
// IG_TOKEN_KEY: 32 random bytes, base64. Rotating it means every account
// has to reconnect, so set it once.
function tokenKey(): Buffer {
  const raw = env('IG_TOKEN_KEY');
  const key = Buffer.from(raw, 'base64');
  if (key.length !== 32) throw new ConfigError('IG_TOKEN_KEY must be 32 bytes, base64-encoded.');
  return key;
}

export function encrypt(plain: string): string {
  const iv = randomBytes(12);
  const c = createCipheriv('aes-256-gcm', tokenKey(), iv);
  const body = Buffer.concat([c.update(plain, 'utf8'), c.final()]);
  return ['v1', iv.toString('base64'), c.getAuthTag().toString('base64'), body.toString('base64')].join('.');
}

export function decrypt(sealed: string): string {
  const [v, iv, tag, body] = sealed.split('.');
  if (v !== 'v1' || !iv || !tag || !body) throw new Error('bad token format');
  const d = createDecipheriv('aes-256-gcm', tokenKey(), Buffer.from(iv, 'base64'));
  d.setAuthTag(Buffer.from(tag, 'base64'));
  return Buffer.concat([d.update(Buffer.from(body, 'base64')), d.final()]).toString('utf8');
}

// ── Signatures ───────────────────────────────────────────────────────
export function hmacHex(secret: string, data: string | Buffer): string {
  return createHmac('sha256', secret).update(data).digest('hex');
}

export function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

const b64url = (b: Buffer) => b.toString('base64url');

/** Signed, expiring OAuth state: carries the user id through Instagram's redirect. */
export function signState(userId: string, ttlMs = 15 * 60_000): string {
  const payload = b64url(Buffer.from(JSON.stringify({ u: userId, e: Date.now() + ttlMs, n: randomBytes(8).toString('hex') })));
  const sig = b64url(createHmac('sha256', env('IG_TOKEN_KEY')).update('state:' + payload).digest());
  return `${payload}.${sig}`;
}

export function verifyState(state: string | null): string | null {
  if (!state) return null;
  const [payload, sig] = state.split('.');
  if (!payload || !sig) return null;
  const expect = b64url(createHmac('sha256', env('IG_TOKEN_KEY')).update('state:' + payload).digest());
  if (!safeEqual(sig, expect)) return null;
  try {
    const p = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { u?: unknown; e?: unknown };
    if (typeof p.u !== 'string' || typeof p.e !== 'number' || p.e < Date.now()) return null;
    return p.u;
  } catch {
    return null;
  }
}

/** Meta signed_request (deauthorize / data deletion callbacks). */
export function parseSignedRequest(signed: string | null, secret: string): Record<string, unknown> | null {
  if (!signed) return null;
  const [sig, payload] = signed.split('.');
  if (!sig || !payload) return null;
  const expect = b64url(createHmac('sha256', secret).update(payload).digest());
  if (!safeEqual(sig.replace(/=+$/, ''), expect)) return null;
  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Absolute URL on this deployment (callbacks must match Meta's settings exactly). */
export function appUrl(path: string): string {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? '').trim() || 'https://www.socialscalex.in';
  return new URL(path, base).toString();
}

/** Loads an account and proves the caller owns it. */
export async function ownedAccount<T = Record<string, unknown>>(userId: string, accountId: string, columns = '*'): Promise<T> {
  if (!/^[0-9a-f-]{36}$/i.test(accountId)) throw new HttpError(404, 'not_found', 'Account not found.');
  const { data, error } = await db().from('ig_accounts').select(columns).eq('id', accountId).eq('user_id', userId).maybeSingle();
  if (error) throw error;
  if (!data) throw new HttpError(404, 'not_found', 'Account not found.');
  return data as T;
}

export function isPaid(paidUntil: string | null | undefined): boolean {
  return Boolean(paidUntil && new Date(paidUntil).getTime() > Date.now());
}
