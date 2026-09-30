import React from 'react';
import Link from 'next/link';
import { Check, ArrowRight } from 'lucide-react';
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

/** Offer box placed inside the free guide. */
export function OfferBox({ variant }: { variant: 'mid' | 'end' }) {
  if (variant === 'mid') {
    return (
      <aside aria-label="Done-for-you option" className="not-prose my-10 rounded-card bg-night p-6 text-on-night sm:p-8">
        <p className="font-display text-2xl leading-snug">Four steps done. Now repeat them for every post, keyword and new link.</p>
        <p className="mt-3 text-on-night-2">
          This is where it gets repetitive. If you’d rather post the Reel and let the DMs run, we set it up, test it and keep it updated for ₹{PLAN_99.price} a month.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link href={PAGE} className="btn btn-night">See the ₹{PLAN_99.price} plan</Link>
          <a href={WA} target="_blank" rel="noopener noreferrer" className="btn btn-night-ghost"><WhatsappIcon size={18} /> Ask on WhatsApp</a>
        </div>
      </aside>
    );
  }
  return (
    <aside aria-label="Done-for-you option" className="not-prose my-12 grid gap-8 rounded-card border border-line bg-paper-2 p-6 sm:p-8 lg:grid-cols-[1.1fr_1fr] lg:items-center">
      <div>
        <p className="font-display text-3xl leading-tight text-ink">Skip the setup. Keep the sales.</p>
        <p className="mt-4 text-ink-2">
          You now know exactly how it works. The question is whether your evenings go into testing keywords and fixing links, or into running your business. For ₹99 a month, less than ₹4 a day, we handle the automation and you handle the customers.
        </p>
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
