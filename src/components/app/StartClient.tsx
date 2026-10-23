'use client';
// ─────────────────────────────────────────────────────────────────────
// /start — where "Get it for ₹99" lands. Sign in first; new people tap
// "Create account". Google works for both. Already signed in → skip ahead.
// Layout: phones get a compact benefits band above the form; tablets and
// laptops get the benefits panel beside it, both visible without scrolling.
// ─────────────────────────────────────────────────────────────────────
import React, { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, BadgeCheck, Infinity as InfinityIcon, MessageCircle, Send, ShieldCheck, Sparkles } from 'lucide-react';
import { AppShell, Notice } from '@/components/app/AppShell';
import { Check, MobileField, PasswordField, TextField } from '@/components/app/Fields';
import { adoptSession, appSupabase, safeNext } from '@/lib/app/client';
import { fieldErrors, isEmail, normalizeMobile, RegisterInput } from '@/lib/app/forms';

interface GoogleId {
  accounts: {
    id: {
      initialize(o: { client_id: string; callback: (r: { credential?: string }) => void; auto_select?: boolean; context?: string }): void;
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

type Session = { access_token: string; refresh_token: string };

class FormError extends Error {
  constructor(message: string, public fields: Record<string, string> = {}) {
    super(message);
  }
}

async function post<T>(path: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  } catch {
    throw new FormError('No internet connection. Check it and try again.');
  }
  const json = (await res.json().catch(() => null)) as (T & { message?: string; fields?: Record<string, string> }) | null;
  if (!res.ok || !json) throw new FormError(json?.message ?? 'Something went wrong. Please try again.', json?.fields ?? {});
  return json;
}

function Benefits() {
  return (
    <section aria-label="What you get" className="overflow-hidden rounded-card bg-night p-5 text-on-night sm:p-7 md:h-full md:p-8">
      <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-coral-on-night">
        <Sparkles className="size-3.5" aria-hidden="true" /> Comment-to-DM · ₹99/month
      </p>
      <h2 className="mt-2 font-display text-2xl leading-tight sm:text-3xl md:mt-3 md:text-4xl">Every comment gets your DM. Instantly.</h2>

      {/* Phones: one line of proof. Bigger screens: the conversation. */}
      <div className="mt-4 space-y-2.5 text-sm md:mt-8">
        <p className="flex items-center gap-2.5">
          <span className="grid size-7 flex-none place-items-center rounded-full bg-white/10"><MessageCircle className="size-3.5" aria-hidden="true" /></span>
          <span className="rounded-2xl rounded-tl-sm bg-white/10 px-3.5 py-2">riya.sharma: <strong>PRICE</strong></span>
        </p>
        <p className="flex items-center gap-2.5">
          <span className="grid size-7 flex-none place-items-center rounded-full bg-coral text-white"><Send className="size-3.5" aria-hidden="true" /></span>
          <span className="rounded-2xl rounded-tl-sm bg-on-night px-3.5 py-2 text-night">Hi Riya! Here’s the price list 👉 your link</span>
        </p>
      </div>

      <ul className="mt-5 flex flex-wrap gap-2 text-xs sm:text-sm md:mt-8 md:grid md:gap-3">
        {[
          { icon: InfinityIcon, t: 'Unlimited posts, Reels, keywords & DMs' },
          { icon: BadgeCheck, t: 'Official Instagram API, no password shared' },
          { icon: ShieldCheck, t: 'Cancel any time' },
        ].map(({ icon: Icon, t }) => (
          <li key={t} className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 md:rounded-none md:bg-transparent md:p-0 md:text-on-night-2">
            <Icon className="size-4 flex-none text-coral-on-night" aria-hidden="true" /> {t}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function StartClient() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get('next'));
  const [mode, setMode] = useState<'login' | 'register'>(params.get('mode') === 'register' ? 'register' : 'login');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [fe, setFe] = useState<Record<string, string>>({});

  // login
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  // register
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [waSame, setWaSame] = useState(true);
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [website, setWebsite] = useState(''); // honeypot

  const [gReady, setGReady] = useState(false);
  const gBtn = useRef<HTMLDivElement>(null);

  useEffect(() => {
    appSupabase().auth.getSession().then(({ data }) => {
      if (data.session) router.replace(next);
    });
  }, [router, next]);

  useEffect(() => {
    if (!gReady || !GOOGLE_ID || !gBtn.current || !window.google) return;
    window.google.accounts.id.initialize({
      client_id: GOOGLE_ID,
      context: mode === 'register' ? 'signup' : 'signin',
      callback: async ({ credential }) => {
        if (!credential) return;
        setBusy(true);
        setError(null);
        try {
          const { session } = await post<{ session: Session }>('/api/app/auth/google', { credential });
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
      text: mode === 'register' ? 'signup_with' : 'signin_with',
      width: Math.min(400, gBtn.current.clientWidth || 320),
      logo_alignment: 'center',
    });
  }, [gReady, router, next, mode]);

  function switchMode(m: 'login' | 'register') {
    setMode(m);
    setError(null);
    setInfo(null);
    setFe({});
  }

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    const f: Record<string, string> = {};
    if (!isEmail(identifier) && !normalizeMobile(identifier)) f.identifier = 'Enter your email or 10-digit mobile number.';
    if (!password) f.password = 'Enter your password.';
    setFe(f);
    if (Object.keys(f).length) return;
    setBusy(true);
    try {
      const { session } = await post<{ session: Session }>('/api/app/auth/login', { identifier, password });
      await adoptSession(session);
      router.replace(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in.');
      setBusy(false);
    }
  }

  async function register(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    const body = { name, mobile, whatsappSame: waSame, whatsapp, email, password: newPw, confirm, website };
    const check = RegisterInput.safeParse(body);
    if (!check.success) {
      setFe(fieldErrors(check.error));
      return;
    }
    setFe({});
    setBusy(true);
    try {
      const { session } = await post<{ session: Session }>('/api/app/auth/register', body);
      await adoptSession(session);
      router.replace(next);
    } catch (err) {
      if (err instanceof FormError && Object.keys(err.fields).length) setFe(err.fields);
      setError(err instanceof Error ? err.message : 'Could not create the account.');
      setBusy(false);
    }
  }

  async function forgot() {
    setError(null);
    setInfo(null);
    if (!isEmail(identifier)) {
      setFe({ identifier: 'Type the email you registered with, then tap “Forgot password?” again.' });
      return;
    }
    setBusy(true);
    const { error: err } = await appSupabase().auth.resetPasswordForEmail(identifier.trim(), {
      redirectTo: `${window.location.origin}/dashboard/reset`,
    });
    setBusy(false);
    // Same message either way, so nobody can test which emails have accounts.
    if (err && /rate|limit/i.test(err.message)) setError('Too many reset emails right now. Wait a few minutes, or continue with Google.');
    else setInfo('If that email has an account, a reset link is on its way. Check spam too.');
  }

  const google = GOOGLE_ID ? (
    <>
      <div className="my-5 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.12em] text-ink-3">
        <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
      </div>
      <div ref={gBtn} className="flex min-h-11 w-full justify-center" aria-busy={!gReady} />
    </>
  ) : null;

  return (
    <AppShell>
      {GOOGLE_ID ? <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onReady={() => setGReady(true)} /> : null}
      <div className="grid gap-5 md:min-h-[calc(100dvh-9rem)] md:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)] md:items-stretch md:gap-8">
        <Benefits />

        <section className="card p-5 sm:p-7 md:self-center" aria-labelledby="auth-title">
          <div role="tablist" aria-label="Sign in or create account" className="mb-6 grid grid-cols-2 rounded-full bg-paper-2 p-1 text-sm font-semibold">
            {(['login', 'register'] as const).map((m) => (
              <button
                key={m}
                role="tab"
                type="button"
                aria-selected={mode === m}
                onClick={() => switchMode(m)}
                className={`rounded-full px-3 py-2.5 transition-colors ${mode === m ? 'bg-surface text-ink shadow-soft' : 'text-ink-3 hover:text-ink'}`}
              >
                {m === 'login' ? 'Sign in' : 'Create account'}
              </button>
            ))}
          </div>

          <h1 id="auth-title" className="font-display text-2xl leading-tight text-ink sm:text-3xl">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h1>

          <div className="mt-4">
            {error ? <Notice tone="error">{error}</Notice> : null}
            {info ? <Notice tone="ok">{info}</Notice> : null}
          </div>

          {mode === 'login' ? (
            <form onSubmit={login} className="grid gap-4" noValidate>
              <TextField label="Email or mobile number" autoComplete="username" inputMode="email" value={identifier} onChange={setIdentifier} error={fe.identifier} placeholder="you@example.com or 98765 43210" />
              <div className="grid gap-1.5">
                <PasswordField label="Password" autoComplete="current-password" value={password} onChange={setPassword} error={fe.password} />
                <button type="button" onClick={forgot} disabled={busy} className="justify-self-end text-xs font-semibold text-ink-2 underline underline-offset-4 hover:text-ink">Forgot password?</button>
              </div>
              <button type="submit" className="btn btn-primary btn-lg w-full" disabled={busy}>
                {busy ? 'Signing in…' : 'Sign in'} {!busy ? <ArrowRight className="size-4" aria-hidden="true" /> : null}
              </button>
              {google}
              <p className="mt-2 text-center text-sm text-ink-2">
                New here? <button type="button" className="link" onClick={() => switchMode('register')}>Create an account</button>
              </p>
            </form>
          ) : (
            <form onSubmit={register} className="grid gap-4" noValidate>
              <TextField label="Your name" autoComplete="name" value={name} onChange={setName} error={fe.name} placeholder="Rajan Saini" />
              <MobileField label="Mobile number" value={mobile} onChange={setMobile} error={fe.mobile} />
              <Check checked={waSame} onChange={setWaSame}>WhatsApp is on this number</Check>
              {!waSame ? <MobileField label="WhatsApp number" value={whatsapp} onChange={setWhatsapp} error={fe.whatsapp} autoComplete="off" /> : null}
              <TextField label="Email" type="email" inputMode="email" autoComplete="email" value={email} onChange={setEmail} error={fe.email} placeholder="you@example.com" />
              <div className="grid gap-4 sm:grid-cols-2">
                <PasswordField label="Password" autoComplete="new-password" value={newPw} onChange={setNewPw} error={fe.password} hint="At least 8 characters" />
                <PasswordField label="Confirm password" autoComplete="new-password" value={confirm} onChange={setConfirm} error={fe.confirm} />
              </div>
              {/* Honeypot: hidden from people, filled by bots. */}
              <input type="text" name="website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} className="hidden" aria-hidden="true" />
              <button type="submit" className="btn btn-primary btn-lg w-full" disabled={busy}>
                {busy ? 'Creating account…' : 'Create account'} {!busy ? <ArrowRight className="size-4" aria-hidden="true" /> : null}
              </button>
              {google}
              <p className="mt-2 text-center text-sm text-ink-2">
                Already have an account? <button type="button" className="link" onClick={() => switchMode('login')}>Sign in</button>
              </p>
            </form>
          )}
        </section>
      </div>
    </AppShell>
  );
}
