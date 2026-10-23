// ─────────────────────────────────────────────────────────────────────
// GET /api/app/instagram/lookup?q=<username or profile link>
//   → { status: 'found' | 'not_found' | 'unavailable' | 'invalid', username?,
//       profile?, connected?: 'you' | 'other' }
// Signed-in customers only, 60 lookups per 10 minutes each (typing pauses
// trigger lookups, so this is generous), and results are cached.
// ─────────────────────────────────────────────────────────────────────
import { NextResponse } from 'next/server';
import { db, errorResponse, NO_STORE, requireUser } from '@/lib/server/appServer';
import { assertNotLocked, hit, throttleKey } from '@/lib/server/throttle';
import { lookupUsername } from '@/lib/server/igLookup';
import { parseInstagramInput } from '@/lib/app/forms';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    const user = await requireUser(req);
    const username = parseInstagramInput(new URL(req.url).searchParams.get('q') ?? '');
    if (!username) return NextResponse.json({ status: 'invalid' }, { headers: NO_STORE });

    const key = throttleKey('ig-lookup', user.id);
    await assertNotLocked(key, 'searches');
    await hit(key, 60, 10 * 60_000, 5 * 60_000);

    const [result, { data: existing }] = await Promise.all([
      lookupUsername(username),
      db().from('ig_accounts').select('user_id, status').eq('username', username).neq('status', 'disconnected').maybeSingle(),
    ]);
    const ex = existing as { user_id: string } | null;
    const connected = ex ? (ex.user_id === user.id ? 'you' : 'other') : null;
    return NextResponse.json({ ...result, username, connected }, { headers: NO_STORE });
  } catch (e) {
    return errorResponse(e);
  }
}
