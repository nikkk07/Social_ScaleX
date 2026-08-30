// Route guard for the CRM. The critical detail: session restore is ASYNC, so
// while status === 'initialising' we render a neutral loader and DO NOT
// redirect — otherwise every hard refresh bounces a signed-in user to /login.
'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';
import { CrmBoot } from '../CrmBoot';
import { Unprovisioned } from '../Unprovisioned';

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { status, retry } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // React Router carried the attempted URL in location state. The App Router
  // has no location state, so it rides in a ?next= query parameter instead —
  // which also survives a refresh on the login page, unlike the old approach.
  useEffect(() => {
    if (status !== 'signed_out') return;
    router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [status, pathname, router]);

  if (status === 'initialising') {
    return <CrmBoot label="Restoring your session…" />;
  }

  if (status === 'error') {
    return (
      <div className="crm-root dark min-h-screen bg-[var(--color-void-black)] text-[var(--color-ink)] flex items-center justify-center px-6">
        <div className="w-full max-w-md text-center" role="alert">
          <h1 className="text-xl font-semibold mb-3">Couldn’t load your account</h1>
          <p className="text-sm text-white/60 mb-8">
            Something went wrong reaching the server. Check your connection and
            try again.
          </p>
          <button
            type="button"
            onClick={retry}
            className="inline-flex items-center justify-center rounded-lg bg-[var(--color-violet-cta)] px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.03] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-violet-light)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-void-black)]"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (status === 'signed_out') {
    // The redirect above is in flight; render the loader rather than a flash
    // of CRM chrome the person is not entitled to see.
    return <CrmBoot label="Redirecting to sign in…" />;
  }

  if (status === 'signed_in_unprovisioned') {
    // Never show empty CRM chrome to a profile-less user.
    return <Unprovisioned />;
  }

  // status === 'signed_in_provisioned'
  return <>{children}</>;
}
