import React from 'react';
import Link from 'next/link';
import { ArrowRight, Check, TrendingUp } from 'lucide-react';
import { WhatsappIcon } from '@/components/icons/WhatsappIcon';
import { ThreeStage } from '@/components/three/ThreeStage';
import { HERO, PORTFOLIO, RESULTS_AS_OF, growthChange, type PortfolioItem } from '@/lib/content';
import { formatDay } from '@/lib/dates';
import { whatsappLink } from '@/lib/site';
import { HeroArt } from './HeroArt';
import { reelItems } from './reelItems';

const asOf = (p: PortfolioItem) => formatDay(p.asOf ?? RESULTS_AS_OF);

/** Real figures only, each with its own capture date. */
function heroFigures() {
  const saini = PORTFOLIO.find((p) => p.id === 'saini-telecom');
  const prago = PORTFOLIO.find((p) => p.id === 'prago');
  const cards: { id: string; href: string; client: string; value: string; label: string; date: string; growth?: boolean }[] = [];
  if (saini?.metrics[0]) cards.push({ id: 'saini-views', href: saini.id, client: saini.client, value: saini.metrics[0].value, label: saini.metrics[0].label, date: asOf(saini) });
  if (prago?.metrics[0]) cards.push({ id: 'prago-views', href: prago.id, client: prago.client, value: prago.metrics[0].value, label: prago.metrics[0].label, date: asOf(prago) });
  const g = saini?.growth[0];
  if (saini && g) cards.push({ id: 'saini-growth', href: saini.id, client: saini.client, value: growthChange(g), label: `${g.fromText} → ${g.toText} followers since June`, date: asOf(saini), growth: true });
  return cards;
}

/**
 * Section 1. A night band so the mark (whose paper bar is drawn for a dark
 * ground) sits in its own colours. All words are server-rendered HTML; the
 * WebGL scene is decoration beside them.
 */
export function HeroSection() {
  const figures = heroFigures();
  return (
    <section aria-labelledby="hero-title" className="hero-pin relative overflow-x-clip bg-night text-on-night">
      <div className="hero-sticky">
        {/* One scene: the 3D feed is the whole hero's background, not a box beside the text. */}
        <div className="hero-stage-mask absolute inset-0">
          <ThreeStage scene="feed" data={reelItems()} className="h-full w-full">
            <div className="absolute inset-y-0 right-0 hidden w-[55%] lg:block">
              <HeroArt className="h-full w-full" />
            </div>
            <div className="absolute inset-x-0 bottom-0 h-[34rem] lg:hidden">
              <HeroArt className="h-full w-full" />
            </div>
          </ThreeStage>
        </div>
        {/* Keeps the words readable where cards pass behind them. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,var(--color-night)_40%,transparent_75%)] lg:bg-[linear-gradient(to_right,var(--color-night)_34%,color-mix(in_srgb,var(--color-night)_70%,transparent)_48%,transparent_64%)]" />

        <div className="wrap relative grid grid-cols-1 items-center pb-[30rem] pt-12 sm:pt-16 lg:h-full lg:min-h-[calc(100svh-4.25rem)] lg:grid-cols-[1.05fr_1fr] lg:py-6">
          <div className="relative z-10">
            <h1 id="hero-title">
              <span className="eyebrow text-coral-on-night">{HERO.eyebrow}</span>
              <span className="mt-5 block text-[clamp(3rem,2.2rem+3.4vw,4.75rem)] leading-[1.0] text-on-night">{HERO.line}</span>
            </h1>
            <p className="mt-6 max-w-xl text-base text-on-night-2 sm:text-lg">{HERO.lede}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="#get-started" data-magnetic className="btn btn-primary btn-lg">
                Book a free strategy call <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <a href={whatsappLink('Hi Social ScaleX, I’d like to grow my brand on Instagram.')} target="_blank" rel="noopener noreferrer" data-magnetic className="btn btn-night-ghost btn-lg">
                <WhatsappIcon size={18} /> Chat on WhatsApp
              </a>
            </div>
            <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm text-on-night-2">
              {HERO.checks.map((t) => (
                <li key={t} className="inline-flex items-center gap-2">
                  <Check className="size-4 text-coral-on-night" aria-hidden="true" /> {t}
                </li>
              ))}
            </ul>
            <ul className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {figures.map((f) => (
                <li key={f.id}>
                  <Link href={`/case-studies#${f.href}`} data-tilt className="hero-chip block h-full rounded-2xl border border-on-night/12 bg-night-2/70 p-4 backdrop-blur-[2px]">
                    <span className="flex items-center gap-1.5 font-display text-3xl leading-none text-on-night">
                      {f.growth ? <TrendingUp className="size-5 text-coral-on-night" aria-hidden="true" /> : null}
                      {f.value}
                    </span>
                    <span className="mt-1.5 block text-xs text-on-night-2">{f.label}</span>
                    <span className="mt-1 block text-[11px] text-on-night-2/80">{f.client} · as of {f.date}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Scroll cue: the feed moves with the page, like a thumb on a phone. */}
        <p aria-hidden="true" className="hero-cue pointer-events-none absolute bottom-6 right-8 z-10 hidden items-center gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-on-night-2 lg:flex">
          Scroll the feed
          <span className="relative block h-10 w-px bg-on-night/20"><span className="hero-cue-dot absolute -left-[3px] top-0 size-[7px] rounded-full bg-coral-on-night" /></span>
        </p>
      </div>
    </section>
  );
}
