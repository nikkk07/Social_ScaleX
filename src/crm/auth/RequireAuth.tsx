'use client';
import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { CrmBoot } from '../CrmBoot';

export function RequireAuth({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { status, retry, signOut, isAdmin } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (status === 'signed_out') router.replace(`/login?next=${encodeURIComponent(pathname ?? '/crm')}`);
  }, [status, pathname, router]);

  if (status === 'initialising') return <CrmBoot label="Restoring your session…" />;
  if (status === 'signed_out') return <CrmBoot label="Redirecting to sign in…" />;

  if (status === 'error') {
    return (
      <Centered>
        <h1 className="text-lg font-semibold">Couldn’t load your account</h1>
        <p className="mt-2 text-sm text-muted-foreground">The server didn’t respond. Check your connection and try again.</p>
        <button type="button" onClick={retry} className="mt-6 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
          Try again
        </button>
      </Centered>
    );
  }

  if (status === 'unprovisioned') {
    return (
      <Centered>
        <ShieldAlert className="mx-auto mb-3 size-8 text-muted-foreground" aria-hidden="true" />
        <h1 className="text-lg font-semibold">No CRM access</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This account isn’t an active team member. Ask an owner or admin to add or reactivate you.
        </p>
        <button type="button" onClick={() => void signOut()} className="mt-6 rounded-lg border border-border px-4 py-2 text-sm">
          Sign out
        </button>
      </Centered>
    );
  }

  if (adminOnly && !isAdmin) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <ShieldAlert className="mx-auto mb-3 size-8 text-muted-foreground" aria-hidden="true" />
        <h1 className="text-lg font-semibold">Admins only</h1>
        <p className="mt-2 text-sm text-muted-foreground">This section is available to owners and admins.</p>
        <Link href="/crm" className="mt-6 inline-block text-sm font-medium text-primary underline-offset-4 hover:underline">
          Back to Today
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm text-center" role="alert">{children}</div>
    </main>
  );
}
