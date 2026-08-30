// ─────────────────────────────────────────────────────────────────────
// Lazy loader for the motion layer.
//
// GSAP + ScrollTrigger + SplitText + Lenis measure 55.5 kB gzipped
// together. That is a third of the entire performance budget, for
// enhancement — so none of it is imported statically anywhere. This module
// is the only entry point, it resolves once, and it resolves to `null`
// whenever motion should not run at all.
//
// Callers must handle null. A component that breaks when this returns null
// has made motion load-bearing, which is the thing to avoid: the CSS
// `.reveal` / `.rise-in` layer is what makes content appear, always.
// ─────────────────────────────────────────────────────────────────────

export interface MotionKit {
  gsap: typeof import('gsap').gsap;
  ScrollTrigger: typeof import('gsap/ScrollTrigger').ScrollTrigger;
  SplitText: typeof import('gsap/SplitText').SplitText;
}

let kit: Promise<MotionKit | null> | null = null;

/**
 * Features that have asked for the motion layer this page load.
 *
 * 55.5 kB gzipped is not worth one effect, so the layer stays unloaded until
 * at least two independent features want it. This is a gate in code rather
 * than a rule in a document, because a rule in a document is one refactor
 * away from being forgotten.
 */
const requested = new Set<MotionFeature>();

export type MotionFeature = 'split-text' | 'scrub' | 'parallax';

/** How many distinct features must want the layer before it loads. */
export const MOTION_THRESHOLD = 2;

/**
 * Register interest in the motion layer and report whether it is warranted.
 *
 * Callers must handle `false` by doing nothing — their CSS base layer is
 * already carrying the effect, so "not loaded" degrades to "no enhancement",
 * never to "broken section".
 */
export function requestMotion(feature: MotionFeature): boolean {
  requested.add(feature);
  return requested.size >= MOTION_THRESHOLD;
}

/** Features registered so far — exported for the provider and for tests. */
export function motionRequests(): ReadonlySet<MotionFeature> {
  return requested;
}

/** True when the visitor has asked the OS for less motion. */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return true;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * True for mouse/trackpad pointers.
 *
 * Smooth scroll runs on these only. On touch it is left native: hijacking
 * momentum scrolling on a phone fights the platform, breaks scroll-locking
 * inside modals, and is the thing that got Lenis removed from this project
 * the first time.
 */
export function isPointerDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(pointer: fine)').matches;
}

/**
 * Resolve the motion kit, loading it on first call.
 *
 * This function does NO scheduling — it starts the import the moment it is
 * called. Deferring to idle (with a setTimeout fallback for Safari < 16.4)
 * is MotionProvider's job. Anything else calling this directly will fetch
 * immediately, so call it from an idle callback or an interaction, never
 * from a render or a mount effect on the critical path.
 *
 * Returns null under `prefers-reduced-motion: reduce` — the modules are
 * never even fetched in that case, so reduced motion is genuinely zero
 * JavaScript rather than animations with their durations set to zero.
 */
export function loadMotion(): Promise<MotionKit | null> {
  if (kit) return kit;

  kit = (async () => {
    if (typeof window === 'undefined' || prefersReducedMotion()) return null;

    // The threshold is checked here too, not only at the call site, so no
    // caller can bypass it by importing loadMotion directly.
    if (requested.size < MOTION_THRESHOLD) return null;

    const [{ gsap }, { ScrollTrigger }, { SplitText }] = await Promise.all([
      import('gsap'),
      import('gsap/ScrollTrigger'),
      import('gsap/SplitText'),
    ]);

    gsap.registerPlugin(ScrollTrigger, SplitText);

    // One ticker for everything. GSAP's rAF loop drives Lenis too (wired up
    // in MotionProvider), so the page never runs two independent loops
    // competing for the same frame.
    gsap.ticker.lagSmoothing(0);

    return { gsap, ScrollTrigger, SplitText };
  })();

  return kit;
}
