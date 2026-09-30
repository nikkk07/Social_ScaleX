import React from 'react';
import { Phone } from 'lucide-react';
import { WhatsappIcon } from '@/components/icons/WhatsappIcon';
import { CONTACT_OFFER, NEXT_STEPS, SERVICES } from '@/lib/content';
import { CONTACTS, PRIMARY_PHONE, WHATSAPP_URL, whatsappLink } from '@/lib/site';
import { LeadForm } from './LeadForm';

export function LeadSection({
  id = 'get-started',
  title = CONTACT_OFFER.heading,
  intro = CONTACT_OFFER.intro,
  defaultService,
  headingLevel = 2,
}: {
  id?: string;
  title?: string;
  intro?: string;
  defaultService?: string;
  headingLevel?: 1 | 2;
}) {
  const H = headingLevel === 1 ? 'h1' : 'h2';
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-24 border-t border-line bg-paper-2 py-section">
      <div className="wrap grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-16">
        <div>
          <p className="eyebrow">Free, no obligation</p>
          <H id={`${id}-title`} className={`mt-4 text-ink ${headingLevel === 1 ? 'text-5xl' : 'text-4xl'}`}>{title}</H>
          <p className="mt-4 max-w-lg text-lg text-ink-2">{intro}</p>
          <ol className="mt-8 space-y-5">
            {NEXT_STEPS.map((s, i) => (
              <li key={s.title} className="flex gap-4">
                <span className="grid size-8 flex-none place-items-center rounded-full bg-surface font-display text-sm text-ink ring-1 ring-line-strong">{i + 1}</span>
                <span>
                  <span className="block font-semibold text-ink">{s.title}</span>
                  <span className="text-sm text-ink-2">{s.desc}</span>
                </span>
              </li>
            ))}
          </ol>
          <div className="mt-10 border-t border-line-strong/60 pt-6">
            <p className="text-sm font-semibold text-ink">Prefer to talk now?</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {CONTACTS.map((c) => (
                <li key={c.phone}>
                  <a href={`tel:${c.phone}`} className="btn btn-secondary">
                    <Phone className="size-4" aria-hidden="true" /> {c.display}
                    <span className="font-normal text-ink-3">{c.name.split(' ')[0]}</span>
                  </a>
                </li>
              ))}
              <li>
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
                  <WhatsappIcon size={16} /> WhatsApp
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="card min-w-0 p-5 sm:p-8">
          <LeadForm
            services={SERVICES.map((s) => s.name)}
            phoneLabel={PRIMARY_PHONE.display}
            whatsappHref={whatsappLink('Hi Social ScaleX, I just sent the form on your website.')}
            defaultService={defaultService}
          />
        </div>
      </div>
    </section>
  );
}
