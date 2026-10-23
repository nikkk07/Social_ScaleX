// ─────────────────────────────────────────────────────────────────────
// GET /api/instagram/callback?code&state  (Instagram redirects here)
//
// Exchanges the code, stores the account with its token encrypted,
// subscribes it to comment webhooks, then sends the person straight to the
// automation builder. Every failure lands on the dashboard with a plain
// reason (?ig=<reason>) instead of an error page.
// ─────────────────────────────────────────────────────────────────────
import { NextResponse } from 'next/server';
import { appUrl, db, encrypt, verifyState } from '@/lib/server/appServer';
import { removeAccount } from '@/lib/server/accounts';
import { exchangeCode, IgError, longLived, profile, SCOPES, subscribe } from '@/lib/server/instagram';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const back = (reason: string, extra = '') => NextResponse.redirect(appUrl(`/dashboard?ig=${reason}${extra}`), { status: 303 });

export async function GET(req: Request) {
  const url = new URL(req.url);
  const st = (() => {
    try {
      return verifyState(url.searchParams.get('state'));
    } catch {
      return null;
    }
  })();
  const userId = st?.userId ?? null;
  if (url.searchParams.get('error')) return back('cancelled');
  const code = url.searchParams.get('code');
  if (!userId) return back('expired');
  if (!code) return back('cancelled');

  try {
    const short = await exchangeCode(code);
    const long = await longLived(short.token);
    const me = await profile(long.access_token);
    const igUserId = String(me.user_id ?? me.id);
    const missing = SCOPES.filter((s) => short.permissions.length && !short.permissions.includes(s));

    const sb = db();
    const { data: existing } = await sb.from('ig_accounts').select('id, user_id, status').eq('ig_user_id', igUserId).maybeSingle();
    let ex = existing as { id: string; user_id: string; status: string } | null;
    if (ex && ex.user_id !== userId) {
      // Still active under another login: the owner of that login must remove
      // it first. If Instagram access was revoked there, the new owner wins.
      if (ex.status !== 'disconnected') return back('taken', `&u=${encodeURIComponent(me.username)}`);
      if (!(await removeAccount(ex.id))) return back('failed');
      ex = null;
    }

    const row = {
      user_id: userId,
      ig_user_id: igUserId,
      ig_scoped_id: short.scopedId,
      username: me.username,
      name: me.name ?? null,
      avatar_url: me.profile_picture_url ?? null,
      account_type: me.account_type ?? null,
      token_enc: encrypt(long.access_token),
      token_expires_at: new Date(Date.now() + long.expires_in * 1000).toISOString(),
      token_refreshed_at: new Date().toISOString(),
      permissions: short.permissions,
      status: missing.length ? 'reconnect' : 'connected',
      last_error: missing.length ? 'Some permissions were switched off. Reconnect and allow all of them.' : null,
    };
    const { data: saved, error } = ex
      ? await sb.from('ig_accounts').update(row).eq('id', ex.id).select('id').single()
      : await sb.from('ig_accounts').insert(row).select('id').single();
    if (error || !saved) throw error ?? new Error('save failed');
    const accountId = (saved as { id: string }).id;

    if (missing.length) return back('permissions', `&a=${accountId}`);

    try {
      await subscribe(igUserId, long.access_token);
    } catch (e) {
      await sb.from('ig_accounts').update({ status: 'reconnect', last_error: 'Could not switch on comment alerts. Reconnect to try again.' }).eq('id', accountId);
      console.error('[ig callback] subscribe failed', e instanceof Error ? e.message : e);
      return back('subscribe', `&a=${accountId}`);
    }

    // Logged in as a different account than the one picked in the search:
    // keep it (they proved they own it) and let them choose on the next page.
    const mismatch = st?.expect && st.expect !== me.username.toLowerCase() ? `&picked=${encodeURIComponent(st.expect)}` : '';

    // Straight on to building the first automation if there is none yet.
    const { count } = await sb.from('ig_automations').select('id', { count: 'exact', head: true }).eq('account_id', accountId);
    return NextResponse.redirect(
      appUrl(count ? `/dashboard/${accountId}?connected=1${mismatch}` : `/dashboard/${accountId}/new?connected=1${mismatch}`),
      { status: 303 },
    );
  } catch (e) {
    console.error('[ig callback]', e instanceof IgError ? `${e.code} ${e.message}` : e);
    if (e instanceof IgError && /professional|business|creator/i.test(e.message)) return back('personal');
    return back('failed');
  }
}
