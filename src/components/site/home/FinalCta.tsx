import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { FINAL_CTA } from '@/lib/content';

/**
 * Homepage section 8. The logo mark (the real file, not a redraw) sits at the
 * start of a coral line that runs on into the call-to-action as the band
 * scrolls in. The line is decorative; the button is an ordinary link to the
 * form below, so tracking and keyboard use are unchanged.
 */
export function FinalCta() {
  return (
    <section aria-labelledby="final-cta-title" className="bg-night py-section text-on-night">
      <div className="rise wrap">
        <h2 id="final-cta-title" className="max-w-3xl text-[clamp(2.75rem,1.8rem+4vw,5.5rem)] leading-[1.02] text-on-night">{FINAL_CTA.title}</h2>
        <p className="mt-5 max-w-xl text-lg text-on-night-2">{FINAL_CTA.intro}</p>
        <div className="mt-10 flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          <Image src="/logo.png" alt="" width={72} height={72} className="hidden size-16 flex-none rounded-[22%] ring-1 ring-on-night/15 sm:block sm:size-[4.5rem]" />
          <span aria-hidden="true" className="relative hidden h-[0.3125rem] min-w-16 flex-1 sm:block">
            <span className="cta-run absolute inset-0 rounded-full bg-coral-on-night" />
          </span>
          <Link href="#get-started" data-magnetic className="btn btn-primary btn-lg">
            {FINAL_CTA.cta} <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
