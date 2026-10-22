import React from 'react';
import Link from 'next/link';
import { ArrowRight, Check, Lightbulb, TriangleAlert, X } from 'lucide-react';
import { WhatsappIcon } from '@/components/icons/WhatsappIcon';
import { Rich } from '@/components/site/Rich';
import { whatsappLink } from '@/lib/site';
import type { CtaBlock, FlowStep, TableBlock, VerdictSide } from '@/lib/guides';

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
