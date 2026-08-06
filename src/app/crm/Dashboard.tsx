// Placeholder /crm dashboard. The real lead UI arrives Phase 4+. This exists
// so route protection, provisioning, and sign-out can be verified end to end.
import React from 'react';
import { useAuth } from './auth/AuthProvider';

export default function Dashboard() {
  const { user, profile, role, signOut } = useAuth();
  return (
    <div className="crm-root dark min-h-screen bg-[var(--color-void-black)] text-[var(--color-ink)]">
      <header className="border-b border-[var(--border)] px-6 py-4 flex items-center justify-between">
        <div className="text-lg font-semibold">
          Social <span className="text-[var(--color-violet-light)]">ScaleX</span> CRM
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-white/60">
            {profile?.full_name || user?.email}
            {role ? <span className="ml-2 text-white/40">· {role}</span> : null}
          </span>
          <button
            type="button"
            onClick={() => void signOut()}
            className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm text-white/80 transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-violet-light)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-void-black)]"
          >
            Sign out
          </button>
        </div>
      </header>
      <main className="px-6 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-2xl font-semibold mb-2">You’re in.</h1>
          <p className="text-sm text-white/50">
            Lead management lands in the next phase. This placeholder confirms
            auth, provisioning, and route protection are working.
          </p>
        </div>
      </main>
    </div>
  );
}
