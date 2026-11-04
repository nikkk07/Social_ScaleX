import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { SiteShell } from '@/components/site/SiteShell';
import { PageIntro } from '@/components/site/PageIntro';
import { SectionHead } from '@/components/site/SectionHead';
import { FaqList } from '@/components/site/FaqList';
import { LeadSection } from '@/components/site/LeadSection';
import { AreaChecker } from '@/components/site/AreaChecker';
import { JsonLd } from '@/components/seo/JsonLd';
import { CITIES, PIN_GROUPS, cityStats, getCity, type AreaEntry } from '@/lib/areas';
import { PORTFOLIO, PORTFOLIO_NOTE, getService } from '@/lib/content';
import { ResultTeaser } from '@/components/site/Results';
import { getAutomation } from '@/lib/automation';
import { areaServiceNode, breadcrumbNode, faqNode, graph, webPageNode } from '@/lib/schema';
import { socialMeta } from '@/lib/site';

export const dynamicParams = false;

export function generateStaticParams() {
  return CITIES.map((c) => ({ slug: c.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = getCity((await params).slug);
  if (!c) return {};
  const path = `/areas/${c.slug}`;
  return {
    title: c.metaTitle,
    description: c.metaDescription,
    alternates: { canonical: path },
    ...socialMeta({ title: c.metaTitle, description: c.metaDescription, path: path }),
  };
}

export default async function CityPage({ params }: Props) {
  const c = getCity((await params).slug);
  if (!c) notFound();
  const path = `/areas/${c.slug}`;
  const crumbs = [
    { name: 'Home', path: '/' },
    { name: 'Areas we serve', path: '/areas' },
    { name: c.longName, path },
  ];
  const groups = PIN_GROUPS[c.key];
  const stats = cityStats(c.key);
  const entries: AreaEntry[] = groups.flatMap(([pin, names]) => names.map((n): AreaEntry => [n, pin, c.slug]));
  const picks = c.picks
    .map((p) => {
      const item = p.kind === 'service' ? getService(p.slug) : getAutomation(p.slug);
      return item ? { href: `/${p.kind === 'service' ? 'services' : 'automation'}/${p.slug}`, name: item.name, why: p.why } : null;
    })
    .filter((x): x is NonNullable<typeof x> => Boolean(x));
  const others = CITIES.filter((o) => o.slug !== c.slug);

  // Proof first: real client results. Only Delhi has clients based in the city
  // itself, so other cities say plainly that these are Delhi NCR accounts.
  const businessFirst = (a: (typeof PORTFOLIO)[number], b: (typeof PORTFOLIO)[number]) => Number(b.kind === 'Business') - Number(a.kind === 'Business');
  const local = PORTFOLIO.filter((p) => p.category.includes(c.name)).sort(businessFirst);
  // Elsewhere, two of the Delhi NCR accounts, a different pair per city, so the pages don't repeat each other.
  const ncr = PORTFOLIO.filter((p) => /Delhi/.test(p.category)).sort(businessFirst);
  const at = CITIES.findIndex((o) => o.slug === c.slug) % Math.max(1, ncr.length);
  const proof = local.length >= 2 ? local.slice(0, 3) : [...ncr.slice(at), ...ncr.slice(0, at)].slice(0, 2);
  const proofTitle = local.length >= 2 ? `Results from ${c.name} accounts` : 'Results from Delhi NCR accounts';

  return (
    <>
      <JsonLd
        data={graph([
          webPageNode({ path, name: c.metaTitle, description: c.metaDescription, hasBreadcrumb: true }),
          breadcrumbNode(crumbs, path),
          areaServiceNode(c),
          faqNode(c.faqs, path),
        ])}
      />
      <SiteShell>
        <PageIntro crumbs={crumbs} eyebrow={`Areas we serve · ${c.name}`} title={c.h1} lede={<p>{c.lede}</p>}>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="#get-started" className="btn btn-primary btn-lg">Book a free strategy call <ArrowRight className="size-4" aria-hidden="true" /></Link>
            <Link href="#pin-codes" className="btn btn-secondary btn-lg">Check your area</Link>
          </div>
        </PageIntro>

        {proof.length ? (
          <section aria-labelledby="proof-title" className="border-t border-line bg-surface py-section">
            <div className="wrap">
              <SectionHead id="proof-title" eyebrow="Proof" title={proofTitle} intro={local.length >= 2 ? PORTFOLIO_NOTE : 'Figures from each client’s own Instagram or YouTube analytics, shared with permission.'} />
              <ul className={`mt-10 grid gap-5 md:grid-cols-2 ${proof.length > 2 ? 'lg:grid-cols-3' : ''}`}>
                {proof.map((p) => <li key={p.id}><ResultTeaser p={p} /></li>)}
              </ul>
              <p className="mt-8">
                <Link href="/case-studies" className="link text-sm">See all client results <span aria-hidden="true">→</span></Link>
              </p>
            </div>
          </section>
        ) : null}

        <section aria-labelledby="local-title" className="py-section">
          <div className="wrap grid grid-cols-1 gap-12 lg:grid-cols-[1.3fr_1fr]">
            <div>
              <SectionHead id="local-title" eyebrow="Local notes" title={`What works for ${c.name} businesses`} />
              <div className="mt-8 space-y-5 text-lg text-ink-2">
                {c.local.map((p) => <p key={p.slice(0, 32)}>{p}</p>)}
              </div>
            </div>
            <div>
              <h3 className="font-sans text-xs font-semibold uppercase tracking-[0.12em] text-ink-3">Busy areas we work in</h3>
              <ul className="mt-4 divide-y divide-line border-y border-line">
                {c.hubs.map((h) => (
                  <li key={h.name} className="flex items-baseline justify-between gap-4 py-3">
                    <span className="min-w-0">
                      <span className="font-semibold text-ink">{h.name}</span>
                      <span className="block text-sm text-ink-3">{h.note}</span>
                    </span>
                    <span className="shrink-0 tabular-nums text-sm text-ink-2">{h.pin}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section aria-labelledby="picks-title" className="border-t border-line bg-paper-2 py-section">
          <div className="wrap">
            <SectionHead id="picks-title" eyebrow="Where to start" title={`What ${c.name} clients usually start with`} />
            <ul className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
              {picks.map((p) => (
                <li key={p.href}>
                  <Link href={p.href} className="card card-link group flex h-full flex-col p-6">
                    <span className="flex items-start justify-between gap-4">
                      <span className="font-display text-2xl leading-tight text-ink">{p.name}</span>
                      <ArrowUpRight className="size-5 flex-none text-ink-3 transition-colors group-hover:text-coral-text" aria-hidden="true" />
                    </span>
                    <span className="mt-3 text-ink-2">{p.why}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section aria-labelledby="faq-title" className="border-t border-line py-section">
          <div className="wrap grid grid-cols-1 gap-12 lg:grid-cols-[1fr_1.6fr]">
            <SectionHead id="faq-title" eyebrow="Questions" title={`${c.name}: common questions`} />
            <FaqList faqs={c.faqs} />
          </div>
        </section>

        <section id="pin-codes" aria-labelledby="pins-title" className="scroll-mt-20 border-t border-line py-section">
          <div className="wrap">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1fr] lg:items-end">
              <SectionHead
                id="pins-title"
                eyebrow="Check your area"
                title={`Do we cover your part of ${c.name}?`}
                intro={`Type your locality or pin code. We cover ${stats.places} localities in ${c.longName}, from official lists.${c.nameNote ? ` ${c.nameNote}` : ''}`}
              />
              <AreaChecker entries={entries} cityNames={{ [c.slug]: c.name }} scoped example={`${c.hubs[0]!.name} or ${c.hubs[0]!.pin}`} />
            </div>
            <details className="group mt-10">
              <summary className="inline-flex min-h-11 cursor-pointer list-none items-center rounded-full border border-line-strong bg-surface px-5 py-2.5 font-semibold text-ink hover:border-ink [&::-webkit-details-marker]:hidden">
                <span className="group-open:hidden">Show</span><span className="hidden group-open:inline">Hide</span>&nbsp;all {stats.pins} pin codes ({stats.first}–{stats.last})
              </summary>
            <div className="mt-6 gap-5 sm:columns-2 lg:columns-3">
              {groups.map(([pin, names]) => (
                <div key={pin} id={`pin-${pin}`} className="mb-5 break-inside-avoid scroll-mt-24 rounded-card border border-line bg-surface p-5 target:border-coral target:bg-coral-tint">
                  <h3 className="font-display text-xl tabular-nums text-ink">
                    <span className="sr-only">Pin code </span>{pin}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-2">{names.join(' · ')}</p>
                </div>
              ))}
            </div>
            </details>
            <p className="mt-6 text-sm text-ink-3">
              Source: <a className="link font-normal" href={c.source.url} target="_blank" rel="noopener noreferrer">{c.source.label}</a>.
              Names are as published there. Not listed? Colonies and societies usually sit under one of these post offices, and we still cover you.
            </p>
          </div>
        </section>

        <nav aria-labelledby="more-title" className="border-t border-line bg-paper-2 py-12">
          <div className="wrap">
            <h2 id="more-title" className="font-sans text-xs font-semibold uppercase tracking-[0.12em] text-ink-3">Other areas we serve</h2>
            <ul className="mt-4 flex flex-wrap gap-3">
              {others.map((o) => (
                <li key={o.slug}>
                  <Link href={`/areas/${o.slug}`} className="inline-block rounded-full border border-line-strong bg-surface px-5 py-2.5 font-display text-lg text-ink hover:border-ink">{o.longName}</Link>
                </li>
              ))}
              <li>
                <Link href="/areas" className="inline-block rounded-full border border-line-strong bg-surface px-5 py-2.5 font-display text-lg text-ink hover:border-ink">All areas</Link>
              </li>
            </ul>
          </div>
        </nav>

        <LeadSection />
      </SiteShell>
    </>
  );
}
