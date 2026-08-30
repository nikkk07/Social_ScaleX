import React from 'react';
import Link from 'next/link';
import { Instagram, Facebook, Youtube, ArrowRight } from 'lucide-react';
import { Reveal } from '../effects/Reveal';
import { SERVICES } from '@/lib/content';

const platforms = [
  { name: 'Instagram', icon: Instagram, stat: '336K followers managed' },
  { name: 'Facebook', icon: Facebook, stat: 'Meta ads built to convert' },
  { name: 'YouTube', icon: Youtube, stat: '96.6K subscribers managed' },
];

export function Services() {
  return (
    <section
      id="services"
      aria-labelledby="services-heading"
      className="py-24 md:py-32 relative border-t border-white/5 section-cv"
    >
      <div className="max-w-7xl mx-auto px-6">
        <Reveal className="max-w-3xl mb-14">
          <span className="text-[var(--color-violet-light)] font-medium tracking-wider uppercase text-sm mb-4 block">
            What we do
          </span>
          <h2
            id="services-heading"
            className="text-4xl md:text-5xl font-display font-bold text-white mb-5"
          >
            Everything your brand needs to scale.
          </h2>
          <p className="text-white/70 text-lg leading-relaxed">
            Instagram page management, Reels production, Meta ads, influencer
            marketing — delivered as one connected system, not a menu of add-ons.
          </p>
        </Reveal>

        <Reveal>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/[0.07] rounded-2xl overflow-hidden border border-white/[0.08] mb-10">
            {SERVICES.map((s) => (
              <Link
                key={s.slug}
                href={`/services#${s.slug}`}
                className="bg-[var(--color-void-black)] hover:bg-white/[0.03] transition-colors p-7 md:p-8 flex gap-5 focus-visible:outline-none focus-visible:bg-white/[0.05]"
              >
                <span className="font-display font-bold text-lg text-[var(--color-violet-light)] tabular-nums shrink-0">
                  {s.id}
                </span>
                <div>
                  <h3 className="text-lg font-display font-bold text-white mb-1.5">
                    {s.title}
                  </h3>
                  <p className="text-sm text-white/65 leading-relaxed">{s.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </Reveal>

        <Reveal className="mb-16 flex justify-center">
          <Link
            href="/services"
            className="liquid-glass inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-medium text-white transition-transform duration-200 hover:scale-[1.02] active:scale-95"
          >
            <span>See what each service includes</span>
            <ArrowRight size={18} aria-hidden />
          </Link>
        </Reveal>

        <Reveal>
          <div className="liquid-glass rounded-2xl p-6 md:p-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 divide-y sm:divide-y-0 sm:divide-x divide-white/10">
              {platforms.map(({ name, icon: Icon, stat }) => (
                <div
                  key={name}
                  className="flex items-center gap-4 pt-6 first:pt-0 sm:pt-0 sm:px-6 sm:first:pl-0"
                >
                  <span className="w-11 h-11 rounded-xl liquid-glass-lite flex items-center justify-center shrink-0">
                    <Icon size={20} className="text-white" aria-hidden />
                  </span>
                  <div>
                    <div className="text-white font-display font-bold">{name}</div>
                    <div className="text-sm text-white/65">{stat}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
