import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, Check, Minus } from 'lucide-react';
import { SiteShell } from '@/components/site/SiteShell';
import { PageIntro } from '@/components/site/PageIntro';
import { SectionHead } from '@/components/site/SectionHead';
import { FaqList } from '@/components/site/FaqList';
import { LeadSection } from '@/components/site/LeadSection';
import { ServiceCard, MetricList } from '@/components/site/Cards';
import { JsonLd } from '@/components/seo/JsonLd';
import { WhatsappIcon } from '@/components/icons/WhatsappIcon';
import { PORTFOLIO, PORTFOLIO_NOTE, PRINCIPLES, SERVICES, getService, inSentence } from '@/lib/content';
import { GUIDES } from '@/lib/guides';
import { whatsappLink } from '@/lib/site';
import { breadcrumbNode, faqNode, graph, serviceNode, webPageNode } from '@/lib/schema';

export const dynamicParams = false;

export function generateStaticParams() {
  return SERVICES.map((s) => ({ slug: s.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const s = getService((await params).slug);
  if (!s) return {};
  const path = `/services/${s.slug}`;
  return {
    title: s.metaTitle,
    description: s.metaDescription,
    alternates: { canonical: path },
    openGraph: { title: `${s.metaTitle} | Social ScaleX`, description: s.metaDescription, url: path },
  };
}

export default async function ServicePage({ params }: Props) {
  const s = getService((await params).slug);
  if (!s) notFound();
  const path = `/services/${s.slug}`;
  const crumbs = [
    { name: 'Home', path: '/' },
    { name: 'Services', path: '/services' },
    { name: s.name, path },
  ];
  const cases = PORTFOLIO.filter((p) => s.caseIds.includes(p.id));
  const related = s.related.map(getService).filter((x): x is NonNullable<typeof x> => Boolean(x));
  const guides = GUIDES.filter((g) => g.services.includes(s.slug));

  return (
    <>
      <JsonLd
        data={graph([
          webPageNode({ path, name: s.metaTitle, description: s.metaDescription, hasBreadcrumb: true }),
          breadcrumbNode(crumbs, path),
          serviceNode(s),
          faqNode(s.faqs, path),
        ])}
      />
      <SiteShell>
        <PageIntro crumbs={crumbs} eyebrow={s.name} title={s.h1} lede={<p>{s.lede}</p>}>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="#get-started" className="btn btn-primary btn-lg">
              Book a free strategy call <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <a href={whatsappLink(`Hi Social ScaleX, I’m interested in ${s.name}.`)} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-lg">
              <WhatsappIcon size={18} /> Ask on WhatsApp
            </a>
          </div>
        </PageIntro>

        <section aria-labelledby="included-title" className="py-section">
          <div className="wrap grid grid-cols-1 gap-12 lg:grid-cols-[1fr_1.3fr]">
            <SectionHead id="included-title" eyebrow="What’s included" title={`What you get with ${inSentence(s.name)}`} intro={s.outcome} />
            <ul className="grid gap-px overflow-hidden rounded-card border border-line bg-line sm:grid-cols-2 sm:[&>li:last-child:nth-child(odd)]:col-span-2">
              {s.deliverables.map((d) => (
                <li key={d} className="flex gap-3 bg-surface p-5 text-ink-2">
                  <Check className="mt-0.5 size-5 flex-none text-coral-text" aria-hidden="true" />
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section aria-labelledby="fit-title" className="border-t border-line bg-paper-2 py-section">
          <div className="wrap">
            <SectionHead id="fit-title" eyebrow="Is it right for you?" title="Who this is for, and who it isn’t" />
            <div className="mt-10 grid gap-5 md:grid-cols-2">
              <div className="card p-6 sm:p-8">
                <h3 className="text-2xl text-ink">A good fit if…</h3>
                <ul className="mt-5 space-y-3 text-ink-2">
                  {s.fit.map((f) => (
                    <li key={f} className="flex gap-3"><Check className="mt-1 size-4 flex-none text-positive" aria-hidden="true" />{f}</li>
                  ))}
                </ul>
              </div>
              <div className="card p-6 sm:p-8">
                <h3 className="text-2xl text-ink">Probably not a fit if…</h3>
                <ul className="mt-5 space-y-3 text-ink-2">
                  {s.notFit.map((f) => (
                    <li key={f} className="flex gap-3"><Minus className="mt-1 size-4 flex-none text-ink-3" aria-hidden="true" />{f}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section aria-labelledby="how-title" className="py-section">
          <div className="wrap">
            <SectionHead id="how-title" eyebrow="How it works" title={`How we run ${inSentence(s.name)}`} />
            <ol className="mt-10 grid gap-px overflow-hidden rounded-card border border-line bg-line md:grid-cols-2 lg:grid-cols-4">
              {s.steps.map((st, i) => (
                <li key={st.title} className="bg-surface p-6">
                  <span className="font-display text-sm text-coral-text">Step {i + 1}</span>
                  <h3 className="mt-2 text-2xl text-ink">{st.title}</h3>
                  <p className="mt-2 text-ink-2">{st.desc}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {cases.length ? (
          <section aria-labelledby="proof-title" className="border-t border-line bg-surface py-section">
            <div className="wrap">
              <SectionHead id="proof-title" eyebrow="Proof" title="Accounts where we’ve done this" intro={PORTFOLIO_NOTE} />
              <ul className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {cases.map((p) => (
                  <li key={p.id} className="card flex flex-col p-6">
                    <h3 className="text-2xl text-ink">{p.client}</h3>
                    <p className="mt-1 text-sm text-ink-3">{p.category} · {p.platform}</p>
                    <div className="mt-6 flex-1 border-t border-line pt-5">
                      {p.metrics.length ? <MetricList metrics={p.metrics} /> : <p className="text-ink-2">{p.description}</p>}
                    </div>
                    <Link href={`/case-studies#${p.id}`} className="link mt-5 text-sm">Read the case<span className="sr-only">: {p.client}</span></Link>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ) : (
          <section aria-labelledby="proof-title" className="border-t border-line bg-surface py-section">
            <div className="wrap">
              <SectionHead id="proof-title" eyebrow="How we work with you" title="What you can hold us to" />
              <ul className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
                {PRINCIPLES.map((p) => (
                  <li key={p.title} className="border-t-2 border-ink pt-5">
                    <h3 className="text-xl text-ink">{p.title}</h3>
                    <p className="mt-2 text-ink-2">{p.desc}</p>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        <section aria-labelledby="faq-title" className="border-t border-line py-section">
          <div className="wrap grid grid-cols-1 gap-12 lg:grid-cols-[1fr_1.6fr]">
            <SectionHead
              id="faq-title"
              eyebrow={`${s.name}: FAQs`}
              title="Common questions"
              intro={guides.length ? (
                <>Go deeper: {guides.map((g, i) => (
                  <React.Fragment key={g.slug}>{i ? ' and ' : ''}<Link className="link" href={`/guides/${g.slug}`}>{g.title}</Link></React.Fragment>
                ))}.</>
              ) : undefined}
            />
            <FaqList faqs={s.faqs} />
          </div>
        </section>

        <section aria-labelledby="related-title" className="border-t border-line bg-paper-2 py-section">
          <div className="wrap">
            <SectionHead id="related-title" eyebrow="Works well with" title="Related services" />
            <ul className="mt-10 grid gap-5 md:grid-cols-3">
              {related.map((r) => <li key={r.slug}><ServiceCard s={r} /></li>)}
            </ul>
          </div>
        </section>

        <LeadSection
          title={`Talk to us about ${inSentence(s.name)}`}
          intro="The first strategy call is free. We’ll look at where you are, tell you what we’d do first, and be honest if this isn’t the right service for you yet."
          defaultService={s.name}
        />
      </SiteShell>
    </>
  );
}
