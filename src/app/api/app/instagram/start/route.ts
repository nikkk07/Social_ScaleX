// POST /api/app/instagram/start { expect?: username } → { url }
// The browser goes to Instagram's login screen; the signed state brings the
// user id and the username they picked back to the callback.
import { NextResponse } from 'next/server';
import { errorResponse, NO_STORE, requireUser, signState } from '@/lib/server/appServer';
import { authorizeUrl } from '@/lib/server/instagram';
import { parseInstagramInput } from '@/lib/app/forms';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const user = await requireUser(req);
    let expect: string | null = null;
    try {
      const body = (await req.json()) as { expect?: unknown };
      if (typeof body?.expect === 'string') expect = parseInstagramInput(body.expect);
    } catch {
      // no body: reconnect without a picked account
    }
    return NextResponse.json({ url: authorizeUrl(signState(user.id, expect)) }, { headers: NO_STORE });
  } catch (e) {
    return errorResponse(e);
  }
}
