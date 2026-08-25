// The CRM top bar: brand, section nav, who you are, sign out. Extracted from
// Dashboard so /crm and /crm/enquiries share one header instead of drifting.
import React from 'react';
import { NavLink } from 'react-router';
import { useAuth } from './auth/AuthProvider';

const linkBase =
  'rounded-lg px-3 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-violet-light)]';

function SectionLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      // `end` so /crm doesn't stay highlighted while on /crm/enquiries.
      end
      className={({ isActive }) =>
        `${linkBase} ${
          isActive
            ? 'bg-white/10 text-[var(--color-ink)]'
            : 'text-white/60 hover:bg-white/5 hover:text-white/90'
        }`
      }
    >
      {children}
    </NavLink>
  );
}

export function CrmHeader() {
  const { user, profile, role, signOut } = useAuth();
  return (
    <header className="border-b border-[var(--border)] px-6 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-6">
          <div className="text-lg font-semibold">
            Social <span className="text-[var(--color-violet-light)]">ScaleX</span> CRM
          </div>
          <nav aria-label="CRM sections" className="flex items-center gap-1">
            <SectionLink to="/crm">Leads</SectionLink>
            <SectionLink to="/crm/enquiries">Enquiries</SectionLink>
          </nav>
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
      </div>
    </header>
  );
}
