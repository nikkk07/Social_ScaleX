// GET /api/app/accounts/:id/media?after=cursor → the account's latest posts and Reels
import { NextResponse } from 'next/server';
import { db, decrypt, errorResponse, HttpError, NO_STORE, ownedAccount, requireUser } from '@/lib/server/appServer';
import { friendly, IgError, listMedia } from '@/lib/server/instagram';
import type { IgAccountRow } from '@/lib/server/appTypes';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Ctx) {
  try {
    const user = await requireUser(req);
    const { id } = await params;
    const acc = await ownedAccount<IgAccountRow>(user.id, id, 'id, ig_user_id, token_enc, status');
    if (!acc.token_enc || acc.status === 'disconnected') throw new HttpError(409, 'reconnect', 'Reconnect Instagram to see your posts.');
    const after = new URL(req.url).searchParams.get('after') ?? undefined;
    try {
      const page = await listMedia(acc.ig_user_id, decrypt(acc.token_enc), after && /^[\w=-]{1,400}$/.test(after) ? after : undefined);
      const items = page.items.map((m) => ({
        id: m.id,
        type: m.media_product_type === 'REELS' ? 'reel' : m.media_type === 'CAROUSEL_ALBUM' ? 'carousel' : m.media_type === 'VIDEO' ? 'video' : 'post',
        thumb: m.thumbnail_url ?? (m.media_type === 'VIDEO' ? null : m.media_url ?? null),
        caption: m.caption ? m.caption.slice(0, 200) : null,
        permalink: m.permalink ?? null,
        timestamp: m.timestamp ?? null,
      }));
      return NextResponse.json({ items, next: page.next }, { headers: NO_STORE });
    } catch (e) {
      if (e instanceof IgError && e.needsReconnect) {
        await db().from('ig_accounts').update({ status: 'reconnect', last_error: friendly(e) }).eq('id', id);
        throw new HttpError(409, 'reconnect', 'Instagram access expired. Reconnect the account.');
      }
      throw new HttpError(502, 'instagram', friendly(e));
    }
  } catch (e) {
    return errorResponse(e);
  }
}
