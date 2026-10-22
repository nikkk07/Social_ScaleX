'use client';
// One Instagram account: what to do next, its automations (pause / edit /
// delete), what happened to recent comments, plan and payment, and removal.
import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ArrowRight, CircleAlert, Clock, Instagram, Pause, Pencil, Play, Plus, Trash2 } from 'lucide-react';
import { AppShell, Avatar, Notice, Spinner, useRequireSession } from '@/components/app/AppShell';
import { useConnect } from '@/components/app/DashboardClient';
import { api, ApiError, fmtDate, type AccountDetail, type Automation, type EventItem } from '@/lib/app/client';

const STATUS: Record<EventItem['status'], { label: string; cls: string }> = {
  sent: { label: 'DM sent', cls: 'bg-positive/10 text-positive' },
  skipped: { label: 'Skipped', cls: 'bg-paper-2 text-ink-3' },
  failed: { label: 'Failed', cls: 'bg-critical/10 text-critical' },
  pending: { label: 'Working…', cls: 'bg-paper-2 text-ink-3' },
};

function timeAgo(iso: string): string {
  const s = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  return fmtDate(iso);
}

function RuleCard({ a, onToggle, onDelete, busy }: { a: Automation; onToggle: () => void; onDelete: () => void; busy: boolean }) {
  return (
    <li className={`card p-5 ${a.is_enabled ? '' : 'opacity-70'}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-ink">{a.name}</p>
          <p className="mt-1 text-sm text-ink-3">
            {a.media_scope === 'all' ? 'All posts & Reels' : `${a.media_ids.length} selected post${a.media_ids.length === 1 ? '' : 's'}`}
            {' · '}
            {a.trigger_mode === 'any' ? 'every comment' : a.keywords.join(', ')}
            {a.public_replies.length ? ' · public reply on' : ''}
          </p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${a.is_enabled ? 'bg-positive/10 text-positive' : 'bg-paper-2 text-ink-3'}`}>{a.is_enabled ? 'On' : 'Paused'}</span>
      </div>
      <p className="mt-3 line-clamp-2 whitespace-pre-line rounded-xl bg-paper-2 px-3 py-2 text-sm text-ink-2">{a.dm_text}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href={`/dashboard/${a.account_id}/edit/${a.id}`} className="btn btn-secondary min-h-10 px-4 py-2"><Pencil className="size-4" aria-hidden="true" /> Edit</Link>
        <button type="button" onClick={onToggle} disabled={busy} className="btn btn-secondary min-h-10 px-4 py-2">
          {a.is_enabled ? <><Pause className="size-4" aria-hidden="true" /> Pause</> : <><Play className="size-4" aria-hidden="true" /> Turn on</>}
        </button>
        <button type="button" onClick={onDelete} disabled={busy} className="btn min-h-10 px-4 py-2 text-critical hover:bg-critical/5"><Trash2 className="size-4" aria-hidden="true" /> Delete</button>
      </div>
    </li>
  );
}

