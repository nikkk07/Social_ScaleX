import React from 'react';

const FILLS = ['var(--color-coral)', 'var(--color-paper-2)', 'var(--color-positive)', 'var(--color-coral-on-night)'];

/**
 * Still version of the hero scene: the logo mark inside a tilted ring of
 * abstract Reel cards. Server-rendered; it is what crawlers, no-JS,
 * reduced-motion and low-power visitors see, and what shows until the 3D
 * scene takes over.
 */
export function HeroArt({ className = '' }: { className?: string }) {
  const cards = Array.from({ length: 10 }, (_, i) => {
    const a = (i / 10) * Math.PI * 2 + 0.3;
    const depth = (Math.cos(a) + 1) / 2; // 1 = nearest
    const s = 0.55 + depth * 0.5;
    return { i, x: 300 + Math.sin(a) * 230, y: 300 + Math.cos(a) * 70 - Math.sin(a) * 40, s, depth };
  }).sort((p, q) => p.depth - q.depth);
  const back = cards.filter((c) => c.depth < 0.5);
  const front = cards.filter((c) => c.depth >= 0.5);
  const card = (c: (typeof cards)[number]) => (
    <g key={c.i} transform={`translate(${c.x.toFixed(1)} ${c.y.toFixed(1)}) scale(${c.s.toFixed(3)})`} opacity={(0.35 + c.depth * 0.65).toFixed(2)}>
      <rect x="-32" y="-57" width="64" height="114" rx="9" fill={FILLS[c.i % FILLS.length]} />
      <circle cx="0" cy="0" r="9" fill="var(--color-paper)" fillOpacity="0.9" />
      <path d="M-3 -5 L6 0 L-3 5 Z" fill="var(--color-ink)" />
      <rect x="-24" y="40" width="34" height="4" rx="2" fill="var(--color-ink)" fillOpacity="0.5" />
    </g>
  );
  return (
    <svg viewBox="0 0 600 600" className={className} aria-hidden="true" focusable="false">
      {back.map(card)}
      <image href="/logo.png" x="170" y="170" width="260" height="260" />
      {front.map(card)}
    </svg>
  );
}
