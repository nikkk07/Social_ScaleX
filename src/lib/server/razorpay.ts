import 'server-only';
// ─────────────────────────────────────────────────────────────────────
// Razorpay over plain fetch (no SDK). Two ways to pay ₹99 per Instagram
// account:
//   autopay → a monthly Subscription (UPI AutoPay / card mandate)
//   once    → an Order for 30 days, paid again manually when it runs out
// Signatures (razorpay.com/docs):
//   order checkout:         HMAC_SHA256(order_id + "|" + payment_id, key_secret)
//   subscription checkout:  HMAC_SHA256(payment_id + "|" + subscription_id, key_secret)
//   webhook:                HMAC_SHA256(raw body, webhook_secret) in X-Razorpay-Signature
// ─────────────────────────────────────────────────────────────────────
import { db, env, hmacHex, safeEqual, HttpError } from '@/lib/server/appServer';
import { PRICE_PAISE } from '@/lib/app/rules';

const API = 'https://api.razorpay.com/v1';

async function rzp<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const auth = Buffer.from(`${env('RAZORPAY_KEY_ID')}:${env('RAZORPAY_KEY_SECRET')}`).toString('base64');
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15_000);
  try {
    const res = await fetch(`${API}${path}`, {
      method: init?.method ?? 'GET',
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
      body: init?.body ? JSON.stringify(init.body) : undefined,
      signal: ctrl.signal,
      cache: 'no-store',
    });
    const json = (await res.json().catch(() => null)) as (T & { error?: { description?: string } }) | null;
    if (!res.ok || !json) {
      console.error('[razorpay]', path, res.status, json?.error?.description);
      throw new HttpError(502, 'payment_provider', 'The payment service did not respond. Please try again.');
    }
    return json;
  } catch (e) {
    if (e instanceof HttpError) throw e;
    throw new HttpError(502, 'payment_provider', 'Could not reach the payment service. Please try again.');
  } finally {
    clearTimeout(timer);
  }
}

export interface RzpOrder { id: string; amount: number; status: string }
export interface RzpSubscription {
  id: string;
  status: string;
  current_start?: number | null;
  current_end?: number | null;
  notes?: Record<string, string>;
}
export interface RzpPayment {
  id: string;
  amount: number;
  status: string;
  order_id?: string | null;
  invoice_id?: string | null;
}

export function keyId(): string {
  return env('RAZORPAY_KEY_ID');
}

/** The ₹99 monthly plan, created once and remembered in app_config. */
export async function planId(): Promise<string> {
  const fromEnv = process.env.RAZORPAY_PLAN_ID?.trim();
  if (fromEnv) return fromEnv;
  const { data } = await db().from('app_config').select('value').eq('key', 'razorpay_plan_99').maybeSingle();
  if (data?.value) return data.value as string;
  const plan = await rzp<{ id: string }>('/plans', {
    method: 'POST',
    body: {
      period: 'monthly',
      interval: 1,
      item: { name: 'Comment-to-DM automation (1 Instagram account)', amount: PRICE_PAISE, currency: 'INR' },
    },
  });
  await db().from('app_config').upsert({ key: 'razorpay_plan_99', value: plan.id });
  return plan.id;
}

export function createOrder(receipt: string, notes: Record<string, string>): Promise<RzpOrder> {
  return rzp<RzpOrder>('/orders', { method: 'POST', body: { amount: PRICE_PAISE, currency: 'INR', receipt: receipt.slice(0, 40), notes } });
}

export async function createSubscription(notes: Record<string, string>): Promise<RzpSubscription> {
  return rzp<RzpSubscription>('/subscriptions', {
    method: 'POST',
    // 120 monthly cycles = 10 years; the customer can cancel any time.
    body: { plan_id: await planId(), total_count: 120, quantity: 1, customer_notify: 1, notes },
  });
}

export const fetchPayment = (id: string) => rzp<RzpPayment>(`/payments/${encodeURIComponent(id)}`);
export const fetchSubscription = (id: string) => rzp<RzpSubscription>(`/subscriptions/${encodeURIComponent(id)}`);
export const cancelSubscription = (id: string) =>
  rzp<RzpSubscription>(`/subscriptions/${encodeURIComponent(id)}/cancel`, { method: 'POST', body: { cancel_at_cycle_end: 1 } });

export function verifyOrderSignature(orderId: string, paymentId: string, signature: string): boolean {
  return safeEqual(hmacHex(env('RAZORPAY_KEY_SECRET'), `${orderId}|${paymentId}`), signature);
}

export function verifySubscriptionSignature(paymentId: string, subscriptionId: string, signature: string): boolean {
  return safeEqual(hmacHex(env('RAZORPAY_KEY_SECRET'), `${paymentId}|${subscriptionId}`), signature);
}

export function verifyWebhook(raw: string, signature: string | null): boolean {
  if (!signature) return false;
  return safeEqual(hmacHex(env('RAZORPAY_WEBHOOK_SECRET'), raw), signature);
}

/** Credits one payment exactly once (see ig_credit_payment in the migration). */
export async function credit(args: {
  paymentId: string;
  accountId: string;
  userId: string;
  kind: 'order' | 'subscription';
  refId: string;
  amount: number;
  until: Date | null;
  days: number;
}): Promise<string | null> {
  const { data, error } = await db().rpc('ig_credit_payment', {
    p_payment_id: args.paymentId,
    p_account: args.accountId,
    p_user: args.userId,
    p_kind: args.kind,
    p_ref: args.refId,
    p_amount: args.amount,
    p_until: args.until ? args.until.toISOString() : null,
    p_days: args.days,
    p_mode: args.kind === 'subscription' ? 'autopay' : 'once',
    p_sub: args.kind === 'subscription' ? args.refId : null,
  });
  if (error) throw error;
  return (data as string | null) ?? null;
}

/** Cycle end of a subscription as a Date, or null. Adds a 1-day grace for slow renewals. */
export function cycleEnd(s: RzpSubscription): Date | null {
  return s.current_end ? new Date((s.current_end + 86_400) * 1000) : null;
}
