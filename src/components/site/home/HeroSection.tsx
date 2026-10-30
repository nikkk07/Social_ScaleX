import React from 'react';
import Link from 'next/link';
import { ArrowRight, Check, TrendingUp } from 'lucide-react';
import { WhatsappIcon } from '@/components/icons/WhatsappIcon';
import { ThreeStage } from '@/components/three/ThreeStage';
import { HERO, PORTFOLIO, RESULTS_AS_OF, growthChange, type PortfolioItem } from '@/lib/content';
import { formatDay } from '@/lib/dates';
import { whatsappLink } from '@/lib/site';
import { HeroArt } from './HeroArt';

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
    <section aria-labelledby="hero-title" className="relative overflow-hidden bg-night text-on-night">
      <div aria-hidden="true" className="pointer-events-none absolute -right-40 top-1/4 size-[42rem] rounded-full bg-[radial-gradient(closest-side,rgba(224,70,43,0.14),transparent)]" />
      <div className="wrap relative grid grid-cols-1 items-center gap-8 pb-16 pt-12 sm:pt-16 lg:min-h-[calc(100svh-4.25rem)] lg:grid-cols-[1.05fr_1fr] lg:gap-4 lg:pb-20 lg:pt-12">
        <div className="relative z-10">
          <h1 id="hero-title">
            <span className="eyebrow text-coral-on-night">{HERO.eyebrow}</span>
            <span className="mt-5 block text-[clamp(3rem,2.2rem+3.4vw,5.5rem)] leading-[1.0] text-on-night">{HERO.line}</span>
          </h1>
          <p className="mt-6 max-w-xl text-base text-on-night-2 sm:text-lg">{HERO.lede}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="#get-started" className="btn btn-primary btn-lg">
              Book a free strategy call <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <a href={whatsappLink('Hi Social ScaleX, I’d like to grow my brand on Instagram.')} target="_blank" rel="noopener noreferrer" className="btn btn-night-ghost btn-lg">
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
          <ul className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {figures.map((f) => (
              <li key={f.id}>
                <Link href={`/case-studies#${f.href}`} className="hero-chip block h-full rounded-2xl border border-on-night/12 bg-night-2/80 p-4">
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

        <div className="relative -mx-4 sm:mx-0 lg:-mr-24">
          <ThreeStage scene="orbit" className="mx-auto aspect-square w-full max-w-[40rem]">
            <HeroArt className="h-full w-full" />
          </ThreeStage>
        </div>
      </div>
    </section>
  );
}
