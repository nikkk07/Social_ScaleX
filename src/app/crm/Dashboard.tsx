// The /crm shell: top bar + the leads list (Phase 4). Route protection and
// provisioning are handled upstream by RequireAuth.
import React from 'react';
import { useAuth } from './auth/AuthProvider';
import { LeadsList } from './leads/LeadsList';

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
      <main>
        <LeadsList />
      </main>
    </div>
  );
}
