import React from 'react';
import { TrendingUp } from 'lucide-react';
import { PORTFOLIO, growthChange } from '@/lib/content';
import { Avatar, StatusBadge } from './Results';

/** Hero proof: real figures from two active retail clients, rendered as HTML. */
export function ProofPanel() {
  const main = PORTFOLIO.find((p) => p.id === 'prago');
  const second = PORTFOLIO.find((p) => p.id === 'saini-telecom');
  if (!main) return null;
  const [views, followers] = main.metrics;
  const growth = main.growth[0];
  const secondGrowth = second?.growth[0];
  return (
    <figure className="mx-auto w-full max-w-md sm:pb-14 lg:mr-0">
      <div className="relative">
        <div className="card relative p-6 shadow-lift sm:p-8">
          <div className="flex items-center gap-3">
            <Avatar p={main} size={44} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">{main.client}</p>
              <p className="truncate text-xs text-ink-3">{main.category}</p>
            </div>
            <StatusBadge status={main.status} />
          </div>
          {views ? (
            <p className="mt-8">
              <span className="block font-display text-6xl leading-none tracking-[-0.03em] text-ink">{views.value}</span>
              <span className="mt-2 block text-sm text-ink-2">{views.label.toLowerCase()}</span>
            </p>
          ) : null}
          <dl className="mt-8 grid grid-cols-2 gap-4 border-t border-line pt-5">
            {followers ? (
              <div className="flex flex-col-reverse">
                <dt className="mt-1 text-xs text-ink-3">{followers.label}</dt>
                <dd className="font-display text-3xl text-ink">{followers.value}</dd>
              </div>
            ) : null}
            {growth ? (
              <div className="flex flex-col-reverse">
                <dt className="mt-1 text-xs text-ink-3">{growth.label} since July, from {growth.fromText}</dt>
                <dd className="flex items-center gap-1.5 font-display text-3xl text-positive">
                  <TrendingUp className="size-6" aria-hidden="true" />
                  {growthChange(growth)}
                </dd>
              </div>
            ) : null}
          </dl>
        </div>
        {second && secondGrowth ? (
          <div aria-hidden="true" className="card absolute -left-8 top-[calc(100%-1.25rem)] hidden w-60 -rotate-3 p-4 shadow-lift sm:block">
            <div className="flex items-center gap-2">
              <Avatar p={second} size={28} />
              <p className="text-xs font-semibold text-ink">{second.client}</p>
            </div>
            <p className="mt-2 flex items-center gap-1.5 font-display text-3xl text-positive">
              <TrendingUp className="size-5" aria-hidden="true" />
              {growthChange(secondGrowth)}
            </p>
            <p className="text-xs text-ink-3">followers, {secondGrowth.fromText} → {secondGrowth.toText} since June</p>
          </div>
        ) : null}
      </div>
      <figcaption className="mt-6 text-xs text-ink-3 sm:ml-52 sm:mt-5">
        From the clients’ own Instagram dashboards, 30 Sep 2026, shared with permission.
      </figcaption>
    </figure>
  );
}
