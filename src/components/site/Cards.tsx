import React from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import type { PortfolioItem, Service } from '@/lib/content';

export function ServiceCard({ s }: { s: Service }) {
  return (
    <Link href={`/services/${s.slug}`} className="card card-link group flex h-full flex-col p-6">
      <span className="flex items-start justify-between gap-4">
        <span className="font-display text-2xl leading-tight text-ink">{s.name}</span>
        <ArrowUpRight className="size-5 flex-none text-ink-3 transition-colors group-hover:text-coral-text" aria-hidden="true" />
      </span>
      <span className="mt-3 text-ink-2">{s.outcome}</span>
    </Link>
  );
}

export function MetricList({ metrics, size = 'md' }: { metrics: PortfolioItem['metrics']; size?: 'md' | 'lg' }) {
  const cols = size === 'lg' ? 'grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-1' : metrics.length === 3 ? 'grid-cols-3 gap-4' : 'grid-cols-2 gap-4';
  return (
    <dl className={`grid ${cols}`}>
      {metrics.map((m) => (
        <div key={m.label} className="flex flex-col-reverse">
          <dt className="mt-1 text-xs leading-snug text-ink-3">{m.label}</dt>
          <dd className={`font-display tabular-nums text-ink ${size === 'lg' ? 'text-5xl' : 'text-2xl sm:text-3xl'}`}>{m.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function CaseCard({ p, headingLevel = 3 }: { p: PortfolioItem; headingLevel?: 2 | 3 }) {
  const H = headingLevel === 2 ? 'h2' : 'h3';
  return (
    <article className="card flex h-full flex-col p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-3">{p.kind} · {p.platform}</p>
      <H className="mt-2 font-display text-2xl text-ink">{p.client}</H>
      <p className="mt-1 text-sm text-ink-3">{p.category}</p>
      <p className="mt-4 flex-1 text-ink-2">{p.description}</p>
      <div className="mt-6 border-t border-line pt-5">
        <MetricList metrics={p.metrics} />
      </div>
      <Link href={`/case-studies#${p.id}`} className="link mt-5 text-sm">
        Read the {p.client} case<span className="sr-only"> study</span>
      </Link>
    </article>
  );
}
