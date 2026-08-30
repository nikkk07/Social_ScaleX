// The /crm dashboard tiles. Each one is a LINK to the exact list it counts —
// a number you can't act on is decoration, and the whole point of "6 need
// follow-up" is getting to those six.
import React from 'react';
import Link from 'next/link';
import { AlertTriangle, Inbox, Sparkles } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { RECENT_DAYS } from '../leads/leadsQuery';
import { useDashboardCounts } from './useDashboardCounts';

interface Tile {
  key: string;
  label: string;
  hint: string;
  to: string;
  icon: React.ReactNode;
  accent: string;
  value: number;
}

const cardClass =
  'flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 transition-colors hover:border-white/20 hover:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-violet-light)]';

export function StatTiles() {
  const result = useDashboardCounts();

  if (result.status === 'loading') {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-[92px] rounded-xl" />
        ))}
      </div>
    );
  }

  // A failed count must not take the leads list down with it — the tiles are
  // a shortcut, the list underneath is the actual job.
  if (result.status === 'error') {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm text-white/50">
        <span>Couldn’t load the summary.</span>
        <button
          type="button"
          onClick={result.refetch}
          className="rounded text-[var(--color-violet-light)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-violet-light)]"
        >
          Retry
        </button>
      </div>
    );
  }

  const { counts } = result;
  const tiles: Tile[] = [
    {
      key: 'followup',
      label: 'Need follow-up',
      hint: `Contacted over ${RECENT_DAYS} days ago, still no outcome`,
      to: '/crm?followup=1',
      icon: <AlertTriangle size={16} />,
      accent: 'var(--color-amber)',
      value: counts.followup,
    },
    {
      key: 'recent',
      label: 'Added this week',
      hint: `New leads in the last ${RECENT_DAYS} days`,
      to: '/crm?recent=1&sort=created_at&dir=desc',
      icon: <Sparkles size={16} />,
      accent: 'var(--color-violet-light)',
      value: counts.recent,
    },
    {
      key: 'enquiries',
      label: 'Open enquiries',
      hint: 'From the website, not yet converted',
      to: '/crm/enquiries',
      icon: <Inbox size={16} />,
      accent: 'var(--color-emerald)',
      value: counts.openEnquiries,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {tiles.map((t) => (
        <Link key={t.key} href={t.to} className={cardClass}>
          <span
            aria-hidden="true"
            className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
            style={{
              color: t.accent,
              background: `color-mix(in oklab, ${t.accent} 14%, transparent)`,
            }}
          >
            {t.icon}
          </span>
          <span className="min-w-0">
            <span className="block text-2xl font-semibold leading-tight tabular-nums">
              {t.value}
            </span>
            <span className="block text-sm font-medium text-white/80">{t.label}</span>
            <span className="mt-0.5 block text-xs text-white/40">{t.hint}</span>
          </span>
        </Link>
      ))}
    </div>
  );
}
