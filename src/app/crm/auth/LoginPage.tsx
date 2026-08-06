// Invite-only staff login. No signup anywhere. Two things carry security
// weight here and are deliberate, not incidental:
//   1. Non-enumeration: a wrong password and an unknown email must produce the
//      SAME message and comparable timing. We never branch on which failed —
//      Supabase itself returns an identical 400 for both — and the reset flow
//      always shows the same generic confirmation.
//   2. The reset redirect must point at an allow-listed URL (this origin).
import React, { useId, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { useAuth } from './AuthProvider';
import { supabase } from '../../../lib/supabase';

type Mode = 'signin' | 'reset';

const GENERIC_SIGNIN_ERROR = 'Incorrect email or password.';
const RATE_LIMIT_ERROR = 'Too many attempts. Please wait a moment and try again.';
const UNEXPECTED_ERROR = 'Something went wrong. Please try again.';
// Same copy whether or not the address exists — never reveal which.
const RESET_CONFIRMATION =
  'If an account exists for that email, a password reset link is on its way.';

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export default function LoginPage() {
  const { status, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const emailId = useId();
  const passwordId = useId();
  const feedbackId = useId();

  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // Already signed in and provisioned? Skip the form.
  const from =
    (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ??
    '/crm';
  if (status === 'signed_in_provisioned') {
    return <Navigate to={from} replace />;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (!isEmail(email)) {
      setError('Enter a valid email address.');
      return;
    }

    if (mode === 'reset') {
      setSubmitting(true);
      try {
        // Fire-and-confirm: we show the same message regardless of the result
        // (except rate-limiting) so the response can't be used to probe which
        // emails are registered.
        const { error: resetErr } = await supabase.auth.resetPasswordForEmail(
          email.trim(),
          { redirectTo: `${window.location.origin}/login` },
        );
        if (resetErr && (resetErr as { status?: number }).status === 429) {
          setError(RATE_LIMIT_ERROR);
        } else {
          setInfo(RESET_CONFIRMATION);
        }
      } catch {
        // Even a thrown error must not leak existence — show the generic note.
        setInfo(RESET_CONFIRMATION);
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // mode === 'signin'
    if (!password) {
      setError(GENERIC_SIGNIN_ERROR);
      return;
    }
    setSubmitting(true);
    const result = await signIn(email, password);
    setSubmitting(false);
    if (result.ok) {
      navigate(from, { replace: true }); // provisioning is enforced by RequireAuth
      return;
    }
    setError(
      result.kind === 'rate_limited'
        ? RATE_LIMIT_ERROR
        : result.kind === 'unexpected'
          ? UNEXPECTED_ERROR
          : GENERIC_SIGNIN_ERROR,
    );
  }

  const inputClass =
    'w-full rounded-lg border border-[var(--border)] bg-[var(--input-background)] px-3.5 py-2.5 text-sm text-[var(--color-ink)] placeholder:text-white/30 outline-none transition focus-visible:border-[var(--color-violet-light)] focus-visible:ring-2 focus-visible:ring-[var(--color-violet-light)]';

  return (
    <div className="crm-root dark min-h-screen bg-[var(--color-void-black)] text-[var(--color-ink)] flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="text-xl font-bold tracking-tight">
            Social <span className="text-[var(--color-violet-light)]">ScaleX</span>
          </div>
          <h1 className="mt-6 text-lg font-semibold">
            {mode === 'signin' ? 'Team sign in' : 'Reset your password'}
          </h1>
          <p className="mt-1 text-sm text-white/50">
            {mode === 'signin'
              ? 'Access is invite-only. There is no public sign-up.'
              : 'Enter your email and we’ll send a reset link.'}
          </p>
        </div>

        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <div>
            <label htmlFor={emailId} className="mb-1.5 block text-sm font-medium text-white/80">
              Email
            </label>
            <input
              id={emailId}
              type="email"
              inputMode="email"
              autoComplete="username"
              autoFocus
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              placeholder="you@company.com"
            />
          </div>

          {mode === 'signin' && (
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor={passwordId} className="block text-sm font-medium text-white/80">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setMode('reset');
                    setError(null);
                    setInfo(null);
                  }}
                  className="text-xs text-[var(--color-violet-light)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-violet-light)] rounded"
                >
                  Forgot password?
                </button>
              </div>
              <input
                id={passwordId}
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
                placeholder="••••••••"
              />
            </div>
          )}

          {/* Single live region for both errors and confirmations. */}
          <div id={feedbackId} aria-live="assertive" role="status" className="min-h-[1.25rem]">
            {error && <p className="text-sm text-[var(--destructive)]">{error}</p>}
            {info && <p className="text-sm text-[var(--color-emerald)]">{info}</p>}
          </div>

          <button
            type="submit"
            disabled={submitting}
            aria-describedby={feedbackId}
            className="w-full rounded-lg bg-[var(--color-violet-cta)] px-4 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-60 disabled:hover:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-violet-light)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-void-black)]"
          >
            {submitting
              ? 'Please wait…'
              : mode === 'signin'
                ? 'Sign in'
                : 'Send reset link'}
          </button>

          {mode === 'reset' && (
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setError(null);
                setInfo(null);
              }}
              className="w-full text-center text-sm text-white/50 hover:text-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-violet-light)] rounded"
            >
              Back to sign in
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
