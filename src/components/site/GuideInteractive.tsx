'use client';
import React, { useEffect, useId, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, CornerDownRight, Heart, MessageCircle, Send, Sparkles } from 'lucide-react';
import { Rich } from '@/components/site/Rich';
import type { DmDemoBlock, UseCasesBlock, WorkflowBlock } from '@/lib/guides';

// Interactive guide blocks. Each renders every piece of content into the
// server HTML (hidden panels use the `hidden` attribute, which crawlers still
// read); JavaScript only switches which one is shown.

/** Roving-focus tabs: arrow keys move, Home/End jump. Returns props for the tab list and each tab. */
function useTabs(count: number) {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const base = useId();
  const go = (i: number, focus = true) => {
    const n = (i + count) % count;
    setActive(n);
    const el = refs.current[n];
    if (focus) el?.focus();
    // Keep the chosen tab visible in a sideways-scrolling row, without moving the page.
    const row = el?.parentElement;
    if (el && row && row.scrollWidth > row.clientWidth) row.scrollTo({ left: el.offsetLeft - 16, behavior: 'smooth' });
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    const k = e.key;
    if (k === 'ArrowRight' || k === 'ArrowDown') { e.preventDefault(); go(active + 1); }
    else if (k === 'ArrowLeft' || k === 'ArrowUp') { e.preventDefault(); go(active - 1); }
    else if (k === 'Home') { e.preventDefault(); go(0); }
    else if (k === 'End') { e.preventDefault(); go(count - 1); }
  };
  const tab = (i: number) => ({
    ref: (el: HTMLButtonElement | null) => { refs.current[i] = el; },
    id: `${base}-tab-${i}`,
    role: 'tab' as const,
    type: 'button' as const,
    'aria-selected': i === active,
    'aria-controls': `${base}-panel-${i}`,
    tabIndex: i === active ? 0 : -1,
    onClick: () => go(i, false),
  });
  const panel = (i: number) => ({
    id: `${base}-panel-${i}`,
    role: 'tabpanel' as const,
    'aria-labelledby': `${base}-tab-${i}`,
    hidden: i !== active,
    tabIndex: 0,
  });
  return { active, go, onKeyDown, tab, panel };
}

