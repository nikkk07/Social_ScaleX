import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Instagram, Youtube } from 'lucide-react';
import { MarketingShell } from '@/components/MarketingShell';
import { PageHeader } from '@/components/sections/PageHeader';
import { Reveal } from '@/components/effects/Reveal';
import { GlassCard } from '@/components/GlassCard';
import { JsonLd } from '@/components/seo/JsonLd';
import { PORTFOLIO } from '@/lib/content';
import {
  breadcrumbNode,
  caseStudyNode,
  graph,
  webPageNode,
} from '@/lib/schema';

const TITLE = 'Client Case Studies & Results';
const DESCRIPTION =
  'Four managed accounts with the numbers from their own Instagram and YouTube dashboards: 336K followers, 4.2M monthly views, 96.6K subscribers.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/case-studies' },
  openGraph: {
    title: `${TITLE} | Social ScaleX`,
    description: DESCRIPTION,
    url: '/case-studies',
  },
};

const CRUMBS = [
  { name: 'Home', path: '/' },
  { name: 'Case Studies', path: '/case-studies' },
];

function PlatformIcons({ platform }: { platform: string }) {
  const showIg = platform.includes('Instagram');
  const showYt = platform.includes('YouTube');
  return (
    <span className="flex -space-x-1" aria-hidden>
      {showIg && <Instagram size={13} className="text-white" />}
      {showYt && <Youtube size={13} className="text-white" />}
    </span>
  );
}

export default function CaseStudiesPage() {
  return (
    <>
      <JsonLd
        data={graph([
          webPageNode({
            path: '/case-studies',
            name: TITLE,
            description: DESCRIPTION,
            hasBreadcrumb: true,
          }),
          breadcrumbNode(CRUMBS, '/case-studies'),
          ...PORTFOLIO.map(caseStudyNode),
        ])}
      />
      <MarketingShell>
        <PageHeader
          crumbs={CRUMBS}
          eyebrow="Client portfolio"
          title="Real accounts. Real numbers."
          intro="Four accounts Social ScaleX manages, with the figures taken from each client's own Instagram and YouTube dashboards: 336K followers on the largest, 4.2M views in 30 days, 96.6K subscribers. Nothing here is projected or rounded up, and every client gave permission to publish."
        />

        <div className="max-w-5xl mx-auto px-6 pb-24">
          <div className="space-y-16">
            {PORTFOLIO.map((item) => (
              <Reveal key={item.id}>
                <article
                  id={item.id}
                  aria-labelledby={`${item.id}-heading`}
                  className="scroll-mt-32"
                >
                  <GlassCard className="p-7 md:p-10">
                    <div className="flex flex-wrap items-center gap-3 mb-5">
                      <span className="liquid-glass-lite rounded-full px-3 py-1.5 flex items-center gap-2">
                        <PlatformIcons platform={item.platform} />
                        <span className="text-xs font-medium text-white">
                          {item.platform}
                        </span>
                      </span>
                      <span className="text-xs font-semibold text-[var(--color-emerald)] uppercase tracking-wider">
                        {item.category}
                      </span>
                    </div>

                    <h2
                      id={`${item.id}-heading`}
                      className="text-2xl md:text-3xl font-display font-bold text-white mb-4"
                    >
                      {item.client}
                    </h2>

                    {/* Metrics first, prose after. An extractor reading this
                        card should reach the numbers before the narrative. */}
                    <dl className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-7 pb-7 border-b border-white/10">
                      {item.metrics.map((m) => (
                        <div key={m.label}>
                          <dt className="text-[10px] uppercase tracking-wider text-white/55 leading-tight order-2 mt-1">
                            {m.label}
                          </dt>
                          <dd className="text-2xl md:text-3xl font-display font-bold text-white">
                            {m.value}
                          </dd>
                        </div>
                      ))}
                    </dl>

                    <p className="text-white/70 leading-relaxed mb-4">
                      {item.description}
                    </p>
                    <p className="text-white/70 leading-relaxed">{item.detail}</p>
                  </GlassCard>
                </article>
              </Reveal>
            ))}
          </div>

          <Reveal className="mt-16 border-t border-white/10 pt-8">
            <p className="text-sm text-white/55 mb-8 max-w-2xl">
              Client data shared with permission, and there are more brands
              beyond the four shown here. Figures are point-in-time snapshots
              from the client dashboards, not running totals.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-5">
              <Link
                href="/#contact"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[var(--color-violet-cta)] text-white px-8 py-4 rounded-full font-semibold border border-white/15 shadow-[0_8px_28px_rgba(124,58,237,0.35)] transition-[transform,background-color] duration-200 hover:bg-[var(--color-violet)] hover:scale-[1.02] active:scale-[0.99]"
              >
                Get a free strategy call
                <ArrowRight size={18} aria-hidden />
              </Link>
              <Link
                href="/services"
                className="inline-flex items-center gap-1.5 text-white/70 hover:text-white font-medium transition-colors"
              >
                See what each service includes
                <ArrowRight size={17} aria-hidden />
              </Link>
            </div>
          </Reveal>
        </div>
      </MarketingShell>
    </>
  );
}
