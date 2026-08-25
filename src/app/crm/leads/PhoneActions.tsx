// Call + WhatsApp actions for a phone. wa.me needs digits only (no '+').
import React from 'react';
import { Phone } from 'lucide-react';
import { WhatsappIcon } from '../../components/icons/WhatsappIcon';
import { waNumber, type LeadPhoneRow } from './leadsQuery';

export function PhoneActions({ phone }: { phone: LeadPhoneRow }) {
  const btn =
    'inline-flex h-8 w-8 items-center justify-center rounded-md border border-[var(--border)] text-white/70 transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-violet-light)]';
  return (
    <div className="flex items-center gap-1.5">
      <a
        href={`tel:${phone.phone_e164}`}
        aria-label={`Call ${phone.phone_e164}`}
        title={phone.phone_e164}
        className={btn}
      >
        <Phone size={15} />
      </a>
      <a
        href={`https://wa.me/${waNumber(phone.phone_e164)}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`WhatsApp ${phone.phone_e164}`}
        className={btn}
      >
        <WhatsappIcon size={15} />
      </a>
    </div>
  );
}
