// Shown to a valid session that has NO profiles row. Without this screen such
// a user would see fully-rendered CRM chrome containing nothing (RLS returns
// zero rows, not an error) and report it as "the app is broken" / "my leads
// are gone". Give them a clear explanation and a way out.
import React from 'react';
import { useAuth } from './auth/AuthProvider';

export function Unprovisioned() {
  const { user, signOut } = useAuth();
  return (
    <div className="crm-root dark min-h-screen bg-[var(--color-void-black)] text-[var(--color-ink)] flex items-center justify-center px-6">
      <div className="w-full max-w-md text-center">
        <h1 className="text-xl font-semibold mb-3">Your account isn’t provisioned yet</h1>
        <p className="text-sm text-white/60 mb-2">
          You’re signed in{user?.email ? ` as ${user.email}` : ''}, but your
          account hasn’t been granted access to the CRM.
        </p>
        <p className="text-sm text-white/60 mb-8">
          Ask an admin to add you, then sign in again.
        </p>
        <button
          type="button"
          onClick={() => void signOut()}
          className="inline-flex items-center justify-center rounded-lg bg-[var(--color-violet-cta)] px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.03] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-violet-light)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-void-black)]"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
