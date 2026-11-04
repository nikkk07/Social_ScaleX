'use client';
import React, { useState } from 'react';

type Filter = { key: string; label: string };

/**
 * Filter chips over server-rendered case studies. Every case is in the HTML
 * (the default is "All"), so crawlers and no-JS visitors see everything.
 */
export function ResultsFilter({
  filters,
  items,
  gridClassName = 'mt-8 grid gap-8',
}: {
  filters: Filter[];
  items: { id: string; group: string; node: React.ReactNode }[];
  gridClassName?: string;
}) {
  const [active, setActive] = useState('all');
  const shown = active === 'all' ? items : items.filter((i) => i.group === active);
  const count = (k: string) => (k === 'all' ? items.length : items.filter((i) => i.group === k).length);

  return (
    <>
      <div role="group" aria-label="Filter results by goal" className="grid grid-cols-1 gap-2 min-[360px]:grid-cols-2 sm:flex sm:flex-wrap">
        {[{ key: 'all', label: 'All results' }, ...filters].map((f) => {
          const on = f.key === active;
          return (
            <button
              key={f.key}
              type="button"
              aria-pressed={on}
              onClick={() => setActive(f.key)}
              className={`inline-flex min-h-11 items-center justify-between gap-2 whitespace-nowrap rounded-full border px-3.5 text-[0.8125rem] sm:justify-start sm:px-4 sm:text-sm font-semibold transition-colors ${
                on ? 'border-ink bg-ink text-paper' : 'border-line-strong bg-surface text-ink hover:border-ink'
              }`}
            >
              {f.label}
              <span className={`tabular-nums ${on ? 'text-paper/75' : 'text-ink-3'}`}>{count(f.key)}</span>
            </button>
          );
        })}
      </div>
      <p className="sr-only" role="status" aria-live="polite">
        Showing {shown.length} of {items.length} results.
      </p>
      <ul className={gridClassName}>
        {shown.map((i) => (
          <li key={i.id}>{i.node}</li>
        ))}
      </ul>
    </>
  );
}
