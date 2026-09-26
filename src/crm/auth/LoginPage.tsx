// Invite-only staff login. No signup anywhere. Two things carry security
// weight here and are deliberate, not incidental:
//   1. Non-enumeration: a wrong password and an unknown email must produce the
//      SAME message and comparable timing. We never branch on which failed —
//      Supabase itself returns an identical 400 for both — and the reset flow
//      always shows the same generic confirmation.
//   2. The reset redirect must point at an allow-listed URL (this origin).
'use client';

import React, { useEffect, useId, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';
import { supabase } from '@/lib/supabase';

type Mode = 'signin' | 'reset';

const GENERIC_SIGNIN_ERROR = 'Incorrect email/phone or password.';
const RATE_LIMIT_ERROR = 'Too many attempts. Please wait a moment and try again.';
const UNEXPECTED_ERROR = 'Something went wrong. Please try again.';
// Same copy whether or not the address exists — never reveal which.
const RESET_CONFIRMATION =
  'If an account exists for that email, a password reset link is on its way.';

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function isPhone(value: string): boolean {
  // Match 10-digit phone number (with or without +91 prefix)
  const cleaned = value.trim().replace(/\s+/g, '');
  return /^(?:\+91)?[6-9]\d{9}$/.test(cleaned);
}

function normalizePhone(value: string): string {
  // Convert to +91XXXXXXXXXX format
  const cleaned = value.trim().replace(/\s+/g, '');
  if (cleaned.startsWith('+91')) return cleaned;
  if (cleaned.length === 10) return `+91${cleaned}`;
  return cleaned;
}

export default function LoginPage() {
  const { status, signIn } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const emailId = useId();
  const passwordId = useId();
  const feedbackId = useId();

  const [mode, setMode] = useState<Mode>('signin');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // Where to land after signing in. Only same-site absolute paths are
  // honoured: `?next=https://evil.example` would otherwise turn the login
  // page into an open redirect.
  const requested = searchParams?.get('next') ?? '';
  const from =
    requested.startsWith('/') && !requested.startsWith('//') ? requested : '/crm';

  // Already signed in and provisioned? Skip the form.
  useEffect(() => {
    if (status === 'signed_in_provisioned') router.replace(from);
  }, [status, from, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    const trimmedInput = emailOrPhone.trim();
    const isEmailInput = isEmail(trimmedInput);
    const isPhoneInput = isPhone(trimmedInput);

    if (!isEmailInput && !isPhoneInput) {
      setError('Enter a valid email address or phone number (10 digits).');
      return;
    }

    if (mode === 'reset') {
      // Password reset only works with email
      if (!isEmailInput) {
        setError('Password reset requires an email address.');
        return;
      }
      
      setSubmitting(true);
      try {
        // Fire-and-confirm: we show the same message regardless of the result
        // (except rate-limiting) so the response can't be used to probe which
        // emails are registered.
        const { error: resetErr } = await supabase.auth.resetPasswordForEmail(
          trimmedInput,
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
    
    // Sign in with phone or email
    if (isPhoneInput) {
      const normalizedPhone = normalizePhone(trimmedInput);
      const { error } = await supabase.auth.signInWithPassword({
        phone: normalizedPhone,
        password,
      });
      setSubmitting(false);
      
      if (!error) {
        router.replace(from); // provisioning is enforced by RequireAuth
        return;
      }
      
      const httpStatus = (error as { status?: number }).status;
      setError(
        httpStatus === 429
          ? RATE_LIMIT_ERROR
          : httpStatus === 400
            ? GENERIC_SIGNIN_ERROR
            : UNEXPECTED_ERROR,
      );
    } else {
      // Email login
      const result = await signIn(trimmedInput, password);
      setSubmitting(false);
      if (result.ok) {
        router.replace(from); // provisioning is enforced by RequireAuth
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
              ? 'Sign in with email or phone number. Access is invite-only.'
              : 'Enter your email and we’ll send a reset link.'}
          </p>
        </div>

        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <div>
            <label htmlFor={emailId} className="mb-1.5 block text-sm font-medium text-white/80">
              Email or Phone
            </label>
            <input
              id={emailId}
              type="text"
              inputMode="text"
              autoComplete="username"
              autoFocus
              required
              value={emailOrPhone}
              onChange={(e) => setEmailOrPhone(e.target.value)}
              className={inputClass}
              placeholder="you@company.com or 9876543210"
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
