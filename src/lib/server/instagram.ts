import 'server-only';
// ─────────────────────────────────────────────────────────────────────
// Instagram API with Instagram Login (graph.instagram.com).
// Official references (checked 23 Oct 2026):
//   Business Login:  developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/business-login
//   Private replies: developers.facebook.com/docs/instagram-platform/private-replies
//   Webhooks setup:  developers.facebook.com/documentation/instagram-platform/webhooks/setup
// The customer never sees a token: it is exchanged here, stored encrypted
// and refreshed by the daily cron.
// ─────────────────────────────────────────────────────────────────────
import { appUrl, env } from '@/lib/server/appServer';

const VERSION = () => process.env.IG_API_VERSION?.trim() || 'v26.0';
const GRAPH = () => `https://graph.instagram.com/${VERSION()}`;

export const SCOPES = [
  'instagram_business_basic',
  'instagram_business_manage_comments',
  'instagram_business_manage_messages',
] as const;

/** Fields this app subscribes each account to. */
export const WEBHOOK_FIELDS = 'comments';

export const REDIRECT_PATH = '/api/instagram/callback';

export class IgError extends Error {
  constructor(
    message: string,
    public code: number | null,
    public subcode: number | null,
    public status: number,
  ) {
    super(message);
  }
  /**
   * Token expired or revoked (code 190): the user must reconnect.
   * Code 10 / 2xx are NOT treated as this: Instagram also uses code 10 for
   * "outside the allowed messaging window", which is about one comment, not
   * the whole account.
   */
  get needsReconnect(): boolean {
    return this.code === 190;
  }
  get rateLimited(): boolean {
    return this.code === 4 || this.code === 17 || this.code === 32 || this.code === 613 || this.status === 429;
  }
}

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10_000);
  let res: Response;
  try {
    res = await fetch(url, { ...init, signal: ctrl.signal, cache: 'no-store' });
  } catch (e) {
    throw new IgError(e instanceof Error && e.name === 'AbortError' ? 'Instagram did not answer in time.' : 'Could not reach Instagram.', null, null, 0);
  } finally {
    clearTimeout(timer);
  }
  const text = await res.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = null;
  }
  if (!res.ok || (body && typeof body === 'object' && 'error' in body)) {
    const err = (body as { error?: { message?: string; code?: number; error_subcode?: number; error_message?: string } } | null)?.error;
    const msg = err?.message ?? err?.error_message ?? (body as { error_message?: string } | null)?.error_message ?? `Instagram error ${res.status}`;
    throw new IgError(msg, err?.code ?? null, err?.error_subcode ?? null, res.status);
  }
  return body as T;
}

export function authorizeUrl(state: string): string {
  const u = new URL('https://www.instagram.com/oauth/authorize');
  u.searchParams.set('client_id', env('IG_APP_ID'));
  u.searchParams.set('redirect_uri', appUrl(REDIRECT_PATH));
  u.searchParams.set('response_type', 'code');
  u.searchParams.set('scope', SCOPES.join(','));
  u.searchParams.set('state', state);
  // Instagram login only: Facebook login here confuses people and is not needed.
  u.searchParams.set('enable_fb_login', 'false');
  // Always show the login screen, so the person picks the account they mean
  // instead of whichever one happens to be logged in on this browser.
  u.searchParams.set('force_reauth', 'true');
  return u.toString();
}

interface ShortToken {
  access_token: string;
  user_id: string | number;
  permissions?: string | string[];
}

