import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteShell } from '@/components/site/SiteShell';
import { PageIntro } from '@/components/site/PageIntro';
import { SectionHead } from '@/components/site/SectionHead';
import { FaqList } from '@/components/site/FaqList';
import { JsonLd } from '@/components/seo/JsonLd';
import { breadcrumbNode, faqNode, graph, itemListNode, webPageNode } from '@/lib/schema';
import { socialMeta } from '@/lib/site';
import { CONTENT_TYPES, CREATOR_FAQS, HOW_IT_WORKS, HUB_DESCRIPTION, HUB_INTRO, HUB_TITLE, fmtDate, getBriefs, isOpen, payText, placeText } from '@/lib/creators';

export const revalidate = 300;

const CRUMBS = [
  { name: 'Home', path: '/' },
  { name: 'Creator Hub', path: '/creators' },
];

export const metadata: Metadata = {
  title: HUB_TITLE,
  description: HUB_DESCRIPTION,
  alternates: { canonical: '/creators' },
  ...socialMeta({ title: HUB_TITLE, description: HUB_DESCRIPTION, path: '/creators' }),
};

export default async function CreatorHub() {
  const open = (await getBriefs()).filter(isOpen);
  return (
    <>
      <JsonLd
        data={graph([
          webPageNode({ path: '/creators', name: HUB_TITLE, description: HUB_DESCRIPTION, type: 'CollectionPage', hasBreadcrumb: true }),
          breadcrumbNode(CRUMBS, '/creators'),
          ...(open.length ? [itemListNode('/creators#briefs', open.map((b) => ({ name: b.title, path: `/creators/briefs/${b.slug}` })))] : []),
          faqNode(CREATOR_FAQS, '/creators'),
        ])}
      />
      <SiteShell>
        <PageIntro crumbs={CRUMBS} eyebrow="Creator Hub" title="Paid briefs for UGC creators and influencers" lede={HUB_INTRO}>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#briefs" className="btn btn-primary btn-lg">See open briefs ({open.length})</a>
            <Link href="/creators/join" className="btn btn-secondary btn-lg">Join the creator network</Link>
          </div>
        </PageIntro>

        <section id="briefs" aria-labelledby="briefs-title" className="py-section">
          <div className="wrap">
            <SectionHead id="briefs-title" eyebrow="Open now" title={open.length ? `${open.length} open brief${open.length === 1 ? '' : 's'}` : 'No open briefs right now'} />
            {open.length ? (
              <ul className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2">
                {open.map((b) => (
                  <li key={b.slug} className="flex flex-col rounded-2xl border border-line bg-surface p-6">
                    <p className="text-sm text-ink-3">{CONTENT_TYPES[b.content_type] ?? b.content_type} · {b.brand_label}</p>
                    <h3 className="mt-2 font-display text-2xl text-ink"><Link href={`/creators/briefs/${b.slug}`} className="hover:text-coral-text">{b.title}</Link></h3>
                    <p className="mt-3 text-ink-2">{b.summary}</p>
                    <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                      <dt className="text-ink-3">Pay</dt><dd className="font-semibold text-ink">{payText(b)}</dd>
                      <dt className="text-ink-3">Where</dt><dd className="text-ink">{placeText(b)}</dd>
                      <dt className="text-ink-3">Apply by</dt><dd className="text-ink">{fmtDate(b.apply_by)}</dd>
                      {b.status === 'shortlisting' ? <><dt className="text-ink-3">Status</dt><dd className="text-ink">Shortlisting, still open</dd></> : null}
                    </dl>
                    <div className="mt-6"><Link href={`/creators/briefs/${b.slug}`} className="btn btn-secondary">Read the brief and apply</Link></div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-8 max-w-2xl rounded-2xl border border-line bg-surface p-6 text-ink-2">
                <p>New briefs go up here as our clients need them. Join the creator network and we’ll contact you when one fits your profile.</p>
                <Link href="/creators/join" className="btn btn-primary mt-5">Join the creator network</Link>
              </div>
            )}
          </div>
        </section>

        <section aria-labelledby="how-title" className="border-t border-line py-section">
          <div className="wrap">
            <SectionHead id="how-title" eyebrow="How it works" title="From application to payment" />
            <ol className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {HOW_IT_WORKS.map((s, i) => (
                <li key={s.title} className="rounded-2xl border border-line bg-surface p-6">
                  <span className="font-display text-3xl text-coral-text">{i + 1}</span>
                  <h3 className="mt-3 text-lg font-semibold text-ink">{s.title}</h3>
                  <p className="mt-2 text-ink-2">{s.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section aria-labelledby="faq-title" className="border-t border-line py-section">
          <div className="wrap grid grid-cols-1 gap-12 lg:grid-cols-[1fr_1.6fr]">
            <SectionHead id="faq-title" eyebrow="Questions creators ask" title="Before you apply" />
            <FaqList faqs={CREATOR_FAQS} />
          </div>
        </section>
      </SiteShell>
    </>
  );
}
