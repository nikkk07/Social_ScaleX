import React from 'react';
import { SectionHead } from '@/components/site/SectionHead';
import { HOW_WE_WORK, PROCESS } from '@/lib/content';

/** Homepage: the real four-step PROCESS. */
export function HowWeWork() {
  return (
    <section aria-labelledby="process-title" className="border-t border-line bg-surface py-section">
      <div className="wrap grid grid-cols-1 gap-12 lg:grid-cols-[1fr_1.3fr] lg:gap-16">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <SectionHead id="process-title" eyebrow={HOW_WE_WORK.eyebrow} title={HOW_WE_WORK.title} intro={HOW_WE_WORK.intro} />
        </div>

        <ol className="rise grid gap-px self-start overflow-hidden rounded-card border border-line bg-line">
          {PROCESS.map((s, i) => (
            <li key={s.title} className="grid grid-cols-[auto_1fr] gap-x-5 bg-surface p-6 sm:p-8">
              <span aria-hidden="true" className="font-display text-5xl leading-none text-coral-text">{i + 1}</span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-3">Step {i + 1}</p>
                <h3 className="mt-1 text-2xl text-ink">{s.title}</h3>
                <p className="mt-2 text-ink-2">{s.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
