import React from 'react';
import { Reveal } from '../effects/Reveal';
import { ContactFormPanel } from './ContactFormPanel';

/**
 * Contact section. Server component: the heading, the offer and the copy are
 * in the served HTML, and only the form panel below hydrates.
 */
export function Contact() {
  return (
    <section
      id="contact"
      aria-labelledby="contact-heading"
      className="py-24 md:py-32 relative border-t border-white/5 section-cv"
    >
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="flex flex-col lg:flex-row gap-16 items-center">
          <Reveal className="w-full lg:w-1/2">
            <span className="text-[var(--color-violet-light)] font-medium tracking-wider uppercase text-sm mb-4 block">
              Ready to scale?
            </span>
            <h2
              id="contact-heading"
              className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white mb-6"
            >
              Let&apos;s build something your audience can&apos;t ignore.
            </h2>
            <p className="text-white/70 text-lg leading-relaxed max-w-lg">
              Your first strategy call is free. No pitch decks, no pressure —
              just an honest conversation about what growth looks like for your
              brand.
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
