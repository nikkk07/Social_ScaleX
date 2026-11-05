import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { SiteShell } from '@/components/site/SiteShell';
import { SectionHead } from '@/components/site/SectionHead';
import { HeroSection } from '@/components/site/home/HeroSection';
import { GrowthEngine } from '@/components/site/home/GrowthEngine';
import { ResultsSection } from '@/components/site/home/ResultsSection';
import { HowWeWork } from '@/components/site/home/HowWeWork';
import { ServicesControlRoom } from '@/components/site/home/ServicesControlRoom';
import { Founders } from '@/components/site/home/Founders';
import { Testimonials } from '@/components/site/Testimonials';
import { FinalCta } from '@/components/site/home/FinalCta';
import { FaqList } from '@/components/site/FaqList';
import { LeadSection } from '@/components/site/LeadSection';
import { JsonLd } from '@/components/seo/JsonLd';
import { FAQS, PAINS, PRINCIPLES, SERVICES, STATS, TESTIMONIALS } from '@/lib/content';
import { GUIDES } from '@/lib/guides';
import { AUTOMATIONS } from '@/lib/automation';
import { GOALS } from '@/lib/goals';
import { CITIES } from '@/lib/areas';
import { AutomationCard } from '@/components/site/AutomationCard';
import { PriceCard } from '@/components/site/Offer';
import { AREAS_SERVED } from '@/lib/site';
import { faqNode, graph, itemListNode, webPageNode } from '@/lib/schema';

export const metadata: Metadata = { alternates: { canonical: '/' } };

