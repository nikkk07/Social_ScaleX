import 'server-only';
// ─────────────────────────────────────────────────────────────────────
// Find an Instagram professional account by exact username, using Meta's
// Business Discovery API (Instagram API with Facebook Login):
//   GET graph.facebook.com/{our-ig-id}?fields=business_discovery.username(x){...}
// developers.facebook.com/documentation/instagram-platform/instagram-api-with-facebook-login/business-discovery
//
// It runs on Social ScaleX's OWN Instagram account (IG_LOOKUP_USER_ID +
// IG_LOOKUP_TOKEN), so it needs no review for our own use. Instagram offers
// no "search as you type" API, so the browser looks up the exact username
// on every pause in typing. Personal and age-gated accounts are not
// returned — exactly the accounts that couldn't use the automation anyway.
// Results are cached for 6 hours (found) / 10 minutes (not found).
// ─────────────────────────────────────────────────────────────────────
import { db } from '@/lib/server/appServer';

export interface IgPublicProfile {
  username: string;
  name: string | null;
  avatar: string | null;
  followers: number | null;
  posts: number | null;
  bio: string | null;
}

export type LookupResult =
  | { status: 'found'; profile: IgPublicProfile }
  | { status: 'not_found' }
  | { status: 'unavailable' }; // lookup not configured, rate-limited or Meta down

const FOUND_TTL = 6 * 60 * 60_000;
const MISS_TTL = 10 * 60_000;

export function lookupConfigured(): boolean {
  return Boolean(process.env.IG_LOOKUP_USER_ID?.trim() && process.env.IG_LOOKUP_TOKEN?.trim());
}

export async function lookupUsername(username: string): Promise<LookupResult> {
  const sb = db();
  const { data: cached } = await sb.from('ig_lookups').select('*').eq('username', username).maybeSingle();
  const c = cached as { found: boolean; data: IgPublicProfile | null; fetched_at: string } | null;
  if (c) {
    const age = Date.now() - new Date(c.fetched_at).getTime();
    if (c.found && c.data && age < FOUND_TTL) return { status: 'found', profile: c.data };
    if (!c.found && age < MISS_TTL) return { status: 'not_found' };
  }
  const igId = process.env.IG_LOOKUP_USER_ID?.trim();
  const token = process.env.IG_LOOKUP_TOKEN?.trim();
  if (!igId || !token) return { status: 'unavailable' };

  const version = process.env.IG_API_VERSION?.trim() || 'v26.0';
  const u = new URL(`https://graph.facebook.com/${version}/${encodeURIComponent(igId)}`);
  u.searchParams.set('fields', `business_discovery.username(${username}){username,name,profile_picture_url,followers_count,media_count,biography}`);
  u.searchParams.set('access_token', token);

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 6000);
  try {
    const res = await fetch(u, { signal: ctrl.signal, cache: 'no-store' });
    const json = (await res.json().catch(() => null)) as {
      business_discovery?: { username?: string; name?: string; profile_picture_url?: string; followers_count?: number; media_count?: number; biography?: string };
      error?: { code?: number; error_subcode?: number; message?: string };
    } | null;
    const bd = json?.business_discovery;
    if (res.ok && bd?.username) {
      const profile: IgPublicProfile = {
        username: bd.username,
        name: bd.name ?? null,
        avatar: bd.profile_picture_url ?? null,
        followers: typeof bd.followers_count === 'number' ? bd.followers_count : null,
        posts: typeof bd.media_count === 'number' ? bd.media_count : null,
        bio: bd.biography ? bd.biography.slice(0, 160) : null,
      };
      await sb.from('ig_lookups').upsert({ username, found: true, data: profile, fetched_at: new Date().toISOString() });
      return { status: 'found', profile };
    }
    const err = json?.error;
    // Code 110 / subcode 2207013: "cannot find user" — a real miss. Rate
    // limits (4, 17, 32, 613) and token problems (190) are not.
    const miss = err && (err.code === 110 || err.error_subcode === 2207013 || (err.code === 100 && /username|user/i.test(err.message ?? '')));
    if (miss) {
      await sb.from('ig_lookups').upsert({ username, found: false, data: null, fetched_at: new Date().toISOString() });
      return { status: 'not_found' };
    }
    console.error('[ig lookup]', res.status, err?.code, err?.error_subcode, err?.message);
    return { status: 'unavailable' };
  } catch {
    return { status: 'unavailable' };
  } finally {
    clearTimeout(timer);
  }
}
