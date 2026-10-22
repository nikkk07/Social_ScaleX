import 'server-only';
// Crediting payments, shared by the browser callback (/api/app/billing/verify)
// and the Razorpay webhook. Both may arrive, in any order, more than once:
// ig_credit_payment() makes the second one a no-op.
import { db } from '@/lib/server/appServer';
import { credit, cycleEnd, fetchPayment, fetchSubscription } from '@/lib/server/razorpay';
import { ONE_TIME_DAYS, PRICE_PAISE } from '@/lib/app/rules';

export interface Checkout {
  rzp_id: string;
  kind: 'order' | 'subscription';
  account_id: string;
  user_id: string;
}

export async function checkoutFor(rzpId: string): Promise<Checkout | null> {
  const { data } = await db().from('ig_checkouts').select('*').eq('rzp_id', rzpId).maybeSingle();
  return (data as Checkout | null) ?? null;
}

/** One-time order: credit 30 days if Razorpay confirms the full amount was captured. */
export async function creditOrderPayment(co: Checkout, paymentId: string): Promise<string | null> {
  const p = await fetchPayment(paymentId);
  if (p.order_id !== co.rzp_id || p.amount < PRICE_PAISE || !['captured', 'authorized'].includes(p.status)) return null;
  return credit({ paymentId, accountId: co.account_id, userId: co.user_id, kind: 'order', refId: co.rzp_id, amount: p.amount, until: null, days: ONE_TIME_DAYS });
}

/** AutoPay: credit up to the current cycle end Razorpay reports. */
export async function creditSubscriptionPayment(co: Checkout, paymentId: string): Promise<string | null> {
  const [p, s] = await Promise.all([fetchPayment(paymentId), fetchSubscription(co.rzp_id)]);
  if (p.amount < PRICE_PAISE || !['captured', 'authorized'].includes(p.status)) return null;
  const until = cycleEnd(s) ?? new Date(Date.now() + (ONE_TIME_DAYS + 1) * 86_400_000);
  const result = await credit({ paymentId, accountId: co.account_id, userId: co.user_id, kind: 'subscription', refId: co.rzp_id, amount: p.amount, until, days: 0 });
  await db().from('ig_billing').update({ rzp_status: s.status, rzp_subscription_id: co.rzp_id, mode: 'autopay' }).eq('account_id', co.account_id);
  return result;
}
