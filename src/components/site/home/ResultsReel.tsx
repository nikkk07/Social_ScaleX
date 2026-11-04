'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, TrendingUp } from 'lucide-react';
import { onFrame, scrollState, trackElement } from '@/components/motion/frame';
import { lc } from '@/lib/text';
import type { ReelItem } from './reelItems';

/** 0 when the stage first pins, 1 when it lets go. */
function progressOf(t: ReturnType<typeof trackElement>): number {
  const span = t.box.height - window.innerHeight;
  return span > 0 ? Math.min(1, Math.max(0, -t.top() / span)) : 0;
}

/** Arc under the reel, like a dial: a thin track and a dot at the current position. */
const ARC = 'M 8 24.7 A 66 66 0 0 1 104 24.7';

/** Where the CSS pins the stage (motion allowed, tall enough screen). Keep in step with theme.css. */
const PIN = '(prefers-reduced-motion: no-preference) and (min-height: 600px) and (min-width: 640px), (prefers-reduced-motion: no-preference) and (min-height: 640px)';

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/** Before → after as two bars, from the client's published figures. */
function Bars({ bars }: { bars: NonNullable<ReelItem['bars']> }) {
  const fromPct = Math.max(6, Math.round((bars.from / bars.to) * 100));
  return (
    <figure className="reel-bars">
      <div aria-hidden="true" className="grid min-h-0 flex-1 grid-cols-2 items-end gap-2.5">
        <div className="flex h-full flex-col justify-end">
          <span className="mb-1.5 text-center text-xs tabular-nums text-on-night-2">{bars.fromText}</span>
          <span className="block rounded-t-md bg-on-night/20" style={{ height: `${fromPct}%` }} />
        </div>
        <div className="flex h-full flex-col justify-end">
          <span className="mb-1.5 text-center text-xs font-semibold tabular-nums text-on-night">{bars.toText}</span>
          <span className="reel-bar-now block h-full rounded-t-md" />
        </div>
      </div>
      <figcaption className="mt-2 border-t border-on-night/15 pt-2 text-[11px] leading-snug text-on-night-2">
        <span className="sr-only">{bars.fromText} to {bars.toText}. </span>
        {bars.label} · {bars.period}
      </figcaption>
    </figure>
  );
}

/**
 * The results reel. Every card is plain HTML: server-rendered, crawlable and
 * read by screen readers, with one layout and nothing positioned on top of
 * anything else. While the stage is pinned, scrolling slides the cards past;
 * with JavaScript, cards also turn on a CSS 3D curve (transforms only, no
 * WebGL, no layout work per frame).
 */
