import React from 'react';
import Link from 'next/link';
import { ArrowRight, Check, Globe, Lightbulb, Link2, MapPin, Sparkles, Star, TriangleAlert, UserRound, X, type LucideIcon } from 'lucide-react';
import { WhatsappIcon } from '@/components/icons/WhatsappIcon';
import { Rich } from '@/components/site/Rich';
import { whatsappLink } from '@/lib/site';
import type { ChatBlock, ChecklistBlock, CtaBlock, FlowStep, SourceIcon, SourcesBlock, StatsBlock, TableBlock, VerdictSide } from '@/lib/guides';

// Visual blocks for guides: answer-first cards, tables, flows and offers.
// Server components only: no client JS, so everything is in the HTML that
// crawlers and answer engines read.

/** Two options side by side: the one to avoid and the one to pick. */
export function Verdict({ sides }: { sides: VerdictSide[] }) {
  return (
    <div className="not-prose my-8 grid gap-4 sm:grid-cols-2">
      {sides.map((s) => {
        const good = s.tone === 'good';
        return (
          <section
            key={s.label}
            aria-label={`${s.label}: ${s.title}`}
            className={`relative overflow-hidden rounded-card p-6 ring-1 ${good ? 'bg-surface ring-positive/40 shadow-lift' : 'bg-paper-2 ring-line'}`}
          >
            <div aria-hidden="true" className={`absolute inset-x-0 top-0 h-1 ${good ? 'bg-positive' : 'bg-line-strong'}`} />
            <p className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-[0.12em] ${good ? 'bg-positive/10 text-positive' : 'bg-surface text-ink-3 ring-1 ring-line'}`}>
              {good ? <Check className="size-3.5" aria-hidden="true" /> : <X className="size-3.5" aria-hidden="true" />}
              {s.label}
            </p>
            <p className="mt-3 font-display text-2xl leading-tight text-ink">{s.title}</p>
            <ul className="mt-4 space-y-2.5 text-base text-ink-2">
              {s.points.map((p) => (
                <li key={p} className="flex gap-2.5">
                  {good
                    ? <Check className="mt-1 size-4 flex-none text-positive" aria-hidden="true" />
                    : <X className="mt-1 size-4 flex-none text-ink-3" aria-hidden="true" />}
                  <span><Rich text={p} /></span>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

/** A comparison table that turns into stacked cards on phones. */
export function DataTable({ b }: { b: TableBlock }) {
  const [corner, ...cols] = b.head;
  return (
    <>
      <ul className="not-prose my-8 grid gap-3 sm:hidden" aria-label={b.caption}>
        {b.rows.map(([label, ...cells]) => (
          <li key={label} className="rounded-card border border-line bg-surface p-4 text-sm">
            <p className="font-semibold text-ink">{label}</p>
            {cells.map((c, i) => (
              <p key={cols[i]} className={`mt-1.5 ${i === b.highlight - 1 ? 'text-ink' : 'text-ink-2'}`}>
                <span className={`font-medium ${i === b.highlight - 1 ? 'text-positive' : 'text-ink-3'}`}>{cols[i]}: </span>
                <Rich text={c} />
              </p>
            ))}
          </li>
        ))}
      </ul>
      <div className="not-prose my-8 hidden overflow-x-auto rounded-card border border-line bg-surface sm:block">
        <table className="w-full min-w-[34rem] text-left text-sm">
          <caption className="sr-only">{b.caption}</caption>
          <thead className="bg-paper-2 text-ink">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold">{corner || <span className="sr-only">Compare</span>}</th>
              {cols.map((c, i) => (
                <th key={c} scope="col" className={`px-4 py-3 font-semibold ${i === b.highlight - 1 ? 'text-positive' : ''}`}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {b.rows.map(([label, ...cells]) => (
              <tr key={label} className="border-t border-line">
                <th scope="row" className="px-4 py-3 font-semibold text-ink">{label}</th>
                {cells.map((c, i) => (
                  <td key={cols[i]} className={`px-4 py-3 ${i === b.highlight - 1 ? 'bg-positive/5 text-ink' : 'text-ink-2'}`}><Rich text={c} /></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

/** A numbered journey: vertical on phones, a row of steps on wide screens. */
export function Flow({ steps, label }: { steps: FlowStep[]; label: string }) {
  return (
    <ol aria-label={label} className="not-prose my-8 grid gap-3 sm:grid-cols-[repeat(auto-fit,minmax(0,1fr))]">
      {steps.map((s, i) => (
        <li key={s.title} className="relative rounded-card border border-line bg-surface p-4">
          <span aria-hidden="true" className="grid size-8 place-items-center rounded-full bg-coral-tint font-display text-lg text-coral-text">{i + 1}</span>
          <p className="mt-3 font-semibold leading-snug text-ink">{s.title}</p>
          <p className="mt-1 text-sm text-ink-2">{s.text}</p>
          {i < steps.length - 1 ? (
            <ArrowRight aria-hidden="true" className="absolute -right-3 top-1/2 z-10 hidden size-5 -translate-y-1/2 rounded-full bg-paper text-coral-text sm:block" />
          ) : null}
        </li>
      ))}
    </ol>
  );
}

/** A short tip or warning that should stand out while skimming. */
export function Callout({ tone, title, text }: { tone: 'tip' | 'warn'; title: string; text: string }) {
  const Icon = tone === 'tip' ? Lightbulb : TriangleAlert;
  return (
    <aside className={`not-prose my-8 flex gap-4 rounded-card border-l-4 p-5 ${tone === 'tip' ? 'border-positive bg-positive/5' : 'border-coral bg-coral-tint'}`}>
      <Icon aria-hidden="true" className={`mt-0.5 size-5 flex-none ${tone === 'tip' ? 'text-positive' : 'text-coral-text'}`} />
      <div>
        <p className="font-semibold text-ink">{title}</p>
        <p className="mt-1 text-base text-ink-2"><Rich text={text} /></p>
      </div>
    </aside>
  );
}

/** Social ScaleX offer inside a guide: one promise, a few proof points, two ways to start. */
export function GuideCta({ b }: { b: CtaBlock }) {
  const wa = whatsappLink(b.whatsapp);
  if (b.variant === 'mid') {
    return (
      <aside aria-label="Social ScaleX can do this for you" className="not-prose my-10 overflow-hidden rounded-card border border-coral/30 bg-coral-tint">
        <div className="grid gap-5 p-6 sm:grid-cols-[1fr_auto] sm:items-center sm:p-7">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-coral-text">Social ScaleX</p>
            <p className="mt-2 font-display text-3xl leading-tight text-ink">{b.title}</p>
            <p className="mt-2 text-lg text-ink-2"><Rich text={b.text} /></p>
          </div>
          <div className="flex flex-col items-stretch gap-3 sm:items-end">
            <Link href={b.href} className="btn btn-primary btn-lg">{b.button} <ArrowRight className="size-4" aria-hidden="true" /></Link>
            <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-ink-2 underline decoration-line-strong underline-offset-4 hover:text-ink sm:justify-end">
              <WhatsappIcon size={16} /> or ask on WhatsApp
            </a>
          </div>
          <ul className="flex flex-wrap gap-2 text-sm sm:col-span-2">
            {b.points.map((t) => (
              <li key={t} className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1 text-ink-2 ring-1 ring-line">
                <Check className="size-3.5 text-positive" aria-hidden="true" /> {t}
              </li>
            ))}
          </ul>
        </div>
      </aside>
    );
  }
  return (
    <aside aria-label="Work with Social ScaleX" className="not-prose my-12 overflow-hidden rounded-card bg-night p-6 text-on-night sm:p-8">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-coral-on-night">Social ScaleX · Delhi NCR</p>
      <p className="mt-3 font-display text-3xl leading-tight sm:text-4xl">{b.title}</p>
      <p className="mt-3 text-lg text-on-night-2">{b.text.replace(/\*\*/g, '')}</p>
      <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
        {b.points.map((t) => (
          <li key={t} className="flex gap-2.5 text-on-night-2"><Check className="mt-1 size-4 flex-none text-coral-on-night" aria-hidden="true" /> {t}</li>
        ))}
      </ul>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link href={b.href} className="btn btn-primary btn-lg">{b.button} <ArrowRight className="size-4" aria-hidden="true" /></Link>
        <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-lg bg-on-night text-night hover:opacity-90"><WhatsappIcon size={18} /> Chat on WhatsApp</a>
      </div>
    </aside>
  );
}

/** Big numbers, each with its source. The first card is the lead figure. */
export function Stats({ b }: { b: StatsBlock }) {
  return (
    <section aria-label={b.label} className="not-prose my-8">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink-3">{b.label}</p>
      <dl className="mt-3 grid gap-3 sm:grid-cols-2">
        {b.items.map((x, i) => {
          const lead = i === 0;
          return (
            <div key={x.value} className={`flex flex-col rounded-card p-5 ${lead ? 'bg-night text-on-night' : 'border border-line bg-surface'}`}>
              <dt className={`order-2 mt-2 text-base leading-snug ${lead ? 'text-on-night' : 'text-ink'}`}>{x.text}</dt>
              <dd className={`order-1 whitespace-nowrap font-display text-5xl leading-none tracking-[-0.02em] sm:text-4xl ${lead ? 'text-coral-on-night' : 'text-ink'}`}>{x.value}</dd>
              <dd className={`order-3 mt-auto pt-3 text-xs ${lead ? 'text-on-night-2' : 'text-ink-3'}`}>
                Source:{' '}
                <a href={x.href} target="_blank" rel="noopener noreferrer" className={`underline underline-offset-2 ${lead ? 'decoration-on-night/40 hover:text-on-night' : 'decoration-line-strong hover:text-ink'}`}>{x.source}</a>
              </dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
}

/** What an AI answer looks like to a customer. Always labelled as a made-up example. */
export function ChatExample({ b }: { b: ChatBlock }) {
  return (
    <figure className="not-prose my-8 overflow-hidden rounded-card border border-line bg-surface shadow-lift">
      <div className="flex items-center gap-2 border-b border-line bg-paper-2 px-4 py-2.5 text-xs font-semibold text-ink-3">
        <Sparkles className="size-3.5 text-coral-text" aria-hidden="true" /> Example only, not a real AI answer
      </div>
      <div className="space-y-4 p-4 sm:p-6">
        <p className="ml-auto flex w-fit max-w-[88%] items-start gap-2 rounded-2xl rounded-br-md bg-ink px-4 py-2.5 text-base text-on-night">
          <UserRound className="mt-0.5 size-4 flex-none opacity-70" aria-hidden="true" />
          <span><span className="sr-only">Customer asks: </span>{b.question}</span>
        </p>
        <div className="max-w-[92%] rounded-2xl rounded-bl-md bg-paper-2 p-4">
          <p className="text-base text-ink"><span className="sr-only">AI answers: </span>{b.intro}</p>
          <ol className="mt-3 space-y-2">
            {b.answer.map((a, i) => (
              <li key={a.name} className="flex gap-3 rounded-xl bg-surface p-3 ring-1 ring-line">
                <span aria-hidden="true" className="grid size-7 flex-none place-items-center rounded-full bg-positive/10 text-sm font-bold text-positive">{i + 1}</span>
                <span className="min-w-0">
                  <span className="block font-semibold text-ink">{a.name}</span>
                  <span className="mt-0.5 flex items-center gap-1 text-sm text-ink-2"><Star className="size-3.5 flex-none fill-current text-coral-text" aria-hidden="true" />{a.note}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
        <p className="flex items-center gap-3 rounded-xl border-2 border-dashed border-coral/50 bg-coral-tint px-4 py-3 text-base font-semibold text-coral-text">
          <X className="size-5 flex-none" aria-hidden="true" /> {b.missing}
        </p>
      </div>
      <figcaption className="border-t border-line px-4 py-3 text-xs text-ink-3">{b.caption}</figcaption>
    </figure>
  );
}

const SOURCE_ICON: Record<SourceIcon, LucideIcon> = { map: MapPin, globe: Globe, star: Star, link: Link2 };

/** Four places an AI answer reads from, arranged around one hub on wider screens. */
export function SourceMap({ b }: { b: SourcesBlock }) {
  const hub = (
    <span className="grid size-24 place-items-center rounded-full bg-night p-3 text-center font-display text-base leading-tight text-on-night ring-8 ring-paper">
      {b.center}
    </span>
  );
  return (
    <figure className="not-prose my-8">
      <figcaption className="text-xs font-bold uppercase tracking-[0.14em] text-ink-3">{b.label}</figcaption>
      <div className="mt-4 flex justify-center sm:hidden" aria-hidden="true">{hub}</div>
      <div className="relative mt-3 grid gap-3 sm:mt-4 sm:grid-cols-2 sm:gap-12">
        {/* Lines through the gaps join each card to the hub. Decorative. */}
        <span aria-hidden="true" className="absolute inset-x-6 top-1/2 hidden h-px bg-line-strong sm:block" />
        <span aria-hidden="true" className="absolute inset-y-6 left-1/2 hidden w-px bg-line-strong sm:block" />
        {b.items.map((x) => {
          const Icon = SOURCE_ICON[x.icon];
          return (
            <section key={x.title} aria-label={x.title} className="relative rounded-card border border-line bg-surface p-5">
              <span aria-hidden="true" className="grid size-10 place-items-center rounded-xl bg-coral-tint text-coral-text"><Icon className="size-5" /></span>
              <p className="mt-3 font-semibold text-ink">{x.title}</p>
              <p className="mt-1 text-sm text-ink-2"><Rich text={x.text} /></p>
              <p className="mt-3 text-xs text-ink-3">Used by</p>
              <ul className="mt-1.5 flex flex-wrap gap-1.5">
                {x.usedBy.map((u) => (
                  <li key={u} className="rounded-full bg-paper-2 px-2.5 py-1 text-xs font-semibold text-ink-2 ring-1 ring-line">{u}</li>
                ))}
              </ul>
            </section>
          );
        })}
        <span aria-hidden="true" className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 sm:block">{hub}</span>
      </div>
    </figure>
  );
}

/** Detailed steps: a number, a time chip and plain instructions. Titles are h3s for the outline. */
export function Checklist({ b }: { b: ChecklistBlock }) {
  return (
    <ol aria-label={b.label} className="not-prose my-8 space-y-3">
      {b.items.map((x, i) => (
        <li key={x.title} className="relative grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 rounded-card border border-line bg-surface p-5 sm:p-6">
          <span aria-hidden="true" className="grid size-11 place-items-center rounded-xl border-2 border-coral/50 font-display text-xl text-coral-text">{i + 1}</span>
          <div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <h3 className="font-display text-2xl leading-tight text-ink">{x.title}</h3>
              {x.time ? <span className="rounded-full bg-paper-2 px-2.5 py-0.5 text-xs font-semibold text-ink-3 ring-1 ring-line">{x.time}</span> : null}
            </div>
            <p className="mt-2 text-base text-ink-2"><Rich text={x.text} /></p>
            {x.points?.length ? (
              <ul className="mt-3 space-y-2">
                {x.points.map((pt) => (
                  <li key={pt} className="flex gap-2.5 text-base text-ink-2">
                    <Check className="mt-1 size-4 flex-none text-positive" aria-hidden="true" />
                    <span><Rich text={pt} /></span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
