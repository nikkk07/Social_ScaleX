import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, Check, MessageCircle } from 'lucide-react';
import { SiteShell } from '@/components/site/SiteShell';
import { PageIntro } from '@/components/site/PageIntro';
import { SectionHead } from '@/components/site/SectionHead';
import { FaqList } from '@/components/site/FaqList';
import { LeadSection } from '@/components/site/LeadSection';
import { AutomationCard } from '@/components/site/AutomationCard';
import { CompareTable, PriceCard } from '@/components/site/Offer';
import { JsonLd } from '@/components/seo/JsonLd';
import { WhatsappIcon } from '@/components/icons/WhatsappIcon';
import { AUTOMATIONS, PLAN_99, getAutomation } from '@/lib/automation';
import { getGuide } from '@/lib/guides';
import { whatsappLink } from '@/lib/site';
import { inSentence } from '@/lib/content';
import { automationNode, breadcrumbNode, faqNode, graph, webPageNode } from '@/lib/schema';

export const dynamicParams = false;

export function generateStaticParams() {
  return AUTOMATIONS.map((a) => ({ slug: a.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const a = getAutomation(params.slug);
  if (!a) return {};
  const path = `/automation/${a.slug}`;
  return {
    title: a.metaTitle,
    description: a.metaDescription,
    alternates: { canonical: path },
    openGraph: { title: `${a.metaTitle} | Social ScaleX`, description: a.metaDescription, url: path },
  };
}

export default function AutomationPage({ params }: { params: { slug: string } }) {
  const a = getAutomation(params.slug);
  if (!a) notFound();
  const path = `/automation/${a.slug}`;
  const crumbs = [
    { name: 'Home', path: '/' },
    { name: 'Automation', path: '/automation' },
    { name: a.short, path },
  ];
  const related = a.related.map(getAutomation).filter((x): x is NonNullable<typeof x> => Boolean(x));
  const guide = a.guide ? getGuide(a.guide) : undefined;

  return (
    <>
      <JsonLd
        data={graph([
          webPageNode({ path, name: a.metaTitle, description: a.metaDescription, hasBreadcrumb: true }),
          breadcrumbNode(crumbs, path),
          automationNode(a),
          faqNode(a.faqs, path),
        ])}
      />
      <SiteShell>
        <PageIntro crumbs={crumbs} eyebrow={a.priced ? `₹${PLAN_99.price} / month` : 'Automation'} title={a.h1} lede={<p>{a.lede}</p>}>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="#get-started" className="btn btn-primary btn-lg">
              {a.priced ? `Get it for ₹${PLAN_99.price}/month` : 'Book a free strategy call'} <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <a href={whatsappLink(`Hi Social ScaleX, I’m interested in ${a.name}.`)} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-lg">
              <WhatsappIcon size={18} /> Ask on WhatsApp
            </a>
          </div>
          <figure className="card mt-10 max-w-xl p-5">
            <figcaption className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-3">How it looks</figcaption>
            <div className="mt-4 space-y-3 text-sm">
              <p className="flex gap-3"><span className="grid size-7 flex-none place-items-center rounded-full bg-paper-2 text-xs font-semibold text-ink">1</span><span className="rounded-2xl rounded-tl-sm bg-paper-2 px-4 py-2.5 text-ink">{a.example.trigger}</span></p>
              <p className="flex gap-3"><span className="grid size-7 flex-none place-items-center rounded-full bg-coral-tint text-coral-text"><MessageCircle className="size-3.5" aria-hidden="true" /></span><span className="rounded-2xl rounded-tl-sm bg-coral-tint px-4 py-2.5 text-ink">{a.example.reply}</span></p>
            </div>
          </figure>
        </PageIntro>

        <section aria-labelledby="features-title" className="py-section">
          <div className="wrap">
            <SectionHead id="features-title" eyebrow="Features" title={`What ${inSentence(a.short)} does for you`} />
            <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {a.features.map((f) => (
                <li key={f.title} className="card p-6">
                  <h3 className="text-xl text-ink">{f.title}</h3>
                  <p className="mt-2 text-ink-2">{f.desc}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {a.priced ? (
          <section aria-labelledby="price-title" className="border-t border-line bg-paper-2 py-section">
            <div className="wrap grid grid-cols-1 gap-12 lg:grid-cols-[1.2fr_1fr] lg:items-start">
              <div>
                <SectionHead
                  id="price-title"
                  eyebrow="Pricing"
                  title={`₹${PLAN_99.price} a month. Set up, tested and managed.`}
                  intro="The automation itself is free on Meta’s tools. You pay for us to set it up properly, test it, and keep every keyword and link working."
                />
                <CompareTable />
                {guide ? (
                  <p className="text-ink-2">Want to try it yourself first? <Link className="link" href={`/guides/${guide.slug}`}>Read the free step-by-step guide</Link>.</p>
                ) : null}
              </div>
              <PriceCard headingLevel={2} />
            </div>
          </section>
        ) : null}

        <section aria-labelledby="how-title" className="border-t border-line py-section">
          <div className="wrap">
            <SectionHead id="how-title" eyebrow="How it works" title="From first message to live automation" />
            <ol className="mt-10 grid gap-px overflow-hidden rounded-card border border-line bg-line md:grid-cols-2 lg:grid-cols-4">
              {a.steps.map((st, i) => (
                <li key={st.title} className="bg-surface p-6">
                  <span className="font-display text-sm text-coral-text">Step {i + 1}</span>
                  <h3 className="mt-2 text-2xl text-ink">{st.title}</h3>
                  <p className="mt-2 text-ink-2">{st.desc}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section aria-labelledby="uses-title" className="border-t border-line bg-surface py-section">
          <div className="wrap grid grid-cols-1 gap-10 lg:grid-cols-2">
            <SectionHead id="uses-title" eyebrow="Use cases" title="Ways businesses use it" />
            <ul className="grid gap-3">
              {a.useCases.map((u) => (
                <li key={u} className="flex gap-3 text-lg text-ink-2"><Check className="mt-1.5 size-4 flex-none text-coral-text" aria-hidden="true" />{u}</li>
              ))}
            </ul>
          </div>
        </section>

        <section aria-labelledby="faq-title" className="border-t border-line py-section">
          <div className="wrap grid grid-cols-1 gap-12 lg:grid-cols-[1fr_1.6fr]">
            <SectionHead id="faq-title" eyebrow={`${a.short}: FAQs`} title="Common questions" />
            <FaqList faqs={a.faqs} />
          </div>
        </section>

        <section aria-labelledby="related-title" className="border-t border-line bg-paper-2 py-section">
          <div className="wrap">
            <SectionHead id="related-title" eyebrow="More automation" title="Related automations" />
            <ul className="mt-10 grid gap-5 md:grid-cols-3">
              {related.map((r) => <li key={r.slug}><AutomationCard a={r} /></li>)}
            </ul>
          </div>
        </section>

        <LeadSection
          title={a.priced ? `Start comment-to-DM for ₹${PLAN_99.price}/month` : `Talk to us about ${inSentence(a.name)}`}
          intro={a.priced ? 'Send your details. We set it up with you, test it, and you pay after it works.' : 'The first strategy call is free. We’ll tell you what to automate first and what it will cost.'}
          defaultService={a.name}
        />
      </SiteShell>
    </>
  );
}
