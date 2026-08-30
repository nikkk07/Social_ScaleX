'use client';

import React, { useEffect, useRef, useState } from 'react';

interface AnimatedCounterProps {
  value: string;
  className?: string;
  /** Seconds. */
  duration?: number;
}

const EASE_OUT_EXPO = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

/**
 * Counts up to values like "9.3M+", "496K+", "4+", "14" when scrolled into
 * view, preserving any non-numeric prefix and suffix.
 *
 * Two things matter here beyond the animation:
 *
 *  - The initial render is the FINAL value, not zero. That is what gets
 *    server-rendered, so the real figure is in the HTML for anything reading
 *    it without running scripts; the count-up only replaces it after mount.
 *  - It uses a plain rAF loop and IntersectionObserver rather than a motion
 *    library. Framer Motion was the single largest dependency on the
 *    marketing pages and this was one of only two things using it.
 */
export function AnimatedCounter({
  value,
  className,
  duration = 1.8,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const match = value.match(/^([^0-9]*)([0-9]+(?:\.[0-9]+)?)(.*)$/);
    if (!match) return;
    const [, prefix = '', numStr = '', suffix = ''] = match;
    const target = parseFloat(numStr);
    const decimals = numStr.includes('.')
      ? (numStr.split('.')[1]?.length ?? 0)
      : 0;

    // Respect the OS setting: no count-up, just the number.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let frame = 0;
    let start = 0;

    const step = (now: number) => {
      if (!start) start = now;
      const t = Math.min((now - start) / (duration * 1000), 1);
      const current = target * EASE_OUT_EXPO(t);
      setDisplay(`${prefix}${current.toFixed(decimals)}${suffix}`);
      if (t < 1) frame = requestAnimationFrame(step);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        setDisplay(`${prefix}${(0).toFixed(decimals)}${suffix}`);
        frame = requestAnimationFrame(step);
      },
      { rootMargin: '-60px' },
    );
    observer.observe(el);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value, duration]);

  return (
    <span ref={ref} className={className} style={{ fontVariantNumeric: 'tabular-nums' }}>
      {display}
    </span>
  );
}
