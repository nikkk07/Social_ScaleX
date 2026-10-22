'use client';
// Landing page of the "reset password" email. Supabase puts a recovery
// session in the URL; we set the new password and sign every other device
// out (anyone who knew the old password loses access).
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell, Notice, Spinner } from '@/components/app/AppShell';
import { appSupabase } from '@/lib/app/client';

export function ResetClient() {
  const router = useRouter();
  const [ready, setReady] = useState<'wait' | 'ok' | 'bad'>('wait');
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sb = appSupabase();
    const { data: sub } = sb.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') setReady('ok');
    });
    const t = setTimeout(() => {
      sb.auth.getSession().then(({ data }) => setReady((r) => (r === 'ok' || data.session ? 'ok' : 'bad')));
    }, 1500);
    return () => {
      clearTimeout(t);
      sub.subscription.unsubscribe();
    };
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 8) { setError('Use at least 8 characters.'); return; }
    setBusy(true);
    setError(null);
    const sb = appSupabase();
    const { error: err } = await sb.auth.updateUser({ password: pw });
    if (err) {
      setError('Could not save the new password. The link may have expired — request a new one.');
      setBusy(false);
      return;
    }
    await sb.auth.signOut({ scope: 'others' });
    router.replace('/dashboard');
  }

  return (
    <AppShell>
      {ready === 'wait' ? <Spinner label="Checking your link…" /> : null}
      {ready === 'bad' ? <Notice tone="error">This reset link is invalid or has expired. Go back and tap “Forgot password” again.</Notice> : null}
      {ready === 'ok' ? (
        <form onSubmit={save} className="card grid max-w-md gap-4 p-6 sm:p-8">
          <h1 className="font-display text-3xl text-ink">Set a new password</h1>
          {error ? <Notice tone="error">{error}</Notice> : null}
          <label className="grid gap-1.5 text-sm font-semibold text-ink">
            New password
            <input className="field" type="password" autoComplete="new-password" minLength={8} required value={pw} onChange={(e) => setPw(e.target.value)} />
          </label>
          <button type="submit" disabled={busy} className="btn btn-primary btn-lg">{busy ? 'Saving…' : 'Save and continue'}</button>
        </form>
      ) : null}
    </AppShell>
  );
}
