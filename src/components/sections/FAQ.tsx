import React from 'react';
import { ChevronDown } from 'lucide-react';
import { Reveal } from '../effects/Reveal';
import type { Faq } from '@/lib/content';

interface FAQProps {
  faqs: Faq[];
  eyebrow?: string;
  heading?: string;
  intro?: string;
  /** Rendered as h2 on a page that already owns its h1. */
  headingId?: string;
}

/**
 * FAQ section — native <details>/<summary>, no JavaScript.
 *
 * This replaced a Radix Accordion, and the reason is the whole point of the
 * section. Radix unmounts closed panels, so five of the six answers were not
 * in the DOM at all: the visible page had them, the HTML did not, and neither
 * did anything reading the HTML. <details> keeps every answer in the markup
 * whether or not it is expanded, which is what makes the matching FAQPage
 * schema truthful and the answers quotable.
 */
export function FAQ({
  faqs,
  eyebrow = 'Questions, answered',
  heading = 'Before you book the call.',
  intro = 'The things brands ask us most — answered straight, no sales script.',
  headingId = 'faq-heading',
}: FAQProps) {
  return (
    <section
      id="faq"
      aria-labelledby={headingId}
      className="py-24 md:py-32 relative border-t border-white/5 section-cv"
    >
      <div className="max-w-3xl mx-auto px-6">
        <Reveal className="text-center mb-14">
          <span className="text-[var(--color-violet-light)] font-medium tracking-wider uppercase text-sm mb-4 block">
            {eyebrow}
          </span>
          <h2
            id={headingId}
            className="text-4xl md:text-5xl font-display font-bold text-white mb-4"
          >
            {heading}
          </h2>
          <p className="text-white/70 text-lg leading-relaxed">{intro}</p>
        </Reveal>

        <Reveal>
          <div className="space-y-3">
            {faqs.map((item, i) => (
              <details
                key={item.q}
                // The first answer is open on load; the rest are collapsed but
                // still present in the HTML.
                open={i === 0}
                className="group liquid-glass rounded-2xl px-6 [&_summary::-webkit-details-marker]:hidden"
              >
                <summary className="flex items-start justify-between gap-4 cursor-pointer list-none py-5 text-base md:text-lg font-display font-semibold text-white focus-visible:outline-none">
                  {/* h3 inside summary keeps the question in the heading
                      outline, which is what builds the extractable Q→A pair. */}
                  <h3 className="text-base md:text-lg font-display font-semibold">
                    {item.q}
                  </h3>
                  <ChevronDown
                    size={18}
                    aria-hidden
                    className="mt-1 shrink-0 text-white/50 transition-transform duration-200 group-open:rotate-180"
                  />
                </summary>
                <p className="text-white/70 leading-relaxed text-sm md:text-base pb-6">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
