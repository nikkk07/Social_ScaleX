import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, TrendingUp, X } from 'lucide-react';
import { GOAL_LABEL, PORTFOLIO, RESULTS_AS_OF, getService, growthChange, type Growth, type PortfolioItem } from '@/lib/content';
import { formatDay } from '@/lib/dates';
import { lc } from '@/lib/text';
import { whatsappLink } from '@/lib/site';
import { WhatsappIcon } from '@/components/icons/WhatsappIcon';
import { InstagramIcon, YoutubeIcon } from '@/components/icons/PlatformIcons';
import { leadGrowth } from './Results';

/*
 * Client results as tappable stories.
 *
 * The page shows only a face, a name and one number per client. Tapping opens
 * that client's full story over the page. Every story is server-rendered into
 * the HTML (crawlers and AI readers get all of it) and has its own address,
 * /case-studies#<id>, so links from other pages open the right story.
 * Without JavaScript, `:target` opens it; StoryController adds the rest.
 */

type Lead =
  | { kind: 'growth'; big: string; line: string; g: Growth }
  | { kind: 'metric'; big: string; line: string }
  | { kind: 'brief'; big: string; line: string };

function lead(p: PortfolioItem): Lead {
  const g = leadGrowth(p);
  if (g) return { kind: 'growth', big: growthChange(g), line: `${g.fromText} → ${g.toText} ${lc(g.label)}`, g };
  const m = p.metrics[0];
  if (m) return { kind: 'metric', big: m.value, line: m.label };
  return { kind: 'brief', big: GOAL_LABEL[p.goal], line: 'Reels and creator collaborations' };
}

/** Second line of the story heading: the result in words. */
function resultInWords(p: PortfolioItem): string {
  const g = leadGrowth(p);
  if (g) return `${g.fromText} to ${g.toText} ${lc(g.label)}`;
  const m = p.metrics[0];
  if (m) return `${m.value} ${lc(m.label)}`;
  return `Brand awareness for a ${lc(p.short)}`;
}

const hasFigures = (p: PortfolioItem) => p.metrics.length > 0 || p.growth.length > 0;

const CTA_FOR: Record<PortfolioItem['goal'], string> = {
  sales: 'your store',
  awareness: 'your brand',
  creator: 'your channel',
};

function source(p: PortfolioItem): string {
  if (p.platform === 'Instagram + YouTube') return 'Instagram professional dashboard and YouTube Studio';
  return p.platform === 'YouTube' ? 'YouTube Studio' : 'Instagram professional dashboard';
}

function Face({ p, size }: { p: PortfolioItem; size: number }) {
  return (
    <Image
      src={p.avatar}
      alt=""
      width={size}
      height={size}
      className="flex-none rounded-full bg-paper-2 object-cover"
      style={{ width: size, height: size }}
    />
  );
}

