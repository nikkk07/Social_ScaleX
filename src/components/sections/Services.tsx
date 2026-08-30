import React from 'react';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Instagram, Facebook, Youtube } from 'lucide-react';
import { Reveal } from '../effects/Reveal';
import { SERVICES } from '@/lib/content';

/**
 * TODO(verify-metrics): these three platform figures are point-in-time
 * snapshots recorded in-repo pre-2026-08-05, same provenance as PORTFOLIO.
 * They are the last hard-coded metrics outside content.ts.
 */
const PLATFORMS = [
  { name: 'Instagram', icon: Instagram, stat: '336K followers managed' },
  { name: 'Facebook', icon: Facebook, stat: 'Meta ads built to convert' },
  { name: 'YouTube', icon: Youtube, stat: '96.6K subscribers managed' },
];

/**
 * Services grid — outcome-framed.
 *
 * Each card leads with what the client GETS and only then says what the
 * service is. Services sold as feature lists ask the reader to do the
 * translation themselves, and most won't.
 *
 * Note what is NOT here: the 01–08 numbering the previous grid carried.
 * These eight are a set, not a sequence — nothing happens first — so
 * numbering them encoded order that does not exist. The deliverable count
 * replaces it, which is a fact the card can actually stand behind because
 * it is derived from the same array /services renders in full.
 *
 * Server component; the reveal is CSS.
 */
export function Services() {
  return (
    <section
      id="services"
      aria-labelledby="services-heading"
      className="py-section relative border-t border-stroke section-cv"
    >
      <div className="max-w-wide mx-auto px-gutter">
        <Reveal className="max-w-3xl mb-14">
          <span className="text-cta font-medium tracking-caps uppercase text-2xs mb-4 block">
            What we do
          </span>
          <h2
            id="services-heading"
            className="text-4xl font-display font-bold text-ink mb-5"
          >
            Everything your brand needs to scale.
          </h2>
          <p className="text-ink-muted text-lg">
            Instagram page management, Reels production, Meta ads, influencer
            marketing — delivered as one connected system, not a menu of
            add-ons.
          </p>
        </Reveal>

        {/* Hairline grid: gap-px over a faint fill, so the rules are the gaps
            themselves rather than nine separate borders to keep aligned. */}
        <Reveal>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-px bg-stroke rounded-lg overflow-hidden border border-stroke mb-10">
            {SERVICES.map((s) => (
              <li key={s.slug} className="bg-base-950">
                <Link
                  href={`/services#${s.slug}`}
                  className="group flex h-full flex-col gap-3 p-7 md:p-8 transition-colors hover:bg-base-850 focus-visible:bg-base-850 focus-visible:outline-none"
                >
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-xl font-display font-bold text-ink">
                      {s.title}
                    </h3>
                    <ArrowUpRight
                      size={18}
                      aria-hidden
                      className="mt-1 shrink-0 text-ink-subtle transition-colors group-hover:text-cta"
                    />
                  </div>

                  {/* The outcome leads. It is the reason to care; the
                      description below only explains the mechanism. */}
                  <p className="text-base text-ink leading-snug">{s.outcome}</p>

                  <p className="text-sm text-ink-subtle">{s.desc}</p>

                  <span className="mt-auto pt-2 text-2xs uppercase tracking-caps text-ink-subtle tabular-nums">
                    {s.deliverables.length} deliverables
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal className="mb-16 flex justify-center">
          <Link href="/services" className="btn btn-ghost">
            See what each service includes
            <ArrowRight size={18} aria-hidden />
          </Link>
        </Reveal>

        <Reveal>
          <div className="liquid-glass rounded-lg p-6 md:p-8">
            <ul className="grid grid-cols-1 sm:grid-cols-3 gap-6 divide-y sm:divide-y-0 sm:divide-x divide-stroke">
              {PLATFORMS.map(({ name, icon: Icon, stat }) => (
                <li
                  key={name}
                  className="flex items-center gap-4 pt-6 first:pt-0 sm:pt-0 sm:px-6 sm:first:pl-0"
                >
                  <span className="w-11 h-11 rounded-md liquid-glass-lite flex items-center justify-center shrink-0">
                    <Icon size={20} className="text-ink" aria-hidden />
                  </span>
                  <div>
                    <div className="text-ink font-display font-bold">{name}</div>
                    <div className="text-sm text-ink-subtle">{stat}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
