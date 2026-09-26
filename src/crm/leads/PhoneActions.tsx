// Call + WhatsApp actions for a phone. wa.me needs digits only (no '+').
import React from 'react';
import { Phone } from 'lucide-react';
import { WhatsappIcon } from '@/components/icons/WhatsappIcon';
import { waNumber } from './leadsQuery';

export function PhoneActions({ phone }: { phone: string }) {
  if (!phone) return null;
  
  const btn =
    'inline-flex h-8 w-8 items-center justify-center rounded-md border border-[var(--border)] text-white/70 transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-violet-light)]';
  return (
    <div className="flex items-center gap-1.5">
      <a
        href={`tel:${phone}`}
        aria-label={`Call ${phone}`}
        title={phone}
        className={btn}
      >
        <Phone size={15} />
      </a>
      <a
        href={`https://wa.me/${waNumber(phone)}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`WhatsApp ${phone}`}
        className={btn}
      >
        <WhatsappIcon size={15} />
      </a>
    </div>
  );
}