/** How a tool works, one step at a time. */
export function Workflow({ b }: { b: WorkflowBlock }) {
  const { active, go, onKeyDown, tab, panel } = useTabs(b.steps.length);
  const last = b.steps.length - 1;
  return (
    <figure className="not-prose my-10 overflow-hidden rounded-card border border-line bg-surface shadow-lift">
      <div className="flex items-center justify-between gap-3 border-b border-line bg-paper-2 px-4 py-3 sm:px-6">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink-3">{b.label}</p>
        <p className="whitespace-nowrap text-xs font-semibold text-ink-3 tabular-nums" aria-hidden="true">{active + 1} / {b.steps.length}</p>
      </div>
      <div className="relative">
        <div role="tablist" aria-label={b.label} onKeyDown={onKeyDown} className="flex gap-2 overflow-x-auto px-4 pb-3 pt-4 [scrollbar-width:none] sm:flex-wrap sm:px-6 [&::-webkit-scrollbar]:hidden">
          {b.steps.map((s, i) => {
            const done = i < active;
            const on = i === active;
            return (
              <button
                key={s.title}
                {...tab(i)}
                className={`inline-flex min-h-11 flex-none items-center gap-2 rounded-full px-3.5 text-sm font-semibold transition-colors ${
                  on ? 'bg-ink text-paper' : done ? 'bg-positive/10 text-positive ring-1 ring-positive/30' : 'bg-paper-2 text-ink-2 ring-1 ring-line hover:ring-line-strong'
                }`}
              >
                <span aria-hidden="true" className={`grid size-5 place-items-center rounded-full text-[0.6875rem] tabular-nums ${on ? 'bg-coral text-white' : done ? 'bg-positive text-white' : 'bg-surface text-ink-3 ring-1 ring-line'}`}>
                  {done ? <Check className="size-3" strokeWidth={3} /> : i + 1}
                </span>
                {s.title}
              </button>
            );
          })}
        </div>
        <div aria-hidden="true" className="mx-4 h-1 overflow-hidden rounded-full bg-paper-2 sm:mx-6">
          <div className="h-full rounded-full bg-coral transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${((active + 1) / b.steps.length) * 100}%` }} />
        </div>
      </div>
      {b.steps.map((s, i) => (
        <div key={s.title} {...panel(i)} className="grid gap-5 px-4 py-6 outline-none sm:grid-cols-[auto_minmax(0,1fr)] sm:gap-8 sm:px-6 sm:py-8">
          <span aria-hidden="true" className="font-display text-7xl leading-none tracking-[-0.04em] text-coral sm:text-8xl">{String(i + 1).padStart(2, '0')}</span>
          <div>
            <p className="font-display text-3xl leading-tight text-ink">{s.title}</p>
            <p className="mt-2 text-lg text-ink-2"><Rich text={s.text} /></p>
            <ul className="mt-4 space-y-2">
              {s.points.map((pt) => (
                <li key={pt} className="flex gap-2.5 text-base text-ink-2">
                  <Check className="mt-1 size-4 flex-none text-positive" aria-hidden="true" />
                  <span><Rich text={pt} /></span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}
      <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-3 sm:px-6">
        <button type="button" onClick={() => go(active - 1, false)} disabled={active === 0} className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-ink-2 hover:text-ink disabled:opacity-40">
          <ArrowLeft className="size-4" aria-hidden="true" /> Back
        </button>
        <button type="button" onClick={() => go(active === last ? 0 : active + 1, false)} className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-ink px-4 text-sm font-semibold text-paper hover:opacity-90">
          {active === last ? 'Start again' : `Next: ${b.steps[active + 1]!.title}`} <ArrowRight className="size-4" aria-hidden="true" />
        </button>
      </div>
      <figcaption className="border-t border-line bg-paper-2 px-4 py-3 text-xs text-ink-3 sm:px-6"><Rich text={b.note} /></figcaption>
    </figure>
  );
}

/** Pick an industry, see one Reel it could make. */
export function UseCases({ b }: { b: UseCasesBlock }) {
  const { onKeyDown, tab, panel } = useTabs(b.items.length);
  return (
    <figure className="not-prose my-10">
      <figcaption className="text-xs font-bold uppercase tracking-[0.14em] text-ink-3">{b.label}</figcaption>
      <div role="tablist" aria-label={b.label} onKeyDown={onKeyDown} className="mt-3 flex flex-wrap gap-2">
        {b.items.map((x, i) => {
          const t = tab(i);
          return (
            <button
              key={x.name}
              {...t}
              className={`min-h-11 flex-none rounded-full px-4 text-sm font-semibold transition-colors ${t['aria-selected'] ? 'bg-coral-tint text-coral-text ring-2 ring-coral' : 'bg-surface text-ink-2 ring-1 ring-line hover:ring-line-strong'}`}
            >
              {x.name}
            </button>
          );
        })}
      </div>
      {b.items.map((x, i) => (
        <div key={x.name} {...panel(i)} className="mt-4 grid gap-4 rounded-card border border-line bg-surface p-4 outline-none sm:grid-cols-[13rem_minmax(0,1fr)] sm:gap-6 sm:p-6">
          {/* Phone-shaped preview of the sample Reel. */}
          <div aria-hidden="true" className="relative mx-auto flex aspect-[9/16] w-44 flex-col justify-between overflow-hidden rounded-[1.5rem] bg-night p-4 text-on-night ring-4 ring-ink sm:w-full">
            <div className="absolute inset-0 bg-[radial-gradient(120%_70%_at_100%_0%,rgb(224_70_43/0.45),transparent_60%),radial-gradient(90%_60%_at_0%_100%,rgb(30_107_69/0.35),transparent_60%)]" />
            <p className="relative text-[0.625rem] font-bold uppercase tracking-[0.14em] text-coral-on-night">Sample Reel</p>
            <p className="relative font-display text-xl leading-tight">{x.hook}</p>
            <div className="relative space-y-2">
              <p className="rounded-full bg-on-night/15 px-2.5 py-1 text-[0.6875rem] leading-snug">{x.cta}</p>
              <div className="flex gap-3 text-on-night-2"><Heart className="size-4" /><MessageCircle className="size-4" /><Send className="size-4" /></div>
            </div>
          </div>
          <dl className="grid content-start gap-3 text-base">
            {[
              ['Reel idea', x.idea],
              ['Opening line', x.hook],
              ['What’s on screen', x.visuals],
              ['Who it’s for', x.audience],
              ['Call to action', x.cta],
            ].map(([k, v]) => (
              <div key={k} className="border-b border-line pb-3 last:border-0 last:pb-0">
                <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-3">{k}</dt>
                <dd className="mt-1 text-ink">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
      <p className="mt-3 text-xs text-ink-3">{b.note}</p>
    </figure>
  );
}

/** Tap a comment, watch the automatic DM go out (or not). */
export function DmDemo({ b }: { b: DmDemoBlock }) {
  const [pick, setPick] = useState(0);
  const [stage, setStage] = useState(3); // 0 nothing, 1 comment, 2 checked, 3 reply
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const play = (i: number) => {
    timers.current.forEach(clearTimeout);
    setPick(i);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { setStage(3); return; }
    setStage(1);
    timers.current = [window.setTimeout(() => setStage(2), 650), window.setTimeout(() => setStage(3), 1400)];
  };
  const c = b.comments[pick]!;
  const match = c.reply !== '';
  const word = c.text.trim();
  return (
    <figure className="not-prose my-10 overflow-hidden rounded-card border border-line bg-surface shadow-lift">
      <div className="flex items-center gap-2 border-b border-line bg-paper-2 px-4 py-3 text-xs font-bold uppercase tracking-[0.14em] text-ink-3 sm:px-6">
        <Sparkles className="size-3.5 text-coral-text" aria-hidden="true" /> {b.label}
      </div>
      <div className="grid gap-6 p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:p-6">
        <div>
          <p className="text-sm font-semibold text-ink">Try a comment</p>
          <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Example comments">
            {b.comments.map((x, i) => (
              <button
                key={x.text}
                type="button"
                aria-pressed={i === pick}
                onClick={() => play(i)}
                className={`min-h-11 rounded-full px-4 text-sm font-semibold transition-colors ${i === pick ? 'bg-ink text-paper' : 'bg-paper-2 text-ink ring-1 ring-line hover:ring-line-strong'}`}
              >
                “{x.text}”
              </button>
            ))}
          </div>
          <p className="mt-5 text-sm text-ink-2"><Rich text={b.note} /></p>
        </div>

        {/* The phone. */}
        <div className="rounded-[1.75rem] bg-ink p-2.5">
          <div className="rounded-[1.35rem] bg-surface p-4">
            <p className="text-xs text-ink-3"><span className="font-semibold text-ink">@{b.account}</span> · Reel</p>
            <p className="mt-1 text-sm text-ink">{b.reel}</p>
            <div aria-live="polite" className="mt-4 min-h-[13rem] space-y-3">
              {stage >= 1 ? (
                <p className="flex items-start gap-2 text-sm motion-safe:animate-[fade-up_300ms_ease-out]">
                  <span aria-hidden="true" className="grid size-7 flex-none place-items-center rounded-full bg-coral-tint text-xs font-bold text-coral-text">{b.commenter.slice(0, 1).toUpperCase()}</span>
                  <span><span className="font-semibold text-ink">{b.commenter}</span> <span className="text-ink-2">{c.text}</span><span className="sr-only"> (comment)</span></span>
                </p>
              ) : null}
              {stage >= 2 ? (
                <p className={`ml-9 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold motion-safe:animate-[fade-up_300ms_ease-out] ${match ? 'bg-positive/10 text-positive' : 'bg-paper-2 text-ink-3'}`}>
                  {match ? <Check className="size-3.5" aria-hidden="true" /> : <CornerDownRight className="size-3.5" aria-hidden="true" />}
                  {match ? `Trigger word “${word}” found` : 'No trigger word, so no DM'}
                </p>
              ) : null}
              {stage >= 3 && match ? (
                <div className="motion-safe:animate-[fade-up_300ms_ease-out]">
                  <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-ink-3">Direct message from @{b.account}</p>
                  <p className="mt-1.5 max-w-[92%] rounded-2xl rounded-tl-md bg-paper-2 px-3.5 py-2.5 text-sm text-ink">{c.reply}</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </figure>
  );
}
