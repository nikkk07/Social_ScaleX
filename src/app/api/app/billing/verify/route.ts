// ─────────────────────────────────────────────────────────────────────
// POST /api/app/billing/verify  (called by the browser right after Razorpay
// Checkout succeeds)
//   { orderId, paymentId, signature }          one-time ₹99
//   { subscriptionId, paymentId, signature }   AutoPay
// The signature proves the response came from Razorpay; the payment is then
// re-read from Razorpay before anything is credited.
// ─────────────────────────────────────────────────────────────────────
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { errorResponse, HttpError, isPaid, NO_STORE, readJson, requireUser } from '@/lib/server/appServer';
import { verifyOrderSignature, verifySubscriptionSignature } from '@/lib/server/razorpay';
import { checkoutFor, creditOrderPayment, creditSubscriptionPayment } from '@/lib/server/billing';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const id = z.string().regex(/^[A-Za-z0-9_]{6,40}$/);
const Body = z.union([
  z.object({ orderId: id, paymentId: id, signature: z.string().regex(/^[a-f0-9]{64}$/) }),
  z.object({ subscriptionId: id, paymentId: id, signature: z.string().regex(/^[a-f0-9]{64}$/) }),
]);

export async function POST(req: Request) {
  try {
    const user = await requireUser(req);
    const parsed = Body.safeParse(await readJson(req));
    if (!parsed.success) throw new HttpError(400, 'invalid_input', 'Payment details were incomplete.');
    const b = parsed.data;
    const refId = 'orderId' in b ? b.orderId : b.subscriptionId;
    const ok = 'orderId' in b
      ? verifyOrderSignature(b.orderId, b.paymentId, b.signature)
      : verifySubscriptionSignature(b.paymentId, b.subscriptionId, b.signature);
    if (!ok) throw new HttpError(400, 'bad_signature', 'We could not confirm this payment. If money was deducted, it will be refunded or credited automatically.');

    const co = await checkoutFor(refId);
    if (!co || co.user_id !== user.id) throw new HttpError(404, 'not_found', 'Payment not found.');

    const paidUntil = co.kind === 'order' ? await creditOrderPayment(co, b.paymentId) : await creditSubscriptionPayment(co, b.paymentId);
    if (!paidUntil) {
      // Authorised but not captured yet (rare). The webhook will credit it.
      return NextResponse.json({ ok: true, pending: true, accountId: co.account_id }, { headers: NO_STORE });
    }
    return NextResponse.json({ ok: true, active: isPaid(paidUntil), paidUntil, accountId: co.account_id }, { headers: NO_STORE });
  } catch (e) {
    return errorResponse(e);
  }
}
