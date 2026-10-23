'use client';
// Dashboard home. Google sign-ups first add their mobile + WhatsApp (once).
// No account yet → straight to the Instagram search. Otherwise: the list of
// connected accounts with what each needs next. Instagram callback errors
// arrive as ?ig=<reason> and are explained in plain words.
import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, Plus } from 'lucide-react';
import { AppShell, Avatar, Notice, Spinner, useRequireSession } from '@/components/app/AppShell';
import { Check, MobileField, TextField } from '@/components/app/Fields';
import { api, ApiError, fmtDate, type AccountSummary } from '@/lib/app/client';
import { fieldErrors, ProfileInput } from '@/lib/app/forms';

const IG_ERRORS: Record<string, string> = {
  cancelled: 'Instagram connection was cancelled. Search your account and try again.',
  expired: 'That connection link expired. Search your account and try again.',
  personal:
    'This is a personal Instagram account. Switch it to a Professional account (free): Instagram → Settings → Account type and tools → Switch to professional account. Then connect again.',
  permissions: 'Some permissions were switched off on Instagram’s screen. Connect again and keep every permission on.',
  subscribe: 'Connected, but Instagram did not switch on comment alerts. Open the account and tap “Reconnect”.',
  failed: 'Instagram did not complete the connection. Please try again in a minute.',
};

export function nextStepFor(a: AccountSummary): { label: string; href: string; tone: 'ok' | 'warn' | 'error' } {
  if (a.status !== 'connected') return { label: 'Reconnect Instagram', href: `/dashboard/${a.id}`, tone: 'error' };
  if (!a.automations.total) return { label: 'Set up your DM', href: `/dashboard/${a.id}/new`, tone: 'warn' };
  if (!a.billing?.active) return { label: 'Pay ₹99 to go live', href: `/dashboard/${a.id}/activate`, tone: 'warn' };
  return { label: 'Live', href: `/dashboard/${a.id}`, tone: 'ok' };
}

/** Re-runs Instagram login for an account already picked (reconnect). */
export function useConnect(expect?: string) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const connect = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const { url } = await api<{ url: string }>('/api/app/instagram/start', { method: 'POST', body: expect ? { expect } : {} });
      window.location.assign(url);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not start the connection.');
      setBusy(false);
    }
  }, [expect]);
  return { connect, busy, error };
}

interface Profile { full_name: string; phone: string; whatsapp: string }

function ProfileGate({ defaultName, onDone }: { defaultName: string; onDone: () => void }) {
  const [name, setName] = useState(defaultName);
  const [mobile, setMobile] = useState('');
  const [waSame, setWaSame] = useState(true);
  const [whatsapp, setWhatsapp] = useState('');
  const [fe, setFe] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const body = { name, mobile, whatsappSame: waSame, whatsapp };
    const check = ProfileInput.safeParse(body);
    if (!check.success) { setFe(fieldErrors(check.error)); return; }
    setFe({});
    setBusy(true);
    try {
      await api('/api/app/profile', { method: 'PUT', body });
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save. Please try again.');
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="card mx-auto grid max-w-md gap-4 p-5 sm:p-7" noValidate>
      <div>
        <h1 className="font-display text-2xl text-ink sm:text-3xl">One last detail</h1>
        <p className="mt-1 text-sm text-ink-2">So we can reach you on WhatsApp if your automation ever needs attention.</p>
      </div>
      {error ? <Notice tone="error">{error}</Notice> : null}
      <TextField label="Your name" autoComplete="name" value={name} onChange={setName} error={fe.name} />
      <MobileField label="Mobile number" value={mobile} onChange={setMobile} error={fe.mobile} />
      <Check checked={waSame} onChange={setWaSame}>WhatsApp is on this number</Check>
      {!waSame ? <MobileField label="WhatsApp number" value={whatsapp} onChange={setWhatsapp} error={fe.whatsapp} autoComplete="off" /> : null}
      <button type="submit" disabled={busy} className="btn btn-primary btn-lg w-full">{busy ? 'Saving…' : 'Continue'} {!busy ? <ArrowRight className="size-4" aria-hidden="true" /> : null}</button>
    </form>
  );
}

export function DashboardClient() {
  const { ready, email } = useRequireSession();
  const router = useRouter();
  const params = useSearchParams();
  const ig = params.get('ig');
  const takenUser = params.get('u');
  const [data, setData] = useState<{ accounts: AccountSummary[]; profile: Profile | null; user: { name: string | null } } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(() => {
    api<{ accounts: AccountSummary[]; profile: Profile | null; user: { name: string | null } }>('/api/app/me')
      .then(setData)
      .catch((e) => setLoadError(e instanceof ApiError ? e.message : 'Could not load your accounts.'));
  }, []);

  useEffect(() => { if (ready) load(); }, [ready, load]);

  // Nothing connected yet (and no error to show): go find the account.
  useEffect(() => {
    if (data?.profile && data.accounts.length === 0 && !ig) router.replace('/dashboard/connect');
  }, [data, ig, router]);

  if (!ready || (!data && !loadError)) return <AppShell email={email}><Spinner /></AppShell>;
  if (!data) return <AppShell email={email}><Notice tone="error">{loadError}</Notice></AppShell>;

  if (!data.profile) {
    return <AppShell email={email}><ProfileGate defaultName={data.user.name ?? ''} onDone={load} /></AppShell>;
  }

  const igMessage = ig === 'taken'
    ? `@${takenUser ?? 'This account'} is already connected under another Social ScaleX login. Sign in with that login, or tap Help to move it.`
    : ig ? IG_ERRORS[ig] ?? IG_ERRORS.failed : null;

  return (
    <AppShell email={email}>
      {igMessage ? (
        <Notice tone="error">
          {igMessage}
          <div className="mt-3"><Link href="/dashboard/connect" className="btn btn-primary">Search my account <ArrowRight className="size-4" aria-hidden="true" /></Link></div>
        </Notice>
      ) : null}

      {data.accounts.length === 0 && !ig ? <Spinner label="Opening search…" /> : null}

      {data.accounts.length > 0 ? (
        <>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl text-ink sm:text-4xl">Your Instagram accounts</h1>
              <p className="mt-1 text-ink-2">₹99 a month for each account. Unlimited automations inside it.</p>
            </div>
            <Link href="/dashboard/connect" className="btn btn-secondary"><Plus className="size-4" aria-hidden="true" /> Add another account</Link>
          </div>
          <ul className="mt-8 grid gap-4">
            {data.accounts.map((a) => {
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
