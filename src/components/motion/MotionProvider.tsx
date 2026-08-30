'use client';

import { useEffect } from 'react';
import {
  MOTION_THRESHOLD,
  isPointerDevice,
  loadMotion,
  motionRequests,
  prefersReducedMotion,
} from '@/lib/motion';

/**
 * Boots the optional motion layer: Lenis smooth scroll on pointer devices,
 * and GSAP's ticker as the single rAF loop driving it.
 *
 * Deliberately renders nothing and provides no context. Components reach the
 * kit through `loadMotion()` themselves, which means no part of the tree
 * re-renders when motion becomes ready and no component can accidentally
 * depend on a provider being above it.
 *
 * Everything here is opt-out by default:
 *   - `prefers-reduced-motion: reduce` → nothing loads at all
 *   - touch / coarse pointer            → GSAP loads, Lenis does not
 *   - JS disabled or a chunk 404s       → the CSS layer already showed the
 *                                         content; nothing to degrade
 */
export function MotionProvider() {
  useEffect(() => {
    if (prefersReducedMotion()) return;

    let lenis: import('lenis').default | null = null;
    let tick: ((time: number) => void) | null = null;
    let cancelled = false;
    let gsapRef: Awaited<ReturnType<typeof loadMotion>> = null;

    // Deferred to idle: the motion layer must never compete with the LCP
    // paint or with hydration for bandwidth or main-thread time.
    //
    // requestIdleCallback is missing on Safari before 16.4, so there is a
    // setTimeout fallback. `usedIdle` records which branch ran — cancelling
    // must use the matching API, and branching a second time on
    // `cancelIdleCallback` could pick the wrong one and leak the callback.
    const usedIdle = typeof window.requestIdleCallback === 'function';
    const handle = usedIdle
      ? window.requestIdleCallback(boot, { timeout: 2000 })
      : window.setTimeout(boot, 400);

    async function boot() {
      // Nothing to enhance, or not enough asking. Either way, the CSS base
      // layer has already rendered every section correctly.
      if (motionRequests().size < MOTION_THRESHOLD) return;

      const kit = await loadMotion();
      if (!kit || cancelled) return;
      gsapRef = kit;

      const { gsap, ScrollTrigger } = kit;

      if (isPointerDevice()) {
        const Lenis = (await import('lenis')).default;
        if (cancelled) return;

        lenis = new Lenis({
          lerp: 0.09,
          // Native smooth-scroll must be off once Lenis owns the scroll, or
          // an anchor jump fights the interpolation and lands twice.
          smoothWheel: true,
          syncTouch: false,
        });
        document.documentElement.style.scrollBehavior = 'auto';

        lenis.on('scroll', ScrollTrigger.update);

        tick = (time: number) => lenis?.raf(time * 1000);
        gsap.ticker.add(tick);
      }

      // Fonts change metrics, which moves every trigger boundary. Recompute
      // once they land rather than pinning triggers to fallback-font layout.
      if (document.fonts?.ready) {
        void document.fonts.ready.then(() => {
          if (!cancelled) ScrollTrigger.refresh();
        });
      }
    }

    return () => {
      cancelled = true;
      if (usedIdle) window.cancelIdleCallback(handle);
      else window.clearTimeout(handle);

      if (tick && gsapRef) gsapRef.gsap.ticker.remove(tick);
      lenis?.destroy();
      document.documentElement.style.removeProperty('scroll-behavior');
      gsapRef?.ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  return null;
}
