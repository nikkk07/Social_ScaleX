import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { SiteShell } from '@/components/site/SiteShell';
import { PageIntro } from '@/components/site/PageIntro';
import { LeadSection } from '@/components/site/LeadSection';
import { JsonLd } from '@/components/seo/JsonLd';
import { SERVICES } from '@/lib/content';
import { breadcrumbNode, graph, itemListNode, webPageNode } from '@/lib/schema';

const TITLE = 'Social Media Marketing Services';
const DESCRIPTION =
  'Instagram and Facebook management, Reels production, Meta ads, Google Ads, YouTube, influencer marketing, shoots and strategy for Delhi NCR brands.';
const CRUMBS = [
  { name: 'Home', path: '/' },
  { name: 'Services', path: '/services' },
];

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/services' },
  openGraph: { title: `${TITLE} | Social ScaleX`, description: DESCRIPTION, url: '/services' },
};

export default function ServicesPage() {
  return (
    <>
      <JsonLd
        data={graph([
          webPageNode({ path: '/services', name: TITLE, description: DESCRIPTION, type: 'CollectionPage', hasBreadcrumb: true }),
          breadcrumbNode(CRUMBS, '/services'),
          itemListNode('/services#list', SERVICES.map((s) => ({ name: s.name, path: `/services/${s.slug}` }))),
        ])}
      />
      <SiteShell>
        <PageIntro
          crumbs={CRUMBS}
          eyebrow="Services"
          title="Social media marketing services for Delhi NCR brands"
          lede="Eight services that work as one system: content that earns attention, page management that keeps it, and paid ads on Meta and Google that turn it into enquiries. Pick one, or let us run the lot."
        />
        <section aria-label="All services" className="py-section">
          <ol className="wrap grid gap-5">
            {SERVICES.map((s, i) => (
              <li key={s.slug} className="card grid gap-6 p-6 sm:p-8 lg:grid-cols-[3rem_1fr_1.2fr_auto] lg:items-start">
                <span className="font-display text-xl text-coral-text">{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <h2 className="text-3xl text-ink">
                    <Link href={`/services/${s.slug}`} className="hover:text-coral-text">{s.name}</Link>
                  </h2>
                  <p className="mt-3 text-ink-2">{s.outcome}</p>
                </div>
                <ul className="grid gap-2 text-sm text-ink-2">
                  {s.deliverables.slice(0, 4).map((d) => (
                    <li key={d} className="flex gap-2"><span aria-hidden="true" className="mt-2 size-1.5 flex-none rounded-full bg-coral" />{d}</li>
                  ))}
                </ul>
                <Link href={`/services/${s.slug}`} className="btn btn-secondary self-start">
                  Details<span className="sr-only"> on {s.name}</span> <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ol>
        </section>
        <LeadSection title="Not sure which service you need?" intro="Tell us about your brand. On the free strategy call we’ll say what we would do first, and what we wouldn’t spend money on yet." />
      </SiteShell>
    </>
  );
}
