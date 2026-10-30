import React from 'react';
import Image from 'next/image';
import { SectionHead } from '@/components/site/SectionHead';
import { ThreeStage } from '@/components/three/ThreeStage';
import { HOW_WE_WORK, PROCESS } from '@/lib/content';

/**
 * Homepage section 4: the real four-step PROCESS. Beside it, the brand X
 * (built from the logo's two strokes) turns a quarter turn per step as the
 * section scrolls. Until the scene loads, and for anyone who can't or
 * shouldn't get WebGL, the tile shows the logo itself.
 */
export function HowWeWork() {
  return (
    <section aria-labelledby="process-title" className="border-t border-line bg-surface py-section">
      <div className="wrap grid grid-cols-1 gap-12 lg:grid-cols-[1fr_1.3fr] lg:gap-16">
        <div>
          <SectionHead id="process-title" eyebrow={HOW_WE_WORK.eyebrow} title={HOW_WE_WORK.title} intro={HOW_WE_WORK.intro} />
          <div className="mt-10 lg:sticky lg:top-28">
            <div className="mx-auto aspect-square w-full max-w-[13rem] overflow-hidden rounded-[22%] bg-night sm:max-w-[16rem] lg:mx-0 lg:max-w-[20rem]">
              <ThreeStage scene="brandx" className="h-full w-full">
                <Image src="/logo.png" alt="" width={512} height={512} sizes="(min-width: 1024px) 20rem, 16rem" className="h-full w-full" />
              </ThreeStage>
            </div>
          </div>
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
