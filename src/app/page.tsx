import React from 'react';
import type { Metadata } from 'next';
import { MarketingShell } from '@/components/MarketingShell';
import { Hero } from '@/components/sections/Hero';
import { StatsBand } from '@/components/sections/StatsBand';
import { Work } from '@/components/sections/Work';
import { Services } from '@/components/sections/Services';
import { Process } from '@/components/sections/Process';
import { WhyUs } from '@/components/sections/WhyUs';
import { FAQ } from '@/components/sections/FAQ';
import { Contact } from '@/components/sections/Contact';
import { JsonLd } from '@/components/seo/JsonLd';
import { FAQS } from '@/lib/content';
import { faqNode, graph, webPageNode } from '@/lib/schema';

export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

export default function HomePage() {
  return (
    <>
      <JsonLd
        data={graph([
          webPageNode({
            path: '/',
            name: 'Social ScaleX | Social Media Marketing Agency in Delhi NCR',
            description:
              'Social media marketing agency in Delhi NCR managing Instagram, Facebook and YouTube for brands and creators.',
          }),
          faqNode(FAQS, '/'),
        ])}
      />
      <MarketingShell>
        <Hero />
        <StatsBand />
        <Work />
        <Services />
        <Process />
        <WhyUs />
        <FAQ faqs={FAQS} />
        <Contact />
      </MarketingShell>
    </>
  );
}
