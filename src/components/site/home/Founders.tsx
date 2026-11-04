import React from 'react';
import Image from 'next/image';
import { Phone } from 'lucide-react';
import { LinkedinIcon } from '@/components/icons/PlatformIcons';
import { SectionHead } from '@/components/site/SectionHead';
import { FOUNDERS_SECTION } from '@/lib/content';
import { CONTACTS } from '@/lib/site';

const initials = (name: string) => name.split(' ').map((w) => w[0]).join('').slice(0, 2);

/**
 * Homepage section 7. Monograms stand in for portraits until the founders
 * supply real photos; no stock or generated faces.
 */
export function Founders() {
  return (
    <section aria-labelledby="founders-title" className="border-t border-line py-section">
      <div className="wrap grid grid-cols-1 gap-12 lg:grid-cols-[1fr_1.2fr] lg:items-center">
        <SectionHead id="founders-title" eyebrow={FOUNDERS_SECTION.eyebrow} title={FOUNDERS_SECTION.title} intro={FOUNDERS_SECTION.intro} />
        <ul className="rise grid gap-5 sm:grid-cols-2">
          {CONTACTS.map((c) => (
            <li key={c.phone} className="card flex flex-col p-6">
              {c.photo ? (
                <Image src={c.photo} alt={`${c.name}, ${c.role} of Social ScaleX`} width={160} height={160} sizes="80px" className="size-20 rounded-full object-cover" />
              ) : (
                <span aria-hidden="true" className="grid size-20 place-items-center rounded-full bg-night font-display text-3xl text-on-night">
                  {initials(c.name)}
                </span>
              )}
              <h3 className="mt-5 text-2xl text-ink">{c.name}</h3>
              <p className="text-sm text-ink-3">{c.role}, Social ScaleX</p>
              <ul className="mt-5 flex flex-wrap gap-2">
                <li>
                  <a href={`tel:${c.phone}`} className="btn btn-secondary">
                    <Phone className="size-4" aria-hidden="true" /> {c.display}
                  </a>
                </li>
                {c.linkedin ? (
                  <li>
                    <a href={c.linkedin} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
                      <LinkedinIcon size={16} /> LinkedIn<span className="sr-only">: {c.name} (opens in a new tab)</span>
                    </a>
                  </li>
                ) : null}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
