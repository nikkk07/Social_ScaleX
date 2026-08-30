import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { HeroAtmosphere } from '../effects/HeroAtmosphere';
import { PORTFOLIO } from '@/lib/content';

/**
 * Above-the-fold hero. Server component, zero JavaScript.
 *
 * The h1 is plain server-rendered HTML, so the LCP element paints on the
 * first frame instead of waiting for hydration, and every crawler reads the
 * positioning statement whether or not it runs JS.
 *
 * The headline is split into words at build time rather than at runtime — see
 * `.split-word` in theme.css for why GSAP SplitText is deliberately not used
 * on the LCP element.
 */

/** Split here, not in JS. `accent` marks the word carrying the gradient. */
const HEADLINE: ReadonlyArray<{ word: string; accent?: boolean }> = [
  { word: 'We' },
  { word: 'Grow' },
  { word: 'Brands.', accent: true },
];

/** Delay slots continue past the headline so the whole hero reads as one
 *  sequence rather than two that happen to overlap. */
const AFTER_HEADLINE = HEADLINE.length;

export function Hero() {
  // Derived, never hand-typed: the proof line cannot drift from the case
  // studies the way a hard-coded number would.
  // TODO(verify-metrics): the underlying figures are point-in-time snapshots
  // recorded in-repo pre-2026-08-05; currency unconfirmed.
  const igFollowers = PORTFOLIO.reduce((sum, item) => {
    const followers = item.metrics.find((m) => m.label.includes('Followers'));
    if (!followers) return sum;
    const n = parseFloat(followers.value);
    return sum + (followers.value.includes('K') ? n * 1000 : n);
  }, 0);
  // FLOOR, never round. The real total is 376.5K; rounding would print
  // "377K+", which is a claim about client accounts that is not true. A "+"
  // figure must always sit at or below the actual number.
  const igDisplay = `${Math.floor(igFollowers / 1000)}K+`;

  return (
    <section className="relative min-h-[100svh] flex flex-col justify-center pt-32 pb-24 overflow-hidden">
      <HeroAtmosphere />

      <div className="max-w-4xl mx-auto px-gutter relative z-10 flex flex-col items-center text-center w-full">
        <div
          className="rise-in liquid-glass inline-flex items-center gap-2 px-4 py-2 rounded-pill mb-8"
          style={{ animationDelay: '0.05s' }}
        >
          <span className="w-1.5 h-1.5 rounded-pill bg-positive shrink-0" />
          <span className="text-sm font-medium text-ink-muted">
            Real clients. Real growth. Verified results.
          </span>
        </div>

        <h1 className="text-7xl font-display font-bold tracking-display text-ink mb-6">
          {HEADLINE.map(({ word, accent }, i) => (
            <React.Fragment key={word}>
              {/* The mask is the effect: each word rises out of its own
                  overflow-hidden box rather than merely fading. */}
              <span className="split-word" style={{ '--i': i } as React.CSSProperties}>
                <span className={accent ? 'text-growth' : undefined}>{word}</span>
              </span>
              {i < HEADLINE.length - 1 ? ' ' : null}
            </React.Fragment>
          ))}
        </h1>

        {/*
          Answer-first subhead. Names the service, the platforms and the
          location inside the first sentence, because this is the sentence an
          answer engine quotes when asked "who does social media marketing in
          Delhi NCR".
        */}
        <p
          className="rise-in text-lg text-ink-muted max-w-2xl mb-10"
          style={{ animationDelay: `${AFTER_HEADLINE * 0.09 + 0.1}s` }}
        >
          Social ScaleX is a social media marketing agency in Delhi NCR. We run
          Instagram, Facebook and YouTube for brands and creators end to end —
          content production, page management, paid advertising and reporting
          built from your own account analytics.
        </p>

        <div
          className="rise-in flex flex-col sm:flex-row items-center gap-5"
          style={{ animationDelay: `${AFTER_HEADLINE * 0.09 + 0.2}s` }}
        >
          {/* One primary action per screen, and it is the only cyan on it. */}
          <Link href="#contact" className="btn btn-cta w-full sm:w-auto">
            Get a free strategy call
          </Link>
          <Link
            href="/case-studies"
            className="inline-flex items-center gap-1.5 text-ink-muted hover:text-ink font-medium transition-colors"
          >
            See real client results
            <ArrowRight size={17} aria-hidden />
          </Link>
        </div>

        <p
          className="rise-in text-sm text-ink-subtle font-medium tracking-wide mt-10"
          style={{ animationDelay: `${AFTER_HEADLINE * 0.09 + 0.3}s` }}
        >
          {igDisplay} combined Instagram followers across the brands we manage.
        </p>
      </div>
    </section>
  );
}
