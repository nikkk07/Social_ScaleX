import React from 'react';
import type { Metadata } from 'next';
import { SiteShell } from '@/components/site/SiteShell';
import { PageIntro } from '@/components/site/PageIntro';
import { SectionHead } from '@/components/site/SectionHead';
import { FaqList } from '@/components/site/FaqList';
import { LeadSection } from '@/components/site/LeadSection';
import { ResultsFilter } from '@/components/site/ResultsFilter';
import { StoryPanels, StoryRings, StoryTile } from '@/components/site/CaseStories';
import { StoryController } from '@/components/site/StoryController';
import { JsonLd } from '@/components/seo/JsonLd';
import { GOAL_LABEL, PORTFOLIO, PORTFOLIO_NOTE, RESULTS_AS_OF, RESULTS_FAQS, STATS, type ResultGoal } from '@/lib/content';
import { UpdatedAgo } from '@/components/site/UpdatedAgo';
import { breadcrumbNode, caseStudyNode, faqNode, graph, webPageNode } from '@/lib/schema';
import { socialMeta } from '@/lib/site';

const PATH = '/case-studies';
const TITLE = 'Client Results: Instagram & YouTube Case Studies';
const DESCRIPTION =
  'Real results from brands and creators we work with: 400 to 13.1K followers since June, 10M+ Instagram views in 30 days, a 358K creator. Delhi NCR agency.';
const CRUMBS = [
  { name: 'Home', path: '/' },
  { name: 'Client results', path: PATH },
];

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  ...socialMeta({ title: TITLE, description: DESCRIPTION, path: PATH }),
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
          title={`Instagram and YouTube results from ${PORTFOLIO.length} real clients`}
          lede={
            <p>
              Choose a profile to see its story: where the account started, what we changed and what happened next. Every number
              comes from the client’s own dashboard, with their permission, and we round it down, never up.
            </p>
          }
        >
          <p className="mt-8 text-sm font-semibold text-ink">Choose a profile to open its story</p>
          <div className="mt-3"><StoryRings /></div>
          <p className="mt-8 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink-2">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-positive" />
            <UpdatedAgo iso={RESULTS_AS_OF} prefix="Figures updated" />
          </p>
          <dl className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-card border border-line bg-line lg:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="flex flex-col-reverse bg-surface p-5 sm:p-6">
                <dt className="mt-1 text-sm text-ink-3">{s.label}</dt>
                <dd className="font-display text-4xl text-ink sm:text-5xl">{s.value}</dd>
              </div>
            ))}
          </dl>
        </PageIntro>

        <section id="results" aria-labelledby="results-title" className="scroll-mt-20 py-section">
          <div className="wrap">
            <SectionHead
              id="results-title"
              eyebrow={`${PORTFOLIO.length} case studies`}
              title="Pick an account"
              intro="Each card opens the full story, with dated figures and a link to the live profile."
            />
            <div className="mt-8">
              <ResultsFilter
                filters={filters}
                gridClassName="mt-5 grid grid-cols-1 gap-3 min-[340px]:grid-cols-2 min-[340px]:[&>li:last-child:nth-child(odd)]:col-span-2 sm:gap-4 lg:grid-cols-4 lg:[&>li:last-child:nth-child(odd)]:col-span-1"
                items={PORTFOLIO.map((p) => ({ id: p.id, group: p.goal, node: <StoryTile p={p} /> }))}
              />
            </div>
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
                ['Dated', 'We recorded current figures on 30 September 2026 (Saini Telecom on 15 October 2026). “Before” figures are the ones this site published on 1 July 2026, or the count when we took the account over.'],
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
        <StoryPanels />
        <StoryController />
      </SiteShell>
    </>
  );
}
