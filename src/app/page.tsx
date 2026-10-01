import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import { SiteShell } from '@/components/site/SiteShell';
import { SectionHead } from '@/components/site/SectionHead';
import { ServiceCard } from '@/components/site/Cards';
import { ResultTeaser } from '@/components/site/Results';
import { ProofPanel } from '@/components/site/ProofPanel';
import { FaqList } from '@/components/site/FaqList';
import { LeadSection } from '@/components/site/LeadSection';
import { JsonLd } from '@/components/seo/JsonLd';
import { WhatsappIcon } from '@/components/icons/WhatsappIcon';
import { UpdatedAgo } from '@/components/site/UpdatedAgo';
import { FAQS, PAINS, PORTFOLIO, PORTFOLIO_NOTE, RESULTS_AS_OF, PRINCIPLES, PROCESS, SERVICES, STATS } from '@/lib/content';
import { GUIDES } from '@/lib/guides';
import { AUTOMATIONS } from '@/lib/automation';
import { GOALS } from '@/lib/goals';
import { CITIES } from '@/lib/areas';
import { AutomationCard } from '@/components/site/AutomationCard';
import { PriceCard } from '@/components/site/Offer';
import { AREAS_SERVED, whatsappLink } from '@/lib/site';
import { faqNode, graph, itemListNode, webPageNode } from '@/lib/schema';

export const metadata: Metadata = { alternates: { canonical: '/' } };

/** The three biggest sales stories and the biggest creator. */
const FEATURED = ['saini-telecom', 'big-discount-mart', 'prago', 'acdelhivlogs'];

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
        {/* Hero */}
        <section aria-labelledby="hero-title" className="relative overflow-hidden">
          <div className="wrap grid grid-cols-1 items-center gap-14 pb-20 pt-12 sm:pt-16 lg:grid-cols-[1.25fr_1fr] lg:gap-16 lg:pb-28 lg:pt-20">
            <div>
              <h1 id="hero-title">
                <span className="eyebrow">Social media marketing agency in Delhi NCR</span>
                <span className="mt-5 block text-6xl text-ink">
                  We grow brands where their customers <em className="font-normal italic text-coral-text">already</em> scroll.
                </span>
              </h1>
              <p className="mt-6 max-w-xl text-lg text-ink-2">
                Social ScaleX plans, shoots, posts and advertises for brands and creators on Instagram, Facebook and YouTube, then reports every result from your own dashboard.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/contact" className="btn btn-primary btn-lg">
                  Book a free strategy call <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
                <a href={whatsappLink('Hi Social ScaleX, I’d like to grow my brand on social media.')} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-lg">
                  <WhatsappIcon size={18} /> Chat on WhatsApp
                </a>
              </div>
              <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-2">
                {['You keep every account', 'Reports from your own analytics', 'Talk directly to the founders'].map((t) => (
                  <li key={t} className="inline-flex items-center gap-2">
                    <Check className="size-4 text-positive" aria-hidden="true" /> {t}
                  </li>
                ))}
              </ul>
            </div>
            <ProofPanel />
          </div>
        </section>

        {/* Stats */}
        <section aria-label="Results in numbers" className="border-y border-line bg-surface">
          <dl className="wrap grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="flex flex-col-reverse">
                <dt className="mt-1 max-w-[16rem] text-sm text-ink-3">{s.label}</dt>
                <dd className="font-display text-4xl text-ink sm:text-5xl">{s.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Pains */}
        <section aria-labelledby="pains-title" className="py-section">
          <div className="wrap">
            <SectionHead id="pains-title" eyebrow="Sound familiar?" title="Most brands don’t need more posts. They need posts that work." />
            <ul className="mt-12 grid gap-5 md:grid-cols-3">
              {PAINS.map((p) => (
                <li key={p.problem} className="card flex flex-col p-6">
                  <p className="font-display text-2xl leading-snug text-ink">“{p.problem}”</p>
                  <p className="mt-4 flex-1 text-ink-2">{p.answer}</p>
                  <Link href={p.href} className="link mt-5 text-sm">{p.cta} <span aria-hidden="true">→</span></Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Services */}
        <section aria-labelledby="services-title" className="border-t border-line bg-paper-2 py-section">
          <div className="wrap">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <SectionHead
                id="services-title"
                eyebrow="Services"
                title="Instagram page management, Reels and ads, under one roof."
                intro="Content, page management and paid ads, delivered together so each one makes the others work harder."
              />
              <Link href="/services" className="btn btn-secondary self-start md:self-auto">All services</Link>
            </div>
            <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {SERVICES.map((s) => (
                <li key={s.slug}><ServiceCard s={s} /></li>
              ))}
            </ul>
          </div>
        </section>

        {/* Automation */}
        <section aria-labelledby="automation-title" className="py-section">
          <div className="wrap grid grid-cols-1 gap-12 lg:grid-cols-[1.5fr_1fr]">
            <div>
              <SectionHead
                id="automation-title"
                eyebrow="Automation"
                title="Instagram and WhatsApp auto-replies for every comment and DM"
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
                    <span className="mt-2 line-clamp-3 text-ink-2">{g.metaDescription}</span>
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/guides/increase-instagram-followers" className="card card-link flex h-full flex-col p-6">
                  <span className="font-display text-2xl text-ink">More followers, likes and views</span>
                  <span className="mt-2 line-clamp-3 text-ink-2">How to grow on Instagram the way Instagram rewards, without buying followers.</span>
                </Link>
              </li>
            </ul>
          </div>
        </section>

        {/* Results */}
        <section aria-labelledby="results-title" className="py-section">
          <div className="wrap">
            <SectionHead
              id="results-title"
              eyebrow="Client results"
              title="Real accounts. Real numbers."
              intro={PORTFOLIO_NOTE}
            />
            <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink-2">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-positive" />
              <UpdatedAgo iso={RESULTS_AS_OF} prefix="Figures updated" />
            </p>
            <ul className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURED.map((id) => PORTFOLIO.find((p) => p.id === id))
                .filter((p): p is NonNullable<typeof p> => Boolean(p))
                .map((p) => (
                  <li key={p.id} className="min-w-0"><ResultTeaser p={p} /></li>
                ))}
            </ul>
            <p className="mt-8">
              <Link href="/case-studies" className="btn btn-secondary btn-lg">
                See all {PORTFOLIO.length} client results <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </p>
          </div>
        </section>

        {/* Process */}
        <section aria-labelledby="process-title" className="border-t border-line bg-surface py-section">
          <div className="wrap grid grid-cols-1 gap-12 lg:grid-cols-[1fr_1.4fr]">
            <SectionHead
              id="process-title"
              eyebrow="How we work"
              title="Growth isn’t luck. It’s a process."
              intro="Four steps, the same for every account. You see and approve each one."
            />
            <ol className="grid gap-px overflow-hidden rounded-card border border-line bg-line sm:grid-cols-2">
              {PROCESS.map((s, i) => (
                <li key={s.title} className="bg-surface p-6">
                  <span className="font-display text-sm text-coral-text">Step {i + 1}</span>
                  <h3 className="mt-2 text-2xl text-ink">{s.title}</h3>
                  <p className="mt-2 text-ink-2">{s.desc}</p>
                </li>
              ))}
            </ol>
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
                    <span className="mt-3 line-clamp-3 text-ink-2">{g.description}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <LeadSection />
      </SiteShell>
    </>
  );
}
