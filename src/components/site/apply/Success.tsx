'use client';
// The moment after someone applies: a short celebration (a coral seal stamps in, a tick draws itself, confetti in
// the brand colours bursts once), then the facts they need: a reference, what happens next, and a way to apply again.
// Pure CSS, ~0 KB of library; with reduced motion everything is simply there. Focus moves to the heading for screen readers.
import React, { useEffect, useRef } from 'react';
import { ArrowRight } from 'lucide-react';

const COLORS = ['#C23A22', '#16140F', '#E8A33D', '#C23A22', '#2F7D5B', '#E8A33D'];

export function Success({ title, lede, reference, steps, againLabel, onAgain, againHref, footnote }: {
  title: string; lede: string; reference?: string; steps: { title: string; text: string }[]; againLabel: string; onAgain?: () => void; againHref?: string; footnote?: string;
}) {
  const h = useRef<HTMLHeadingElement>(null);
  useEffect(() => { h.current?.focus(); }, []);
  return (
    <div role="status" className="apply-done relative overflow-hidden py-6 text-center sm:px-6 sm:py-8">
      <div className="relative mx-auto size-24" aria-hidden>
        {Array.from({ length: 16 }, (_, i) => (
          <span key={i} className="confetti" style={{ '--a': `${(360 / 16) * i}deg`, '--d': `${70 + (i % 3) * 22}px`, '--c': COLORS[i % COLORS.length], '--t': `${(i % 4) * 40}ms` } as React.CSSProperties} />
        ))}
        <span className="ring" />
        <svg viewBox="0 0 96 96" className="seal relative size-24">
          <circle cx="48" cy="48" r="44" fill="#C23A22" />
          <circle cx="48" cy="48" r="36" fill="none" stroke="#FAF8F4" strokeOpacity=".35" strokeWidth="1.5" strokeDasharray="2 5" />
          <path className="tick" d="M30 49.5 42.5 62 67 36" fill="none" stroke="#FAF8F4" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <p className="rise mt-7 text-xs font-semibold uppercase tracking-[0.16em] text-coral-text" style={{ '--t': '420ms' } as React.CSSProperties}>Best wishes from Social ScaleX</p>
      <h2 ref={h} tabIndex={-1} className="rise mt-3 font-display text-3xl text-ink outline-none sm:text-4xl" style={{ '--t': '480ms' } as React.CSSProperties}>{title}</h2>
      <p className="rise mx-auto mt-3 max-w-xl text-ink-2" style={{ '--t': '540ms' } as React.CSSProperties}>{lede}</p>
      {reference ? (
        <p className="rise mt-5 inline-flex items-center gap-2 rounded-full border border-line bg-paper px-4 py-2 text-sm text-ink-2" style={{ '--t': '600ms' } as React.CSSProperties}>
          Reference <span className="num font-semibold tracking-wider text-ink">{reference}</span>
        </p>
      ) : null}
      <ol className="rise mx-auto mt-8 grid max-w-2xl gap-3 text-left sm:grid-cols-3" style={{ '--t': '680ms' } as React.CSSProperties}>
        {steps.map((s, i) => (
          <li key={s.title} className="rounded-2xl border border-line bg-paper p-4">
            <span className="font-display text-xl text-coral-text">{i + 1}</span>
            <p className="mt-1 font-semibold text-ink">{s.title}</p>
            <p className="mt-1 text-sm text-ink-2">{s.text}</p>
          </li>
        ))}
      </ol>
      <div className="rise mt-8" style={{ '--t': '760ms' } as React.CSSProperties}>
        {againHref ? <a href={againHref} className="link inline-flex items-center gap-1.5 font-semibold">{againLabel}<ArrowRight className="size-4" aria-hidden /></a>
          : <button type="button" onClick={onAgain} className="link inline-flex items-center gap-1.5 font-semibold">{againLabel}<ArrowRight className="size-4" aria-hidden /></button>}
        {footnote ? <p className="mx-auto mt-4 max-w-lg text-xs text-ink-3">{footnote}</p> : null}
      </div>
      <style>{`
        .apply-done .seal{animation:seal .6s cubic-bezier(.2,1.4,.4,1) both}
        .apply-done .tick{stroke-dasharray:60;stroke-dashoffset:60;animation:tick .45s .35s cubic-bezier(.6,0,.2,1) forwards}
        .apply-done .ring{position:absolute;inset:0;border-radius:9999px;border:2px solid #C23A22;opacity:0;animation:ring .9s .15s ease-out}
        .apply-done .confetti{position:absolute;left:50%;top:50%;width:8px;height:12px;margin:-6px -4px;border-radius:2px;background:var(--c);opacity:0;
          transform:rotate(var(--a)) translateY(0) scale(.4);animation:burst 1.1s calc(.25s + var(--t)) cubic-bezier(.15,.7,.3,1) both}
        .apply-done .rise{animation:rise .5s var(--t,0ms) cubic-bezier(.2,.7,.2,1) both}
        @keyframes seal{0%{transform:scale(.3) rotate(-25deg);opacity:0}100%{transform:none;opacity:1}}
        @keyframes tick{to{stroke-dashoffset:0}}
        @keyframes ring{0%{transform:scale(.9);opacity:.6}100%{transform:scale(1.9);opacity:0}}
        @keyframes burst{0%{opacity:1;transform:rotate(var(--a)) translateY(0) scale(.4)}70%{opacity:1}100%{opacity:0;transform:rotate(var(--a)) translateY(calc(var(--d) * -1)) rotate(200deg) scale(1)}}
        @keyframes rise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
        @media (prefers-reduced-motion:reduce){.apply-done *{animation:none!important}.apply-done .tick{stroke-dashoffset:0}.apply-done .confetti,.apply-done .ring{display:none}}
      `}</style>
    </div>
  );
}
