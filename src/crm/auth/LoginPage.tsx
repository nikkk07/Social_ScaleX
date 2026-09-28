'use client';
import React, { useEffect, useId, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Loader2, Lock } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { isEmail, normalizePhone } from '@/lib/crm/normalize';
import { inputClass } from '../ui/kit';
import { CrmBoot } from '../CrmBoot';

export default function LoginPage() {
  const { status, signIn, signedOutReason } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const idId = useId();
  const pwId = useId();
  const msgId = useId();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requested = params?.get('next') ?? '';
  const next = requested.startsWith('/crm') && !requested.startsWith('//') ? requested : '/crm';

  useEffect(() => {
    if (status === 'signed_in') router.replace(next);
  }, [status, next, router]);

  if (status === 'initialising') return <CrmBoot label="Checking your session…" />;
  if (status === 'signed_in') return <CrmBoot label="Opening the CRM…" />;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const id = identifier.trim();
    if (!isEmail(id) && !normalizePhone(id)) {
      setError('Enter your email address or 10-digit mobile number.');
      return;
    }
    if (!password) {
      setError('Enter your password.');
      return;
    }
    setBusy(true);
    const res = await signIn(id, password);
    setBusy(false);
    if (!res.ok) {
      setError(res.message);
      setPassword('');
    }
    // On success the effect above navigates once the profile is loaded.
  }

  const notice =
    signedOutReason === 'idle'
      ? 'You were signed out after a period of inactivity.'
      : signedOutReason === 'inactive'
        ? 'Your account was deactivated. Ask an owner or admin if this is a mistake.'
        : null;

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Lock className="size-5" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Social ScaleX CRM</h1>
          <p className="mt-1 text-sm text-muted-foreground">Team sign in. Access is by invitation only.</p>
        </div>

        <form onSubmit={onSubmit} noValidate className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm" aria-describedby={msgId}>
          {notice ? <p className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">{notice}</p> : null}
          <div className="space-y-1.5">
            <label htmlFor={idId} className="block text-sm font-medium">Email or mobile number</label>
            <input
              id={idId}
              type="text"
              inputMode="email"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              autoFocus
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="you@company.com or 98765 43210"
              className={inputClass}
              aria-invalid={!!error || undefined}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor={pwId} className="block text-sm font-medium">Password</label>
            <div className="relative">
              <input
                id={pwId}
                type={show ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${inputClass} pr-10`}
                aria-invalid={!!error || undefined}
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-lg text-muted-foreground hover:text-foreground"
                aria-label={show ? 'Hide password' : 'Show password'}
                aria-pressed={show}
              >
                {show ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
              </button>
            </div>
          </div>

          <div id={msgId} role="alert" aria-live="assertive" className="min-h-5 text-sm font-medium text-destructive">
            {error}
          </div>

          <button
            type="submit"
            disabled={busy}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {busy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
          <p className="text-center text-xs text-muted-foreground">
            Forgot your password? Ask an owner or admin to reset it from Team.
          </p>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          <Link href="/" className="underline-offset-4 hover:underline">Back to the Social ScaleX website</Link>
        </p>
      </div>
    </main>
  );
}
