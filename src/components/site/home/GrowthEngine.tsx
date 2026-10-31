import React from 'react';
import Link from 'next/link';
import { SectionHead } from '@/components/site/SectionHead';
import { GROWTH_ENGINE, getService, type PipelineStage } from '@/lib/content';
import { getAutomation } from '@/lib/automation';

/** The stage's one line comes from the page that delivers it, so the two can never disagree. */
function describe(s: PipelineStage): string {
  if (s.from?.kind === 'service') return getService(s.from.slug)?.outcome ?? s.desc ?? '';
  if (s.from?.kind === 'automation') return getAutomation(s.from.slug)?.outcome ?? s.desc ?? '';
  return s.desc ?? '';
}

/**
 * Homepage section 2: Reel → Reach → Engagement → DM → WhatsApp → Enquiry.
 * An ordered list styled as a connected path; vertical on phones, horizontal
 * from `lg`. The fill line and the token follow scroll with CSS only.
 */
export function GrowthEngine() {
  const stages: readonly PipelineStage[] = GROWTH_ENGINE.stages;
  return (
    <section aria-labelledby="engine-title" className="border-t border-line bg-paper-2 py-section">
      <div className="wrap">
        <SectionHead id="engine-title" eyebrow={GROWTH_ENGINE.eyebrow} title={GROWTH_ENGINE.title} intro={GROWTH_ENGINE.intro} />

        <div className="engine-path relative mt-12 overflow-x-clip">
          {/* The path: a hairline with a coral fill that grows as you scroll. Decorative. */}
          <div aria-hidden="true" className="absolute bottom-6 left-[1.1875rem] top-6 w-px bg-line-strong lg:hidden">
            <span className="engine-fill absolute inset-0 bg-coral" />
            <span className="engine-token absolute inset-0">
              <span className="absolute left-0 top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-coral ring-4 ring-coral-tint" />
            </span>
          </div>

          <ol className="rise relative grid gap-4 lg:grid-cols-3 lg:gap-5">
            {stages.map((s, i) => (
              <li key={s.stage} className="flex gap-4 lg:gap-4">
                <span
                  aria-hidden="true"
                  className={`relative z-10 grid size-10 flex-none place-items-center rounded-full font-display text-sm ring-4 ring-paper-2 ${i === stages.length - 1 ? 'bg-coral text-white' : 'bg-ink text-on-night'}`}
                >
                  {i + 1}
                </span>
                <div className="engine-stage card flex min-w-0 flex-1 flex-col p-5">
                  <h3 className="text-2xl text-ink">{s.stage}</h3>
                  <p className="mt-2 flex-1 text-sm text-ink-2">{describe(s)}</p>
                  <ul className="mt-4 flex flex-col gap-1.5 text-sm">
                    {s.links.map((l) => (
                      <li key={l.href}>
                        <Link href={l.href} className="link">
                          {l.label} <span aria-hidden="true">→</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