export function ResultsReel({ items }: { items: ReelItem[] }) {
  const reelRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const n = items.length;

  useEffect(() => {
    const reel = reelRef.current;
    const row = rowRef.current;
    if (!reel || !row) return;
    const pinned = window.matchMedia(PIN);
    const tracked = trackElement(reel);
    const cards = [...row.children] as HTMLElement[];
    let step = 0;
    const measure = () => {
      const a = cards[0];
      const b = cards[1];
      step = a && b ? b.offsetLeft - a.offsetLeft : 0;
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(row);

    let current = -1;
    let unsub: (() => void) | undefined;
    let swing = 0;

    const reset = () => {
      row.style.transform = '';
      cards.forEach((c) => {
        c.style.transform = '';
        c.style.opacity = '';
      });
    };

    const update = () => {
      const p = progressOf(tracked);
      const idx = Math.round(p * (n - 1));
      if (idx !== current) {
        current = idx;
        setActive(idx);
      }
      if (!pinned.matches) return;
      // A little extra turn while scrolling fast, eased so it never jerks.
      swing += (clamp(scrollState.velocity * 0.6, -8, 8) - swing) * 0.12;
      const pos = p * (n - 1);
      row.style.transform = `translate3d(${(-pos * step).toFixed(1)}px,0,0)`;
      cards.forEach((c, i) => {
        const d = i - pos;
        const a = Math.min(Math.abs(d), 2);
        const turn = clamp(-d * 16, -32, 32) + swing;
        c.style.transform = `rotateY(${turn.toFixed(2)}deg) translate3d(0,0,${(-a * 110).toFixed(1)}px) scale(${(1 - a * 0.05).toFixed(3)})`;
        c.style.opacity = (1 - a * 0.28).toFixed(3);
      });
    };

    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((e) => e.isIntersecting);
        if (visible && !unsub) {
          reel.classList.add('reel-js');
          unsub = onFrame(update);
        }
        if (!visible && unsub) {
          unsub();
          unsub = undefined;
        }
      },
      { rootMargin: '50% 0px' },
    );
    io.observe(reel);
    const onChange = () => {
      if (!pinned.matches) reset();
    };
    pinned.addEventListener('change', onChange);

    return () => {
      io.disconnect();
      ro.disconnect();
      tracked.dispose();
      unsub?.();
      pinned.removeEventListener('change', onChange);
      reel.classList.remove('reel-js');
      reset();
    };
  }, [n]);

  const go = useCallback(
    (i: number) => {
      const reel = reelRef.current;
      if (!reel) return;
      const target = Math.min(n - 1, Math.max(0, i));
      const top = window.scrollY + reel.getBoundingClientRect().top;
      const span = reel.offsetHeight - window.innerHeight;
      if (span <= 0) return;
      window.scrollTo({ top: top + (span * target) / Math.max(1, n - 1), behavior: 'smooth' });
    },
    [n],
  );

  const cur = items[active] ?? items[0];
  if (!cur) return null;

  return (
    <div ref={reelRef} className="reel mt-8" style={{ '--n': n } as React.CSSProperties}>
      <div className="reel-stage">
        <div className="reel-track wrap">
          <div ref={rowRef} className="reel-row">
            {items.map((it, i) => (
              <article
                key={it.id}
                className="reel-card @container"
                style={{ '--i': i } as React.CSSProperties}
                onFocus={() => go(i)}
              >
                {/* Background: brand glow, orbit rings and grain, tinted by the client's own photo. */}
                <Image src={it.avatar} alt="" width={16} height={16} sizes="16px" aria-hidden="true" className="reel-tint" />
                <span aria-hidden="true" className="reel-bg" />

                <header className="flex items-center gap-3.5">
                  <Image src={it.avatar} alt={`${it.client} Instagram profile photo`} width={64} height={64} className="size-12 flex-none rounded-full object-cover ring-2 ring-on-night/20 @md:size-14" />
                  <div className="min-w-0 flex-1">
                    <h3 className="line-clamp-2 text-balance font-display text-xl leading-tight text-on-night @md:text-2xl @2xl:text-3xl">
                      <Link href={`/case-studies#${it.id}`} className="after:absolute after:inset-0 after:rounded-[inherit]">{it.client}</Link>
                    </h3>
                    <p className="truncate text-sm text-on-night-2">@{it.handle}</p>
                  </div>
                  <span className="hidden flex-none rounded-full border border-on-night/20 bg-night/40 px-3 py-1 text-xs font-semibold text-on-night-2 @lg:inline">
                    {it.status === 'Active' ? 'Active client' : 'Past client'}
                  </span>
                </header>

                <div className="reel-body">
                  <div className="min-w-0">
                    <p className={`flex items-center gap-2 font-display leading-none tracking-[-0.02em] ${it.growth ? 'text-coral-on-night' : 'text-on-night'} text-[clamp(2.75rem,14cqw,6.5rem)]`}>
                      {it.growth ? <TrendingUp className="size-[0.5em] flex-none" strokeWidth={2.5} aria-hidden="true" /> : null}
                      {it.value}
                    </p>
                    <p className="mt-2 text-base text-on-night-2 @lg:text-lg">{it.label}</p>
                  </div>
                  {it.bars ? <Bars bars={it.bars} /> : null}
                </div>

                <footer className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-t border-on-night/12 pt-4">
                  {it.extra ? (
                    <p className="text-sm text-on-night-2">
                      <span className="font-display text-xl text-on-night @lg:text-2xl">{it.extra.value}</span> {lc(it.extra.label)}
                    </p>
                  ) : null}
                  <p className="text-xs text-on-night-2">{it.date}</p>
                </footer>
              </article>
            ))}
          </div>
        </div>

        <div className="reel-caption wrap relative flex-col items-center text-center">
          {/* Phones keep only the buttons and the counter: the card itself links to the case. */}
          <span aria-hidden="true" className="relative block h-8 w-28 max-sm:hidden">
            <svg viewBox="0 0 112 32" className="absolute inset-0 h-full w-full">
              <path d={ARC} fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="1.5" />
            </svg>
            {/* The dot turns about the arc's centre on the reel's scroll timeline: a composited CSS transform. */}
            <span className="reel-dot absolute left-14 top-[4.375rem] size-0">
              <span className="absolute -left-[3.5px] -top-[69.5px] size-[7px] rounded-full bg-coral-on-night" />
            </span>
          </span>
          <div className="flex items-center gap-3 sm:mt-2">
            <button type="button" onClick={() => go(active - 1)} disabled={active === 0} className="grid size-11 place-items-center rounded-full border border-on-night/20 text-on-night transition-colors hover:border-on-night disabled:opacity-30" aria-label="Previous client">
              <ArrowLeft className="size-4" aria-hidden="true" />
            </button>
            <p className="min-w-[12rem] rounded-xl bg-night-2 px-5 py-2.5">
              <span className="block font-display text-lg leading-tight text-on-night sm:text-xl">{cur.client}</span>
              <span className="block text-xs tabular-nums text-on-night-2">{String(active + 1).padStart(2, '0')} / {String(n).padStart(2, '0')}</span>
            </p>
            <button type="button" onClick={() => go(active + 1)} disabled={active === n - 1} className="grid size-11 place-items-center rounded-full border border-on-night/20 text-on-night transition-colors hover:border-on-night disabled:opacity-30" aria-label="Next client">
              <ArrowRight className="size-4" aria-hidden="true" />
            </button>
          </div>
          <Link href={`/case-studies#${cur.id}`} className="mt-3 inline-flex min-h-6 items-center text-sm max-sm:hidden font-semibold text-coral-on-night underline decoration-coral-on-night/40 underline-offset-4 hover:decoration-coral-on-night">
            See the {cur.client} case <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
