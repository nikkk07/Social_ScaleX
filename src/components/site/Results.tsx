import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, TrendingUp } from 'lucide-react';
import { growthChange, type Growth, type Metric, type PortfolioItem } from '@/lib/content';
import { lc } from '@/lib/text';

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
export function leadGrowth(p: PortfolioItem): Growth | undefined {
  const g = p.growth[0];
  return g && g.to / g.from >= 1.5 ? g : undefined;
}

/** One supporting figure for the compact card. */
function teaserExtra(p: PortfolioItem): Metric | undefined {
  const g = leadGrowth(p);
  if (!g) return p.metrics[1];
  return p.metrics.find((m) => m.value.replace('+', '') !== g.toText.replace('+', ''));
}

/** Big green growth figure, or the biggest number when growth is modest. */
export function Headline({ p, size = 'lg' }: { p: PortfolioItem; size?: 'lg' | 'md' }) {
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
          <span className="font-semibold text-ink">{g.fromText} → {g.toText}</span> {lc(g.label)}
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
export function GrowthBars({ g, aside = 'change' }: { g: Growth; aside?: 'change' | 'period' }) {
  const pct = Math.max(3, Math.round((g.from / g.to) * 100));
  return (
    <div>
      <p className="flex items-baseline justify-between gap-3 text-sm">
        <span className="font-semibold text-ink">{g.label}</span>
        {aside === 'change' ? <span className="font-semibold text-positive">{growthChange(g)}</span> : <span className="text-ink-3">{g.period}</span>}
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
