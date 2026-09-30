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
}: {
  filters: Filter[];
  items: { id: string; group: string; node: React.ReactNode }[];
}) {
  const [active, setActive] = useState('all');
  const shown = active === 'all' ? items : items.filter((i) => i.group === active);
  const count = (k: string) => (k === 'all' ? items.length : items.filter((i) => i.group === k).length);

  return (
    <>
      <div role="group" aria-label="Filter results by goal" className="flex flex-wrap gap-2">
        {[{ key: 'all', label: 'All results' }, ...filters].map((f) => {
          const on = f.key === active;
          return (
            <button
              key={f.key}
              type="button"
              aria-pressed={on}
              onClick={() => setActive(f.key)}
              className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors ${
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
      <div className="mt-8 grid gap-8">
        {shown.map((i) => (
          <React.Fragment key={i.id}>{i.node}</React.Fragment>
        ))}
      </div>
    </>
  );
}
