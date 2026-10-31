'use client';

import { useEffect } from 'react';

/** Cards that tilt toward the pointer, with a glare that follows it. */
const TILT = '[data-tilt], .card-link, .room-tile, .engine-stage, .tilt-card';
/** Buttons that lean a few pixels toward the pointer. */
const MAGNET = '[data-magnetic]';

/**
 * 3D hover for the whole site from one pointer listener. Only for a real
 * hovering pointer (mouse, trackpad, pen) and never under reduced motion.
 * Writes happen once per frame, to the one element under the pointer, using
 * transforms only, so hover never causes layout work.
 */
export function TiltLayer() {
  useEffect(() => {
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!fine.matches || reduce.matches) return;

    let el: HTMLElement | null = null;
    let kind: 'tilt' | 'magnet' = 'tilt';
    let rect: DOMRect | null = null;
    let x = 0;
    let y = 0;
    let raf = 0;

    const reset = (node: HTMLElement) => {
      node.style.transition = 'transform 450ms cubic-bezier(.2,.8,.2,1), box-shadow 300ms ease, border-color 200ms ease';
      node.style.transform = '';
      node.classList.remove('is-tilting');
    };

    const write = () => {
      raf = 0;
      if (!el || !rect) return;
      const px = (x - rect.left) / rect.width; // 0..1
      const py = (y - rect.top) / rect.height;
      if (kind === 'magnet') {
        el.style.transform = `translate3d(${((px - 0.5) * 10).toFixed(2)}px, ${((py - 0.5) * 8).toFixed(2)}px, 0)`;
        return;
      }
      // Larger cards tilt less, so a wide card never swings.
      const max = Math.max(3, Math.min(9, 2400 / Math.max(rect.width, 1)));
      const ry = (px - 0.5) * 2 * max;
      const rx = -(py - 0.5) * 2 * max;
      el.style.transform = `perspective(900px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translate3d(0,-4px,0)`;
      el.style.setProperty('--gx', `${(px * 100).toFixed(1)}%`);
      el.style.setProperty('--gy', `${(py * 100).toFixed(1)}%`);
    };

    const onMove = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      const target = (e.target as Element | null)?.closest<HTMLElement>(`${MAGNET}, ${TILT}`) ?? null;
      if (target !== el) {
        if (el) reset(el);
        el = target;
        if (el) {
          kind = el.matches(MAGNET) ? 'magnet' : 'tilt';
          rect = el.getBoundingClientRect(); // once per element entered, not per move
          el.style.transition = 'transform 120ms linear, box-shadow 300ms ease, border-color 200ms ease';
          if (kind === 'tilt') el.classList.add('is-tilting', 'tilt-glare');
        }
      }
      if (el && !raf) raf = requestAnimationFrame(write);
    };
    // Scrolling moves the card under a still pointer: re-measure on scroll end.
    const onScroll = () => {
      if (el) rect = el.getBoundingClientRect();
    };
    const onLeave = () => {
      if (el) reset(el);
      el = null;
    };

    document.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerleave', onLeave);
    window.addEventListener('scrollend', onScroll, { passive: true });
    return () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('scrollend', onScroll);
      if (raf) cancelAnimationFrame(raf);
      if (el) reset(el);
    };
  }, []);
  return null;
}
