import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight, TrendingUp } from 'lucide-react';
import { GOAL_LABEL, getService, growthChange, type Growth, type Metric, type PortfolioItem } from '@/lib/content';
import { InstagramIcon, YoutubeIcon } from '@/components/icons/PlatformIcons';

const CTA: Record<PortfolioItem['goal'], string> = {
  sales: 'Want Instagram to sell for you too?',
  awareness: 'Building a brand people remember?',
  creator: 'Growing as a creator?',
};

/** The client's own Instagram profile photo. */
export function Avatar({ p, size = 56 }: { p: PortfolioItem; size?: number }) {
  return (
    <Image
      src={p.avatar}
      alt={`${p.client} Instagram profile photo`}
      width={size}
      height={size}
      className="flex-none rounded-full bg-paper-2 object-cover ring-1 ring-line"
      style={{ width: size, height: size }}
    />
  );
}

export function StatusBadge({ status }: { status: PortfolioItem['status'] }) {
  const active = status === 'Active';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${active ? 'bg-positive/10 text-positive' : 'bg-paper-2 text-ink-2'}`}>
      <span aria-hidden="true" className={`size-1.5 rounded-full ${active ? 'bg-positive' : 'bg-ink-3'}`} />
      {active ? 'Active client' : 'Past client'}
    </span>
  );
}

/** Lead with growth only when it is the strongest story (at least +50%); otherwise lead with the biggest number. */
function leadGrowth(p: PortfolioItem): Growth | undefined {
  const g = p.growth[0];
  return g && g.to / g.from >= 1.5 ? g : undefined;
}

/** Metrics not already shown as the headline or in a growth bar. */
function extraMetrics(p: PortfolioItem): Metric[] {
  const shown = new Set(p.growth.map((g) => g.toText.replace('+', '')));
  const list = leadGrowth(p) ? p.metrics : p.metrics.slice(1);
  return list.filter((m) => !shown.has(m.value.replace('+', '')));
}

/** Lower-case a label for running text, keeping platform names as written. */
const lc = (s: string) => (/^(Instagram|YouTube)/.test(s) ? s : s.charAt(0).toLowerCase() + s.slice(1));

/** One supporting figure for the compact card. */
function teaserExtra(p: PortfolioItem): Metric | undefined {
  const g = leadGrowth(p);
  if (!g) return p.metrics[1];
  return p.metrics.find((m) => m.value.replace('+', '') !== g.toText.replace('+', ''));
}

/** Big green growth figure, or the biggest number when growth is modest. */
function Headline({ p, size = 'lg' }: { p: PortfolioItem; size?: 'lg' | 'md' }) {
  const big = size === 'lg' ? 'text-6xl sm:text-7xl' : 'text-5xl';
  const g = leadGrowth(p);
  if (g) {
    return (
      <p>
        <span className={`flex items-center gap-2 font-display leading-none tracking-[-0.02em] text-positive ${big}`}>
          <TrendingUp className="size-9 flex-none" strokeWidth={2.5} aria-hidden="true" />
          {growthChange(g)}
        </span>
        <span className="mt-3 block text-sm text-ink-2">
          <span className="font-semibold text-ink">{g.fromText} → {g.toText}</span> {g.label.toLowerCase()}
          <span className={size === 'md' ? 'block text-ink-3' : ''}>{size === 'md' ? g.period : ` · ${g.period}`}</span>
        </span>
      </p>
    );
  }
  const m = p.metrics[0];
  if (!m) return null;
  return (
    <p>
      <span className={`block font-display leading-none tracking-[-0.02em] text-ink ${big}`}>{m.value}</span>
      <span className="mt-3 block text-sm text-ink-2">{m.label}</span>
    </p>
  );
}

/** Before → after as two bars. The numbers are text; the bars only illustrate them. */
function GrowthBars({ g }: { g: Growth }) {
  const pct = Math.max(3, Math.round((g.from / g.to) * 100));
  return (
    <div>
      <p className="flex items-baseline justify-between gap-3 text-sm">
        <span className="font-semibold text-ink">{g.label}</span>
        <span className="font-semibold text-positive">{growthChange(g)}</span>
      </p>
      <div aria-hidden="true" className="mt-2 grid grid-cols-[3rem_minmax(0,1fr)] items-center gap-x-3 gap-y-1.5 text-xs">
        <span className="tabular-nums text-ink-3">{g.fromText}</span>
        <span className="h-2 rounded-full bg-line-strong" style={{ width: `${pct}%` }} />
        <span className="tabular-nums font-semibold text-ink">{g.toText}</span>
        <span className="h-2 w-full rounded-full bg-positive" />
      </div>
      <p className="sr-only">{g.label}: from {g.fromText} to {g.toText}, {g.period}.</p>
    </div>
  );
}

function ProfileLinks({ p }: { p: PortfolioItem }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {p.profiles.map((pr) => (
        <li key={pr.url}>
          <a
            href={pr.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-10 items-center gap-2 rounded-full border border-line-strong bg-surface px-3.5 text-sm font-semibold text-ink transition-colors hover:border-ink"
          >
            {pr.label === 'Instagram' ? (
              <InstagramIcon size={16} className="text-[#C13584]" />
            ) : (
              <YoutubeIcon size={18} className="text-[#E00000]" />
            )}
            {pr.label}
            <span className="sr-only">: {p.client} (opens in a new tab)</span>
            <ArrowUpRight className="size-3.5 text-ink-3" aria-hidden="true" />
          </a>
        </li>
      ))}
    </ul>
  );
}

/** Full case study, used on /case-studies. */
export function ResultCase({ p }: { p: PortfolioItem }) {
  const services = p.services.map(getService).filter((x): x is NonNullable<typeof x> => Boolean(x));
  const hasNumbers = p.growth.length > 0 || p.metrics.length > 0;
  const extra = extraMetrics(p);
  return (
    <article id={p.id} aria-labelledby={`${p.id}-title`} className="card scroll-mt-24 overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 p-6 sm:p-8">
          <div className="flex items-center gap-4">
            <Avatar p={p} size={64} />
            <div className="min-w-0">
              <h2 id={`${p.id}-title`} className="text-3xl leading-tight text-ink">{p.client}</h2>
              <p className="truncate text-sm text-ink-3">@{p.handle}</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <StatusBadge status={p.status} />
            <span className="rounded-full bg-paper-2 px-2.5 py-1 text-xs font-semibold text-ink-2">{GOAL_LABEL[p.goal]}</span>
            <span className="rounded-full bg-paper-2 px-2.5 py-1 text-xs font-semibold text-ink-2">{p.category}</span>
          </div>

          {/* The number first on phones; on desktop it sits in the side panel. */}
          {hasNumbers ? <div className="mt-6 lg:hidden"><Headline p={p} size="md" /></div> : null}

          <p className="mt-6 text-ink-2">{p.detail}</p>

          <h3 className="mt-6 font-sans text-xs font-semibold uppercase tracking-[0.12em] text-ink-3">What we did</h3>
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
            {services.map((s) => (
              <li key={s.slug}>
                <Link href={`/services/${s.slug}`} className="text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">{s.name}</Link>
              </li>
            ))}
          </ul>
          <div className="mt-6"><ProfileLinks p={p} /></div>
        </div>

        <div className="border-t border-line bg-paper p-6 sm:p-8 lg:border-l lg:border-t-0">
          {hasNumbers ? (
            <>
              <div className="hidden lg:block"><Headline p={p} /></div>
              {p.growth.length ? (
                <div className="grid gap-5 lg:mt-8 lg:border-t lg:border-line lg:pt-6">
                  {p.growth.map((g) => <GrowthBars key={g.label} g={g} />)}
                </div>
              ) : null}
              {extra.length ? (
                <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-line pt-5">
                  {extra.map((m) => (
                    <div key={m.label} className="flex flex-col-reverse">
                      <dt className="mt-1 text-xs text-ink-3">{m.label}</dt>
                      <dd className="font-display text-3xl text-ink">{m.value}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}
            </>
          ) : (
            <>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-3">The brief</p>
              <p className="mt-3 font-display text-3xl leading-tight text-ink">Make the name known.</p>
              <p className="mt-3 text-sm text-ink-2">{p.description}</p>
            </>
          )}
          <Link href="#get-started" className="btn btn-primary mt-8 w-full">
            Get a plan like this <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
          <p className="mt-2 text-center text-xs text-ink-3">{CTA[p.goal]} Free call, no obligation.</p>
        </div>
      </div>
    </article>
  );
}

/** Compact card for the homepage. The whole card is one link. */
export function ResultTeaser({ p, headingLevel = 3 }: { p: PortfolioItem; headingLevel?: 2 | 3 }) {
  const H = headingLevel === 2 ? 'h2' : 'h3';
  const extra = teaserExtra(p);
  return (
    <article className="card card-link relative flex h-full flex-col p-6">
      <div className="flex items-center gap-3">
        <Avatar p={p} size={48} />
        <div className="min-w-0">
          <H className="font-display text-xl leading-tight text-ink">
            <Link href={`/case-studies#${p.id}`} className="after:absolute after:inset-0">{p.client}</Link>
          </H>
          <p className="truncate text-xs text-ink-3">@{p.handle}</p>
        </div>
      </div>
      <div className="mt-6 flex-1"><Headline p={p} size="md" /></div>
      {extra ? (
        <p className="mt-5 border-t border-line pt-4 text-sm text-ink-2">
          <span className="font-semibold text-ink">{extra.value}</span> {lc(extra.label)}
        </p>
      ) : null}
      <span aria-hidden="true" className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-coral-text">
        See the case <ArrowRight className="size-4" />
      </span>
    </article>
  );
}
