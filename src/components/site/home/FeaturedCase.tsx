import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Avatar, GrowthBars } from '@/components/site/Results';
import { PORTFOLIO, RESULTS_AS_OF, getService } from '@/lib/content';
import { formatDay } from '@/lib/dates';
import { CountUp } from './CountUp';

/**
 * Homepage section 6: Saini Telecom, told with its real data points only:
 * 400 followers at takeover (June 2026), 13.1K and 5M+ views in the last 30
 * days on its capture date. The counter runs 400 → 13.1K with nothing
 * labelled in between.
 */
export function FeaturedCase() {
  const p = PORTFOLIO.find((x) => x.id === 'saini-telecom');
  const g = p?.growth[0];
  if (!p || !g) return null;
  const views = p.metrics.find((m) => /views/i.test(m.label));
  const date = formatDay(p.asOf ?? RESULTS_AS_OF);
  const services = p.services.map(getService).filter((s): s is NonNullable<typeof s> => Boolean(s));

  return (
    <section aria-labelledby="featured-title" className="bg-night py-section text-on-night">
      <div className="wrap grid grid-cols-1 gap-12 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-16">
        <div>
          <p className="eyebrow text-coral-on-night">Featured case</p>
          <h2 id="featured-title" className="mt-4 text-4xl text-on-night">
            {p.client}: {g.fromText} to {g.toText} followers since June.
          </h2>
          <p className="mt-5 max-w-xl text-lg text-on-night-2">{p.detail}</p>
          <h3 className="mt-8 font-sans text-xs font-semibold uppercase tracking-[0.12em] text-on-night-2">What we did</h3>
          <ul className="mt-3 flex flex-wrap gap-2">
            {services.map((s) => (
              <li key={s.slug}>
                <Link href={`/services/${s.slug}`} className="inline-flex min-h-10 items-center rounded-full border border-on-night/30 px-4 text-sm font-semibold text-on-night hover:border-on-night">
                  {s.name}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-8">
            <Link href={`/case-studies#${p.id}`} className="btn btn-night btn-lg">
              Read the case <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </p>
        </div>

        <div className="rise rounded-card bg-paper p-6 text-ink shadow-lift sm:p-8">
          <div className="flex items-center gap-3">
            <Avatar p={p} size={52} />
            <div className="min-w-0">
              <p className="font-display text-xl leading-tight">{p.client}</p>
              <p className="truncate text-xs text-ink-3">@{p.handle}</p>
            </div>
          </div>
          <p className="mt-8 text-sm font-semibold text-ink-2">Instagram followers</p>
          <p className="mt-1 font-display text-7xl leading-none tracking-[-0.02em] text-positive">
            <CountUp from={g.from} to={g.to} toText={g.toText} label={`${g.toText} followers, up from ${g.fromText} in June 2026`} />
          </p>
          <div className="mt-8 border-t border-line pt-6"><GrowthBars g={g} aside="period" /></div>
          {views ? (
            <dl className="mt-6 flex flex-col-reverse border-t border-line pt-5">
              <dt className="mt-1 text-sm text-ink-2">{views.label}</dt>
              <dd className="font-display text-4xl text-ink">{views.value}</dd>
            </dl>
          ) : null}
          <p className="mt-5 text-xs text-ink-3">Figures as of {date}, from the client’s own Instagram analytics.</p>
        </div>
      </div>
    </section>
  );
}