/** Instagram-style rings at the top of the page: one tap opens a story. */
export function StoryRings() {
  return (
    <div className="story-rings-wrap">
      <ul className="story-rings" aria-label="Client stories">
        {PORTFOLIO.map((p) => (
          <li key={p.id}>
            <a href={`#${p.id}`} data-story-link={p.id} className="story-ring">
              <span className="story-ring-face"><Face p={p} size={60} /></span>
              <span className="story-ring-name">{p.client}</span>
              <span className="sr-only">: open the story</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Compact, tappable card for the results grid. Shows one number, nothing more. */
export function StoryTile({ p }: { p: PortfolioItem }) {
  const l = lead(p);
  const pct = l.kind === 'growth' ? Math.max(4, Math.round((l.g.from / l.g.to) * 100)) : 0;
  return (
    <a href={`#${p.id}`} data-story-link={p.id} className="story-tile card card-link">
      <Face p={p} size={40} />
      <span className="mt-3 block text-sm font-semibold leading-snug text-ink">{p.client}</span>
      <span className="mt-0.5 block text-xs leading-snug text-ink-3">{p.short}</span>
      <span
        className={`mt-4 flex items-center gap-1.5 font-display leading-none tracking-[-0.02em] ${
          l.kind === 'growth' ? 'text-4xl text-positive sm:text-5xl' : l.kind === 'metric' ? 'text-4xl text-ink sm:text-5xl' : 'text-2xl text-ink sm:text-3xl'
        }`}
      >
        {l.kind === 'growth' ? <TrendingUp className="size-6 flex-none" strokeWidth={2.5} aria-hidden="true" /> : null}
        {l.big}
      </span>
      <span className="mt-2 block text-xs leading-snug text-ink-2">{l.line}</span>
      {p.status === 'Past' ? <span className="mt-1 block text-xs text-ink-3">Past client{hasFigures(p) ? ', at hand-over' : ''}</span> : null}
      {l.kind === 'growth' ? (
        <span aria-hidden="true" className="mt-3 block h-1.5 overflow-hidden rounded-full bg-paper-2">
          <span className="block h-full rounded-full bg-positive" style={{ width: '100%' }}>
            <span className="block h-full rounded-full bg-line-strong" style={{ width: `${pct}%` }} />
          </span>
        </span>
      ) : null}
      <span className="mt-auto flex items-center justify-between gap-2 pt-5 text-xs font-semibold">
        <span className="text-coral-text">See story</span>
        <span className="grid size-7 place-items-center rounded-full bg-ink text-paper"><ArrowRight className="size-3.5" aria-hidden="true" /></span>
      </span>
    </a>
  );
}

function NightBars({ g }: { g: Growth }) {
  const pct = Math.max(3, Math.round((g.from / g.to) * 100));
  return (
    <div>
      <p className="flex items-baseline justify-between gap-3 text-sm">
        <span className="font-semibold text-on-night">{g.label}</span>
        <span className="text-on-night-2">{g.period}</span>
      </p>
      <div aria-hidden="true" className="mt-2 grid grid-cols-[3.25rem_minmax(0,1fr)] items-center gap-x-3 gap-y-2 text-xs">
        <span className="tabular-nums text-on-night-2">{g.fromText}</span>
        <span className="story-bar h-2 rounded-full bg-on-night/25" style={{ width: `${pct}%` }} />
        <span className="tabular-nums font-semibold text-on-night">{g.toText}</span>
        <span className="story-bar story-bar-now h-2 w-full rounded-full" />
      </div>
      <p className="sr-only">{g.label}: from {g.fromText} to {g.toText}, {g.period}.</p>
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="story-step">
      <span aria-hidden="true" className="story-step-n">{n}</span>
      <div className="min-w-0">
        <h3 className="font-sans text-xs font-semibold uppercase tracking-[0.12em] text-ink-3">{title}</h3>
        <div className="mt-2 text-lg leading-relaxed text-ink">{children}</div>
      </div>
    </li>
  );
}

/** One client's full story. Hidden until opened. */
export function StoryPanel({ p, index }: { p: PortfolioItem; index: number }) {
  const l = lead(p);
  const total = PORTFOLIO.length;
  const prev = PORTFOLIO[(index - 1 + total) % total]!;
  const next = PORTFOLIO[(index + 1) % total]!;
  const services = p.services.map(getService).filter((x): x is NonNullable<typeof x> => Boolean(x));
  const hasNumbers = p.metrics.length > 0 || p.growth.length > 0;
  const extra = p.metrics.filter((m) => !p.growth.some((g) => g.toText.replace('+', '') === m.value.replace('+', '')));
  const wa = whatsappLink(`Hi Social ScaleX, I just read the ${p.client} story on your website. Can you look at my account?`);
  const date = p.status === 'Past' ? null : formatDay(p.asOf ?? RESULTS_AS_OF);

  return (
    <article id={p.id} data-story={p.id} className="story" role="dialog" aria-modal="true" aria-labelledby={`${p.id}-title`}>
      <a href="#results" data-story-close tabIndex={-1} aria-hidden="true" className="story-backdrop" />
      <div className="story-panel" data-story-panel>
        {/* Top bar: position in the set, who this is, close. */}
        <div className="story-top">
          <div aria-hidden="true" className="story-progress">
            {PORTFOLIO.map((x, i) => <span key={x.id} className={i <= index ? 'is-on' : ''} />)}
          </div>
          <div className="mt-3 flex items-center gap-3">
            <Face p={p} size={36} />
            <p className="min-w-0 flex-1 leading-tight">
              <span className="block truncate text-sm font-semibold text-on-night">@{p.handle}</span>
              <span className="block truncate text-xs text-on-night-2">Story {index + 1} of {total}</span>
            </p>
            <a href="#results" data-story-close className="story-close" aria-label={`Close the ${p.client} story`}>
              <X className="size-5" aria-hidden="true" />
            </a>
          </div>
        </div>

        {/* The result, first. */}
        <header className="story-hero">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-coral-on-night">
            {l.kind === 'brief' ? '' : `${GOAL_LABEL[p.goal]} · `}{p.status === 'Active' ? 'Active client' : 'Past client'}
          </p>
          <h2 id={`${p.id}-title`} className="mt-3 text-3xl leading-tight text-on-night sm:text-4xl">
            {p.client}
            <span className="sr-only">: </span>
            <span className="mt-1 block font-sans text-base font-normal tracking-normal text-on-night-2">{resultInWords(p)}</span>
          </h2>
          <p
            className={`story-big mt-6 flex items-center gap-2 font-display leading-none tracking-[-0.03em] ${
              l.kind === 'brief' ? 'text-4xl leading-tight text-on-night' : 'text-7xl text-coral-on-night sm:text-8xl'
            }`}
          >
            {l.kind === 'growth' ? <TrendingUp className="size-10 flex-none" strokeWidth={2.5} aria-hidden="true" /> : null}
            {l.kind === 'brief' ? 'Reels and creator collabs' : l.big}
          </p>
          <p className="mt-3 text-sm text-on-night-2">{p.category}</p>
          {p.growth.length ? (
            <div className="mt-7 grid gap-5 border-t border-on-night/15 pt-6">
              {p.growth.map((g) => <NightBars key={g.label} g={g} />)}
            </div>
          ) : null}
        </header>

        <div className="story-body">
          <ol className="story-steps">
            <Step n={1} title="Where it started"><p>{p.story.start}</p></Step>
            <Step n={2} title="The job"><p>{p.story.job}</p></Step>
            <Step n={3} title="What we changed">
              <ul className="grid gap-2">
                {p.story.did.map((d) => (
                  <li key={d} className="flex gap-2.5"><Check className="mt-1.5 size-4 flex-none text-positive" aria-hidden="true" /><span>{d}</span></li>
                ))}
              </ul>
              {services.length ? (
                <ul className="mt-4 flex flex-wrap gap-2" aria-label="Services used">
                  {services.map((s) => (
                    <li key={s.slug}>
                      <Link href={`/services/${s.slug}`} className="inline-flex min-h-9 items-center rounded-full border border-line-strong bg-surface px-3 text-sm font-semibold text-ink-2 hover:border-ink hover:text-ink">
                        {s.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
            </Step>
            <Step n={4} title="What happened">
              <p>{p.story.outcome}</p>
              {extra.length ? (
                <dl className="mt-4 grid grid-cols-2 gap-3">
                  {extra.map((m) => (
                    <div key={m.label} className="flex flex-col-reverse justify-end rounded-2xl bg-paper-2 p-4">
                      <dt className="mt-1 text-xs leading-snug text-ink-3">{m.label}</dt>
                      <dd className="font-display text-3xl leading-none text-ink">{m.value}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}
            </Step>
          </ol>

          {p.shots?.length ? (
            <div className="mt-10 grid gap-4">
              {p.shots.map((s) => (
                <figure key={s.src} className="overflow-hidden rounded-card border border-line bg-surface">
                  <Image src={s.src} alt={s.alt} width={1080} height={1920} className="h-auto w-full" sizes="(min-width: 768px) 36rem, 100vw" />
                  <figcaption className="p-3 text-xs text-ink-3">{s.caption}</figcaption>
                </figure>
              ))}
            </div>
          ) : null}

          {/* Proof the reader can check. */}
          <div className="mt-10 rounded-card border border-line bg-surface p-5">
            <p className="text-sm font-semibold text-ink">Check it yourself</p>
            <p className="mt-1 text-sm text-ink-2">
              {hasNumbers
                ? date
                  ? `These figures come from the client’s own ${source(p)} on ${date}, shared with permission. We checked follower counts against the public profile the same day.`
                  : `These are the figures at hand-over, from the client’s own ${source(p)}, shared with permission.`
                : 'We no longer run this page. Visit the profile to see the brand today.'}
            </p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {p.profiles.map((pr) => (
                <li key={pr.url}>
                  <a href={pr.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-2 rounded-full border border-line-strong px-3.5 text-sm font-semibold text-ink hover:border-ink">
                    {pr.label === 'Instagram' ? <InstagramIcon size={16} className="text-[#C13584]" /> : <YoutubeIcon size={18} className="text-[#E00000]" />}
                    {pr.label}
                    <span className="sr-only">: {p.client} (opens in a new tab)</span>
                    <ArrowUpRight className="size-3.5 text-ink-3" aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* The ask. */}
          <div className="story-cta">
            <p className="font-display text-3xl leading-tight text-on-night">Want a plan like this for {CTA_FOR[p.goal]}?</p>
            <p className="mt-3 text-on-night-2">Book a free strategy call. We look at your account first and tell you what we would change. No pitch decks, no pressure.</p>
            <div className="mt-6 grid gap-3">
              <a href="#get-started" data-story-exit className="btn btn-lg btn-night">Get my free plan <ArrowRight className="size-4" aria-hidden="true" /></a>
              <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-lg btn-night-ghost"><WhatsappIcon size={18} /> Ask on WhatsApp</a>
            </div>
          </div>

          <nav aria-label="More client stories" className="mt-8 grid grid-cols-2 gap-3">
            <a href={`#${prev.id}`} data-story-link={prev.id} className="story-nav">
              <span className="flex items-center gap-1 text-xs text-ink-3"><ArrowLeft className="size-3.5" aria-hidden="true" /> Previous</span>
              <span className="mt-1 block truncate text-sm font-semibold text-ink">{prev.client}</span>
            </a>
            <a href={`#${next.id}`} data-story-link={next.id} className="story-nav text-right">
              <span className="flex items-center justify-end gap-1 text-xs text-ink-3">Next <ArrowRight className="size-3.5" aria-hidden="true" /></span>
              <span className="mt-1 block truncate text-sm font-semibold text-ink">{next.client}</span>
            </a>
          </nav>
        </div>

        {/* Always-visible ask on phones while reading. */}
        <div className="story-dock">
          <a href="#get-started" data-story-exit className="btn btn-primary flex-1">Get a plan like this</a>
          <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-secondary aspect-square px-0" aria-label={`Ask about the ${p.client} result on WhatsApp`}>
            <WhatsappIcon size={20} />
          </a>
        </div>
      </div>
    </article>
  );
}

export function StoryPanels() {
  return (
    <div className="stories" data-stories>
      {PORTFOLIO.map((p, i) => <StoryPanel key={p.id} p={p} index={i} />)}
    </div>
  );
}
