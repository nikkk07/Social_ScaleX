import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { SiteShell } from '@/components/site/SiteShell';
import { PageIntro } from '@/components/site/PageIntro';
import { SectionHead } from '@/components/site/SectionHead';
import { FaqList } from '@/components/site/FaqList';
import { LeadSection } from '@/components/site/LeadSection';
import { ServiceCard } from '@/components/site/Cards';
import { AutomationCard } from '@/components/site/AutomationCard';
import { JsonLd } from '@/components/seo/JsonLd';
import { GOALS, getGoal } from '@/lib/goals';
import { getService } from '@/lib/content';
import { getAutomation } from '@/lib/automation';
import { breadcrumbNode, faqNode, graph, webPageNode } from '@/lib/schema';

export const dynamicParams = false;

export function generateStaticParams() {
  return GOALS.map((g) => ({ slug: g.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const g = getGoal(params.slug);
  if (!g) return {};
  const path = `/solutions/${g.slug}`;
  return {
    title: g.metaTitle,
    description: g.metaDescription,
    alternates: { canonical: path },
    openGraph: { title: `${g.metaTitle} | Social ScaleX`, description: g.metaDescription, url: path },
  };
}

export default function GoalPage({ params }: { params: { slug: string } }) {
  const g = getGoal(params.slug);
  if (!g) notFound();
  const path = `/solutions/${g.slug}`;
  const crumbs = [
    { name: 'Home', path: '/' },
    { name: 'Services', path: '/services' },
    { name: g.name, path },
  ];
  const services = g.services.map(getService).filter((x): x is NonNullable<typeof x> => Boolean(x));
  const autos = g.automations.map(getAutomation).filter((x): x is NonNullable<typeof x> => Boolean(x));

  return (
    <>
      <JsonLd
        data={graph([
          webPageNode({ path, name: g.metaTitle, description: g.metaDescription, hasBreadcrumb: true }),
          breadcrumbNode(crumbs, path),
          faqNode(g.faqs, path),
        ])}
      />
      <SiteShell>
        <PageIntro crumbs={crumbs} eyebrow="Solutions" title={g.h1} lede={<p>{g.lede}</p>}>
          <div className="mt-8">
            <Link href="#get-started" className="btn btn-primary btn-lg">Book a free strategy call <ArrowRight className="size-4" aria-hidden="true" /></Link>
          </div>
        </PageIntro>

        <section aria-labelledby="plan-title" className="py-section">
          <div className="wrap">
            <SectionHead id="plan-title" eyebrow="The plan" title="How we get you there" />
            <ol className="mt-10 grid gap-px overflow-hidden rounded-card border border-line bg-line md:grid-cols-2 lg:grid-cols-4">
              {g.plan.map((st, i) => (
                <li key={st.title} className="bg-surface p-6">
                  <span className="font-display text-sm text-coral-text">Step {i + 1}</span>
                  <h3 className="mt-2 text-2xl text-ink">{st.title}</h3>
                  <p className="mt-2 text-ink-2">{st.desc}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section aria-labelledby="measure-title" className="border-t border-line bg-surface py-section">
          <div className="wrap grid grid-cols-1 gap-10 lg:grid-cols-2">
            <SectionHead id="measure-title" eyebrow="What we measure" title="Numbers that show it’s working" intro="All from your own dashboards, never screenshots we picked." />
            <dl className="grid gap-6">
              {g.measures.map((m) => (
                <div key={m.metric} className="border-t-2 border-ink pt-4">
                  <dt className="font-display text-2xl text-ink">{m.metric}</dt>
                  <dd className="mt-1 text-ink-2">{m.why}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section aria-labelledby="services-title" className="border-t border-line bg-paper-2 py-section">
          <div className="wrap">
            <SectionHead id="services-title" eyebrow="What we use" title="Services and automations for this goal" />
            <ul className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {services.map((s) => <li key={s.slug}><ServiceCard s={s} /></li>)}
              {autos.map((a) => <li key={a.slug}><AutomationCard a={a} /></li>)}
            </ul>
          </div>
        </section>

        <section aria-labelledby="faq-title" className="border-t border-line py-section">
          <div className="wrap grid grid-cols-1 gap-12 lg:grid-cols-[1fr_1.6fr]">
            <SectionHead id="faq-title" eyebrow="Questions" title="Common questions" />
            <FaqList faqs={g.faqs} />
          </div>
        </section>

        <LeadSection />
      </SiteShell>
    </>
  );
}
