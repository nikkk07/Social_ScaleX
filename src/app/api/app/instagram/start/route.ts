// POST /api/app/instagram/start → { url }  The browser goes to Instagram's
// login screen; the signed state brings the user id back to the callback.
import { NextResponse } from 'next/server';
import { errorResponse, NO_STORE, requireUser, signState } from '@/lib/server/appServer';
import { authorizeUrl } from '@/lib/server/instagram';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const user = await requireUser(req);
    return NextResponse.json({ url: authorizeUrl(signState(user.id)) }, { headers: NO_STORE });
  } catch (e) {
    return errorResponse(e);
  }
}
