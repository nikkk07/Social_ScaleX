import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { SiteShell } from '@/components/site/SiteShell';
import { PageIntro } from '@/components/site/PageIntro';
import { SectionHead } from '@/components/site/SectionHead';
import { FaqList } from '@/components/site/FaqList';
import { LeadSection } from '@/components/site/LeadSection';
import { AreaChecker } from '@/components/site/AreaChecker';
import { JsonLd } from '@/components/seo/JsonLd';
import { AREAS_FAQS, CITIES, allEntries, cityStats } from '@/lib/areas';
import { breadcrumbNode, faqNode, graph, itemListNode, webPageNode } from '@/lib/schema';
import { abs } from '@/lib/site';

const PATH = '/areas';
const TITLE = 'Areas We Serve in Delhi NCR: Pin Code Check';
const DESCRIPTION =
  'Check if we cover your area: every locality and pin code we serve in Delhi, Noida, Gurugram, Ghaziabad and Faridabad, from official lists. Remote across India.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  openGraph: { title: `${TITLE} | Social ScaleX`, description: DESCRIPTION, url: PATH },
};

export default function AreasPage() {
  const crumbs = [
    { name: 'Home', path: '/' },
    { name: 'Areas we serve', path: PATH },
  ];
  const entries = allEntries();
  const cityNames = Object.fromEntries(CITIES.map((c) => [c.slug, c.name]));
  const totals = CITIES.map((c) => cityStats(c.key)).reduce(
    (t, s) => ({ pins: t.pins + s.pins, places: t.places + s.places }),
    { pins: 0, places: 0 },
  );

  return (
    <>
      <JsonLd
        data={graph([
          webPageNode({ path: PATH, name: TITLE, description: DESCRIPTION, type: 'CollectionPage', hasBreadcrumb: true }),
          breadcrumbNode(crumbs, PATH),
          itemListNode(`${abs(PATH)}#cities`, CITIES.map((c) => ({ name: `Social media marketing in ${c.longName}`, path: `/areas/${c.slug}` }))),
          faqNode(AREAS_FAQS, PATH),
        ])}
      />
      <SiteShell>
        <PageIntro
          crumbs={crumbs}
          eyebrow="Areas we serve"
          title="A social media agency near you, anywhere in Delhi NCR"
          lede={
            <p>
              We shoot on location across Delhi, Noida, Gurugram, Ghaziabad and Faridabad, and run page management, ads and
              automation remotely for the rest of India. Type your area or pin code to check: {totals.places} localities
              across {totals.pins} pin codes, from official lists.
            </p>
          }
        >
          <div className="mt-8 max-w-2xl">
            <AreaChecker entries={entries} cityNames={cityNames} />
          </div>
        </PageIntro>

        <section aria-labelledby="cities-title" className="py-section">
          <div className="wrap">
            <SectionHead
              id="cities-title"
              eyebrow="By city"
              title="Pick your city"
              intro="Each city page lists every locality and pin code we cover there, with what works for local businesses."
            />
            <ul className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {CITIES.map((c) => {
                const s = cityStats(c.key);
                return (
                  <li key={c.slug}>
                    <Link href={`/areas/${c.slug}`} className="card card-link group flex h-full flex-col p-6">
                      <span className="flex items-start justify-between gap-4">
                        <span className="font-display text-2xl leading-tight text-ink">{c.longName}</span>
                        <ArrowUpRight className="size-5 flex-none text-ink-3 transition-colors group-hover:text-coral-text" aria-hidden="true" />
                      </span>
                      <span className="mt-1 text-sm text-ink-3">{c.district === c.name ? c.state : `${c.district}, ${c.state}`}</span>
                      <span className="mt-4 text-ink-2">
                        {s.places} localities · {s.pins} pin codes · {s.first}–{s.last}
                      </span>
                    </Link>
                  </li>
                );
              })}
              <li>
                <div className="flex h-full flex-col rounded-card border border-dashed border-line-strong p-6">
                  <span className="font-display text-2xl leading-tight text-ink">Rest of India</span>
                  <span className="mt-4 text-ink-2">
                    Page management, ads, automation and reporting run remotely, and we edit footage you send. For a shoot elsewhere, ask on the call.
                  </span>
                </div>
              </li>
            </ul>
          </div>
        </section>

        <section aria-labelledby="how-title" className="border-t border-line bg-paper-2 py-section">
          <div className="wrap grid grid-cols-1 gap-10 lg:grid-cols-2">
            <SectionHead id="how-title" eyebrow="How it works locally" title="Local is more than a location tag" />
            <ul className="grid gap-6 text-ink-2">
              <li className="border-t-2 border-ink pt-4">
                <h3 className="font-display text-2xl text-ink">Shot where you are</h3>
                <p className="mt-1">We come to your shop, clinic, studio or office, so your Reels show the real place people will visit.</p>
              </li>
              <li className="border-t-2 border-ink pt-4">
                <h3 className="font-display text-2xl text-ink">Named the way locals search</h3>
                <p className="mt-1">Your market, sector or road goes in captions, your bio and location tags, not just “Delhi NCR”.</p>
              </li>
              <li className="border-t-2 border-ink pt-4">
                <h3 className="font-display text-2xl text-ink">Ads that stay close</h3>
                <p className="mt-1">Meta and Google ads aimed at a radius around your door, so budget goes on people who can actually visit.</p>
              </li>
            </ul>
          </div>
        </section>

        <section aria-labelledby="faq-title" className="border-t border-line py-section">
          <div className="wrap grid grid-cols-1 gap-12 lg:grid-cols-[1fr_1.6fr]">
            <SectionHead
              id="faq-title"
              eyebrow="Questions"
              title="Common questions"
              intro={<>Want the full list for one city? <Link className="link" href="/areas/delhi">Start with Delhi <ArrowRight className="inline size-4" aria-hidden="true" /></Link></>}
            />
            <FaqList faqs={AREAS_FAQS} />
          </div>
        </section>

        <LeadSection />
      </SiteShell>
    </>
  );
}
