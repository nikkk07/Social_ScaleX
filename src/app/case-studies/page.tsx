import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { SiteShell } from '@/components/site/SiteShell';
import { PageIntro } from '@/components/site/PageIntro';
import { SectionHead } from '@/components/site/SectionHead';
import { FaqList } from '@/components/site/FaqList';
import { LeadSection } from '@/components/site/LeadSection';
import { ResultCase } from '@/components/site/Results';
import { ResultsFilter } from '@/components/site/ResultsFilter';
import { JsonLd } from '@/components/seo/JsonLd';
import { GOAL_LABEL, PORTFOLIO, PORTFOLIO_NOTE, RESULTS_FAQS, STATS, type ResultGoal } from '@/lib/content';
import { breadcrumbNode, caseStudyNode, faqNode, graph, webPageNode } from '@/lib/schema';

const PATH = '/case-studies';
const TITLE = 'Client Results: Instagram & YouTube Case Studies';
const DESCRIPTION =
  'Real results from brands and creators we work with: 400 to 12K followers since June, 10M+ Instagram views in 30 days, a 358K creator. Delhi NCR agency.';
const CRUMBS = [
  { name: 'Home', path: '/' },
  { name: 'Client results', path: PATH },
];

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  openGraph: { title: `${TITLE} | Social ScaleX`, description: DESCRIPTION, url: PATH },
};

const GOALS: ResultGoal[] = ['sales', 'awareness', 'creator'];

export default function CaseStudiesPage() {
  const filters = GOALS.filter((g) => PORTFOLIO.some((p) => p.goal === g)).map((g) => ({ key: g, label: GOAL_LABEL[g] }));

  return (
    <>
      <JsonLd
        data={graph([
          webPageNode({ path: PATH, name: TITLE, description: DESCRIPTION, type: 'CollectionPage', hasBreadcrumb: true }),
          breadcrumbNode(CRUMBS, PATH),
          ...PORTFOLIO.map(caseStudyNode),
          faqNode(RESULTS_FAQS, PATH),
        ])}
      />
      <SiteShell>
        <PageIntro
          crumbs={CRUMBS}
          eyebrow="Client results"
          title="Real accounts, real numbers"
          lede={
            <p>
              Stores that sell on Instagram, a brand that wanted to be known, and creators with audiences in the hundreds of
              thousands. Every figure comes from the client’s own dashboard, with their permission, and is rounded down, never up.
            </p>
          }
        >
          <dl className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-card border border-line bg-line lg:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="flex flex-col-reverse bg-surface p-5 sm:p-6">
                <dt className="mt-1 text-sm text-ink-3">{s.label}</dt>
                <dd className="font-display text-4xl text-ink sm:text-5xl">{s.value}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="#get-started" className="btn btn-primary btn-lg">Get a free plan <ArrowRight className="size-4" aria-hidden="true" /></Link>
            <Link href="#results" className="btn btn-secondary btn-lg">See the case studies</Link>
          </div>
        </PageIntro>

        <section id="results" aria-label="Case studies" className="scroll-mt-20 py-section">
          <div className="wrap">
            <ResultsFilter
              filters={filters}
              items={PORTFOLIO.map((p) => ({ id: p.id, group: p.goal, node: <ResultCase p={p} /> }))}
            />
            <p className="mt-8 text-sm text-ink-3">{PORTFOLIO_NOTE}</p>
          </div>
        </section>

        <section aria-labelledby="method-title" className="border-t border-line bg-surface py-section">
          <div className="wrap grid grid-cols-1 gap-10 lg:grid-cols-2">
            <SectionHead
              id="method-title"
              eyebrow="How we report"
              title="Numbers you can check yourself"
              intro="Every account links to its public profile, so you can see it for yourself."
            />
            <ul className="grid gap-6 text-ink-2">
              {[
                ['From the client’s dashboard', 'Views come from Instagram’s professional dashboard or YouTube Studio, not from screenshots we picked.'],
                ['Dated', 'Current figures were recorded on 30 September 2026. “Before” figures are the ones this site published on 1 July 2026.'],
                ['Rounded down', 'A figure shown as “6M+” means the dashboard showed more than 6 million. We never round up.'],
                ['Past clients stay honest', 'For accounts we no longer run, we show the number at hand-over, not what happened after.'],
              ].map(([t, d]) => (
                <li key={t} className="border-t-2 border-ink pt-4">
                  <h3 className="font-display text-2xl text-ink">{t}</h3>
                  <p className="mt-1">{d}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section aria-labelledby="faq-title" className="border-t border-line py-section">
          <div className="wrap grid grid-cols-1 gap-12 lg:grid-cols-[1fr_1.6fr]">
            <SectionHead id="faq-title" eyebrow="Questions" title="About these results" />
            <FaqList faqs={RESULTS_FAQS} />
          </div>
        </section>

        <LeadSection title="Want numbers like these on your account?" intro="Tell us where your account is today. On the free call we’ll show you what we’d change first." />
      </SiteShell>
    </>
  );
}
