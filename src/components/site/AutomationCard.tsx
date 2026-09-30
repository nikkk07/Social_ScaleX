import React from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import type { Automation } from '@/lib/automation';
import { PLAN_99 } from '@/lib/automation';

export function AutomationCard({ a }: { a: Automation }) {
  return (
    <Link href={`/automation/${a.slug}`} className="card card-link group flex h-full flex-col p-6">
      <span className="flex items-start justify-between gap-4">
        <span className="font-display text-2xl leading-tight text-ink">{a.name}</span>
        <ArrowUpRight className="size-5 flex-none text-ink-3 transition-colors group-hover:text-coral-text" aria-hidden="true" />
      </span>
      <span className="mt-3 flex-1 text-ink-2">{a.outcome}</span>
      {a.priced ? (
        <span className="mt-5 inline-flex w-fit rounded-full bg-coral-tint px-3 py-1 text-sm font-semibold text-coral-text">₹{PLAN_99.price} / month</span>
      ) : (
        <span className="mt-5 text-sm text-ink-3">Quoted on a free call</span>
      )}
    </Link>
  );
}
