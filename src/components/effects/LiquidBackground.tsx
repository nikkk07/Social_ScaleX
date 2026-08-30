import React from "react";

/**
 * Static, GPU-cheap page background: void-black base with two large,
 * soft violet/emerald radial glows and a vignette to keep text legible.
 *
 * The previous WebGL implementation (three.js / R3F, ~888 kB) was removed
 * in the minimal-glass redesign: glass reads as premium only when the
 * surroundings are calm, and a canvas repainting every frame is the
 * opposite of calm (and hostile to CRM data tables). Painted once, then
 * composited — zero per-frame cost. Amber and cyan are retired from the
 * marketing palette here; violet is the single accent, emerald the
 * growth colour.
 */
export function LiquidBackground() {
  return (
    <div
      className="fixed inset-0 z-0 pointer-events-none bg-[var(--color-void-black)]"
      aria-hidden
    >
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(55vw 55vw at 12% -8%, rgba(139, 92, 246, 0.20), transparent 60%),
            radial-gradient(50vw 50vw at 96% 108%, rgba(52, 211, 153, 0.10), transparent 62%)
          `,
        }}
      />
      {/* Vignette — softens the edges, holds contrast under body copy */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(5,5,8,0.6)_100%)]" />
    </div>
  );
}
