import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteShell } from '@/components/site/SiteShell';
import { PageIntro } from '@/components/site/PageIntro';
import { LeadSection } from '@/components/site/LeadSection';
import { JsonLd } from '@/components/seo/JsonLd';
import { GUIDES } from '@/lib/guides';
import { breadcrumbNode, graph, itemListNode, webPageNode } from '@/lib/schema';

const TITLE = 'Social Media Marketing Guides';
const DESCRIPTION =
  'Plain-English guides on Instagram Reels reach, Meta vs Google Ads and hiring a social media agency, sourced from the platforms’ own documentation.';
const CRUMBS = [
  { name: 'Home', path: '/' },
  { name: 'Guides', path: '/guides' },
];

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/guides' },
  openGraph: { title: `${TITLE} | Social ScaleX`, description: DESCRIPTION, url: '/guides' },
};

const fmt = (d: string) => new Date(`${d}T00:00:00+05:30`).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' });

export default function GuidesPage() {
  return (
    <>
      <JsonLd
        data={graph([
          webPageNode({ path: '/guides', name: TITLE, description: DESCRIPTION, type: 'CollectionPage', hasBreadcrumb: true }),
          breadcrumbNode(CRUMBS, '/guides'),
          itemListNode('/guides#list', GUIDES.map((g) => ({ name: g.title, path: `/guides/${g.slug}` }))),
        ])}
      />
      <SiteShell>
        <PageIntro
          crumbs={CRUMBS}
          eyebrow="Guides"
          title="How the platforms actually work"
          lede={<p>Short, practical guides for business owners. Every platform fact links to Instagram’s, Meta’s or Google’s own documentation, so you can check it yourself.</p>}
        />
        <section aria-label="All guides" className="py-section">
          <ul className="wrap grid gap-5">
            {GUIDES.map((g) => (
              <li key={g.slug}>
                <article className="card card-link relative grid gap-4 p-6 sm:p-8 lg:grid-cols-[1fr_1.3fr]">
                  <h2 className="text-3xl text-ink">
                    <Link href={`/guides/${g.slug}`} className="after:absolute after:inset-0">{g.title}</Link>
                  </h2>
                  <div>
                    <p className="text-ink-2">{g.summary}</p>
                    <p className="mt-4 text-sm text-ink-3">Updated <time dateTime={g.updated}>{fmt(g.updated)}</time> · {g.sources.length} sources</p>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        </section>
        <LeadSection />
      </SiteShell>
    </>
  );
}
