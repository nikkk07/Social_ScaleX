import React from 'react';
import { Reveal } from '../effects/Reveal';
import { PROCESS } from '@/lib/content';

/**
 * How the work runs, in four steps.
 *
 * The numbering stays here, unlike on the services grid. These four are a
 * genuine sequence — the audit precedes the strategy, which precedes the
 * launch — so the numerals encode real order rather than decorating a set.
 *
 * Single left rail rather than the alternating left/right timeline this
 * replaced. Alternating looks livelier in a screenshot and reads worse:
 * the eye has to re-find the start of each step, and on the fourth one it
 * has stopped trying. One column, one rail, one reading direction.
 *
 * Server component; the rail and reveals are CSS.
 */
export function Process() {
  return (
    <section
      id="process"
      aria-labelledby="process-heading"
      className="py-section relative border-t border-stroke overflow-hidden section-cv"
    >
      <div className="max-w-content mx-auto px-gutter">
        <Reveal className="mb-16">
          <span className="text-cta font-medium tracking-caps uppercase text-2xs mb-4 block">
            How we work
          </span>
          <h2
            id="process-heading"
            className="text-4xl font-display font-bold text-ink mb-5"
          >
            Growth isn&apos;t luck. It&apos;s engineered.
          </h2>
          {/* Sourced from the FAQ's own commitment, not invented here: "the
              first 30 days are setup and testing — audit, content pillars,
              and finding what your audience responds to." */}
          <p className="text-ink-muted text-lg">
            The first 30 days are setup and testing — steps one and two below.
            Execution starts once we know what your audience actually responds
            to, not before.
          </p>
        </Reveal>

        <ol className="relative">
          {/* The rail runs violet to cyan: the growth gradient, used here to
              show progression through the sequence. Sits behind the markers
              and stops short of the last one so it reads as a path with an
              end rather than a line that keeps going. */}
          <div
            className="absolute left-[19px] top-2 bottom-16 w-px bg-gradient-to-b from-growth-2 to-growth-3"
            aria-hidden
          />

          {PROCESS.map((step) => (
            <li key={step.num} className="relative pl-14 pb-14 last:pb-0">
              {/*
                OUTSIDE <Reveal>, deliberately. `.reveal` animates a transform,
                and a transformed element becomes the containing block for its
                absolutely positioned descendants — so a marker placed inside
                it anchored to the Reveal box (which starts after this li's
                padding) and landed on top of the heading instead of in the
                gutter beside it.
              */}
              <span
                className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-pill border border-stroke-strong bg-base-900 font-display text-sm font-bold text-cta tabular-nums"
                aria-hidden
              >
                {step.num}
              </span>

              <Reveal>
                <h3 className="text-2xl font-display font-bold text-ink mb-3">
                  {step.title}
                </h3>
                <p className="text-ink-muted mb-5">{step.desc}</p>

                <ul className="flex flex-wrap gap-2">
                  {step.tags.map((tag) => (
                    <li
                      key={tag}
                      className="liquid-glass-lite px-3 py-1 rounded-pill text-2xs text-ink-muted whitespace-nowrap"
                    >
                      {tag}
                    </li>
                  ))}
                </ul>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
