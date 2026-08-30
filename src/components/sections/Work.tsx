import React from 'react';
import Link from 'next/link';
import { ArrowRight, Instagram, Youtube } from 'lucide-react';
import { Reveal } from '../effects/Reveal';
import { GlassCard } from '../GlassCard';
import { MotionRequest } from '../motion/MotionRequest';
import { PORTFOLIO, type PortfolioItem } from '@/lib/content';

function PlatformChip({ platform }: { platform: PortfolioItem['platform'] }) {
  return (
    <span className="liquid-glass-lite rounded-pill px-3 py-1.5 inline-flex items-center gap-2">
      <span className="flex -space-x-1" aria-hidden>
        {platform.includes('Instagram') && <Instagram size={13} className="text-ink" />}
        {platform.includes('YouTube') && <Youtube size={13} className="text-ink" />}
      </span>
      <span className="text-2xs font-medium text-ink">{platform}</span>
    </span>
  );
}

/**
 * Client case studies.
 *
 * The card media used to be a mock Instagram screenshot — grey bars arranged
 * to look like a UI. It was replaced because it implied evidence that does
 * not exist: a reader glances at it and reads "screenshot of the account".
 * The media is now the account's own headline figure set in type, which
 * claims exactly as much as we can actually support.
 *
 * The headline metric is simply the FIRST in each item's array — the order
 * the data author chose. It is deliberately not "the largest" or "the most
 * impressive": a rule that picks the flattering number per client is spin
 * with extra steps, and every metric is listed below the fold of the card
 * regardless.
 *
 * Server component. The parallax is CSS (`.parallax-layer`); MotionRequest
 * registers interest in a GSAP refinement that will only ever load if a
 * second feature wants the layer too.
 */
export function Work() {
  return (
    <section
      id="work"
      aria-labelledby="work-heading"
      className="py-section relative section-cv"
    >
      {/* Registers 'parallax' with the motion layer. Renders nothing. */}
      <MotionRequest feature="parallax" />

      <div className="max-w-wide mx-auto px-gutter">
        <Reveal className="max-w-3xl mb-14">
          <span className="text-cta font-medium tracking-caps uppercase text-2xs mb-4 block">
            Client portfolio
          </span>
          <h2
            id="work-heading"
            className="text-4xl font-display font-bold text-ink mb-5"
          >
            Real accounts. Real numbers.
          </h2>
          <p className="text-ink-muted text-lg">
            Every figure below is pulled straight from the client&apos;s own
            Instagram or YouTube dashboard — no projections, no rounding up.
          </p>
        </Reveal>

        <ul className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-12">
          {PORTFOLIO.map((item) => {
            // The media shows the first metric; the row below shows the
            // rest. Rendering all of them in both places printed the same
            // figure twice per card, which reads as a mistake and wastes the
            // one area with room to make a number land.
            const [headline, ...rest] = item.metrics;
            return (
              <li key={item.id}>
                <Reveal>
                  <GlassCard className="h-full flex flex-col">
                    <div className="parallax-frame relative h-44 border-b border-stroke">
                      {/* The drifting layer: gradient only, no content, so
                          nothing readable ever moves under the reader. */}
                      <div
                        className="parallax-layer absolute inset-0 bg-base-900"
                        style={{
                          background:
                            'radial-gradient(120% 100% at 20% 0%, rgba(139,92,246,0.28), transparent 62%), radial-gradient(90% 90% at 100% 100%, rgba(34,211,238,0.20), transparent 65%)',
                        }}
                      />
                      <div className="relative h-full flex flex-col justify-between p-5">
                        <PlatformChip platform={item.platform} />
                        {headline ? (
                          <div>
                            <div className="text-4xl font-display font-bold text-ink tabular-nums leading-none">
                              {headline.value}
                            </div>
                            <div className="text-2xs uppercase tracking-caps text-ink-subtle mt-1.5">
                              {headline.label}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="p-6 md:p-7 flex flex-col flex-1">
                      <span className="text-2xs font-semibold text-positive uppercase tracking-caps block mb-2">
                        {item.category}
                      </span>
                      <h3 className="text-2xl font-display font-bold text-ink mb-2.5">
                        {item.client}
                      </h3>
                      <p className="text-ink-subtle text-sm mb-6">
                        {item.description}
                      </p>

                      {/* dl, not divs: these are label/value pairs, and the
                          pairing is what an extractor needs to read them. */}
                      <dl
                        className={`mt-auto grid ${
                          rest.length >= 2 ? 'grid-cols-2' : 'grid-cols-1'
                        } gap-3 pt-5 border-t border-stroke`}
                      >
                        {rest.map((metric) => (
                          <div key={metric.label}>
                            <dd className="text-xl font-display font-bold text-ink mb-1 tabular-nums">
                              {metric.value}
                            </dd>
                            <dt className="text-2xs uppercase tracking-caps text-ink-subtle leading-tight">
                              {metric.label}
                            </dt>
                          </div>
                        ))}
                      </dl>
                    </div>
                  </GlassCard>
                </Reveal>
              </li>
            );
          })}
        </ul>

        <Reveal className="flex flex-col md:flex-row items-center justify-between gap-6 border-t border-stroke pt-8">
          <p className="text-sm text-ink-subtle max-w-lg">
            Client data shared with permission — and more brands beyond those
            shown here. Figures are point-in-time snapshots, not running totals.
          </p>
          <Link href="/case-studies" className="btn btn-ghost">
            Read the full case studies
            <ArrowRight size={18} aria-hidden />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
