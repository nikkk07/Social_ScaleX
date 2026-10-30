'use client';

import React, { useEffect, useRef, useState } from 'react';

/** 400 → "400", 13 100 → "13.1K": the same style the published figures use. */
function short(n: number): string {
  return n < 1000 ? String(Math.round(n)) : `${(n / 1000).toFixed(1)}K`;
}

/**
 * Counts from one real figure to another the first time it scrolls into
 * view. It only ever rests on `to`: the server renders `toText`, and the
 * values passed through on the way are never labelled or paused on. Screen
 * readers get the static sentence in `label`, not the moving digits.
 */
export function CountUp({ from, to, toText, label, className = '' }: { from: number; to: number; toText: string; label: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [text, setText] = useState(toText);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        const start = performance.now();
        const DURATION = 1600;
        const step = (now: number) => {
          const t = Math.min(1, (now - start) / DURATION);
          const eased = 1 - Math.pow(1 - t, 3);
          setText(t < 1 ? short(from + (to - from) * eased) : toText);
          if (t < 1) raf = requestAnimationFrame(step);
        };
        setText(short(from));
        raf = requestAnimationFrame(step);
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [from, to, toText]);

  return (
    <span className={className}>
      <span ref={ref} aria-hidden="true" className="tabular-nums">{text}</span>
      <span className="sr-only">{label}</span>
    </span>
  );
}
