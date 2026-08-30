import React from 'react';
import { ArrowRight } from 'lucide-react';

/**
 * Above-the-fold hero. Server component, zero JavaScript.
 *
 * The h1 and subhead are plain server-rendered HTML, so the LCP element
 * paints on the first frame instead of waiting for hydration, and every
 * crawler reads the positioning statement whether or not it runs JS.
 * The staggered entrance is CSS (`.rise-in` + inline animation-delay).
 */
export function Hero() {
  return (
    <section className="relative min-h-[100svh] flex flex-col justify-center pt-32 pb-24">
      <div className="max-w-4xl mx-auto px-6 relative z-10 flex flex-col items-center text-center w-full">
        <div
          className="rise-in liquid-glass inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8"
          style={{ animationDelay: '0.05s' }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-emerald)] shrink-0" />
          <span className="text-sm font-medium text-white/75">
            Real clients. Real growth. Verified results.
          </span>
        </div>

        <h1
          className="rise-in text-5xl md:text-7xl font-display font-bold tracking-tight text-white mb-6 leading-[1.05]"
          style={{ animationDelay: '0.15s' }}
        >
          We Grow <span className="text-gradient">Brands.</span>
        </h1>

        {/*
          Answer-first subhead. Names the service, the platforms and the
          location inside the first sentence, because this is the sentence an
          answer engine quotes when asked "who does social media marketing in
          Delhi NCR".
        */}
        <p
          className="rise-in text-lg md:text-xl text-white/70 max-w-2xl mb-10 leading-relaxed"
          style={{ animationDelay: '0.25s' }}
        >
          Social ScaleX is a social media marketing agency in Delhi NCR. We run
          Instagram, Facebook and YouTube for brands and creators end to end —
          content production, page management, paid advertising and reporting
          built from your own account analytics.
        </p>

        <div
          className="rise-in flex flex-col sm:flex-row items-center gap-5"
          style={{ animationDelay: '0.35s' }}
        >
          <a
            href="#contact"
            className="w-full sm:w-auto inline-flex items-center justify-center bg-[var(--color-violet-cta)] text-white px-8 py-4 rounded-full font-semibold text-base border border-white/15 shadow-[0_8px_28px_rgba(124,58,237,0.35)] transition-[transform,background-color] duration-200 hover:bg-[var(--color-violet)] hover:scale-[1.02] active:scale-[0.99]"
          >
            Get a free strategy call
          </a>
          <a
            href="/case-studies"
            className="inline-flex items-center gap-1.5 text-white/70 hover:text-white font-medium transition-colors"
          >
            See real client results
            <ArrowRight size={17} aria-hidden />
          </a>
        </div>

        <p
          className="rise-in text-sm text-white/60 font-medium tracking-wide mt-10"
          style={{ animationDelay: '0.45s' }}
        >
          {/* TODO(verify-metrics): 376K = 336+10.6+15.9+14 (IG followers) from
              the PORTFOLIO data. Recorded in-repo pre-2026-08-05; currency
              unconfirmed. */}
          376K+ combined Instagram followers across the brands we manage.
        </p>
      </div>
    </section>
  );
}
