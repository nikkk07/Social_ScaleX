import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { UpdatedAgo } from '@/components/site/UpdatedAgo';
import { PORTFOLIO, PORTFOLIO_NOTE, RESULTS_LATEST } from '@/lib/content';
import { ResultsReel } from './ResultsReel';
import { reelItems } from './reelItems';

/** Section 3: client results as a pinned, curved reel (see ResultsReel). */
export function ResultsSection() {
  const items = reelItems();
  return (
    <section aria-labelledby="results-title" className="bg-night text-on-night">
      <div className="wrap pt-section">
        <p className="eyebrow text-coral-on-night">Client results</p>
        <div className="mt-4 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <h2 id="results-title" className="max-w-2xl text-4xl text-on-night">Real accounts. Real numbers.</h2>
          <p className="inline-flex flex-none items-center gap-2 self-start whitespace-nowrap rounded-full border border-on-night/15 px-3 py-1.5 text-xs font-semibold text-on-night-2 md:self-auto">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-coral-on-night" />
            <UpdatedAgo iso={RESULTS_LATEST} prefix="Figures updated" />
          </p>
        </div>
      </div>

      <ResultsReel items={items} />

      <div className="wrap pb-section pt-10">
        <p className="max-w-3xl text-sm text-on-night-2">{PORTFOLIO_NOTE}</p>
        <p className="mt-6">
          <Link href="/case-studies" className="btn btn-night btn-lg">
            See all {PORTFOLIO.length} client results <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </p>
      </div>
    </section>
  );
}
