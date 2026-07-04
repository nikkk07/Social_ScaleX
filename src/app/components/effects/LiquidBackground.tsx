import React, { Suspense, lazy, useEffect, useState } from "react";
import { motion } from "motion/react";

// Three.js + R3F are heavy — split them out so first paint is instant.
const LiquidCanvas = lazy(() => import("./LiquidScene"));

/**
 * Fixed full-viewport 3D background: floating liquid glass shapes with
 * real refraction, chromatic aberration and cursor/scroll parallax.
 * Falls back to a static aurora gradient when the user prefers reduced
 * motion or WebGL is unavailable; the WebGL layer fades in on load.
 */
export function LiquidBackground() {
  const [mode, setMode] = useState<"full" | "low" | "static">("static");

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
    if (!gl) return;

    setMode(window.innerWidth < 768 ? "low" : "full");
  }, []);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden>
      {/* Deep space base + aurora wash (also the reduced-motion fallback) */}
      <div className="absolute inset-0 bg-[var(--color-void-black)]" />
      <div className="absolute inset-0 opacity-70">
        <div className="absolute top-[-10%] left-[10%] w-[45vw] h-[45vw] rounded-full bg-[var(--color-violet)]/25 blur-[140px] animate-float-slow" />
        <div className="absolute bottom-[-15%] right-[5%] w-[40vw] h-[40vw] rounded-full bg-[var(--color-emerald)]/14 blur-[140px] animate-float-slow [animation-delay:-5s]" />
        <div className="absolute top-[30%] right-[25%] w-[30vw] h-[30vw] rounded-full bg-[var(--color-cyan)]/10 blur-[120px] animate-float-slow [animation-delay:-9s]" />
      </div>

      {mode !== "static" && (
        <Suspense fallback={null}>
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.6, ease: "easeOut" }}
          >
            <LiquidCanvas low={mode === "low"} />
          </motion.div>
        </Suspense>
      )}

      {/* Vignette to keep text legible over the scene */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(5,5,8,0.55)_100%)]" />
    </div>
  );
}
