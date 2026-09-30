'use client';
import React, { useDeferredValue, useId, useMemo, useState } from 'react';
import { MapPin, Search } from 'lucide-react';
import type { AreaEntry } from '@/lib/areas';
import { whatsappLink } from '@/lib/site';

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '');
const MAX = 8;

/**
 * "Do you cover my area?" Instant, on-device search over the same official
 * lists the page prints as text. Nothing is sent anywhere; without JS the
 * full lists below still work.
 */
export function AreaChecker({
  entries,
  cityNames,
  scoped = false,
  example = 'Kamla Nagar or 110007',
}: {
  entries: AreaEntry[];
  cityNames: Record<string, string>;
  /** On a city page links jump to the pin on the same page. */
  scoped?: boolean;
  /** Placeholder hint, e.g. "Sohna or 122103". */
  example?: string;
}) {
  const id = useId();
  const [q, setQ] = useState('');
  const query = useDeferredValue(q);

  const index = useMemo(() => entries.map((e) => [norm(e[0]), e] as const), [entries]);

  const { hits, total } = useMemo(() => {
    const n = norm(query);
    if (n.length < 2) return { hits: [] as AreaEntry[], total: 0 };
    const isPin = /^\d+$/.test(n);
    const starts: AreaEntry[] = [];
    const within: AreaEntry[] = [];
    for (const [key, e] of index) {
      if (isPin) {
        if (e[1].startsWith(n)) starts.push(e);
      } else if (key.startsWith(n)) starts.push(e);
      else if (key.includes(n)) within.push(e);
    }
    const all = [...starts, ...within];
    return { hits: all.slice(0, MAX), total: all.length };
  }, [index, query]);

  const n = norm(query);
  const searched = n.length >= 2;
  const status = !searched
    ? ''
    : total === 0
      ? 'Not on the list.'
      : `${total} ${total === 1 ? 'match' : 'matches'}${total > MAX ? `, showing ${MAX}` : ''}.`;

  return (
    <div className="rounded-card border border-line-strong bg-surface p-5 sm:p-6">
      <label htmlFor={`${id}-q`} className="block font-semibold text-ink">
        Check your area or pin code
      </label>
      <div className="relative mt-3">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-3" aria-hidden="true" />
        <input
          id={`${id}-q`}
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={`e.g. ${example}`}
          autoComplete="off"
          spellCheck={false}
          aria-describedby={`${id}-s`}
          className="field pl-10"
        />
      </div>
      <p id={`${id}-s`} role="status" aria-live="polite" className="mt-3 min-h-5 text-sm text-ink-3">
        {status}
      </p>
      {hits.length > 0 ? (
        <ul className="mt-2 divide-y divide-line">
          {hits.map(([name, pin, city]) => (
            <li key={`${name}-${pin}-${city}`}>
              <a
                href={scoped ? `#pin-${pin}` : `/areas/${city}#pin-${pin}`}
                className="flex items-center gap-3 py-2.5 text-ink hover:text-coral-text"
              >
                <MapPin className="size-4 shrink-0 text-coral" aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate">{name}</span>
                <span className="shrink-0 tabular-nums text-sm text-ink-2">{pin}</span>
                {scoped ? null : <span className="shrink-0 text-sm text-ink-3">{cityNames[city]}</span>}
              </a>
            </li>
          ))}
        </ul>
      ) : null}
      {searched && total === 0 ? (
        <p className="mt-1 text-sm text-ink-2">
          The official lists name post offices, not every colony or society, so you are probably still covered.{' '}
          <a
            className="link"
            href={whatsappLink(`Hi Social ScaleX, do you work in ${q.trim()}?`)}
            target="_blank"
            rel="noopener noreferrer"
          >
            Ask us on WhatsApp
          </a>
          .
        </p>
      ) : null}
    </div>
  );
}
