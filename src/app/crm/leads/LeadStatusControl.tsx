// Inline status control — the most frequent action in the app. Pending ⇄
// Contacted; choosing Contacted reveals Interested / Not interested right in
// the row. Reverting to Pending clears the outcome, matching both the
// outcome_requires_contacted CHECK and the tg_leads_status_coherence trigger.
import React from 'react';
import type { LeadOutcome, LeadStatus } from '../../../lib/database.types';

export interface StatusChange {
  status: LeadStatus;
  outcome: LeadOutcome | null;
}

const seg = (active: boolean) =>
  [
    'px-2.5 py-1 text-xs font-medium rounded-md transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-violet-light)]',
    active
      ? 'bg-[var(--accent)] text-[var(--color-violet-light)]'
      : 'text-white/50 hover:text-white/80',
  ].join(' ');

const outcomeSeg = (active: boolean, tone: 'emerald' | 'rose') =>
  [
    'px-2.5 py-1 text-xs font-medium rounded-md transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-violet-light)]',
    active
      ? tone === 'emerald'
        ? 'bg-[color-mix(in_oklab,var(--color-emerald)_18%,transparent)] text-[var(--color-emerald)]'
        : 'bg-[color-mix(in_oklab,var(--destructive)_16%,transparent)] text-[var(--destructive)]'
      : 'text-white/50 hover:text-white/80',
  ].join(' ');

export function LeadStatusControl({
  status,
  outcome,
  disabled = false,
  onChange,
}: {
  status: LeadStatus;
  outcome: LeadOutcome | null;
  disabled?: boolean;
  onChange: (next: StatusChange) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div
        className="inline-flex rounded-lg border border-[var(--border)] p-0.5"
        role="group"
        aria-label="Lead status"
      >
        <button
          type="button"
          disabled={disabled}
          aria-pressed={status === 'pending'}
          onClick={() => onChange({ status: 'pending', outcome: null })}
          className={seg(status === 'pending')}
        >
          Pending
        </button>
        <button
          type="button"
          disabled={disabled}
          aria-pressed={status === 'contacted'}
          onClick={() => onChange({ status: 'contacted', outcome })}
          className={seg(status === 'contacted')}
        >
          Contacted
        </button>
      </div>

      {status === 'contacted' && (
        <div
          className="inline-flex rounded-lg border border-[var(--border)] p-0.5"
          role="group"
          aria-label="Lead outcome"
        >
          <button
            type="button"
            disabled={disabled}
            aria-pressed={outcome === 'interested'}
            onClick={() =>
              onChange({
                status: 'contacted',
                outcome: outcome === 'interested' ? null : 'interested',
              })
            }
            className={outcomeSeg(outcome === 'interested', 'emerald')}
          >
            Interested
          </button>
          <button
            type="button"
            disabled={disabled}
            aria-pressed={outcome === 'not_interested'}
            onClick={() =>
              onChange({
                status: 'contacted',
                outcome: outcome === 'not_interested' ? null : 'not_interested',
              })
            }
            className={outcomeSeg(outcome === 'not_interested', 'rose')}
          >
            Not interested
          </button>
        </div>
      )}
    </div>
  );
}
