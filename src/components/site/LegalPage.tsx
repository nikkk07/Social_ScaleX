import React from 'react';
import { SiteShell } from './SiteShell';
import { Breadcrumbs } from './Breadcrumbs';
import { CONTACTS } from '@/lib/site';
import type { Crumb } from '@/lib/schema';

export function LegalPage({ title, updated, crumbs, children }: { title: string; updated: string; crumbs: Crumb[]; children: React.ReactNode }) {
  return (
    <SiteShell>
      <article className="wrap max-w-content py-12 sm:py-16">
        <Breadcrumbs crumbs={crumbs} />
        <h1 className="mt-10 text-5xl text-ink">{title}</h1>
        <p className="mt-3 text-sm text-ink-3">Last updated: {updated}</p>
        <div className="prose-site mt-10">{children}</div>
        <p className="mt-16 border-t border-line pt-8 text-sm text-ink-3">
          Questions about this page? Call{' '}
          <a href={`tel:${CONTACTS[0].phone}`} className="link">{CONTACTS[0].display}</a>.
        </p>
      </article>
    </SiteShell>
  );
}
