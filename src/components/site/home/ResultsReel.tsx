'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, TrendingUp } from 'lucide-react';
import { onFrame, trackElement } from '@/components/motion/frame';
import { canRender, whenEngagedAndIdle } from '@/components/three/gate';
import type { ReelItem } from './reelItems';

/** 0 when the stage first pins, 1 when it lets go. */
function progressOf(t: ReturnType<typeof trackElement>): number {
  const span = t.box.height - window.innerHeight;
  return span > 0 ? Math.min(1, Math.max(0, -t.top() / span)) : 0;
}

/** Arc under the reel, like a dial: a thin track and a dot at the current position. */
const ARC = 'M 8 24.7 A 66 66 0 0 1 104 24.7';

/**
 * The results reel. Every card is HTML (server-rendered, crawlable, readable
 * by screen readers). As the visitor scrolls, the stage stays pinned and the
 * cards slide past; once WebGL is available the same cards are redrawn on a
 * curved strip with a slight colour split when scrolling fast.
 */
export function ResultsReel({ items }: { items: ReelItem[] }) {
  const reelRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [active, setActive] = useState(0);
  const [live, setLive] = useState(false);
  const n = items.length;

  useEffect(() => {
    const reel = reelRef.current;
    const stage = stageRef.current;
    const row = rowRef.current;
    const canvas = canvasRef.current;
    if (!reel || !stage || !row || !canvas) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const tracked = trackElement(reel);
    const cssTimeline = typeof CSS !== 'undefined' && CSS.supports('animation-timeline: view()');
    let isLive = false;
    let current = -1;
    let unsub: (() => void) | undefined;
    let handle: { setVisible: (v: boolean) => void; dispose: () => void } | undefined;
    let visible = false;
    let started = false;
    let cancelIdle: (() => void) | undefined;
    let cancelled = false;

    const update = () => {
      const p = progressOf(tracked);
      const idx = Math.round(p * (n - 1));
      if (idx !== current) {
        current = idx;
        setActive(idx);
      }
      // Browsers without CSS scroll timelines: slide the HTML row from here.
      if (!cssTimeline && !isLive) {
        const card = row.children[0] as HTMLElement | undefined;
        const next = row.children[1] as HTMLElement | undefined;
        const step = card && next ? next.offsetLeft - card.offsetLeft : 0;
        row.style.transform = `translate3d(${(-p * (n - 1) * step).toFixed(1)}px,0,0)`;
      }
    };

    const start = () => {
      if (started) return;
      started = true;
      import('@/components/three/scenes/reel')
        .then((m) => {
          if (cancelled) return;
          handle = m.mount({
            canvas,
            stage,
            row,
            tracked,
            items,
            onReady: () => {
              if (cancelled) return;
              isLive = true;
              setLive(true);
            },
          });
          handle.setVisible(visible);
        })
        .catch(() => {
          /* keep the HTML reel */
        });
    };

    const io = new IntersectionObserver(
      (entries) => {
        visible = entries.some((e) => e.isIntersecting);
        handle?.setVisible(visible);
        if (visible && !unsub) unsub = onFrame(update);
        if (!visible && unsub) {
          unsub();
          unsub = undefined;
        }
      },
      { rootMargin: '50% 0px' },
    );
    io.observe(reel);

    // Load the WebGL reel well before it scrolls into view.
    const near = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting) && !cancelIdle && canRender()) cancelIdle = whenEngagedAndIdle(start);
      },
      { rootMargin: '150% 0px' },
    );
    near.observe(reel);

    return () => {
      cancelled = true;
      tracked.dispose();
      io.disconnect();
      near.disconnect();
      unsub?.();
      cancelIdle?.();
      handle?.dispose();
    };
  }, [items, n]);

  const go = useCallback(
    (i: number) => {
      const reel = reelRef.current;
      if (!reel) return;
      const target = Math.min(n - 1, Math.max(0, i));
      const top = window.scrollY + reel.getBoundingClientRect().top;
      const span = reel.offsetHeight - window.innerHeight;
      window.scrollTo({ top: top + (span * target) / Math.max(1, n - 1), behavior: 'smooth' });
    },
    [n],
  );

  const cur = items[active] ?? items[0];
  if (!cur) return null;

  return (
    <div ref={reelRef} className="reel mt-10" style={{ '--n': n } as React.CSSProperties}>
      <div ref={stageRef} className={`reel-stage ${live ? 'is-live' : ''}`}>
        <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" />
        <div className="wrap motion-safe:max-w-none motion-safe:px-0">
          <div ref={rowRef} className="reel-row">
            {items.map((it) => (
              <article key={it.id} className="reel-card @container relative flex flex-col overflow-hidden rounded-[1.75rem] bg-night-2 p-6 ring-1 ring-on-night/10 sm:p-9">
                {/* The client's own profile photo, scaled up from 16 px into a soft colour wash: each card gets its client's colours for a few hundred bytes. */}
                <Image src={it.avatar} alt="" width={16} height={16} sizes="16px" aria-hidden="true" className="pointer-events-none absolute inset-0 size-full scale-125 object-cover opacity-35 saturate-150" />
                <div aria-hidden="true" className="reel-card-shade pointer-events-none absolute inset-0" />
                <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-[radial-gradient(closest-side,rgba(224,70,43,0.22),transparent)]" />
                {it.bars ? (
                  <div className="reel-bars absolute right-6 top-[24%] flex h-[34%] w-[38%] flex-col sm:right-9 @lg:top-[26%] @lg:w-[30%]">
                    <div aria-hidden="true" className="flex flex-1 items-end justify-end gap-3">
                      <span className="flex h-full w-1/2 flex-col items-center justify-end gap-1.5">
                        <span className="text-xs tabular-nums text-on-night-2">{it.bars.fromText}</span>
                        <span className="w-full rounded-t-lg bg-on-night/20" style={{ height: `${Math.max(6, Math.round((it.bars.from / it.bars.to) * 100))}%` }} />
                      </span>
                      <span className="flex h-full w-1/2 flex-col items-center justify-end gap-1.5">
                        <span className="text-xs font-semibold tabular-nums text-on-night">{it.bars.toText}</span>
                        <span className="h-full w-full rounded-t-lg bg-gradient-to-t from-coral to-coral-on-night shadow-[0_0_32px_rgba(240,122,94,0.35)]" />
                      </span>
                    </div>
                    <p className="mt-2 border-t border-on-night/15 pt-2 text-right text-[11px] text-on-night-2">{it.bars.label} · {it.bars.period}</p>
                    <p className="sr-only">{it.bars.label}: {it.bars.fromText} to {it.bars.toText}, {it.bars.period}.</p>
                  </div>
                ) : null}
                <div className="relative flex items-center gap-4">
                  <Image src={it.avatar} alt={`${it.client} Instagram profile photo`} width={64} height={64} className="size-14 flex-none rounded-full object-cover ring-2 ring-on-night/15 sm:size-16" />
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-display text-2xl leading-tight text-on-night @lg:text-3xl">
                      <Link href={`/case-studies#${it.id}`} tabIndex={live ? -1 : undefined} className="after:absolute after:inset-0">{it.client}</Link>
                    </h3>
                    <p className="truncate text-sm text-on-night-2">@{it.handle}</p>
                  </div>
                  <span className="hidden flex-none rounded-full border border-on-night/20 px-3 py-1 text-xs font-semibold text-on-night-2 @lg:inline">
                    {it.status === 'Active' ? 'Active client' : 'Past client'}
                  </span>
                </div>
                <div className="reel-bottom relative mt-auto">
                  <p className={`flex items-center gap-3 font-display text-[clamp(2.75rem,15cqw,7.5rem)] leading-none tracking-[-0.02em] ${it.growth ? 'text-coral-on-night' : 'text-on-night'}`}>
                    {it.growth ? <TrendingUp className="size-10 flex-none sm:size-14" strokeWidth={2.25} aria-hidden="true" /> : null}
                    {it.value}
                  </p>
                  <p className="mt-2 text-base text-on-night-2 sm:text-lg">{it.label}</p>
                  <div className="mt-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-t border-on-night/10 pt-4">
                    {it.extra ? (
                      <p className="text-sm text-on-night-2"><span className="font-display text-2xl text-on-night">{it.extra.value}</span> {it.extra.label.toLowerCase()}</p>
                    ) : <span />}
                    <p className="text-xs text-on-night-2">{it.date}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="reel-caption wrap relative mt-8 flex-col items-center text-center">
          <span aria-hidden="true" className="relative block h-8 w-28">
            <svg viewBox="0 0 112 32" className="absolute inset-0 h-full w-full">
              <path d={ARC} fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="1.5" />
            </svg>
            {/* The dot turns about the arc's centre on the reel's scroll timeline: a composited CSS transform. */}
            <span className="reel-dot absolute left-14 top-[4.375rem] size-0">
              <span className="absolute -left-[3.5px] -top-[69.5px] size-[7px] rounded-full bg-coral-on-night" />
            </span>
          </span>
          <div className="mt-2 flex items-center gap-3">
            <button type="button" onClick={() => go(active - 1)} disabled={active === 0} className="grid size-10 place-items-center rounded-full border border-on-night/20 text-on-night transition-colors hover:border-on-night disabled:opacity-30" aria-label="Previous client">
              <ArrowLeft className="size-4" aria-hidden="true" />
            </button>
            <p className="min-w-[13rem] rounded-xl bg-night-2 px-5 py-2.5">
              <span className="block font-display text-xl leading-tight text-on-night">{cur.client}</span>
              <span className="block text-xs tabular-nums text-on-night-2">{String(active + 1).padStart(2, '0')} / {String(n).padStart(2, '0')}</span>
            </p>
            <button type="button" onClick={() => go(active + 1)} disabled={active === n - 1} className="grid size-10 place-items-center rounded-full border border-on-night/20 text-on-night transition-colors hover:border-on-night disabled:opacity-30" aria-label="Next client">
              <ArrowRight className="size-4" aria-hidden="true" />
            </button>
          </div>
          <Link href={`/case-studies#${cur.id}`} className="mt-4 text-sm font-semibold text-coral-on-night underline decoration-coral-on-night/40 underline-offset-4 hover:decoration-coral-on-night">
            See the {cur.client} case <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
