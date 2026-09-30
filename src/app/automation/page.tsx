import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteShell } from '@/components/site/SiteShell';
import { PageIntro } from '@/components/site/PageIntro';
import { SectionHead } from '@/components/site/SectionHead';
import { FaqList } from '@/components/site/FaqList';
import { LeadSection } from '@/components/site/LeadSection';
import { AutomationCard } from '@/components/site/AutomationCard';
import { PriceCard } from '@/components/site/Offer';
import { JsonLd } from '@/components/seo/JsonLd';
import { AUTOMATIONS, AUTOMATION_HUB } from '@/lib/automation';
import { breadcrumbNode, faqNode, graph, itemListNode, webPageNode } from '@/lib/schema';

const CRUMBS = [
  { name: 'Home', path: '/' },
  { name: 'Automation', path: '/automation' },
];
const HUB_FAQS = AUTOMATIONS.flatMap((a) => a.faqs.slice(0, 1));

export const metadata: Metadata = {
  title: AUTOMATION_HUB.metaTitle,
  description: AUTOMATION_HUB.metaDescription,
  alternates: { canonical: '/automation' },
  openGraph: { title: `${AUTOMATION_HUB.metaTitle} | Social ScaleX`, description: AUTOMATION_HUB.metaDescription, url: '/automation' },
};

export default function AutomationHub() {
  return (
    <>
      <JsonLd
        data={graph([
          webPageNode({ path: '/automation', name: AUTOMATION_HUB.metaTitle, description: AUTOMATION_HUB.metaDescription, type: 'CollectionPage', hasBreadcrumb: true }),
          breadcrumbNode(CRUMBS, '/automation'),
          itemListNode('/automation#list', AUTOMATIONS.map((a) => ({ name: a.name, path: `/automation/${a.slug}` }))),
          faqNode(HUB_FAQS, '/automation'),
        ])}
      />
      <SiteShell>
        <PageIntro crumbs={CRUMBS} eyebrow="Automation" title={AUTOMATION_HUB.h1} lede={<p>{AUTOMATION_HUB.lede}</p>} />
        <section aria-labelledby="all-title" className="py-section">
          <div className="wrap grid grid-cols-1 gap-12 lg:grid-cols-[1.5fr_1fr]">
            <div>
              <SectionHead id="all-title" eyebrow="What we automate" title="Auto-reply on every channel your customers use" />
              <ul className="mt-10 grid gap-5 sm:grid-cols-2">
                {AUTOMATIONS.map((a) => <li key={a.slug}><AutomationCard a={a} /></li>)}
              </ul>
            </div>
            <div className="lg:pt-24"><PriceCard /></div>
          </div>
        </section>
        <section aria-labelledby="free-title" className="border-t border-line bg-paper-2 py-section">
          <div className="wrap grid grid-cols-1 gap-8 lg:grid-cols-[1.5fr_1fr] lg:items-center">
            <SectionHead
              id="free-title"
              eyebrow="Prefer to do it yourself?"
              title="Free Instagram comment-to-DM guide"
              intro="Meta Business Suite includes a free Comment to message automation. Our step-by-step guide shows you how to set it up, test it and stay within Meta’s rules."
            />
            <Link href="/guides/free-instagram-comment-to-dm-automation" className="btn btn-secondary btn-lg justify-self-start">Read the free guide</Link>
          </div>
        </section>
        <section aria-labelledby="faq-title" className="py-section">
          <div className="wrap grid grid-cols-1 gap-12 lg:grid-cols-[1fr_1.6fr]">
            <SectionHead id="faq-title" eyebrow="Questions" title="Automation, answered" />
            <FaqList faqs={HUB_FAQS} />
          </div>
        </section>
        <LeadSection title="Automate your DMs and comments" intro="Tell us which channel you want to automate. For comment-to-DM, we can start today at ₹99 a month." defaultService="Instagram comment-to-DM automation" />
      </SiteShell>
    </>
  );
}
