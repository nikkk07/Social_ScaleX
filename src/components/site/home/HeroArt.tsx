import React from 'react';

const FILLS = ['var(--color-night-2)', 'var(--color-coral)', 'var(--color-paper-2)', 'var(--color-positive)', 'var(--color-coral-on-night)'];

/**
 * Still version of the hero feed: Reel cards stacked on a vertical spiral,
 * the front one largest. Server-rendered; it is what crawlers, no-JS,
 * reduced-motion and low-power visitors see, and what shows until the 3D
 * feed takes over.
 */
export function HeroArt({ className = '' }: { className?: string }) {
  const cards = [-2, -1, 1, 2, 0].map((k) => {
    const s = 1 - Math.abs(k) * 0.16;
    return { k, x: 240 + Math.sin(k * 0.6) * 150, y: 300 + k * 128, s, o: 1 - Math.abs(k) * 0.3 };
  });
  return (
    <svg viewBox="0 0 480 600" className={className} aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="hero-glow">
          <stop offset="0" stopColor="var(--color-coral-on-night)" stopOpacity="0.35" />
          <stop offset="1" stopColor="var(--color-coral-on-night)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="240" cy="300" r="230" fill="url(#hero-glow)" />
      {cards.map((c) => (
        <g key={c.k} transform={`translate(${c.x.toFixed(1)} ${c.y}) scale(${c.s.toFixed(2)})`} opacity={c.o.toFixed(2)}>
          <rect x="-80" y="-142" width="160" height="284" rx="14" fill={FILLS[(c.k + 5) % FILLS.length]} stroke="var(--color-on-night)" strokeOpacity="0.12" />
          <circle cx="0" cy="0" r="17" fill="var(--color-paper)" fillOpacity="0.9" />
          <path d="M-6 -9 L10 0 L-6 9 Z" fill="var(--color-ink)" />
          <rect x="-64" y="104" width="86" height="7" rx="3.5" fill="var(--color-on-night)" fillOpacity="0.35" />
          <rect x="-80" y="138" width="160" height="4" fill="var(--color-coral)" />
        </g>
      ))}
    </svg>
  );
}