export function AccountClient({ accountId }: { accountId: string }) {
  const { ready, email } = useRequireSession();
  const router = useRouter();
  const params = useSearchParams();
  const [d, setD] = useState<AccountDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { connect, busy: connecting, error: connectError } = useConnect();

  const load = useCallback(() => {
    api<AccountDetail>(`/api/app/accounts/${accountId}`)
      .then(setD)
      .catch((e) => setLoadError(e instanceof ApiError ? e.message : 'Could not load this account.'));
  }, [accountId]);

  useEffect(() => {
    if (ready) load();
  }, [ready, load]);

  // Comments keep arriving: refresh the activity list every 30 s while open.
  useEffect(() => {
    if (!ready) return;
    const t = setInterval(() => { if (document.visibilityState === 'visible') load(); }, 30_000);
    return () => clearInterval(t);
  }, [ready, load]);

  async function act(fn: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  if (!ready || (!d && !loadError)) return <AppShell email={email}><Spinner /></AppShell>;
  if (loadError || !d) return <AppShell email={email}><Notice tone="error">{loadError}</Notice><Link className="link" href="/dashboard">Back to dashboard</Link></AppShell>;

  const { account, billing, automations, events } = d;
  const live = account.status === 'connected' && billing?.active && automations.some((a) => a.is_enabled);
  const autopay = billing?.mode === 'autopay' && billing.status === 'active';
  const cancelScheduled = billing?.mode === 'autopay' && ['cancel_scheduled', 'cancelled'].includes(billing.status ?? '');
  const halted = billing?.mode === 'autopay' && billing.status === 'halted';
  const endsSoon = billing?.active && billing.paidUntil && !autopay && new Date(billing.paidUntil).getTime() - Date.now() < 5 * 86_400_000;

  return (
    <AppShell email={email}>
      <Link href="/dashboard" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-2 hover:text-ink"><ArrowLeft className="size-4" aria-hidden="true" /> All accounts</Link>

      <div className="flex flex-wrap items-center gap-4">
        <Avatar src={account.avatar_url} name={account.username} />
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-3xl text-ink">@{account.username}</h1>
          <p className="text-sm text-ink-3">{account.name ?? 'Instagram professional account'}</p>
        </div>
        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ${live ? 'bg-positive/10 text-positive' : 'bg-coral-tint text-coral-text'}`}>
          <span aria-hidden="true" className={`size-2 rounded-full ${live ? 'bg-positive' : 'bg-coral'}`} />
          {live ? 'Live' : 'Not live'}
        </span>
      </div>

      <div className="mt-6">
        {params.get('connected') ? <Notice tone="ok">Instagram reconnected.</Notice> : null}
        {params.get('saved') ? <Notice tone="ok">Saved. Changes apply to new comments right away.</Notice> : null}
        {error ? <Notice tone="error">{error}</Notice> : null}
        {connectError ? <Notice tone="error">{connectError}</Notice> : null}

        {account.status !== 'connected' ? (
          <Notice tone="error">
            <strong>Instagram needs reconnecting.</strong> {account.last_error ?? 'Access expired or was removed.'} Nothing is sent until you reconnect.
            <div className="mt-3"><button type="button" onClick={connect} disabled={connecting} className="btn btn-primary"><Instagram className="size-4" aria-hidden="true" /> {connecting ? 'Opening…' : 'Reconnect Instagram'}</button></div>
          </Notice>
        ) : !automations.length ? (
          <Notice tone="warn">No automation yet. <Link className="link" href={`/dashboard/${accountId}/new`}>Set one up</Link> — it takes a minute.</Notice>
        ) : !billing?.active ? (
          <Notice tone="warn">
            <strong>{billing?.paidUntil ? `Your plan ended on ${fmtDate(billing.paidUntil)}.` : 'Almost there.'}</strong> Pay ₹99 to switch your automation on.
            <div className="mt-3"><Link href={`/dashboard/${accountId}/activate`} className="btn btn-primary">Pay ₹99 <ArrowRight className="size-4" aria-hidden="true" /></Link></div>
          </Notice>
        ) : halted ? (
          <Notice tone="error">AutoPay could not charge your last renewal. Update your payment method from the Razorpay email, or <Link className="link" href={`/dashboard/${accountId}/activate`}>pay ₹99 once</Link> before {fmtDate(billing.paidUntil)}.</Notice>
        ) : endsSoon ? (
          <Notice tone="warn">Your plan ends on {fmtDate(billing.paidUntil)}. <Link className="link" href={`/dashboard/${accountId}/activate`}>Renew now</Link> so it doesn’t stop.</Notice>
        ) : null}
      </div>

      <section className="mt-8" aria-labelledby="rules">
        <div className="flex items-center justify-between gap-3">
          <h2 id="rules" className="text-xl font-semibold text-ink">Automations</h2>
          <Link href={`/dashboard/${accountId}/new`} className="btn btn-secondary min-h-10 px-4 py-2"><Plus className="size-4" aria-hidden="true" /> New</Link>
        </div>
        {automations.length ? (
          <ul className="mt-4 grid gap-4 md:grid-cols-2">
            {automations.map((a) => (
              <RuleCard
                key={a.id}
                a={a}
                busy={busy}
                onToggle={() => act(() => api(`/api/app/automations/${a.id}`, { method: 'PATCH', body: { isEnabled: !a.is_enabled } }))}
                onDelete={() => {
                  if (window.confirm(`Delete “${a.name}”? This can’t be undone.`)) void act(() => api(`/api/app/automations/${a.id}`, { method: 'DELETE' }));
                }}
              />
            ))}
          </ul>
        ) : <p className="mt-4 text-sm text-ink-3">Nothing here yet.</p>}
        {automations.length > 1 ? <p className="mt-3 text-xs text-ink-3">If two automations match the same comment, the one for that specific post wins, then the keyword one. Each comment gets one DM.</p> : null}
      </section>

      <section className="mt-10" aria-labelledby="activity">
        <h2 id="activity" className="text-xl font-semibold text-ink">Recent comments</h2>
        {events.length ? (
          <ul className="mt-4 divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
            {events.map((e) => (
              <li key={e.id} className="flex flex-wrap items-start gap-3 px-4 py-3 text-sm">
                <span className={`mt-0.5 rounded-full px-2 py-0.5 text-xs font-bold ${STATUS[e.status].cls}`}>{STATUS[e.status].label}</span>
                <span className="min-w-0 flex-1">
                  <span className="font-semibold text-ink">{e.commenter_username ? `@${e.commenter_username}` : 'Someone'}</span>{' '}
                  <span className="text-ink-2">“{(e.comment_text ?? '').slice(0, 120)}”</span>
                  {e.detail ? <span className="mt-0.5 flex items-start gap-1 text-xs text-ink-3"><CircleAlert className="mt-0.5 size-3 flex-none" aria-hidden="true" />{e.detail}</span> : null}
                </span>
                <span className="flex items-center gap-1 text-xs text-ink-3"><Clock className="size-3" aria-hidden="true" />{timeAgo(e.created_at)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 rounded-card border border-dashed border-line-strong p-5 text-sm text-ink-3">
            No comments yet. To test, comment your keyword on one of your posts from a <strong>different</strong> Instagram account. Comments from @{account.username} itself are ignored.
          </p>
        )}
      </section>

      <section className="mt-10 grid gap-4 md:grid-cols-2" aria-label="Plan and account">
        <div className="card p-5">
          <h2 className="font-semibold text-ink">Plan</h2>
          <p className="mt-1 text-sm text-ink-2">
            {billing?.active
              ? autopay
                ? `₹99/month AutoPay · renews ${fmtDate(billing.paidUntil)}`
                : cancelScheduled
                  ? `AutoPay cancelled · runs until ${fmtDate(billing.paidUntil)}`
                  : `Paid until ${fmtDate(billing.paidUntil)}`
              : 'Not active'}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {!autopay ? <Link href={`/dashboard/${accountId}/activate`} className="btn btn-secondary min-h-10 px-4 py-2">{billing?.active ? 'Add 30 days / AutoPay' : 'Pay ₹99'}</Link> : null}
            {autopay ? (
              <button
                type="button"
                disabled={busy}
                className="btn btn-secondary min-h-10 px-4 py-2"
                onClick={() => {
                  if (window.confirm(`Stop AutoPay? Your automation keeps working until ${fmtDate(billing?.paidUntil ?? null)}, then stops.`)) {
                    void act(() => api('/api/app/billing/cancel', { method: 'POST', body: { accountId } }));
                  }
                }}
              >
                Cancel AutoPay
              </button>
            ) : null}
          </div>
        </div>
        <div className="card p-5">
          <h2 className="font-semibold text-ink">Instagram connection</h2>
          <p className="mt-1 text-sm text-ink-2">{account.status === 'connected' ? 'Connected and receiving comments.' : 'Needs reconnecting.'}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={connect} disabled={connecting} className="btn btn-secondary min-h-10 px-4 py-2">Reconnect</button>
            <button
              type="button"
              disabled={busy}
              className="btn min-h-10 px-4 py-2 text-critical hover:bg-critical/5"
              onClick={() => {
                const msg = autopay
                  ? `Remove @${account.username}? AutoPay is cancelled, all automations are deleted and DMs stop now.`
                  : `Remove @${account.username}? All automations are deleted and DMs stop now.`;
                if (!window.confirm(msg)) return;
                setBusy(true);
                setError(null);
                api(`/api/app/accounts/${accountId}`, { method: 'DELETE' })
                  .then(() => router.replace('/dashboard'))
                  .catch((e) => {
                    setError(e instanceof ApiError ? e.message : 'Could not remove the account. Please try again.');
                    setBusy(false);
                  });
              }}
            >
              Remove account
            </button>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
