import React from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronDown } from 'lucide-react';
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
 *
 * No `name` attribute on the <details> elements, deliberately. Making the
 * group exclusive would close one answer to open another, which is fine for
 * a person and wrong for the page: two answers a visitor wants to compare
 * (timeline and cost, say) can never be on screen together.
 *
 * Copy is passed in, never written here — the homepage, /about and /services
 * each render a different slice of FAQS from content.ts, and the FAQPage
 * schema on each of those pages is built from that same slice. Same
 * sentences in the schema as on the screen, by construction.
 *
 * Server component. Every state change is CSS on a native element.
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
      className="py-section relative border-t border-stroke section-cv"
    >
      {/* The reading measure, not the wide grid measure: these are eight
          paragraphs of prose, and long lines are what make an FAQ feel like
          work. Matches the Process section for the same reason. */}
      <div className="max-w-content mx-auto px-gutter">
        <Reveal className="mb-12">
          <span className="text-cta font-medium tracking-caps uppercase text-2xs mb-4 block">
            {eyebrow}
          </span>
          <h2
            id={headingId}
            className="text-4xl font-display font-bold text-ink mb-5"
          >
            {heading}
          </h2>
          <p className="text-ink-muted text-lg">{intro}</p>
        </Reveal>

        {/* A list, so the count of questions is exposed rather than implied by
            eight sibling divs. */}
        <ul className="space-y-3">
          {faqs.map((item, i) => (
            <li key={item.q}>
              {/* One Reveal per row rather than one around the whole list.
                  `.reveal` runs on a view() timeline, which is positional —
                  wrapping the list animated all eight as a single block the
                  moment the first one crossed the range. Per row, each
                  answers to its own scroll position and the stagger is real.

                  Nothing inside is absolutely positioned: `.reveal` animates a
                  transform, which would make this div the containing block. */}
              <Reveal>
                <details
                  // The first answer is open on load; the rest are collapsed
                  // but still present in the HTML.
                  open={i === 0}
                  className="group liquid-glass rounded-lg px-6 [&_summary::-webkit-details-marker]:hidden"
                >
                  <summary className="flex items-start justify-between gap-4 list-none py-5">
                    {/* h3 inside summary keeps the question in the heading
                        outline, which is what builds the extractable Q→A
                        pair. Phrasing plus heading content is exactly what
                        the summary content model allows. */}
                    <h3 className="text-lg font-display font-semibold text-ink">
                      {item.q}
                    </h3>
                    <ChevronDown
                      size={18}
                      aria-hidden
                      className="mt-1 shrink-0 text-ink-subtle transition-transform duration-200 ease-out group-open:rotate-180"
                    />
                  </summary>
                  {/* No focus styling on the summary at all — the global
                      `summary:focus-visible` ring in theme.css handles it.
                      This element used to carry `focus-visible:outline-none`
                      with nothing in its place, so tabbing through the
                      questions moved focus invisibly. */}
                  <p className="text-ink-muted pb-6">{item.a}</p>
                </details>
              </Reveal>
            </li>
          ))}
        </ul>

        <Reveal className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 border-t border-stroke mt-10 pt-8">
          <p className="text-sm text-ink-subtle">
            Something here not covered? Ask it on the call — it&apos;s free,
            and there is no pitch deck.
          </p>
          <Link href="/#contact" className="btn btn-ghost btn-sm shrink-0">
            Book the strategy call
            <ArrowRight size={18} aria-hidden />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
