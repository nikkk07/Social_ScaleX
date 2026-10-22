'use client';
// Dashboard home: connect Instagram (step 2) and the list of connected
// accounts with what each one needs next. Errors from the Instagram
// callback arrive as ?ig=<reason> and are explained in plain words.
import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowRight, Instagram, Plus, ShieldCheck } from 'lucide-react';
import { AppShell, Avatar, Notice, Spinner, Stepper, useRequireSession } from '@/components/app/AppShell';
import { api, ApiError, fmtDate, type AccountSummary } from '@/lib/app/client';

const IG_ERRORS: Record<string, string> = {
  cancelled: 'Instagram connection was cancelled. Tap “Connect Instagram” to try again.',
  expired: 'That connection link expired. Tap “Connect Instagram” again.',
  personal:
    'This is a personal Instagram account. Switch it to a Professional account (free): Instagram → Settings → Account type and tools → Switch to professional account. Then connect again.',
  permissions:
    'Some permissions were switched off on Instagram’s screen. Connect again and keep every permission on — the automation needs all three.',
  subscribe: 'Connected, but Instagram did not switch on comment alerts. Tap “Reconnect” to try again.',
  failed: 'Instagram did not complete the connection. Please try again in a minute.',
};

export function nextStepFor(a: AccountSummary): { label: string; href: string; tone: 'ok' | 'warn' | 'error' } {
  if (a.status !== 'connected') return { label: 'Reconnect Instagram', href: `/dashboard/${a.id}`, tone: 'error' };
  if (!a.automations.total) return { label: 'Set up your automation', href: `/dashboard/${a.id}/new`, tone: 'warn' };
  if (!a.billing?.active) return { label: 'Pay ₹99 to go live', href: `/dashboard/${a.id}/activate`, tone: 'warn' };
  return { label: 'Live', href: `/dashboard/${a.id}`, tone: 'ok' };
}

export function useConnect() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const connect = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const { url } = await api<{ url: string }>('/api/app/instagram/start', { method: 'POST' });
      window.location.assign(url);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not start the connection.');
      setBusy(false);
    }
  }, []);
  return { connect, busy, error };
}

export function ConnectHelp() {
  return (
    <details className="mt-4 text-sm text-ink-2">
      <summary className="cursor-pointer font-semibold text-ink">What happens when I tap Connect?</summary>
      <ol className="mt-3 list-decimal space-y-1.5 pl-5">
        <li>Instagram’s own login page opens. Log in to the account you want to automate.</li>
        <li>Tap <strong>Allow</strong>. Keep all three permissions on.</li>
        <li>You come straight back here to set up your automation.</li>
      </ol>
      <p className="mt-3">Your account must be a <strong>Professional</strong> account (Business or Creator). Switching is free in Instagram settings.</p>
    </details>
  );
}

export function DashboardClient() {
  const { ready, email } = useRequireSession();
  const params = useSearchParams();
  const ig = params.get('ig');
  const takenUser = params.get('u');
  const [accounts, setAccounts] = useState<AccountSummary[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { connect, busy, error } = useConnect();

  useEffect(() => {
    if (!ready) return;
    api<{ accounts: AccountSummary[] }>('/api/app/me')
      .then((r) => setAccounts(r.accounts))
      .catch((e) => setLoadError(e instanceof ApiError ? e.message : 'Could not load your accounts.'));
  }, [ready]);

  if (!ready) return <AppShell><Spinner /></AppShell>;

  const igMessage = ig === 'taken'
    ? `@${takenUser ?? 'This account'} is already connected under another Social ScaleX login. Sign in with that login, or remove it there first. Need help? Tap Help above.`
    : ig ? IG_ERRORS[ig] ?? IG_ERRORS.failed : null;

  return (
    <AppShell email={email}>
      {igMessage ? <Notice tone="error">{igMessage}</Notice> : null}
      {loadError ? <Notice tone="error">{loadError}</Notice> : null}
      {error ? <Notice tone="error">{error}</Notice> : null}

      {accounts === null && !loadError ? <Spinner /> : null}

      {accounts && accounts.length === 0 ? (
        <>
          <Stepper at={1} />
          <section className="card max-w-xl p-6 sm:p-8">
            <h1 className="font-display text-3xl leading-tight text-ink sm:text-4xl">Connect your Instagram</h1>
            <p className="mt-2 text-ink-2">One tap. Your posts and Reels show up here right after.</p>
            <button type="button" onClick={connect} disabled={busy} className="btn btn-primary btn-lg mt-6 w-full sm:w-auto">
              <Instagram className="size-5" aria-hidden="true" /> {busy ? 'Opening Instagram…' : 'Connect Instagram'}
            </button>
            <p className="mt-4 flex items-start gap-2 text-xs text-ink-3">
              <ShieldCheck className="mt-0.5 size-3.5 flex-none text-positive" aria-hidden="true" />
              Official Instagram login. We never see your password, and you can remove access any time.
            </p>
            <ConnectHelp />
          </section>
        </>
      ) : null}

      {accounts && accounts.length > 0 ? (
        <>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl text-ink sm:text-4xl">Your Instagram accounts</h1>
              <p className="mt-1 text-ink-2">₹99 a month for each account. Unlimited automations inside it.</p>
            </div>
            <button type="button" onClick={connect} disabled={busy} className="btn btn-secondary">
              <Plus className="size-4" aria-hidden="true" /> {busy ? 'Opening…' : 'Add another account'}
            </button>
          </div>
          <ul className="mt-8 grid gap-4">
            {accounts.map((a) => {
              const step = nextStepFor(a);
              return (
                <li key={a.id}>
                  <Link href={step.href} className="card card-link flex flex-wrap items-center gap-4 p-5">
                    <Avatar src={a.avatar_url} name={a.username} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-ink">@{a.username}</span>
                      <span className="block text-sm text-ink-3">
                        {a.automations.total ? `${a.automations.enabled} of ${a.automations.total} automation${a.automations.total === 1 ? '' : 's'} on` : 'No automation yet'}
                        {a.billing?.active && a.billing.paidUntil ? ` · ${a.billing.mode === 'autopay' && a.billing.status === 'active' ? 'renews' : 'paid until'} ${fmtDate(a.billing.paidUntil)}` : ''}
                      </span>
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold ${
                        step.tone === 'ok' ? 'bg-positive/10 text-positive' : step.tone === 'warn' ? 'bg-coral-tint text-coral-text' : 'bg-critical/10 text-critical'
                      }`}
                    >
                      {step.tone === 'ok' ? <span aria-hidden="true" className="size-2 rounded-full bg-positive" /> : null}
                      {step.label} {step.tone !== 'ok' ? <ArrowRight className="size-4" aria-hidden="true" /> : null}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      ) : null}
    </AppShell>
  );
}
