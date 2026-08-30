import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { MarketingShell } from '@/components/MarketingShell';
import { PageHeader } from '@/components/sections/PageHeader';
import { FAQ } from '@/components/sections/FAQ';
import { Reveal } from '@/components/effects/Reveal';
import { JsonLd } from '@/components/seo/JsonLd';
import { FAQS, PORTFOLIO, SERVICES } from '@/lib/content';
import { CONTACTS } from '@/lib/site';
import { breadcrumbNode, faqNode, graph, webPageNode } from '@/lib/schema';

const TITLE = 'About Social ScaleX';
// Shown in <title> via the layout template, which appends the brand — so the
// tag itself must not repeat it ("About Social ScaleX | Social ScaleX").
const META_TITLE = 'About';
const DESCRIPTION =
  'Who Social ScaleX is: a social media marketing agency in Delhi NCR running Instagram, Facebook and YouTube for a small number of brands and creators.';

export const metadata: Metadata = {
  title: META_TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/about' },
  openGraph: {
    title: `${TITLE} | Social ScaleX`,
    description: DESCRIPTION,
    url: '/about',
  },
};

const CRUMBS = [
  { name: 'Home', path: '/' },
  { name: 'About', path: '/about' },
];

// The two entity-resolution questions an answer engine asks about a business.
// Kept on this page specifically, not duplicated onto the homepage FAQ.
const ABOUT_FAQS = FAQS.filter((f) =>
  ['Where are you based, and do you work remotely?',
   'What makes Social ScaleX different from other agencies?',
   'Which platforms do you manage?'].includes(f.q),
);

export default function AboutPage() {
  return (
    <>
      <JsonLd
        data={graph([
          webPageNode({
            path: '/about',
            name: TITLE,
            description: DESCRIPTION,
            hasBreadcrumb: true,
          }),
          breadcrumbNode(CRUMBS, '/about'),
          faqNode(ABOUT_FAQS, '/about'),
        ])}
      />
      <MarketingShell>
        <PageHeader
          crumbs={CRUMBS}
          eyebrow="Who we are"
          title="A small agency that publishes its numbers."
          intro="Social ScaleX is a social media marketing agency based in Delhi NCR. We manage Instagram, Facebook and YouTube for brands and creators — content production, page management, paid advertising and reporting — and we run a deliberately small book of accounts so each one gets real attention."
        />

        <div className="max-w-3xl mx-auto px-6 pb-8 space-y-16">
          <Reveal>
            <section aria-labelledby="what-we-do">
              <h2
                id="what-we-do"
                className="text-2xl md:text-3xl font-display font-bold text-white mb-4"
              >
                What does Social ScaleX do?
              </h2>
              <p className="text-white/75 text-lg leading-relaxed mb-6">
                We run social media accounts end to end for other people&apos;s
                brands. That means {SERVICES.length} services — page management,
                content production, paid ads on Meta and YouTube, profile
                optimization, analytics, shoots, influencer marketing and growth
                strategy — delivered together rather than sold separately.
              </p>
              <p className="text-white/70 leading-relaxed">
                Most of our shoots happen across Delhi, Noida and Gurugram.
                Management, advertising and reporting all happen remotely, so we
                take on brands from anywhere in India. The work splits between
                creators building an audience and businesses using social to
                sell — an outdoor-gear store is not run the same way as a travel
                vlogger, and we do not pretend otherwise.
              </p>
            </section>
          </Reveal>

          <Reveal>
            <section aria-labelledby="who-we-work-with">
              <h2
                id="who-we-work-with"
                className="text-2xl md:text-3xl font-display font-bold text-white mb-4"
              >
                Who do you work with?
              </h2>
              <p className="text-white/75 text-lg leading-relaxed mb-6">
                Travel and lifestyle creators, and e-commerce brands selling to
                people who already scroll. We currently manage{' '}
                {PORTFOLIO.length} accounts we publish openly, across Instagram
                and YouTube. Each one gave permission for their figures to
                appear on this site.
              </p>
              <ul className="space-y-3">
                {PORTFOLIO.map((p) => (
                  <li key={p.id} className="flex flex-wrap gap-x-3 gap-y-1 text-white/70">
                    <Link
                      href={`/case-studies#${p.id}`}
                      className="font-semibold text-white hover:text-[var(--color-violet-light)] transition-colors"
                    >
                      {p.client}
                    </Link>
                    <span className="text-white/50">— {p.category}</span>
                  </li>
                ))}
              </ul>
            </section>
          </Reveal>

          <Reveal>
            <section aria-labelledby="how-we-report">
              <h2
                id="how-we-report"
                className="text-2xl md:text-3xl font-display font-bold text-white mb-4"
              >
                How do you report on results?
              </h2>
              <p className="text-white/75 text-lg leading-relaxed mb-6">
                Every number we publish comes from the client&apos;s own
                Instagram or YouTube dashboard, and every client can check it
                against their own analytics. Reporting is weekly by call and
                monthly in writing. When something is not working we say so in
                that report rather than burying it under a chart that is.
              </p>
              <p className="text-white/70 leading-relaxed">
                You keep ownership throughout. Accounts stay in your name,
                passwords stay with you, and the content we produce belongs to
                your brand — including if you leave.
              </p>
            </section>
          </Reveal>

          <Reveal>
            <section aria-labelledby="who-to-talk-to">
              <h2
                id="who-to-talk-to"
                className="text-2xl md:text-3xl font-display font-bold text-white mb-4"
              >
                Who do I talk to?
              </h2>
              <p className="text-white/75 text-lg leading-relaxed mb-6">
                Directly to the people running the work. There is no account
                manager relaying messages to a team you never meet.
              </p>
              <ul className="space-y-4">
                {CONTACTS.map((c) => (
                  <li key={c.phone} className="liquid-glass rounded-2xl px-6 py-5">
                    <div className="text-white font-display font-bold mb-1">
                      {c.name}
                    </div>
                    <a
                      href={`tel:${c.phone}`}
                      className="text-[var(--color-violet-light)] hover:underline font-medium"
                    >
                      {c.display}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          </Reveal>

          <Reveal className="border-t border-white/10 pt-10">
            <Link
              href="/#contact"
              className="inline-flex items-center justify-center gap-2 bg-[var(--color-violet-cta)] text-white px-8 py-4 rounded-full font-semibold border border-white/15 shadow-[0_8px_28px_rgba(124,58,237,0.35)] transition-[transform,background-color] duration-200 hover:bg-[var(--color-violet)] hover:scale-[1.02] active:scale-[0.99]"
            >
              Get a free strategy call
              <ArrowRight size={18} aria-hidden />
            </Link>
          </Reveal>
        </div>

        <FAQ
          faqs={ABOUT_FAQS}
          eyebrow="Common questions"
          heading="The rest of the basics."
          intro="Where we are, what we run, and why we work the way we do."
          headingId="about-faq-heading"
        />
      </MarketingShell>
    </>
  );
}
