'use client';
// Step 4: pay ₹99 for this Instagram account. Two choices: AutoPay every
// month (UPI AutoPay / card) or pay once for 30 days. Razorpay Checkout opens
// on this page; on success the server verifies and the automation is live.
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BadgeCheck, Lock, RefreshCw, Wallet } from 'lucide-react';
import { AppShell, Notice, Spinner, useRequireSession } from '@/components/app/AppShell';
import { api, ApiError, fmtDate, type AccountDetail } from '@/lib/app/client';

interface RzpResponse {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_subscription_id?: string;
  razorpay_signature: string;
}
interface RzpInstance {
  open(): void;
  on(event: 'payment.failed', cb: (r: { error?: { description?: string } }) => void): void;
}
declare global {
  interface Window {
    Razorpay?: new (opts: Record<string, unknown>) => RzpInstance;
  }
}

interface CheckoutOut {
  keyId: string;
  orderId?: string;
  subscriptionId?: string;
  amount: number;
  currency: string;
  description: string;
  prefill: { email?: string; name?: string };
}

export function PayClient({ accountId }: { accountId: string }) {
  const { ready, email } = useRequireSession();
  const router = useRouter();
  const [detail, setDetail] = useState<AccountDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mode, setMode] = useState<'autopay' | 'once'>('autopay');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ paidUntil: string | null; pending: boolean } | null>(null);
  const [sdk, setSdk] = useState(false);

  useEffect(() => {
    if (!ready) return;
    api<AccountDetail>(`/api/app/accounts/${accountId}`)
      .then(setDetail)
      .catch((e) => setLoadError(e instanceof ApiError ? e.message : 'Could not load this account.'));
  }, [ready, accountId]);

  async function pay() {
    setError(null);
    if (!window.Razorpay) {
      setError('The payment window could not load. Check your internet, turn off any ad blocker for this page, and try again.');
      return;
    }
    setBusy(true);
    let co: CheckoutOut;
    try {
      co = await api<CheckoutOut>('/api/app/billing/checkout', { method: 'POST', body: { accountId, mode } });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not start the payment.');
      setBusy(false);
      return;
    }
    const rzp = new window.Razorpay({
      key: co.keyId,
      name: 'Social ScaleX',
      description: co.description,
      ...(co.orderId ? { order_id: co.orderId, amount: co.amount, currency: co.currency } : { subscription_id: co.subscriptionId }),
      prefill: co.prefill,
      theme: { color: '#16140F' },
      modal: { ondismiss: () => setBusy(false), confirm_close: true },
      handler: async (r: RzpResponse) => {
        try {
          const body = r.razorpay_order_id
            ? { orderId: r.razorpay_order_id, paymentId: r.razorpay_payment_id, signature: r.razorpay_signature }
            : { subscriptionId: r.razorpay_subscription_id ?? co.subscriptionId, paymentId: r.razorpay_payment_id, signature: r.razorpay_signature };
          const out = await api<{ paidUntil?: string; pending?: boolean }>('/api/app/billing/verify', { method: 'POST', body });
          setDone({ paidUntil: out.paidUntil ?? null, pending: Boolean(out.pending) });
        } catch (e) {
          setError(
            (e instanceof ApiError ? e.message : 'We could not confirm the payment.') +
              ' If money was deducted, do not pay again — it will show here within a few minutes. Payment ID: ' +
              r.razorpay_payment_id,
          );
        } finally {
          setBusy(false);
        }
      },
    });
    rzp.on('payment.failed', (r) => {
      setError(`Payment failed${r.error?.description ? `: ${r.error.description}` : ''}. No money was taken. Try again or choose another method.`);
      setBusy(false);
    });
    rzp.open();
  }

  if (!ready || (!detail && !loadError)) return <AppShell email={email}><Spinner /></AppShell>;
  if (loadError || !detail) return <AppShell email={email}><Notice tone="error">{loadError}</Notice><Link className="link" href="/dashboard">Back to dashboard</Link></AppShell>;

  const username = detail.account.username;

  if (done) {
    return (
      <AppShell email={email}>
        <section className="card max-w-xl p-6 sm:p-8">
          <BadgeCheck className="size-10 text-positive" aria-hidden="true" />
          <h1 className="mt-4 font-display text-3xl text-ink sm:text-4xl">{done.pending ? 'Payment received' : 'You’re live!'}</h1>
          <p className="mt-2 text-ink-2">
            {done.pending
              ? 'Your bank is still confirming the payment. Your automation switches on automatically within a few minutes — no need to pay again.'
              : `Comments on @${username} now get your DM automatically${done.paidUntil ? `. Paid until ${fmtDate(done.paidUntil)}` : ''}.`}
          </p>
          <div className="mt-5 rounded-2xl bg-paper-2 p-4 text-sm text-ink-2">
            <strong className="text-ink">Test it now:</strong> from a different Instagram account, comment your keyword on one of your posts. The DM should arrive within a minute.
          </div>
          <button type="button" className="btn btn-primary btn-lg mt-6" onClick={() => router.push(`/dashboard/${accountId}`)}>Go to my dashboard</button>
        </section>
      </AppShell>
    );
  }

  const b = detail.billing;
  const autopayOn = b?.mode === 'autopay' && ['active', 'authenticated', 'pending'].includes(b.status ?? '');

  return (
    <AppShell email={email}>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" onReady={() => setSdk(true)} />
      <Link href={`/dashboard/${accountId}`} className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-2 hover:text-ink"><ArrowLeft className="size-4" aria-hidden="true" /> @{username}</Link>
      <h1 className="font-display text-3xl leading-tight text-ink sm:text-4xl">{b?.active ? 'Add more time' : 'Switch it on for ₹99'}</h1>
      <p className="mt-1 text-ink-2">For @{username}. Unlimited posts, Reels, keywords and DMs.</p>

      {b?.active && b.paidUntil ? <div className="mt-6"><Notice tone="ok">Already active until {fmtDate(b.paidUntil)}. Paying once adds 30 more days; AutoPay keeps it running every month.</Notice></div> : null}
      {autopayOn ? (
        <div className="mt-6"><Notice tone="info">AutoPay is on for this account, so there is nothing to pay. <Link className="link" href={`/dashboard/${accountId}`}>Back to dashboard</Link></Notice></div>
      ) : (
        <div className="mt-8 grid max-w-2xl gap-4">
          {error ? <Notice tone="error">{error}</Notice> : null}
          <fieldset className="grid gap-3 sm:grid-cols-2">
            <legend className="sr-only">How do you want to pay?</legend>
            {(
              [
                { v: 'autopay', icon: RefreshCw, title: '₹99 every month', sub: 'AutoPay with UPI or card', note: 'Never stops by mistake. Cancel any time.', badge: 'Recommended' },
                { v: 'once', icon: Wallet, title: '₹99 for 30 days', sub: 'Pay once with UPI, card or netbanking', note: 'Pay again yourself when it ends.', badge: null },
              ] as const
            ).map((o) => (
              <label key={o.v} className={`relative flex cursor-pointer flex-col rounded-2xl border p-5 transition-colors ${mode === o.v ? 'border-ink bg-surface shadow-lift' : 'border-line bg-surface hover:border-line-strong'}`}>
                <input type="radio" name="mode" value={o.v} checked={mode === o.v} onChange={() => setMode(o.v)} className="sr-only" />
                {o.badge ? <span className="absolute -top-2.5 right-4 rounded-full bg-positive px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">{o.badge}</span> : null}
                <o.icon className="size-5 text-ink-2" aria-hidden="true" />
                <span className="mt-3 font-display text-2xl text-ink">{o.title}</span>
                <span className="text-sm text-ink-2">{o.sub}</span>
                <span className="mt-2 text-xs text-ink-3">{o.note}</span>
                <span aria-hidden="true" className={`absolute right-4 top-5 grid size-5 place-items-center rounded-full border-2 ${mode === o.v ? 'border-ink bg-ink' : 'border-line-strong'}`}>
                  {mode === o.v ? <span className="size-2 rounded-full bg-white" /> : null}
                </span>
              </label>
            ))}
          </fieldset>
          <button type="button" onClick={pay} disabled={busy || !sdk} className="btn btn-primary btn-lg w-full sm:w-auto">
            {busy ? 'Opening payment…' : !sdk ? 'Loading payment…' : `Pay ₹99${mode === 'autopay' ? ' / month' : ''}`}
          </button>
          <p className="flex items-start gap-2 text-xs text-ink-3">
            <Lock className="mt-0.5 size-3.5 flex-none" aria-hidden="true" />
            Secure payment by Razorpay. We never see your card details or UPI PIN.
          </p>
        </div>
      )}
    </AppShell>
  );
}
