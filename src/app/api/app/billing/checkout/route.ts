// ─────────────────────────────────────────────────────────────────────
// POST /api/app/billing/checkout { accountId, mode: 'autopay' | 'once' }
//   → what Razorpay Checkout needs in the browser.
// Refuses to start a second AutoPay on an account that already has one, and
// refuses to charge for an account with no automation (nothing would run).
// ─────────────────────────────────────────────────────────────────────
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db, errorResponse, HttpError, NO_STORE, ownedAccount, readJson, requireUser } from '@/lib/server/appServer';
import { createOrder, createSubscription, keyId } from '@/lib/server/razorpay';
import { PRICE_PAISE } from '@/lib/app/rules';
import type { IgAccountRow, IgBillingRow } from '@/lib/server/appTypes';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const Body = z.object({ accountId: z.string().uuid(), mode: z.enum(['autopay', 'once']) });

export async function POST(req: Request) {
  try {
    const user = await requireUser(req);
    const parsed = Body.safeParse(await readJson(req));
    if (!parsed.success) throw new HttpError(400, 'invalid_input', 'Choose a payment option.');
    const { accountId, mode } = parsed.data;
    const acc = await ownedAccount<IgAccountRow>(user.id, accountId, 'id, username, status');
    const sb = db();

    const { count } = await sb.from('ig_automations').select('id', { count: 'exact', head: true }).eq('account_id', accountId);
    if (!count) throw new HttpError(400, 'no_automation', 'Create your first automation before paying.');

    const { data: billData } = await sb.from('ig_billing').select('*').eq('account_id', accountId).maybeSingle();
    const bill = billData as IgBillingRow | null;
    const autopayLive = bill?.mode === 'autopay' && ['active', 'authenticated', 'pending'].includes(bill.rzp_status ?? '');
    if (autopayLive) throw new HttpError(409, 'already_autopay', 'AutoPay is already on for this account. Nothing more to pay.');
    // Switching from a one-time payment to AutoPay mid-month is allowed: the
    // days already paid for are never lost (ig_credit_payment only moves
    // paid_until forward). Paying once again while still active stacks 30 days.

    const notes = { account_id: accountId, user_id: user.id, instagram: acc.username };
    const prefill = { email: user.email ?? undefined, name: user.name ?? undefined };
    const description = `@${acc.username} · comment-to-DM`;

    if (mode === 'once') {
      const order = await createOrder(`ig_${accountId.slice(0, 8)}_${Date.now()}`, notes);
      await sb.from('ig_checkouts').insert({ rzp_id: order.id, kind: 'order', account_id: accountId, user_id: user.id });
      return NextResponse.json({ keyId: keyId(), orderId: order.id, amount: PRICE_PAISE, currency: 'INR', description, prefill }, { headers: NO_STORE });
    }
    const sub = await createSubscription(notes);
    await sb.from('ig_checkouts').insert({ rzp_id: sub.id, kind: 'subscription', account_id: accountId, user_id: user.id });
    return NextResponse.json({ keyId: keyId(), subscriptionId: sub.id, amount: PRICE_PAISE, currency: 'INR', description, prefill }, { headers: NO_STORE });
  } catch (e) {
    return errorResponse(e);
  }
}
