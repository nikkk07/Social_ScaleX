'use client';

import { useEffect } from 'react';
import { onFrame, scrollState } from './frame';

/**
 * Smooth wheel scrolling (Lenis) on the public site. Touch keeps the
 * device's own native scrolling, which is already smooth and which people
 * expect. Off entirely for anyone who asks for reduced motion. Loaded after
 * the page is interactive, so it costs nothing at load.
 */
export function SmoothScroll() {
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) return;
    let stop: (() => void) | undefined;
    let cancelled = false;

    import('lenis').then(({ default: Lenis }) => {
      if (cancelled) return;
      const lenis = new Lenis({
        lerp: 0.11,
        smoothWheel: true,
        anchors: { offset: -80 },
        // The header is sticky; anchored sections already carry scroll-margin.
        prevent: (node) => node.hasAttribute('data-lenis-prevent'),
      });
      const unsub = onFrame((t) => {
        lenis.raf(t);
        scrollState.velocity = lenis.velocity;
      }, 'early');
      const onMotion = () => mq.matches && stop?.();
      mq.addEventListener('change', onMotion);
      stop = () => {
        unsub();
        mq.removeEventListener('change', onMotion);
        lenis.destroy();
        scrollState.velocity = 0;
      };
    });

    return () => {
      cancelled = true;
      stop?.();
    };
  }, []);
  return null;
}
