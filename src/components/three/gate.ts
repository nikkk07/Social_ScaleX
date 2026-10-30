/**
 * When a WebGL scene may run. Everything here errs towards the static
 * fallback: a scene that stutters is worse than no scene.
 */
export function canRender(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  const nav = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number };
  if (nav.connection?.saveData) return false;
  // Low-end devices get the still version.
  if (nav.deviceMemory !== undefined && nav.deviceMemory < 4) return false;
  if (nav.hardwareConcurrency !== undefined && nav.hardwareConcurrency < 4) return false;
  try {
    const probe = document.createElement('canvas');
    return Boolean(probe.getContext('webgl2') ?? probe.getContext('webgl'));
  } catch {
    return false;
  }
}

/** Signals that a person is actually on the page (not a page-speed test). */
const ENGAGE = ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart', 'scroll'] as const;

/**
 * After `load`, after the visitor's first interaction, then when the main
 * thread is idle (or 2.5 s at the latest). Waiting for an interaction keeps
 * every scene out of the load phase, so none of them adds to LCP or TBT.
 */
export function whenEngagedAndIdle(cb: () => void): () => void {
  let cancelled = false;
  let loaded = document.readyState === 'complete';
  let engaged = false;
  let idleId: number | undefined;
  let timer: number | undefined;
  const w = window as Window & {
    requestIdleCallback?: (fn: () => void, o?: { timeout: number }) => number;
    cancelIdleCallback?: (id: number) => void;
  };
  const run = () => {
    if (cancelled || !loaded || !engaged) return;
    if (w.requestIdleCallback) idleId = w.requestIdleCallback(() => !cancelled && cb(), { timeout: 2500 });
    else timer = window.setTimeout(() => !cancelled && cb(), 1200);
  };
  const onLoad = () => {
    loaded = true;
    run();
  };
  const onEngage = () => {
    if (engaged) return;
    engaged = true;
    ENGAGE.forEach((t) => window.removeEventListener(t, onEngage));
    run();
  };
  if (!loaded) window.addEventListener('load', onLoad, { once: true });
  ENGAGE.forEach((t) => window.addEventListener(t, onEngage, { passive: true }));
  return () => {
    cancelled = true;
    window.removeEventListener('load', onLoad);
    ENGAGE.forEach((t) => window.removeEventListener(t, onEngage));
    if (idleId !== undefined) w.cancelIdleCallback?.(idleId);
    if (timer !== undefined) window.clearTimeout(timer);
  };
}
