import React from 'react';
import Link from 'next/link';
import { ArrowRight, TrendingUp } from 'lucide-react';
import { PORTFOLIO, RESULTS_AS_OF, growthChange, type Growth } from '@/lib/content';
import { UpdatedAgo } from './UpdatedAgo';
import { monthShort } from '@/lib/dates';
import { Avatar, StatusBadge } from './Results';

/** Hero proof: real figures from two active retail clients, rendered as HTML. */
export function ProofPanel() {
  const main = PORTFOLIO.find((p) => p.id === 'prago');
  const second = PORTFOLIO.find((p) => p.id === 'saini-telecom');
  if (!main) return null;
  const [views, followers] = main.metrics;
  const growth = main.growth.find((g) => /followers/i.test(g.label));
  const viewsGrowth = main.growth.find((g) => /views/i.test(g.label));
  const secondGrowth = second?.growth[0];
  return (
    <figure className="mx-auto w-full max-w-md sm:pb-16 lg:mr-0">
      <div className="relative">
        <Link href={`/case-studies#${main.id}`} className="card card-link relative block p-6 shadow-lift sm:p-8">
          <div className="flex items-center gap-3">
            <Avatar p={main} size={44} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">{main.client}</p>
              <p className="truncate text-xs text-ink-3">{main.short}</p>
            </div>
            <StatusBadge status={main.status} />
          </div>
          {views ? (
            <div className="mt-6 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
              <p>
                <span className="block font-display text-6xl leading-none tracking-[-0.03em] text-ink">{views.value}</span>
                <span className="mt-2 block text-sm text-ink-2">{views.label.toLowerCase()}</span>
                {viewsGrowth ? (
                  <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-positive/10 px-2.5 py-1 text-xs font-semibold text-positive">
                    <TrendingUp className="size-3.5" aria-hidden="true" />
                    {growthChange(viewsGrowth)} since July
                  </span>
                ) : null}
              </p>
              {viewsGrowth ? <MiniColumns before={viewsGrowth} /> : null}
            </div>
          ) : null}
          <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-line pt-5">
            {followers ? (
              <div className="flex flex-col-reverse">
                <dt className="mt-1 text-xs text-ink-3">{followers.label}</dt>
                <dd className="font-display text-3xl text-ink">{followers.value}</dd>
              </div>
            ) : null}
            {growth ? (
              <div className="flex flex-col-reverse">
                <dt className="mt-1 text-xs text-ink-3">Followers since July, from {growth.fromText}</dt>
                <dd className="flex items-center gap-1.5 font-display text-3xl text-positive">
                  <TrendingUp className="size-6" aria-hidden="true" />
                  {growthChange(growth)}
                </dd>
              </div>
            ) : null}
          </dl>
        </Link>
        {second && secondGrowth ? (
          <Link
            href={`/case-studies#${second.id}`}
            className="card relative mt-4 block p-4 shadow-lift transition-colors hover:border-line-strong sm:absolute sm:-left-8 sm:top-[calc(100%-1.5rem)] sm:mt-0 sm:w-64 sm:-rotate-3"
          >
            <span className="flex items-center gap-2.5">
              <Avatar p={second} size={32} />
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-ink">{second.client}</span>
                <span className="block truncate text-xs text-ink-3">{second.short}</span>
              </span>
            </span>
            <span className="mt-2 flex items-center gap-1.5 font-display text-4xl leading-none text-positive">
              <TrendingUp className="size-6" aria-hidden="true" />
              {growthChange(secondGrowth)}
            </span>
            <span className="mt-1.5 block text-xs text-ink-2">
              <span className="font-semibold text-ink">{secondGrowth.fromText} → {secondGrowth.toText}</span> followers since June
            </span>
          </Link>
        ) : null}
      </div>
      <figcaption className="mt-5 text-xs text-ink-3 sm:ml-60">
        <span className="inline-flex items-center gap-1.5 font-semibold text-ink-2">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-positive" />
          <UpdatedAgo iso={RESULTS_AS_OF} />
        </span>
        <span className="mt-1 block">From the clients’ own Instagram dashboards, shared with permission.</span>
        <Link href="/case-studies" className="mt-1.5 inline-flex items-center gap-1 font-semibold text-coral-text hover:underline">
          See all {PORTFOLIO.length} results <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      </figcaption>
    </figure>
  );
}

/** Two real data points (July vs now) as columns. Numbers are text; bars only illustrate. */
function MiniColumns({ before }: { before: Growth }) {
  const pct = Math.max(8, Math.round((before.from / before.to) * 100));
  const cols = [
    { label: 'Jul', value: before.fromText, h: pct, now: false },
    { label: monthShort(RESULTS_AS_OF), value: before.toText, h: 100, now: true },
  ];
  return (
    <div aria-hidden="true" className="flex h-32 items-end gap-3 pb-0.5">
      {cols.map((c) => (
        <div key={c.label} className="flex h-full w-11 flex-col items-center justify-end">
          <span className={`mb-1 text-xs font-semibold tabular-nums ${c.now ? 'text-positive' : 'text-ink-3'}`}>{c.value}</span>
          <span className={`w-9 rounded-t-lg ${c.now ? 'bg-positive' : 'bg-line-strong'}`} style={{ height: `${c.h * 0.7}%` }} />
          <span className="mt-1.5 text-[11px] text-ink-3">{c.label}</span>
        </div>
      ))}
    </div>
  );
}
