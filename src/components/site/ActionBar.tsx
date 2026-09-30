import React from 'react';
import Link from 'next/link';
import { Phone } from 'lucide-react';
import { WhatsappIcon } from '@/components/icons/WhatsappIcon';
import { PRIMARY_PHONE, WHATSAPP_URL } from '@/lib/site';

/** Thumb-zone contact bar on phones. Hidden from 768px up. */
export function ActionBar() {
  return (
    <div className="action-bar" role="region" aria-label="Quick contact">
      <a href={`tel:${PRIMARY_PHONE.phone}`} className="btn btn-secondary">
        <Phone className="size-4" aria-hidden="true" /> Call
      </a>
      <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
        <WhatsappIcon size={16} /> WhatsApp
      </a>
      <Link href="/contact" className="btn btn-primary">Free call</Link>
    </div>
  );
}
