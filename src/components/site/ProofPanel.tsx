import React from 'react';
import { PORTFOLIO } from '@/lib/content';

/** Hero proof: real figures from two managed accounts, rendered as HTML. */
export function ProofPanel() {
  const main = PORTFOLIO.find((p) => p.id === 'acdelhivlogs');
  const second = PORTFOLIO.find((p) => p.id === 'prago');
  if (!main) return null;
  const [followers, views, subs] = main.metrics;
  const secondViews = second?.metrics[1];
  return (
    <figure className="mx-auto w-full max-w-md sm:pb-14 lg:mr-0">
      <div className="relative">
        <div className="card relative p-6 shadow-lift sm:p-8">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-ink">{main.client}</p>
            <p className="rounded-full bg-paper-2 px-3 py-1 text-xs text-ink-2">{main.platform}</p>
          </div>
          <p className="mt-1 text-xs text-ink-3">{main.category}</p>
          {views ? (
            <p className="mt-8">
              <span className="block font-display text-6xl leading-none tracking-[-0.03em] text-ink">{views.value}</span>
              <span className="mt-2 block text-sm text-ink-2">{views.label.toLowerCase()}</span>
            </p>
          ) : null}
          <dl className="mt-8 grid grid-cols-2 gap-4 border-t border-line pt-5">
            {[followers, subs].filter((m): m is NonNullable<typeof m> => Boolean(m)).map((m) => (
              <div key={m.label} className="flex flex-col-reverse">
                <dt className="mt-1 text-xs text-ink-3">{m.label}</dt>
                <dd className="font-display text-3xl text-ink">{m.value}</dd>
              </div>
            ))}
          </dl>
        </div>
        {second && secondViews ? (
          <div aria-hidden="true" className="card absolute -left-8 top-[calc(100%-1.25rem)] hidden w-52 -rotate-3 p-4 shadow-lift sm:block">
            <p className="text-xs text-ink-3">{second.client}</p>
            <p className="mt-1 font-display text-3xl text-ink">{secondViews.value}</p>
            <p className="text-xs text-ink-3">{secondViews.label.toLowerCase()}</p>
          </div>
        ) : null}
      </div>
      <figcaption className="mt-6 text-xs text-ink-3 sm:ml-48 sm:mt-5">
        From the clients’ own Instagram and YouTube analytics, shared with permission.
      </figcaption>
    </figure>
  );
}
