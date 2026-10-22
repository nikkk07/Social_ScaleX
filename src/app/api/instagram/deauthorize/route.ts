// POST /api/instagram/deauthorize  (Meta → us, form field signed_request)
// The person removed our app from their Instagram settings: drop the token
// and mark the account disconnected. Billing is kept so a reconnect by the
// same customer picks up where it left off.
import { NextResponse } from 'next/server';
import { db, env, parseSignedRequest } from '@/lib/server/appServer';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const data = parseSignedRequest(String(form.get('signed_request') ?? ''), env('IG_APP_SECRET'));
    const uid = data?.user_id ? String(data.user_id) : null;
    if (!uid || !/^\d{1,40}$/.test(uid)) return new NextResponse('bad request', { status: 400 });
    await db()
      .from('ig_accounts')
      .update({ status: 'disconnected', token_enc: null, last_error: 'Access was removed in Instagram settings.' })
      .or(`ig_scoped_id.eq.${uid},ig_user_id.eq.${uid}`);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[ig deauthorize]', e);
    return new NextResponse('error', { status: 500 });
  }
}
