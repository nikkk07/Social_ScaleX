import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { HOME_BAND } from '@/lib/creators';

/** A slim band on the homepage so creators and job seekers find their way without hunting in the footer. */
export function CreatorsBand() {
  return (
    <section aria-labelledby="creators-band-title" className="border-t border-line py-12 sm:py-14">
      <div className="wrap">
        <div className="flex flex-col gap-6 rounded-3xl border border-line bg-surface p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="eyebrow">{HOME_BAND.eyebrow}</p>
            <h2 id="creators-band-title" className="mt-3 text-3xl text-ink">{HOME_BAND.title}</h2>
            <p className="mt-3 text-ink-2">{HOME_BAND.text}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:shrink-0">
            <Link href="/creators" className="btn btn-primary btn-lg">For Creators <ArrowRight className="size-4" aria-hidden="true" /></Link>
            <Link href="/careers" className="btn btn-secondary btn-lg">Careers</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
