import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { CONTACTS } from '@/lib/site';

interface LegalPageProps {
  title: string;
  updated: string;
  children: React.ReactNode;
}

/**
 * Shared shell for Privacy / Terms — simple, readable, no heavy effects.
 *
 * The Vite version set document.title from a useEffect and restored it on
 * unmount. That is gone: the page's `metadata` export handles the title, so
 * it is in the served HTML instead of being applied after hydration.
 */
export function LegalPage({ title, updated, children }: LegalPageProps) {
  return (
    <div className="min-h-screen bg-base-950 text-ink font-sans antialiased">
      <div className="max-w-content mx-auto px-gutter py-section">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-ink-muted hover:text-ink transition-colors mb-10 text-sm font-medium"
        >
          <ArrowLeft size={16} aria-hidden />
          <span>Back to Social ScaleX</span>
        </Link>

        <h1 className="text-5xl font-display font-bold tracking-display text-ink mb-3">
          {title}
        </h1>
        <p className="text-ink-subtle text-sm mb-12">Last updated: {updated}</p>

        <div className="space-y-8 text-ink-muted [&_h2]:text-ink [&_h2]:font-display [&_h2]:font-bold [&_h2]:text-xl [&_h2]:mb-3 [&_h2]:mt-2">
          {children}
        </div>

        <div className="mt-16 pt-8 border-t border-stroke text-sm text-ink-subtle">
          Questions about this page? Call us at{' '}
          <a
            href={`tel:${CONTACTS[0].phone}`}
            className="text-cta hover:underline"
          >
            {CONTACTS[0].display}
          </a>{' '}
          or use the contact form on our homepage.
        </div>
      </div>
    </div>
  );
}
