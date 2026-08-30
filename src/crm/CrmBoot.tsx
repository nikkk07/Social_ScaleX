// Neutral, non-decisive loading state for the CRM shell. Shown while the CRM
// chunk loads and while auth status === 'initialising'. Crucially it does NOT
// redirect and does NOT render CRM chrome, so a hard refresh never flashes
// /login before the session is restored.
import React from 'react';

export function CrmBoot({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="crm-root dark min-h-screen bg-[var(--color-void-black)] text-[var(--color-ink)] flex items-center justify-center">
      <div
        className="flex flex-col items-center gap-4"
        role="status"
        aria-live="polite"
      >
        <span
          className="h-8 w-8 rounded-full border-2 border-white/20 border-t-[var(--color-violet-light)] animate-spin"
          aria-hidden="true"
        />
        <span className="text-sm text-white/50">{label}</span>
      </div>
    </div>
  );
}
