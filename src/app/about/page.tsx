import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Phone } from 'lucide-react';
import { SiteShell } from '@/components/site/SiteShell';
import { PageIntro } from '@/components/site/PageIntro';
import { SectionHead } from '@/components/site/SectionHead';
import { FaqList } from '@/components/site/FaqList';
import { LeadSection } from '@/components/site/LeadSection';
import { JsonLd } from '@/components/seo/JsonLd';
import { FAQS, PORTFOLIO, PRINCIPLES, SERVICES } from '@/lib/content';
import { AREAS_SERVED, CONTACTS, FOUNDING_YEAR } from '@/lib/site';
import { breadcrumbNode, faqNode, graph, personId, webPageNode } from '@/lib/schema';

const TITLE = 'About Social ScaleX';
const DESCRIPTION =
  'Social ScaleX is a Delhi NCR social media marketing agency founded in 2025 by Nikhil Bisht and Abhishek Anand. A small team that publishes its client numbers.';
const CRUMBS = [
  { name: 'Home', path: '/' },
  { name: 'About', path: '/about' },
];
const ABOUT_FAQS = FAQS.filter((f) =>
  ['Where are you based, and do you work remotely?', 'What makes Social ScaleX different from other agencies?', 'Which platforms do you manage?'].includes(f.q),
);

export const metadata: Metadata = {
  title: 'About Us: Delhi NCR Social Media Agency',
  description: DESCRIPTION,
  alternates: { canonical: '/about' },
  openGraph: { title: `${TITLE} | Social ScaleX`, description: DESCRIPTION, url: '/about' },
};

export default function AboutPage() {
  return (
    <>
      <JsonLd
        data={graph([
          { ...webPageNode({ path: '/about', name: TITLE, description: DESCRIPTION, type: 'AboutPage', hasBreadcrumb: true }), mentions: CONTACTS.map((_, i) => ({ '@id': personId(i) })) },
          breadcrumbNode(CRUMBS, '/about'),
          faqNode(ABOUT_FAQS, '/about'),
        ])}
      />
      <SiteShell>
        <PageIntro
          crumbs={CRUMBS}
          eyebrow="About us"
          title="A small agency that publishes its numbers"
          lede={<p>Social ScaleX is a social media marketing agency based in Delhi NCR, started in {FOUNDING_YEAR}. We run Instagram, Facebook and YouTube for brands and creators: content production, page management, Meta and Google Ads, and reporting. We keep a deliberately small book of accounts, so each one gets real attention.</p>}
        />

        <section aria-labelledby="story-title" className="py-section">
          <div className="wrap grid grid-cols-1 gap-12 lg:grid-cols-[1fr_1.4fr]">
            <SectionHead id="story-title" eyebrow="What we do" title="We run social media for other people’s brands" />
            <div className="prose-site">
              <p>
                That means {SERVICES.length} services, from <Link href="/services/instagram-marketing">page management</Link> and <Link href="/services/reels-production">Reels production</Link> to <Link href="/services/meta-ads">Meta ads</Link> and <Link href="/services/google-ads">Google Ads</Link>, delivered together rather than sold separately.
              </p>
              <p>
                The work splits between creators building an audience and businesses using social media to sell. An outdoor-gear store is not run the same way as a travel vlogger, and we don’t pretend otherwise. Today we publish results for {PORTFOLIO.length} accounts across Instagram and YouTube; each one agreed to have its numbers shown on this site. See them on <Link href="/case-studies">client results</Link>.
              </p>
              <p>
                Shoots happen across {AREAS_SERVED.join(', ')}. Management, advertising and reporting run remotely, so we work with brands from anywhere in India.
              </p>
            </div>
          </div>
        </section>

        <section aria-labelledby="team-title" className="border-t border-line bg-paper-2 py-section">
          <div className="wrap">
            <SectionHead id="team-title" eyebrow="The team" title="You talk to the people doing the work" intro="There is no account manager relaying messages to a team you never meet. The founders run the accounts and answer the phone." />
            <ul className="mt-10 grid gap-5 md:grid-cols-2">
              {CONTACTS.map((c, i) => (
                <li key={c.phone} id={`founder-${i + 1}`} className="card flex flex-wrap items-center justify-between gap-4 p-6 sm:p-8">
                  <div>
                    <h3 className="text-3xl text-ink">{c.name}</h3>
                    <p className="mt-1 text-ink-3">{c.role}, Social ScaleX</p>
                  </div>
                  <a href={`tel:${c.phone}`} className="btn btn-secondary">
                    <Phone className="size-4" aria-hidden="true" /> <span className="sr-only">Call {c.name.split(' ')[0]} on </span>{c.display}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section aria-labelledby="principles-title" className="py-section">
          <div className="wrap">
            <SectionHead id="principles-title" eyebrow="How we work" title="Four things you can hold us to" />
            <ul className="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
              {PRINCIPLES.map((p) => (
                <li key={p.title} className="border-t-2 border-ink pt-5">
                  <h3 className="text-xl text-ink">{p.title}</h3>
                  <p className="mt-2 text-ink-2">{p.desc}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section aria-labelledby="faq-title" className="border-t border-line py-section">
          <div className="wrap grid grid-cols-1 gap-12 lg:grid-cols-[1fr_1.6fr]">
            <SectionHead id="faq-title" eyebrow="Questions" title="The basics" />
            <FaqList faqs={ABOUT_FAQS} />
          </div>
        </section>

        <LeadSection />
      </SiteShell>
    </>
  );
}
