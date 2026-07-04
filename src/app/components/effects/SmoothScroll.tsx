import React, { useEffect } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";

/**
 * Buttery-smooth inertial scrolling via Lenis.
 * Disabled automatically when the user prefers reduced motion.
 */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // High lerp = minimal added latency: just enough inertia to feel
    // premium without the "page chasing the finger" lag of heavy
    // smoothing. macOS trackpads already smooth natively.
    const lenis = new Lenis({
      lerp: 0.22,
      smoothWheel: true,
      anchors: true,
    });

    let rafId: number;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