export async function exchangeCode(code: string): Promise<{ token: string; scopedId: string; permissions: string[] }> {
  const form = new URLSearchParams({
    client_id: env('IG_APP_ID'),
    client_secret: env('IG_APP_SECRET'),
    grant_type: 'authorization_code',
    redirect_uri: appUrl(REDIRECT_PATH),
    code: code.replace(/#_$/, ''),
  });
  const raw = await call<ShortToken | { data: ShortToken[] }>('https://api.instagram.com/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form,
  });
  const t = 'data' in raw ? raw.data[0] : raw;
  if (!t?.access_token) throw new IgError('Instagram did not return a token.', null, null, 0);
  const perms = Array.isArray(t.permissions) ? t.permissions : (t.permissions ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  return { token: t.access_token, scopedId: String(t.user_id), permissions: perms };
}

export interface LongToken {
  access_token: string;
  expires_in: number;
}

export function longLived(shortToken: string): Promise<LongToken> {
  const u = new URL('https://graph.instagram.com/access_token');
  u.searchParams.set('grant_type', 'ig_exchange_token');
  u.searchParams.set('client_secret', env('IG_APP_SECRET'));
  u.searchParams.set('access_token', shortToken);
  return call<LongToken>(u.toString());
}

export function refresh(token: string): Promise<LongToken> {
  const u = new URL('https://graph.instagram.com/refresh_access_token');
  u.searchParams.set('grant_type', 'ig_refresh_token');
  u.searchParams.set('access_token', token);
  return call<LongToken>(u.toString());
}

export interface IgProfile {
  id: string;
  user_id: string;
  username: string;
  name?: string;
  account_type?: string;
  profile_picture_url?: string;
}

export function profile(token: string): Promise<IgProfile> {
  const u = new URL(`${GRAPH()}/me`);
  u.searchParams.set('fields', 'id,user_id,username,name,account_type,profile_picture_url');
  u.searchParams.set('access_token', token);
  return call<IgProfile>(u.toString());
}

export async function subscribe(igUserId: string, token: string): Promise<void> {
  const u = new URL(`${GRAPH()}/${encodeURIComponent(igUserId)}/subscribed_apps`);
  u.searchParams.set('subscribed_fields', WEBHOOK_FIELDS);
  u.searchParams.set('access_token', token);
  await call<{ success?: boolean }>(u.toString(), { method: 'POST' });
}

export interface IgMedia {
  id: string;
  caption?: string;
  media_type?: string;
  media_product_type?: string;
  media_url?: string;
  thumbnail_url?: string;
  permalink?: string;
  timestamp?: string;
}

export async function listMedia(igUserId: string, token: string, after?: string): Promise<{ items: IgMedia[]; next: string | null }> {
  const u = new URL(`${GRAPH()}/${encodeURIComponent(igUserId)}/media`);
  u.searchParams.set('fields', 'id,caption,media_type,media_product_type,media_url,thumbnail_url,permalink,timestamp');
  u.searchParams.set('limit', '24');
  if (after) u.searchParams.set('after', after);
  u.searchParams.set('access_token', token);
  const r = await call<{ data?: IgMedia[]; paging?: { cursors?: { after?: string }; next?: string } }>(u.toString());
  return { items: r.data ?? [], next: r.paging?.next && r.paging.cursors?.after ? r.paging.cursors.after : null };
}

/** One private reply (DM) to the person who commented. Meta allows one per comment, within 7 days. */
export async function privateReply(igUserId: string, token: string, commentId: string, text: string): Promise<void> {
  await call(`${GRAPH()}/${encodeURIComponent(igUserId)}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ recipient: { comment_id: commentId }, message: { text } }),
  });
}

/** A public reply under the comment. */
export async function replyToComment(token: string, commentId: string, text: string): Promise<void> {
  const u = new URL(`${GRAPH()}/${encodeURIComponent(commentId)}/replies`);
  u.searchParams.set('message', text);
  await call(u.toString(), { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
}

/** Plain-language message for an Instagram failure, shown in the dashboard. */
export function friendly(e: unknown): string {
  if (e instanceof IgError) {
    if (e.needsReconnect) return 'Instagram access expired or was removed. Reconnect the account.';
    if (e.rateLimited) return 'Instagram is limiting messages right now. It will work again shortly.';
    if (/7 days|allowed window|outside.*window/i.test(e.message)) return 'Instagram did not allow a DM for this comment (outside its time window).';
    if (/permission|not authori[sz]ed/i.test(e.message)) return 'Instagram refused: a permission is missing. Reconnect the account and allow every permission.';
    if (/already.*(sent|replied)/i.test(e.message)) return 'A DM was already sent for this comment.';
    return `Instagram said: ${e.message.slice(0, 180)}`;
  }
  return 'Something went wrong while talking to Instagram.';
}
