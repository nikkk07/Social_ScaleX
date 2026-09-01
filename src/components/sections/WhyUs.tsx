import React from 'react';
import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import { Reveal } from '../effects/Reveal';
import { DIFFERENTIATORS } from '@/lib/content';

/**
 * Why us — a sticky pitch beside four independent claims.
 *
 * The "01"–"04" numerals are gone. These four are not a sequence: nothing
 * about "radical transparency" follows from "algorithm-first thinking", so
 * numbering them implied an order that does not exist and quietly competed
 * with the Process section, where the numbers are load-bearing. Same call as
 * the services grid in Phase 4. A check mark marks each claim instead, which
 * says "one of several" without inventing a rank.
 *
 * Copy lives in DIFFERENTIATORS. This file no longer holds any.
 *
 * Server component; the sticky rail and the reveals are CSS.
 */
export function WhyUs() {
  return (
    <section
      id="why-us"
      aria-labelledby="why-us-heading"
      className="py-section relative border-t border-stroke section-cv"
    >
      <div className="max-w-wide mx-auto px-gutter">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
          {/* Left column — sticky on desktop, static where there is no room
              for it to be sticky against. */}
          <div className="w-full lg:w-5/12">
            <div className="lg:sticky lg:top-32">
              <Reveal>
                <span className="text-cta font-medium tracking-caps uppercase text-2xs mb-4 block">
                  Why Social ScaleX
                </span>
                <h2
                  id="why-us-heading"
                  className="text-4xl font-display font-bold text-ink mb-6"
                >
                  We treat your brand like our own.
                </h2>
                <p className="text-ink-muted text-lg mb-8">
                  Most agencies post content. We build systems that compound —
                  where each month&apos;s results make next month&apos;s easier.
                </p>
                {/*
                  btn-action, the secondary tier, and its first use on the
                  site. This is a conversion link rather than navigation, so
                  btn-ghost (what Services, Work, Testimonials and the FAQ use
                  for "see more") would under-sell it — but the one cyan
                  primary per screen is already spoken for by the navbar CTA
                  and, further down, the contact form's submit.
                */}
                <Link href="/#contact" className="btn btn-action">
                  Let&apos;s talk strategy
                  <ArrowRight size={18} aria-hidden />
                </Link>
              </Reveal>
            </div>
          </div>

          {/* Right column — the claims. */}
          <div className="w-full lg:w-7/12">
            <ul className="space-y-6">
              {DIFFERENTIATORS.map((point) => (
                <li key={point.title}>
                  <Reveal>
                    {/*
                      glass-hover rather than a `hover:border-*` utility. The
                      utility form was inert here: `.liquid-glass` sets
                      `border` in unlayered CSS, which beats @layer utilities
                      outright — see the CSS-ownership rule in tokens.css.
                    */}
                    <div className="liquid-glass glass-hover rounded-3xl p-8 flex gap-5 transition-[border-color] duration-300">
                      <span
                        className="liquid-glass-lite flex h-9 w-9 shrink-0 items-center justify-center rounded-pill text-growth-1"
                        aria-hidden
                      >
                        <Check size={17} />
                      </span>
                      <div className="min-w-0">
                        <h3 className="text-2xl font-display font-bold text-ink mb-3">
                          {point.title}
                        </h3>
                        <p className="text-ink-muted text-lg">{point.desc}</p>
                      </div>
                    </div>
                  </Reveal>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
