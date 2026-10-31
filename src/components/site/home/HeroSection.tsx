import React from 'react';
import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import { WhatsappIcon } from '@/components/icons/WhatsappIcon';
import { ProofPanel } from '@/components/site/ProofPanel';
import { whatsappLink } from '@/lib/site';

/**
 * Section 1: the original light hero (server-rendered text and the proof
 * panel, no WebGL), so the first screen paints as fast as the site can.
 * Mild additions only: buttons lean toward the pointer (TiltLayer).
 */
export function HeroSection() {
  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden">
      <div className="wrap grid grid-cols-1 items-center gap-14 pb-20 pt-12 sm:pt-16 lg:grid-cols-[1.25fr_1fr] lg:gap-16 lg:pb-28 lg:pt-20">
        <div>
          <h1 id="hero-title">
            <span className="eyebrow">Social media marketing agency in Delhi NCR</span>
            <span className="mt-5 block text-6xl text-ink">
              We grow brands where their customers <em className="font-normal italic text-coral-text">already</em> scroll.
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-ink-2">
            Social ScaleX plans, shoots, posts and advertises for brands and creators on Instagram, Facebook and YouTube, then reports every result from your own dashboard.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/contact" data-magnetic className="btn btn-primary btn-lg">
              Book a free strategy call <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <a href={whatsappLink('Hi Social ScaleX, I’d like to grow my brand on social media.')} target="_blank" rel="noopener noreferrer" data-magnetic className="btn btn-secondary btn-lg">
              <WhatsappIcon size={18} /> Chat on WhatsApp
            </a>
          </div>
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-2">
            {['You keep every account', 'Reports from your own analytics', 'Talk directly to the founders'].map((t) => (
              <li key={t} className="inline-flex items-center gap-2">
                <Check className="size-4 text-positive" aria-hidden="true" /> {t}
              </li>
            ))}
          </ul>
        </div>
        <ProofPanel />
      </div>
    </section>
  );
}
