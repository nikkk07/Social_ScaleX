// POST /api/app/billing/cancel { accountId } → stop AutoPay at the end of the
// paid month. The automation keeps running until then.
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db, errorResponse, HttpError, NO_STORE, ownedAccount, readJson, requireUser } from '@/lib/server/appServer';
import { cancelSubscription } from '@/lib/server/razorpay';
import type { IgBillingRow } from '@/lib/server/appTypes';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const Body = z.object({ accountId: z.string().uuid() });

export async function POST(req: Request) {
  try {
    const user = await requireUser(req);
    const parsed = Body.safeParse(await readJson(req));
    if (!parsed.success) throw new HttpError(400, 'invalid_input', 'Missing account.');
    await ownedAccount(user.id, parsed.data.accountId, 'id');
    const { data } = await db().from('ig_billing').select('*').eq('account_id', parsed.data.accountId).maybeSingle();
    const bill = data as IgBillingRow | null;
    if (!bill?.rzp_subscription_id || bill.mode !== 'autopay') throw new HttpError(400, 'no_autopay', 'AutoPay is not on for this account.');
    const s = await cancelSubscription(bill.rzp_subscription_id);
    await db().from('ig_billing').update({ rzp_status: s.status === 'active' ? 'cancel_scheduled' : s.status }).eq('account_id', bill.account_id);
    return NextResponse.json({ ok: true, paidUntil: bill.paid_until }, { headers: NO_STORE });
  } catch (e) {
    return errorResponse(e);
  }
}
