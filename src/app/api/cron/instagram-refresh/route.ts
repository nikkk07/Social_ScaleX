// ─────────────────────────────────────────────────────────────────────
// GET /api/cron/instagram-refresh  (Vercel Cron, daily; see vercel.json)
// Long-lived Instagram tokens last 60 days and can be refreshed once they
// are 24 hours old. Refresh every token older than 7 days, so an account
// never expires even if the cron misses a few runs. A token Instagram
// refuses marks the account "reconnect" so the dashboard asks for it.
// Also prunes comment history older than 90 days.
// ─────────────────────────────────────────────────────────────────────
import { NextResponse } from 'next/server';
import { db, decrypt, encrypt, safeEqual } from '@/lib/server/appServer';
import { friendly, IgError, refresh } from '@/lib/server/instagram';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = req.headers.get('authorization') ?? '';
  if (!secret || !safeEqual(auth, `Bearer ${secret}`)) return new NextResponse('unauthorized', { status: 401 });

  const sb = db();
  const cutoff = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const { data } = await sb
    .from('ig_accounts')
    .select('id, token_enc')
    .eq('status', 'connected')
    .not('token_enc', 'is', null)
    .lt('token_refreshed_at', cutoff)
    .limit(200);

  let refreshed = 0;
  let failed = 0;
  for (const row of (data ?? []) as { id: string; token_enc: string }[]) {
    try {
      const t = await refresh(decrypt(row.token_enc));
      await sb
        .from('ig_accounts')
        .update({
          token_enc: encrypt(t.access_token),
          token_expires_at: new Date(Date.now() + t.expires_in * 1000).toISOString(),
          token_refreshed_at: new Date().toISOString(),
        })
        .eq('id', row.id);
      refreshed++;
    } catch (e) {
      failed++;
      if (e instanceof IgError && e.needsReconnect) {
        await sb.from('ig_accounts').update({ status: 'reconnect', last_error: friendly(e) }).eq('id', row.id);
      }
    }
  }

  await sb.from('ig_events').delete().lt('created_at', new Date(Date.now() - 90 * 86_400_000).toISOString());
  await sb.from('rzp_events').delete().lt('created_at', new Date(Date.now() - 30 * 86_400_000).toISOString());

  return NextResponse.json({ refreshed, failed });
}