export default function HomePage() {
  return (
    <>
      <JsonLd
        data={graph([
          webPageNode({
            path: '/',
            name: 'Social Media Marketing Agency in Delhi NCR | Social ScaleX',
            description: 'Social media marketing agency in Delhi NCR managing Instagram, Facebook and YouTube, Reels production, and Meta and Google Ads for brands and creators.',
          }),
          itemListNode('/#services', SERVICES.map((s) => ({ name: s.name, path: `/services/${s.slug}` }))),
          faqNode(FAQS, '/'),
        ])}
      />
      <SiteShell>
        <HeroSection />

        {/* Stats */}
        <section aria-label="Results in numbers" className="border-y border-line bg-surface">
          <dl className="wrap grid grid-cols-2 gap-x-6 gap-y-8 py-10 lg:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="flex flex-col-reverse">
                <dt className="mt-1 max-w-[16rem] text-sm text-ink-3">{s.label}</dt>
                <dd className="font-display text-4xl text-ink sm:text-5xl">{s.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <GrowthEngine />

        {/* Pains */}
        <section aria-labelledby="pains-title" className="py-section">
          <div className="wrap">
            <SectionHead id="pains-title" eyebrow="Sound familiar?" title="Why your posts get likes but no customers" />
            {/* Tablets: one row per pain, quote beside the answer. Three columns from lg. */}
            <ul className="mt-12 grid gap-5 lg:grid-cols-3">
              {PAINS.map((p) => (
                <li key={p.problem} className="card flex flex-col p-6 md:max-lg:grid md:max-lg:grid-cols-[1fr_1.2fr] md:max-lg:content-start md:max-lg:gap-x-10 md:max-lg:p-8">
                  <p className="font-display text-2xl leading-snug text-ink md:max-lg:row-span-2">“{p.problem}”</p>
                  <p className="mt-4 flex-1 text-ink-2 md:max-lg:mt-0">{p.answer}</p>
                  <Link href={p.href} className="link mt-5 inline-flex min-h-6 items-center justify-self-start text-sm">{p.cta} <span aria-hidden="true">→</span></Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <ResultsSection />

        <Testimonials items={TESTIMONIALS} />

        <HowWeWork />

        <ServicesControlRoom />

        {/* Automation */}
        <section aria-labelledby="automation-title" className="py-section">
          <div className="wrap grid grid-cols-1 gap-12 lg:grid-cols-[1.5fr_1fr]">
            <div>
              <SectionHead
                id="automation-title"
                eyebrow="Automation"
                title="Instagram and WhatsApp auto-replies for comments and DMs"
                intro="Instagram comment-to-DM, DM auto-reply, WhatsApp and Facebook automation on Meta’s official tools. Comment-to-DM starts at ₹99 a month."
              />
              <ul className="mt-10 grid gap-5 sm:grid-cols-2">
                {AUTOMATIONS.slice(0, 4).map((a) => <li key={a.slug}><AutomationCard a={a} /></li>)}
              </ul>
              <p className="mt-6 text-ink-2">
                Rather do it yourself? <Link className="link" href="/guides/free-instagram-comment-to-dm-automation">Read the free comment-to-DM guide</Link>.
              </p>
            </div>
            <div className="lg:pt-24"><PriceCard /></div>
          </div>
        </section>

        {/* Goals */}
        <section aria-labelledby="goals-title" className="border-t border-line bg-surface py-section">
          <div className="wrap">
            <SectionHead id="goals-title" eyebrow="By goal" title="What do you want to grow?" />
            <ul className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              {GOALS.map((g) => (
                <li key={g.slug}>
                  <Link href={`/solutions/${g.slug}`} className="card card-link flex h-full flex-col p-6">
                    <span className="font-display text-2xl text-ink">{g.name}</span>
                    <span className="mt-2 text-ink-2">{g.metaDescription}</span>
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/guides/increase-instagram-followers" className="card card-link flex h-full flex-col p-6">
                  <span className="font-display text-2xl text-ink">More followers, likes and views</span>
                  <span className="mt-2 text-ink-2">How to grow on Instagram the way Instagram rewards, without buying followers.</span>
                </Link>
              </li>
            </ul>
          </div>
        </section>

        {/* Principles */}
        <section aria-labelledby="why-title" className="border-t border-line py-section">
          <div className="wrap">
            <SectionHead id="why-title" eyebrow="Why Social ScaleX" title="We treat your brand like our own." />
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

        <Founders />

        {/* Areas */}
        <section aria-labelledby="areas-title" className="border-t border-line bg-paper-2 py-section">
          <div className="wrap grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-center">
            <SectionHead
              id="areas-title"
              eyebrow="Where we work"
              title="A social media agency near you in Delhi NCR"
              intro={`Based in Delhi NCR, we shoot on location across ${AREAS_SERVED.join(', ')}. Page management, ads, automation and reporting run remotely, so brands anywhere in India work with us the same way.`}
            />
            <div>
              <ul className="flex flex-wrap gap-3">
                {CITIES.map((c) => (
                  <li key={c.slug}>
                    <Link href={`/areas/${c.slug}`} className="inline-block rounded-full border border-line-strong bg-surface px-5 py-2.5 font-display text-xl text-ink hover:border-ink">{c.name}</Link>
                  </li>
                ))}
                <li className="rounded-full border border-dashed border-line-strong px-5 py-2.5 font-display text-xl text-ink-2">Rest of India (remote)</li>
              </ul>
              <p className="mt-6">
                <Link href="/areas" className="link">Check your area or pin code <ArrowRight className="inline size-4" aria-hidden="true" /></Link>
              </p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section aria-labelledby="faq-title" className="py-section">
          <div className="wrap grid grid-cols-1 gap-12 lg:grid-cols-[1fr_1.6fr]">
            <SectionHead
              id="faq-title"
              eyebrow="Questions"
              title="Straight answers before you call."
              intro={<>Still unsure? Read our guide on <Link className="link" href="/guides/choose-social-media-agency">how to choose a social media agency</Link>.</>}
            />
            <FaqList faqs={FAQS} />
          </div>
        </section>

        {/* Guides */}
        <section aria-labelledby="guides-title" className="border-t border-line py-section">
          <div className="wrap">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <SectionHead id="guides-title" eyebrow="Guides" title="Learn how the platforms actually work." />
              <Link href="/guides" className="btn btn-secondary self-start md:self-auto">All guides</Link>
            </div>
            <ul className="mt-12 grid gap-5 md:grid-cols-3">
              {GUIDES.slice(0, 3).map((g) => (
                <li key={g.slug}>
                  <Link href={`/guides/${g.slug}`} className="card card-link flex h-full flex-col p-6">
                    <span className="font-display text-2xl leading-snug text-ink">{g.title}</span>
                    <span className="mt-3 text-ink-2">{g.description}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <FinalCta />

        <LeadSection />
      </SiteShell>
    </>
  );
}
