import React from 'react';
import type { Metadata } from 'next';
import { SiteShell } from '@/components/site/SiteShell';
import { PageIntro } from '@/components/site/PageIntro';
import { CreatorApplyForm } from '@/components/site/CreatorApplyForm';
import { JsonLd } from '@/components/seo/JsonLd';
import { breadcrumbNode, graph, webPageNode } from '@/lib/schema';
import { abs, socialMeta } from '@/lib/site';

// Not a job posting: Google bans JobPosting markup for "job requests" (people offering to work), so this page is a plain WebPage.
const TITLE = 'Join the Social ScaleX Creator Network';
const DESCRIPTION = 'UGC creators and influencers in India: join our network once and we contact you when a paid brand brief fits your niche, language and city. Free, 18+.';
const CRUMBS = [
  { name: 'Home', path: '/' },
  { name: 'Creator Hub', path: '/creators' },
  { name: 'Join the network', path: '/creators/join' },
];

export const metadata: Metadata = {
  title: TITLE, description: DESCRIPTION, alternates: { canonical: '/creators/join' },
  ...socialMeta({ title: TITLE, description: DESCRIPTION, path: '/creators/join' }),
};

export default function JoinPage() {
  return (
    <>
      <JsonLd data={graph([webPageNode({ path: '/creators/join', name: TITLE, description: DESCRIPTION, hasBreadcrumb: true }), breadcrumbNode(CRUMBS, '/creators/join')])} />
      <SiteShell>
        <PageIntro crumbs={CRUMBS} eyebrow="Creator Hub" title="Join the creator network"
          lede="No open brief that fits? Tell us what you make, once. When a client needs your niche, language or city, we contact you first with the pay and dates. It’s free, and you can ask us to delete your details at any time." />
        <section id="apply" aria-label="Join the network" className="py-section">
          <div className="wrap max-w-3xl"><CreatorApplyForm returnUrl={abs('/creators/join')} /></div>
        </section>
      </SiteShell>
    </>
  );
}
