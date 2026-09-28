// Neutral loading screen: shown while the CRM chunk loads and while the
// session is restored. It never redirects, so a refresh never flashes /login.
import React from 'react';

export function CrmBoot({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="crm-root fixed inset-0 z-50 flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-3" role="status" aria-live="polite">
        <span
          aria-hidden="true"
          className="h-7 w-7 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--primary)]"
        />
        <span className="text-sm text-[var(--muted-foreground)]">{label}</span>
      </div>
    </div>
  );
}
