import React from 'react';
import Link from 'next/link';
import { Check, ArrowRight, Zap, MessageCircle, Send } from 'lucide-react';
import { WhatsappIcon } from '@/components/icons/WhatsappIcon';
import { DIY_VS_DFY, PLAN_99 } from '@/lib/automation';
import { whatsappLink } from '@/lib/site';

const WA = whatsappLink('Hi Social ScaleX, I want Instagram comment-to-DM automation for ₹99/month.');
const PAGE = '/automation/instagram-comment-to-dm';

/** The ₹99 plan as a card. */
export function PriceCard({ headingLevel = 3 }: { headingLevel?: 2 | 3 }) {
  const H = headingLevel === 2 ? 'h2' : 'h3';
  return (
    <div className="card relative overflow-hidden p-6 shadow-lift sm:p-8">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-coral" />
      <p className="eyebrow">Done for you</p>
      <H className="mt-3 text-3xl text-ink">{PLAN_99.name.replace(/-/g, '\u2011')}</H>
      <p className="mt-4 flex items-baseline gap-2">
        <span className="font-display text-6xl leading-none text-ink">₹{PLAN_99.price}</span>
        <span className="text-ink-2">/ month</span>
      </p>
      <ul className="mt-6 space-y-2.5 text-ink-2">
        {PLAN_99.includes.map((i) => (
          <li key={i} className="flex gap-3"><Check className="mt-1 size-4 flex-none text-positive" aria-hidden="true" />{i}</li>
        ))}
      </ul>
      <div className="mt-8 grid gap-3">
        <Link href={`${PAGE}#get-started`} className="btn btn-primary btn-lg">Get it for ₹{PLAN_99.price}/month <ArrowRight className="size-4" aria-hidden="true" /></Link>
        <a href={WA} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-lg"><WhatsappIcon size={18} /> Start on WhatsApp</a>
      </div>
      <p className="mt-4 text-center text-xs text-ink-3">{PLAN_99.note} Pay after setup.</p>
    </div>
  );
}

const TRUST = ['Official Meta tools', 'No password needed', 'Pay after it works'];

/** Offer boxes placed inside the free guide: short, visual, one action. */
export function OfferBox({ variant }: { variant: 'mid' | 'end' }) {
  if (variant === 'mid') {
    return (
      <aside aria-label="Shortcut: done-for-you setup" className="not-prose my-10 overflow-hidden rounded-card border border-coral/30 bg-coral-tint">
        <div className="grid gap-6 p-6 sm:grid-cols-[1fr_auto] sm:items-center sm:p-7">
          <div>
            <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-coral-text">
              <Zap className="size-3.5 fill-current" aria-hidden="true" /> Shortcut
            </p>
            <p className="mt-2 font-display text-3xl leading-tight text-ink">Skip steps 1–4.</p>
            <p className="mt-1 text-lg text-ink-2">
              We set up comment-to-DM for you. <strong className="text-ink">₹{PLAN_99.price}/month.</strong>
            </p>
          </div>
          <div className="flex flex-col items-stretch gap-3 sm:items-end">
            <div aria-hidden="true" className="hidden items-center gap-2 text-sm sm:flex">
              <span className="inline-flex items-center gap-1.5 rounded-2xl rounded-bl-sm bg-surface px-3 py-2 font-semibold text-ink ring-1 ring-line"><MessageCircle className="size-4" /> PRICE</span>
              <ArrowRight className="size-4 text-coral-text" />
              <span className="inline-flex items-center gap-1.5 rounded-2xl rounded-br-sm bg-ink px-3 py-2 font-semibold text-on-night"><Send className="size-4" /> DM sent</span>
            </div>
            <Link href={`${PAGE}#get-started`} className="btn btn-primary btn-lg">
              Do it for me <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <a href={WA} target="_blank" rel="noopener noreferrer" className="text-center text-sm font-semibold text-ink-2 underline decoration-line-strong underline-offset-4 hover:text-ink sm:text-right">
              or ask on WhatsApp
            </a>
          </div>
          <ul className="flex flex-wrap gap-2 text-sm sm:col-span-2">
            {TRUST.map((t) => (
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
    <aside aria-label="Done-for-you option" className="not-prose my-12 grid gap-8 rounded-card border border-line bg-paper-2 p-6 sm:p-8 lg:grid-cols-[1.1fr_1fr] lg:items-center">
      <div>
        <p className="font-display text-3xl leading-tight text-ink">Rather post, not set up?</p>
        <p className="mt-3 text-lg text-ink-2">We build it, test it and keep every keyword working. You reply to buyers.</p>
        <ul className="mt-5 space-y-2 text-ink-2">
          {TRUST.map((t) => (
            <li key={t} className="flex items-center gap-2"><Check className="size-4 text-positive" aria-hidden="true" /> {t}</li>
          ))}
        </ul>
      </div>
      <PriceCard />
    </aside>
  );
}

export function CompareTable() {
  return (
    <>
    <ul className="not-prose my-8 grid gap-3 sm:hidden" aria-label={`Do it yourself compared with done for you at ₹${PLAN_99.price} a month`}>
      {DIY_VS_DFY.map((r) => (
        <li key={r.point} className="rounded-card border border-line bg-surface p-4 text-sm">
          <p className="font-semibold text-ink">{r.point}</p>
          <p className="mt-2 text-ink-2"><span className="font-medium text-ink-3">Yourself: </span>{r.diy}</p>
          <p className="mt-1 text-ink"><span className="font-medium text-coral-text">With us: </span>{r.dfy}</p>
        </li>
      ))}
    </ul>
    <div className="not-prose my-8 hidden overflow-x-auto rounded-card border border-line bg-surface sm:block">
      <table className="w-full min-w-[34rem] text-left text-sm">
        <caption className="sr-only">Setting up comment-to-DM yourself compared with the ₹{PLAN_99.price} done-for-you plan</caption>
        <thead className="bg-paper-2 text-ink">
          <tr>
            <th scope="col" className="px-4 py-3 font-semibold"><span className="sr-only">Compare</span></th>
            <th scope="col" className="px-4 py-3 font-semibold">Do it yourself</th>
            <th scope="col" className="px-4 py-3 font-semibold">Done for you, ₹{PLAN_99.price}/month</th>
          </tr>
        </thead>
        <tbody>
          {DIY_VS_DFY.map((r) => (
            <tr key={r.point} className="border-t border-line">
              <th scope="row" className="px-4 py-3 font-semibold text-ink">{r.point}</th>
              <td className="px-4 py-3 text-ink-2">{r.diy}</td>
              <td className="px-4 py-3 text-ink">{r.dfy}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    </>
  );
}
