/**
 * One requestAnimationFrame loop for the whole page. Smooth scrolling runs
 * first in each frame, then every 3D scene, so a scene never reads a scroll
 * position that is a frame old. The loop stops when nothing is subscribed.
 */
type FrameFn = (time: number) => void;

const early = new Set<FrameFn>();
const late = new Set<FrameFn>();
let raf = 0;

function tick(time: number) {
  raf = early.size || late.size ? requestAnimationFrame(tick) : 0;
  early.forEach((fn) => fn(time));
  late.forEach((fn) => fn(time));
}

/** Subscribe to every frame. `priority: 'early'` is reserved for the scroller. Returns an unsubscribe. */
export function onFrame(fn: FrameFn, priority: 'early' | 'late' = 'late'): () => void {
  (priority === 'early' ? early : late).add(fn);
  if (!raf) raf = requestAnimationFrame(tick);
  return () => {
    early.delete(fn);
    late.delete(fn);
  };
}

/** Scroll velocity in px per frame, published by the smooth scroller (0 without it). */
export const scrollState = { velocity: 0 };

/**
 * An element's position in the document, measured only when layout changes
 * (resize, fonts, images), never per frame. Per-frame code reads `scrollY`
 * against it, which costs no layout work while scrolling.
 */
export function trackElement(el: HTMLElement) {
  const box = { top: 0, left: 0, height: 0 };
  const measure = () => {
    const r = el.getBoundingClientRect();
    box.top = r.top + window.scrollY;
    box.left = r.left + window.scrollX;
    box.height = r.height;
  };
  measure();
  const ro = new ResizeObserver(measure);
  ro.observe(el);
  ro.observe(document.body);
  return {
    box,
    /** Viewport-relative top, like getBoundingClientRect().top. */
    top: () => box.top - window.scrollY,
    dispose: () => ro.disconnect(),
  };
}
