import React from 'react';
import { SectionHead } from '@/components/site/SectionHead';
import type { Testimonial } from '@/lib/content';

/** Client quotes, given with permission. Renders nothing until there is at least one. */
export function Testimonials({ items, title = 'What clients say' }: { items: Testimonial[]; title?: string }) {
  if (!items.length) return null;
  return (
    <section aria-labelledby="quotes-title" className="border-t border-line py-section">
      <div className="wrap">
        <SectionHead id="quotes-title" eyebrow="In their words" title={title} />
        <ul className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {items.map((t) => (
            <li key={`${t.name}-${t.date}`}>
              <figure className="card flex h-full flex-col p-6">
                <blockquote className="flex-1 font-display text-xl leading-snug text-ink">“{t.quote}”</blockquote>
                <figcaption className="mt-5 border-t border-line pt-4 text-sm">
                  <span className="block font-semibold text-ink">{t.name}</span>
                  <span className="text-ink-3">{t.role}</span>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
