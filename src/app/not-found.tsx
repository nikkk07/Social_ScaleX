import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { MarketingShell } from '@/components/MarketingShell';

/**
 * A real 404.
 *
 * The Vite router sent every unknown path to the homepage with a 200. That is
 * a soft 404: Google treats duplicated homepage content across arbitrary URLs
 * as a quality problem, and it hides genuinely broken internal links. This
 * returns the correct status and offers the routes that do exist.
 */
export const metadata: Metadata = {
  title: 'Page not found',
  robots: { index: false, follow: true },
};

const LINKS = [
  { href: '/', label: 'Home' },
  { href: '/services', label: 'Services' },
  { href: '/case-studies', label: 'Case studies' },
  { href: '/about', label: 'About' },
];

export default function NotFound() {
  return (
    <MarketingShell>
      <section className="min-h-[70svh] flex flex-col justify-center items-center text-center px-6 pt-32 pb-24">
        <p className="text-[var(--color-violet-light)] font-medium tracking-wider uppercase text-sm mb-4">
          404
        </p>
        <h1 className="text-4xl md:text-6xl font-display font-bold text-white mb-5">
          That page doesn&apos;t exist.
        </h1>
        <p className="text-white/70 text-lg leading-relaxed max-w-xl mb-10">
          The link may be out of date, or the address slightly off. Everything
          on the site is one click away below.
        </p>
        <nav aria-label="Main pages" className="flex flex-wrap justify-center gap-3">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="liquid-glass rounded-full px-6 py-3 font-medium text-white transition-transform duration-200 hover:scale-[1.03] active:scale-95"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </section>
    </MarketingShell>
  );
}
