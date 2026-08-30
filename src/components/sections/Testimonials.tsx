import React from 'react';
import Link from 'next/link';
import { ArrowRight, Quote } from 'lucide-react';
import { Reveal } from '../effects/Reveal';
import { GlassCard } from '../GlassCard';
import { PORTFOLIO, TESTIMONIALS, type Metric, type PortfolioItem } from '@/lib/content';

/**
 * Social proof.
 *
 * Renders real client quotes when TESTIMONIALS has any, and verified results
 * from PORTFOLIO when it does not. The fallback is not an apology for missing
 * quotes — it is what the original brief specified for this slot ("light,
 * verified metrics grid, not testimonial quotes"), so the section stands on
 * its own indefinitely and simply gets stronger when quotes arrive.
 *
 * Nothing here is ever written on a client's behalf.
 */

/**
 * Which figure this section leads with, per client.
 *
 * Deliberately NOT the same metric the portfolio cards lead with. Those show
 * the audience (followers); this shows what the account did (views, or the
 * growth delta where no view count exists). Same rule for every client, so it
 * is a rule rather than a per-client choice about which number flatters most.
 */
function performanceMetric(item: PortfolioItem): Metric | undefined {
  return (
    item.metrics.find((m) => /views/i.test(m.label)) ??
    item.metrics.find((m) => m.value.startsWith('+')) ??
    item.metrics[item.metrics.length - 1]
  );
}

/** Everything except the headline figure, as a one-line supporting detail. */
function supportingDetail(item: PortfolioItem, headline: Metric | undefined): string {
  return item.metrics
    .filter((m) => m !== headline)
    .map((m) => `${m.value} ${m.label.toLowerCase()}`)
    .join(' · ');
}

function VerifiedResults() {
  return (
    <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
      {PORTFOLIO.map((item, i) => {
        const headline = performanceMetric(item);
        return (
          <li
            key={item.id}
            // The first account is the largest we manage, so it gets the wider
            // cell — size carries the same information the number does.
            className={i === 0 ? 'md:col-span-2' : undefined}
          >
            <Reveal>
              <GlassCard className="h-full p-6 flex items-start gap-5">
                {/*
                  Solid colour, NOT .text-growth. That class needs to own the
                  element's `background` for background-clip:text, and
                  .liquid-glass-lite sets one too — combining them renders the
                  glyph transparent over glass with no gradient behind it, i.e.
                  an empty circle. Never put .text-growth on an element that
                  also carries a background.
                */}
                <span
                  className="liquid-glass-lite flex h-11 w-11 shrink-0 items-center justify-center rounded-pill font-display text-base font-bold text-growth-1"
                  aria-hidden
                >
                  {item.client.charAt(0).toUpperCase()}
                </span>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-3">
                    <span className="font-display font-bold text-ink">
                      {item.client}
                    </span>
                    <span className="text-2xs uppercase tracking-caps text-ink-subtle">
                      {item.platform}
                    </span>
                  </div>

                  {headline ? (
                    <p className="mb-2">
                      <span className="text-3xl font-display font-bold text-ink tabular-nums">
                        {headline.value}
                      </span>{' '}
                      <span className="text-sm text-ink-muted">
                        {headline.label.toLowerCase()}
                      </span>
                    </p>
                  ) : null}

                  <p className="text-sm text-ink-subtle">
                    {supportingDetail(item, headline)}
                  </p>
                </div>
              </GlassCard>
            </Reveal>
          </li>
        );
      })}
    </ul>
  );
}

function Quotes() {
  return (
    <ul className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
      {TESTIMONIALS.map((t) => (
        <li key={`${t.author}-${t.clientId}`}>
          <Reveal>
            <GlassCard className="h-full p-7 flex flex-col gap-5">
              <Quote size={20} aria-hidden className="text-growth-2 shrink-0" />
              <blockquote className="text-lg text-ink flex-1">
                {t.quote}
              </blockquote>
              <figcaption className="text-sm">
                <span className="font-semibold text-ink">{t.author}</span>
                <span className="text-ink-subtle"> · {t.role}</span>
              </figcaption>
            </GlassCard>
          </Reveal>
        </li>
      ))}
    </ul>
  );
}

export function Testimonials() {
  const hasQuotes = TESTIMONIALS.length > 0;

  return (
    <section
      id="results"
      aria-labelledby="results-heading"
      className="py-section relative border-t border-stroke section-cv"
    >
      <div className="max-w-wide mx-auto px-gutter">
        <Reveal className="max-w-3xl mb-12">
          <span className="text-cta font-medium tracking-caps uppercase text-2xs mb-4 block">
            {hasQuotes ? 'In their words' : 'Verified results'}
          </span>
          <h2
            id="results-heading"
            className="text-4xl font-display font-bold text-ink mb-5"
          >
            {hasQuotes
              ? 'What our clients say.'
              : 'Numbers pulled straight from the dashboard.'}
          </h2>
          <p className="text-ink-muted text-lg">
            {hasQuotes
              ? 'Published with permission, in the words the client used.'
              : 'No rounding up, no projections — every figure here is from the client’s own Instagram or YouTube analytics.'}
          </p>
        </Reveal>

        {hasQuotes ? <Quotes /> : <VerifiedResults />}

        <Reveal className="flex flex-col md:flex-row items-center justify-between gap-6 border-t border-stroke pt-8">
          <p className="text-sm text-ink-subtle max-w-lg">
            Client data shared with permission. Figures are point-in-time
            snapshots from each account&apos;s own analytics.
          </p>
          <Link href="/case-studies" className="btn btn-ghost">
            See the full case studies
            <ArrowRight size={18} aria-hidden />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
