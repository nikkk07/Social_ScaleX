import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteShell } from '@/components/site/SiteShell';
import { SERVICES } from '@/lib/content';

export const metadata: Metadata = {
  title: 'Page not found',
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <SiteShell>
      <section className="wrap py-section">
        <p className="eyebrow">Error 404</p>
        <h1 className="mt-4 max-w-3xl text-5xl text-ink">This page doesn’t exist, but these do.</h1>
        <p className="mt-5 max-w-xl text-lg text-ink-2">The link may be old or mistyped. Try one of these instead.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/" className="btn btn-primary">Go to the homepage</Link>
          <Link href="/contact" className="btn btn-secondary">Contact us</Link>
        </div>
        <ul className="mt-12 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICES.map((s) => (
            <li key={s.slug}><Link href={`/services/${s.slug}`} className="link">{s.name}</Link></li>
          ))}
        </ul>
      </section>
    </SiteShell>
  );
}
