import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SiteShell } from '@/components/site/SiteShell';
import { Breadcrumbs } from '@/components/site/Breadcrumbs';
import { CreatorApplyForm } from '@/components/site/CreatorApplyForm';
import { JsonLd } from '@/components/seo/JsonLd';
import { breadcrumbNode, graph, webPageNode } from '@/lib/schema';
import { abs, socialMeta } from '@/lib/site';
import { CONTENT_TYPES, fmtDate, getBrief, getBriefs, isOpen, jobPostingNode, payText, placeText } from '@/lib/creators';

export const revalidate = 300;
export const dynamicParams = true;

export async function generateStaticParams() {
  return (await getBriefs()).map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const b = await getBrief((await params).slug);
  if (!b) return { title: 'Brief not found', robots: { index: false } };
  const path = `/creators/briefs/${b.slug}`;
  const open = isOpen(b);
  const title = `${b.title}${open ? '' : ' (closed)'}`;
  const description = `${payText(b)} · ${placeText(b)} · apply by ${fmtDate(b.apply_by)}. ${b.summary}`.slice(0, 160);
  return {
    title, description, alternates: { canonical: path },
    ...(open ? {} : { robots: { index: false, follow: true } }),
    ...socialMeta({ title, description, path }),
  };
}

export default async function BriefPage({ params }: { params: Promise<{ slug: string }> }) {
  const b = await getBrief((await params).slug);
  if (!b) notFound();
  const path = `/creators/briefs/${b.slug}`;
  const open = isOpen(b);
  const job = jobPostingNode(b);
  const crumbs = [{ name: 'Home', path: '/' }, { name: 'Creator Hub', path: '/creators' }, { name: b.title, path }];
  const facts: [string, React.ReactNode][] = [
    ['Pay', <strong key="p">{payText(b)}{b.pay_note ? <span className="font-normal text-ink-2"> · {b.pay_note}</span> : null}</strong>],
    ['Content', `${CONTENT_TYPES[b.content_type] ?? b.content_type} for ${b.platforms.map((p) => p[0]!.toUpperCase() + p.slice(1)).join(', ')}`],
    ['Where', placeText(b)],
    ['Usage rights', b.usage_rights],
    ['Apply by', fmtDate(b.apply_by)],
    ...(b.deliver_by ? [['Deliver by', fmtDate(b.deliver_by)] as [string, React.ReactNode]] : []),
    ['Creators needed', String(b.slots)],
    ...(b.languages.length ? [['Languages', b.languages.join(', ')] as [string, React.ReactNode]] : []),
    ...(b.min_followers ? [['Followers', `${b.min_followers.toLocaleString('en-IN')}+`] as [string, React.ReactNode]] : []),
    ['Face on camera', b.face_on_camera ? 'Yes' : 'Not needed'],
    ['Post label', b.disclosure_label],
  ];

  return (
    <>
      <JsonLd data={graph([
        webPageNode({ path, name: b.title, description: b.summary, hasBreadcrumb: true, dateModified: b.updated_at.slice(0, 10) }),
        breadcrumbNode(crumbs, path),
        ...(job ? [job] : []),
      ])} />
      <SiteShell>
        <article>
          <div className="wrap pt-8"><Breadcrumbs crumbs={crumbs} /></div>
          <header className="wrap mt-10 max-w-4xl">
            <p className="eyebrow">{CONTENT_TYPES[b.content_type] ?? b.content_type} · {b.brand_label}</p>
            <h1 className="mt-4 text-5xl text-ink">{b.title}</h1>
            <p className="mt-6 max-w-2xl text-lg text-ink-2">{b.summary}</p>
            {!open ? <p role="status" className="mt-6 rounded-xl border border-line bg-paper-2 p-4 text-ink">This brief is closed and no longer takes applications. <Link href="/creators" className="underline">See the open briefs</Link> or <Link href="/creators/join" className="underline">join the creator network</Link>.</p> : null}
          </header>

          <div className="wrap mt-12 grid grid-cols-1 gap-12 pb-section lg:grid-cols-[1.4fr_1fr]">
            <div className="min-w-0">
              <h2 className="text-3xl text-ink">The brief</h2>
              {b.description.split(/\n{2,}/).map((p, i) => <p key={i} className="mt-4 whitespace-pre-line text-ink-2">{p}</p>)}
              <h2 className="mt-10 text-3xl text-ink">What you’ll deliver</h2>
              <ul className="mt-4 list-disc space-y-2 pl-5 text-ink-2">{b.deliverables.map((d) => <li key={d}>{d}</li>)}</ul>
              {b.requirements.length ? <>
                <h2 className="mt-10 text-3xl text-ink">Who can apply</h2>
                <ul className="mt-4 list-disc space-y-2 pl-5 text-ink-2">{[...b.requirements, '18 or older'].map((d) => <li key={d}>{d}</li>)}</ul>
              </> : null}
              <h2 className="mt-10 text-3xl text-ink">Disclosure</h2>
              <p className="mt-4 text-ink-2">Your post must carry the label “{b.disclosure_label}” upfront, as India’s advertising code (ASCI) requires when a brand pays you or gives you something. Social ScaleX never charges creators anything.</p>
            </div>
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <dl className="rounded-2xl border border-line bg-surface p-6 text-sm">
                {facts.map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 border-b border-line py-2.5 last:border-0">
                    <dt className="text-ink-3">{k}</dt><dd className="text-right text-ink">{v}</dd>
                  </div>
                ))}
              </dl>
              {open ? <a href="#apply" className="btn btn-primary btn-lg mt-5 w-full">Apply now</a> : null}
            </aside>
          </div>

          {open ? (
            <section id="apply" aria-labelledby="apply-title" className="scroll-mt-24 border-t border-line py-section">
              <div className="wrap max-w-3xl">
                <h2 id="apply-title" className="text-4xl text-ink">Apply for this brief</h2>
                <p className="mt-3 text-ink-2">About two minutes. No account and no fee. We reply to every application, yes or no.</p>
                <div className="mt-8 rounded-3xl border border-line bg-surface p-5 sm:p-8"><CreatorApplyForm brief={b.slug} briefTitle={b.title} returnUrl={abs(path)} /></div>
              </div>
            </section>
          ) : null}
        </article>
      </SiteShell>
    </>
  );
}
