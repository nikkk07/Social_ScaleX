import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteShell } from '@/components/site/SiteShell';
import { PageIntro } from '@/components/site/PageIntro';
import { MetricList } from '@/components/site/Cards';
import { LeadSection } from '@/components/site/LeadSection';
import { JsonLd } from '@/components/seo/JsonLd';
import { PORTFOLIO, PORTFOLIO_NOTE, getService } from '@/lib/content';
import { breadcrumbNode, caseStudyNode, graph, webPageNode } from '@/lib/schema';

const TITLE = 'Client Results & Case Studies';
const DESCRIPTION =
  'Real Instagram and YouTube results from accounts Social ScaleX manages: 4.2M monthly views, 336K followers, 96.6K subscribers. Figures from client analytics.';
const CRUMBS = [
  { name: 'Home', path: '/' },
  { name: 'Client results', path: '/case-studies' },
];

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/case-studies' },
  openGraph: { title: `${TITLE} | Social ScaleX`, description: DESCRIPTION, url: '/case-studies' },
};

export default function CaseStudiesPage() {
  return (
    <>
      <JsonLd
        data={graph([
          webPageNode({ path: '/case-studies', name: TITLE, description: DESCRIPTION, type: 'CollectionPage', hasBreadcrumb: true }),
          breadcrumbNode(CRUMBS, '/case-studies'),
          ...PORTFOLIO.map(caseStudyNode),
        ])}
      />
      <SiteShell>
        <PageIntro
          crumbs={CRUMBS}
          eyebrow="Client results"
          title="Real accounts, real numbers"
          lede={<p>Every account below is one we run today. The figures come from each client’s own Instagram or YouTube dashboard, published with their permission. No projections, and nothing rounded up.</p>}
        >
          <nav aria-label="Case studies on this page" className="mt-8">
            <ul className="flex flex-wrap gap-2">
              {PORTFOLIO.map((p) => (
                <li key={p.id}><a href={`#${p.id}`} className="btn btn-secondary">{p.client}</a></li>
              ))}
            </ul>
          </nav>
        </PageIntro>

        <div className="py-section">
          <div className="wrap grid gap-8">
            {PORTFOLIO.map((p) => (
              <article key={p.id} id={p.id} aria-labelledby={`${p.id}-title`} className="card scroll-mt-24 overflow-hidden">
                <div className="grid gap-10 p-6 sm:p-10 lg:grid-cols-[1.3fr_1fr]">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-3">{p.kind} · {p.platform}</p>
                    <h2 id={`${p.id}-title`} className="mt-3 text-4xl text-ink">{p.client}</h2>
                    <p className="mt-1 text-ink-3">{p.category}</p>
                    <p className="mt-6 text-lg text-ink-2">{p.detail}</p>
                    <h3 className="mt-8 font-sans text-sm font-semibold text-ink">Services on this account</h3>
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {p.services.map(getService).filter((x): x is NonNullable<typeof x> => Boolean(x)).map((s) => (
                        <li key={s.slug}>
                          <Link href={`/services/${s.slug}`} className="inline-block rounded-full bg-paper-2 px-3.5 py-1.5 text-sm text-ink hover:bg-coral-tint">{s.name}</Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="self-start rounded-card bg-paper p-6 ring-1 ring-line">
                    <h3 className="font-sans text-sm font-semibold text-ink">The numbers</h3>
                    <div className="mt-5"><MetricList metrics={p.metrics} size="lg" /></div>
                  </div>
                </div>
              </article>
            ))}
            <p className="text-sm text-ink-3">{PORTFOLIO_NOTE}</p>
          </div>
        </div>

        <LeadSection title="Want numbers like these on your account?" intro="Tell us where your account is today. On the free call we’ll show you what we’d change first." />
      </SiteShell>
    </>
  );
}
