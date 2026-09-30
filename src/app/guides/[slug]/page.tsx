import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SiteShell } from '@/components/site/SiteShell';
import { Breadcrumbs } from '@/components/site/Breadcrumbs';
import { ServiceCard } from '@/components/site/Cards';
import { LeadSection } from '@/components/site/LeadSection';
import { Rich } from '@/components/site/Rich';
import { CompareTable, OfferBox } from '@/components/site/Offer';
import { JsonLd } from '@/components/seo/JsonLd';
import { GUIDES, getGuide, guideWordCount, type Block } from '@/lib/guides';
import { getService } from '@/lib/content';
import { articleNode, breadcrumbNode, graph, webPageNode } from '@/lib/schema';

export const dynamicParams = false;

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const g = getGuide(params.slug);
  if (!g) return {};
  const path = `/guides/${g.slug}`;
  return {
    title: g.metaTitle,
    description: g.description,
    alternates: { canonical: path },
    openGraph: { type: 'article', title: `${g.metaTitle} | Social ScaleX`, description: g.description, url: path, publishedTime: g.published, modifiedTime: g.updated },
  };
}

const fmt = (d: string) => new Date(`${d}T00:00:00+05:30`).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' });
const anchor = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function BlockView({ b }: { b: Block }) {
  switch (b.t) {
    case 'h2':
      return <h2 id={anchor(b.text)}>{b.text}</h2>;
    case 'p':
      return <p><Rich text={b.text} /></p>;
    case 'ul':
      return <ul>{b.items.map((it) => <li key={it}><Rich text={it} /></li>)}</ul>;
    case 'ol':
      return <ol>{b.items.map((it) => <li key={it}><Rich text={it} /></li>)}</ol>;
    case 'offer':
      return <OfferBox variant={b.variant} />;
    case 'compare':
      return <CompareTable />;
    case 'quote':
      return (
        <figure>
          <blockquote><p>{b.text}</p></blockquote>
          <figcaption className="mt-2 text-sm text-ink-3">{b.cite}</figcaption>
        </figure>
      );
  }
}

export default function GuidePage({ params }: { params: { slug: string } }) {
  const g = getGuide(params.slug);
  if (!g) notFound();
  const path = `/guides/${g.slug}`;
  const crumbs = [
    { name: 'Home', path: '/' },
    { name: 'Guides', path: '/guides' },
    { name: g.metaTitle, path },
  ];
  const words = guideWordCount(g);
  const toc = g.blocks.filter((b): b is Extract<Block, { t: 'h2' }> => b.t === 'h2');
  const services = g.services.map(getService).filter((x): x is NonNullable<typeof x> => Boolean(x));
  const others = GUIDES.filter((o) => o.slug !== g.slug);

  return (
    <>
      <JsonLd
        data={graph([
          webPageNode({ path, name: g.metaTitle, description: g.description, hasBreadcrumb: true }),
          breadcrumbNode(crumbs, path),
          articleNode(g, words),
        ])}
      />
      <SiteShell>
        <article>
          <header className="border-b border-line">
            <div className="wrap grid max-w-content grid-cols-1 pb-12 pt-8 lg:max-w-wide lg:grid-cols-[14rem_minmax(0,42rem)] lg:justify-center lg:gap-16">
              <div className="lg:col-start-2">
              <Breadcrumbs crumbs={crumbs} />
              <p className="eyebrow mt-10">Guide</p>
              <h1 className="mt-4 text-5xl text-ink">{g.title}</h1>
              <p className="mt-5 text-sm text-ink-3">
                By {g.author} · Updated <time dateTime={g.updated}>{fmt(g.updated)}</time> · {Math.max(1, Math.round(words / 220))} min read
              </p>
              <div className="mt-8 rounded-card border-l-4 border-coral bg-surface p-6 ring-1 ring-line">
                <p className="font-sans text-xs font-semibold uppercase tracking-[0.12em] text-ink-3">The short answer</p>
                <p className="mt-2 text-lg text-ink">{g.summary}</p>
              </div>
              </div>
            </div>
          </header>

          <div className="wrap grid max-w-content grid-cols-1 gap-10 py-12 lg:max-w-wide lg:grid-cols-[14rem_minmax(0,42rem)] lg:justify-center lg:gap-16">
            <nav aria-label="On this page" className="hidden lg:block">
              <div className="sticky top-24">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-3">On this page</p>
                <ol className="mt-4 space-y-2.5 text-sm">
                  {toc.map((h) => (
                    <li key={h.text}><a href={`#${anchor(h.text)}`} className="text-ink-2 hover:text-ink">{h.text}</a></li>
                  ))}
                </ol>
              </div>
            </nav>
            <div className="prose-site">
              {g.blocks.map((b, i) => <BlockView key={i} b={b} />)}

              <h2 id="sources">Sources</h2>
              <ol className="text-base">
                {g.sources.map((s) => (
                  <li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.label}</a></li>
                ))}
              </ol>
              <p className="text-sm text-ink-3">Sources checked on {fmt(g.updated)}. Platform rules change; if something here is out of date, tell us and we’ll fix it.</p>
            </div>
          </div>
        </article>

        {services.length ? (
          <section aria-labelledby="help-title" className="border-t border-line bg-paper-2 py-section">
            <div className="wrap">
              <h2 id="help-title" className="text-4xl text-ink">Want us to handle this for you?</h2>
              <ul className="mt-10 grid gap-5 md:grid-cols-3">
                {services.map((s) => <li key={s.slug}><ServiceCard s={s} /></li>)}
              </ul>
            </div>
          </section>
        ) : null}

        <section aria-labelledby="more-title" className="border-t border-line py-section">
          <div className="wrap">
            <h2 id="more-title" className="text-3xl text-ink">More guides</h2>
            <ul className="mt-8 grid gap-5 md:grid-cols-2">
              {others.map((o) => (
                <li key={o.slug}>
                  <Link href={`/guides/${o.slug}`} className="card card-link block h-full p-6">
                    <span className="font-display text-2xl text-ink">{o.title}</span>
                    <span className="mt-2 block text-ink-2">{o.description}</span>
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
