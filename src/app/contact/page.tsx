import React from 'react';
import type { Metadata } from 'next';
import { SiteShell } from '@/components/site/SiteShell';
import { Breadcrumbs } from '@/components/site/Breadcrumbs';
import { SectionHead } from '@/components/site/SectionHead';
import { FaqList } from '@/components/site/FaqList';
import { LeadSection } from '@/components/site/LeadSection';
import { JsonLd } from '@/components/seo/JsonLd';
import { CONTACT_FAQS } from '@/lib/content';
import { breadcrumbNode, faqNode, graph, webPageNode } from '@/lib/schema';

const TITLE = 'Contact Us: Book a Free Strategy Call';
const DESCRIPTION =
  'Call, WhatsApp or send the form to book a free social media strategy call with Social ScaleX, Delhi NCR. We usually call back within a few hours.';
const CRUMBS = [
  { name: 'Home', path: '/' },
  { name: 'Contact', path: '/contact' },
];

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/contact' },
  openGraph: { title: `${TITLE} | Social ScaleX`, description: DESCRIPTION, url: '/contact' },
};

export default function ContactPage() {
  return (
    <>
      <JsonLd
        data={graph([
          webPageNode({ path: '/contact', name: TITLE, description: DESCRIPTION, type: 'ContactPage', hasBreadcrumb: true }),
          breadcrumbNode(CRUMBS, '/contact'),
          faqNode(CONTACT_FAQS, '/contact'),
        ])}
      />
      <SiteShell>
        <div className="wrap pt-8"><Breadcrumbs crumbs={CRUMBS} /></div>
        <LeadSection
          id="contact"
          headingLevel={1}
          title="Book a free strategy call"
          intro="Tell us about your brand and we’ll call you back, usually within a few hours during business hours. No pitch deck and no pressure: an honest conversation about what growth looks like for you."
        />
        <section aria-labelledby="faq-title" className="py-section">
          <div className="wrap grid grid-cols-1 gap-12 lg:grid-cols-[1fr_1.6fr]">
            <SectionHead id="faq-title" eyebrow="Before you call" title="What to expect" />
            <FaqList faqs={CONTACT_FAQS} />
          </div>
        </section>
      </SiteShell>
    </>
  );
}
