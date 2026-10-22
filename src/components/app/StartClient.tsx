'use client';
// Step 1: sign up or sign in. Google first (one tap, nothing to remember),
// email + password as the fallback. Already signed in → straight on.
import React, { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, Eye, EyeOff, Lock, MessageCircle, Send } from 'lucide-react';
import { AppShell, Notice, Stepper } from '@/components/app/AppShell';
import { adoptSession, appSupabase, safeNext } from '@/lib/app/client';

interface GoogleId {
  accounts: {
    id: {
      initialize(o: { client_id: string; callback: (r: { credential?: string }) => void; ux_mode?: string; auto_select?: boolean }): void;
      renderButton(el: HTMLElement, o: Record<string, unknown>): void;
    };
  };
}
declare global {
  interface Window {
    google?: GoogleId;
  }
}

const GOOGLE_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

async function post<T>(path: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  } catch {
    throw new Error('No internet connection. Check it and try again.');
  }
  const json = (await res.json().catch(() => null)) as (T & { message?: string }) | null;
  if (!res.ok || !json) throw new Error(json?.message ?? 'Something went wrong. Please try again.');
  return json;
}

export function StartClient() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get('next'));
  const [mode, setMode] = useState<'signup' | 'signin'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [gReady, setGReady] = useState(false);
  const gBtn = useRef<HTMLDivElement>(null);

  // Already signed in: skip this page.
  useEffect(() => {
    appSupabase().auth.getSession().then(({ data }) => {
      if (data.session) router.replace(next);
    });
  }, [router, next]);

  useEffect(() => {
    if (!gReady || !GOOGLE_ID || !gBtn.current || !window.google) return;
    window.google.accounts.id.initialize({
      client_id: GOOGLE_ID,
      callback: async ({ credential }) => {
        if (!credential) return;
        setBusy(true);
        setError(null);
        try {
          const { session } = await post<{ session: { access_token: string; refresh_token: string } }>('/api/app/auth/google', { credential });
          await adoptSession(session);
          router.replace(next);
        } catch (e) {
          setError(e instanceof Error ? e.message : 'Google sign-in failed.');
          setBusy(false);
        }
      },
    });
    gBtn.current.innerHTML = '';
    window.google.accounts.id.renderButton(gBtn.current, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      shape: 'pill',
      text: 'continue_with',
      width: Math.min(360, gBtn.current.clientWidth || 360),
    });
  }, [gReady, router, next]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      const { session } = await post<{ session: { access_token: string; refresh_token: string } }>('/api/app/auth/email', {
        mode,
        email: email.trim(),
        password,
      });
      await adoptSession(session);
      router.replace(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setBusy(false);
    }
  }

  async function forgot() {
    setError(null);
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError('Type your email above first, then tap “Forgot password”.');
      return;
    }
    setBusy(true);
    const { error: err } = await appSupabase().auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/dashboard/reset`,
    });
    setBusy(false);
    // Same message either way, so this can't be used to check who has an account.
    if (err && /rate|limit/i.test(err.message)) setError('Too many reset emails. Wait a few minutes, or continue with Google.');
    else setInfo('If that email has an account, a reset link is on its way. Check spam too.');
  }

  return (
    <AppShell>
      {GOOGLE_ID ? <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onReady={() => setGReady(true)} /> : null}
      <Stepper at={0} />
      <div className="grid gap-10 lg:grid-cols-[1fr_22rem] lg:items-start">
        <section className="card mx-auto w-full max-w-md p-6 sm:p-8 lg:mx-0">
          <h1 className="font-display text-3xl leading-tight text-ink sm:text-4xl">
            {mode === 'signup' ? 'Start your ₹99 automation' : 'Welcome back'}
          </h1>
          <p className="mt-2 text-ink-2">
            {mode === 'signup' ? 'Takes about 2 minutes. You pay only at the end.' : 'Sign in to manage your automations.'}
          </p>

          {error ? <div className="mt-5"><Notice tone="error">{error}</Notice></div> : null}
          {info ? <div className="mt-5"><Notice tone="ok">{info}</Notice></div> : null}

          {GOOGLE_ID ? (
            <>
              <div ref={gBtn} className="mt-6 flex min-h-11 justify-center" aria-busy={!gReady} />
              <div className="my-6 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.12em] text-ink-3">
                <span className="h-px flex-1 bg-line" /> or with email <span className="h-px flex-1 bg-line" />
              </div>
            </>
          ) : <div className="mt-6" />}

          <form onSubmit={submit} className="grid gap-4" noValidate>
            <label className="grid gap-1.5 text-sm font-semibold text-ink">
              Email
              <input className="field" type="email" inputMode="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@business.com" />
            </label>
            <label className="grid gap-1.5 text-sm font-semibold text-ink">
              Password
              <span className="relative">
                <input
                  className="field w-full pr-12"
                  type={show ? 'text' : 'password'}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  required
                  minLength={mode === 'signup' ? 8 : 1}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'signup' ? 'At least 8 characters' : 'Your password'}
                />
                <button type="button" onClick={() => setShow((s) => !s)} className="absolute inset-y-0 right-0 grid w-12 place-items-center text-ink-3 hover:text-ink" aria-label={show ? 'Hide password' : 'Show password'}>
                  {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </span>
            </label>
            <button type="submit" className="btn btn-primary btn-lg w-full" disabled={busy || !email || !password}>
              {busy ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Sign in'} {!busy ? <ArrowRight className="size-4" aria-hidden="true" /> : null}
            </button>
          </form>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-2 text-sm">
            <button type="button" className="link" onClick={() => { setMode(mode === 'signup' ? 'signin' : 'signup'); setError(null); setInfo(null); }}>
              {mode === 'signup' ? 'Have an account? Sign in' : 'New here? Create an account'}
            </button>
            {mode === 'signin' ? <button type="button" className="text-ink-3 underline underline-offset-4 hover:text-ink" onClick={forgot} disabled={busy}>Forgot password</button> : null}
          </div>
          <p className="mt-6 flex items-start gap-2 text-xs text-ink-3">
            <Lock className="mt-0.5 size-3.5 flex-none" aria-hidden="true" />
            We never ask for your Instagram password. You connect Instagram through Instagram’s own login screen in the next step.
          </p>
        </section>

        <aside className="hidden lg:block" aria-label="What you are setting up">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-3">What you get</p>
          <div className="mt-4 space-y-3 text-sm">
            <p className="flex gap-3"><span className="grid size-7 flex-none place-items-center rounded-full bg-paper-2 text-xs font-semibold text-ink"><MessageCircle className="size-3.5" aria-hidden="true" /></span><span className="rounded-2xl rounded-tl-sm bg-surface px-4 py-2.5 text-ink ring-1 ring-line">Someone comments “PRICE” on your Reel</span></p>
            <p className="flex gap-3"><span className="grid size-7 flex-none place-items-center rounded-full bg-coral-tint text-coral-text"><Send className="size-3.5" aria-hidden="true" /></span><span className="rounded-2xl rounded-tl-sm bg-coral-tint px-4 py-2.5 text-ink">They get your DM with the link, instantly</span></p>
          </div>
          <ul className="mt-6 space-y-2 text-sm text-ink-2">
            <li>• ₹99 a month per Instagram account</li>
            <li>• Unlimited posts, Reels, keywords and messages</li>
            <li>• Uses Instagram’s official API</li>
            <li>• Cancel any time</li>
          </ul>
        </aside>
      </div>
    </AppShell>
  );
}
