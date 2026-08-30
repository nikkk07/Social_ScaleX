import React from 'react';

/**
 * The hero's ambient layer. Server component, zero JavaScript, zero 3D
 * (standing decision 02 — nothing heavy goes near the LCP element).
 *
 * Three layers, cheapest first:
 *   1. Two large radial washes on the growth axis, violet into cyan.
 *   2. An SVG ascending-bars motif — the growth metaphor stated quietly,
 *      as geometry rather than as another gradient.
 *   3. A vignette to hold contrast under the headline.
 *
 * Everything is painted once and then composited. The only thing that moves
 * is a scroll-driven `transform` (`.atmo-drift`), which runs off the
 * compositor and is skipped entirely under reduced motion.
 */
export function HeroAtmosphere() {
  return (
    <div
      className="absolute inset-0 -z-10 overflow-hidden pointer-events-none"
      aria-hidden
    >
      {/* Violet wash, upper left — the start of the growth gradient. */}
      <div
        className="atmo-layer atmo-drift absolute inset-0"
        style={{
          background:
            'radial-gradient(58vw 58vw at 8% -12%, rgba(139,92,246,0.26), transparent 62%)',
        }}
      />
      {/* Cyan wash, lower right — its end, and the CTA colour. */}
      <div
        className="atmo-layer atmo-drift absolute inset-0"
        style={{
          animationDirection: 'reverse',
          background:
            'radial-gradient(52vw 52vw at 96% 104%, rgba(34,211,238,0.16), transparent 64%)',
        }}
      />

      {/*
        Ascending bars. An SMMA hero should say "growth" with its geometry,
        not only its copy. Drawn as rects rather than a gradient so it reads
        as data rather than decoration, and kept faint enough that it never
        competes with the headline for contrast.
      */}
      <svg
        className="atmo-layer absolute right-0 bottom-0 h-[52%] w-full max-w-3xl opacity-[0.16]"
        viewBox="0 0 400 200"
        preserveAspectRatio="xMaxYMax slice"
        fill="none"
      >
        <defs>
          <linearGradient id="hero-bars" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0" />
            <stop offset="55%" stopColor="#8B5CF6" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#22D3EE" stopOpacity="1" />
          </linearGradient>
          <linearGradient id="hero-trend" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#22D3EE" stopOpacity="0" />
            <stop offset="100%" stopColor="#22D3EE" stopOpacity="0.9" />
          </linearGradient>
        </defs>

        {[
          [40, 46],
          [80, 62],
          [120, 58],
          [160, 84],
          [200, 96],
          [240, 92],
          [280, 124],
          [320, 148],
          [360, 178],
        ].map(([x, h]) => (
          <rect
            key={x}
            x={x}
            y={200 - (h ?? 0)}
            width="18"
            height={h}
            rx="4"
            fill="url(#hero-bars)"
          />
        ))}

        {/* The trend line through the bar tops. */}
        <path
          d="M49 154 L89 138 L129 142 L169 116 L209 104 L249 108 L289 76 L329 52 L369 22"
          stroke="url(#hero-trend)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* Vignette — softens the edges and holds contrast under body copy. */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_42%,rgba(5,5,8,0.72)_100%)]" />
    </div>
  );
}
