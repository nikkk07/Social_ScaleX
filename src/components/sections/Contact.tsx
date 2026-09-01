import React from 'react';
import { Reveal } from '../effects/Reveal';
import { ContactFormPanel } from './ContactFormPanel';
import { CONTACT_OFFER } from '@/lib/content';

/**
 * Contact section. Server component: the heading, the offer and the copy are
 * in the served HTML, and only the form panel below hydrates.
 *
 * The offer copy now comes from CONTACT_OFFER rather than being typed into
 * this file. Same sentences as before — the move is what matters, since this
 * was the last marketing section still holding its own copy.
 */
export function Contact() {
  return (
    <section
      id="contact"
      aria-labelledby="contact-heading"
      className="py-section relative border-t border-stroke section-cv"
    >
      <div className="max-w-wide mx-auto px-gutter relative z-10">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-center">
          <Reveal className="w-full lg:w-1/2">
            <span className="text-cta font-medium tracking-caps uppercase text-2xs mb-4 block">
              {CONTACT_OFFER.eyebrow}
            </span>
            <h2
              id="contact-heading"
              className="text-5xl font-display font-bold text-ink mb-6"
            >
              {CONTACT_OFFER.heading}
            </h2>
            <p className="text-ink-muted text-lg max-w-lg">
              {CONTACT_OFFER.intro}
            </p>
          </Reveal>

          <Reveal className="w-full lg:w-1/2">
            <ContactFormPanel />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
