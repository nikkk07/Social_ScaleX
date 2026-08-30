import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import { MarketingShell } from '@/components/MarketingShell';
import { PageHeader } from '@/components/sections/PageHeader';
import { Reveal } from '@/components/effects/Reveal';
import { JsonLd } from '@/components/seo/JsonLd';
import { SERVICES } from '@/lib/content';
import {
  breadcrumbNode,
  faqNode,
  graph,
  serviceNode,
  webPageNode,
} from '@/lib/schema';

const TITLE = 'Social Media Marketing Services';
const DESCRIPTION =
  'Instagram page management, content production, Meta and YouTube ads, influencer marketing and reporting. What each service includes, in full.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/services' },
  openGraph: {
    title: `${TITLE} | Social ScaleX`,
    description: DESCRIPTION,
    url: '/services',
  },
};

const CRUMBS = [
  { name: 'Home', path: '/' },
  { name: 'Services', path: '/services' },
];

export default function ServicesPage() {
  return (
    <>
      <JsonLd
        data={graph([
          webPageNode({
            path: '/services',
            name: TITLE,
            description: DESCRIPTION,
            hasBreadcrumb: true,
          }),
          breadcrumbNode(CRUMBS, '/services'),
          // One FAQPage built from the same question/answer pairs rendered
          // below, so the schema and the visible text are the same sentences.
          faqNode(
            SERVICES.map((s) => ({ q: s.question, a: s.answer })),
            '/services',
          ),
          ...SERVICES.map(serviceNode),
        ])}
      />
      <MarketingShell>
        <PageHeader
          crumbs={CRUMBS}
          eyebrow="What we do"
          title="Social media marketing services."
          intro="Social ScaleX runs eight services across Instagram, Facebook and YouTube: page management, content production, paid advertising, profile optimization, analytics, product and event shoots, influencer marketing, and growth strategy. Most brands take several together, because they compound. Each one is set out in full below."
        />

        <div className="max-w-4xl mx-auto px-6 pb-24">
          {/* Jump list — a plain in-page index. It gives every service an
              internal link with descriptive anchor text, which is how the
              individual sections get discovered and cited on their own. */}
          <Reveal className="mb-20">
            <nav aria-label="Services on this page" className="liquid-glass rounded-2xl p-6 md:p-8">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-white/50 mb-5">
                On this page
              </h2>
              <ol className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                {SERVICES.map((s) => (
                  <li key={s.slug} className="flex gap-3 text-sm">
                    <span className="text-[var(--color-violet-light)] font-display font-bold tabular-nums shrink-0">
                      {s.id}
                    </span>
                    <a
                      href={`#${s.slug}`}
                      className="text-white/70 hover:text-white transition-colors"
                    >
                      {s.title}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </Reveal>

          <div className="space-y-20">
            {SERVICES.map((service) => (
              <Reveal key={service.slug}>
                <section
                  id={service.slug}
                  aria-labelledby={`${service.slug}-heading`}
                  // scroll-mt clears the fixed nav capsule when jumped to.
                  className="scroll-mt-32 border-t border-white/10 pt-12"
                >
                  <span className="text-[var(--color-violet-light)] font-display font-bold tabular-nums text-sm">
                    {service.id}
                  </span>
                  <h2
                    id={`${service.slug}-heading`}
                    className="text-2xl md:text-3xl font-display font-bold text-white mt-2 mb-6"
                  >
                    {service.title}
                  </h2>

                  {/*
                    Question-form H3 followed immediately by a self-contained
                    40–60 word answer. The pairing is the unit an answer engine
                    extracts — a heading that is not a question, or an answer
                    that needs the paragraph above it to make sense, does not
                    get quoted. The service name stays the H2 above it so the
                    heading outline names the service, not just the question.
                  */}
                  <h3 className="text-xl md:text-2xl font-display font-bold text-white mb-4">
                    {service.question}
                  </h3>
                  <p className="text-white/75 text-lg leading-relaxed mb-8 max-w-3xl">
                    {service.answer}
                  </p>

                  <h4 className="text-sm font-semibold uppercase tracking-wider text-white/50 mb-4">
                    What&apos;s included
                  </h4>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                    {service.deliverables.map((d) => (
                      <li key={d} className="flex gap-3 text-white/70">
                        <Check
                          size={17}
                          aria-hidden
                          className="mt-1 shrink-0 text-[var(--color-emerald)]"
                        />
                        <span className="leading-relaxed">{d}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              </Reveal>
            ))}
          </div>

          <Reveal className="mt-24 border-t border-white/10 pt-12 text-center">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
              Not sure which of these you need?
            </h2>
            <p className="text-white/70 text-lg leading-relaxed mb-8 max-w-2xl mx-auto">
              That is what the strategy call is for. We look at your account,
              tell you which of these would move the number you care about, and
              say so plainly if the answer is none of them yet.
            </p>
            <Link
              href="/#contact"
              className="inline-flex items-center justify-center gap-2 bg-[var(--color-violet-cta)] text-white px-8 py-4 rounded-full font-semibold border border-white/15 shadow-[0_8px_28px_rgba(124,58,237,0.35)] transition-[transform,background-color] duration-200 hover:bg-[var(--color-violet)] hover:scale-[1.02] active:scale-[0.99]"
            >
              Get a free strategy call
              <ArrowRight size={18} aria-hidden />
            </Link>
          </Reveal>
        </div>
      </MarketingShell>
    </>
  );
}
