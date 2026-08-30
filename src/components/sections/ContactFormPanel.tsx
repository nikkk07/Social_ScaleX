'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Phone } from 'lucide-react';
import { GlassCard } from '../GlassCard';
import { WhatsappIcon } from '../icons/WhatsappIcon';
import { CONTACTS, WHATSAPP_URL } from '@/lib/site';

/**
 * Static stand-in shown while the form chunk loads — and permanently, for
 * anyone without JavaScript, since this is what gets server-rendered.
 *
 * It is deliberately a working way to make contact rather than a spinner: a
 * skeleton would leave a no-JS visitor with a dead panel where the only
 * conversion path on the page should be.
 */
function ContactFallback() {
  return (
    <GlassCard className="p-8">
      <p className="text-white/75 leading-relaxed mb-6">
        Prefer to talk now? Call either of us directly, or message us on
        WhatsApp — the callback form loads just below.
      </p>
      <div className="space-y-3">
        {CONTACTS.map((c) => (
          <a
            key={c.phone}
            href={`tel:${c.phone}`}
            className="liquid-glass-inset flex items-center gap-3 rounded-xl px-4 py-3.5 text-white transition-colors hover:bg-white/[0.08]"
          >
            <Phone size={17} aria-hidden className="text-[var(--color-violet-light)]" />
            <span className="font-medium">{c.display}</span>
            <span className="text-white/50 text-sm ml-auto">{c.name}</span>
          </a>
        ))}
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="liquid-glass-inset flex items-center gap-3 rounded-xl px-4 py-3.5 text-white transition-colors hover:bg-white/[0.08]"
        >
          <WhatsappIcon size={17} aria-hidden />
          <span className="font-medium">Message us on WhatsApp</span>
        </a>
      </div>
    </GlassCard>
  );
}

/**
 * `ssr: false` is the point of this file. It moves react-hook-form, zod,
 * @hookform/resolvers and sonner out of the homepage's initial JavaScript and
 * into a chunk fetched only once this below-the-fold panel is reached.
 */
const ContactForms = dynamic(() => import('./ContactForms'), {
  ssr: false,
  loading: () => <ContactFallback />,
});

export function ContactFormPanel() {
  return <ContactForms />;
}
