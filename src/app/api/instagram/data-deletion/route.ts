// POST /api/instagram/data-deletion  (Meta → us, form field signed_request)
// Meta's required data-deletion callback: delete everything we hold for that
// Instagram user and return a status URL plus confirmation code.
// AutoPay is cancelled first (removeAccount) so billing stops too.
import { randomBytes } from 'node:crypto';
import { NextResponse } from 'next/server';
import { appUrl, db, env, parseSignedRequest } from '@/lib/server/appServer';
import { removeAccount } from '@/lib/server/accounts';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const data = parseSignedRequest(String(form.get('signed_request') ?? ''), env('IG_APP_SECRET'));
    const uid = data?.user_id ? String(data.user_id) : null;
    if (!uid || !/^\d{1,40}$/.test(uid)) return new NextResponse('bad request', { status: 400 });
    const { data: rows } = await db().from('ig_accounts').select('id').or(`ig_scoped_id.eq.${uid},ig_user_id.eq.${uid}`);
    for (const r of (rows ?? []) as { id: string }[]) {
      if (!(await removeAccount(r.id))) {
        // AutoPay could not be stopped right now: remove the Instagram data
        // anyway (the token and comment history), keep the billing row.
        await db().from('ig_events').delete().eq('account_id', r.id);
        await db().from('ig_accounts').update({ status: 'disconnected', token_enc: null, username: 'deleted', name: null, avatar_url: null }).eq('id', r.id);
      }
    }
    const code = randomBytes(8).toString('hex');
    return NextResponse.json({ url: appUrl(`/privacy?deletion=${code}`), confirmation_code: code });
  } catch (e) {
    console.error('[ig data deletion]', e);
    return new NextResponse('error', { status: 500 });
  }
}
