import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SiteShell } from '@/components/site/SiteShell';
import { Breadcrumbs } from '@/components/site/Breadcrumbs';
import { CareerApplyForm } from '@/components/site/CareerApplyForm';
import { JsonLd } from '@/components/seo/JsonLd';
import { breadcrumbNode, graph, webPageNode } from '@/lib/schema';
import { abs, socialMeta } from '@/lib/site';
import { ageText, EMPLOYMENT_LABEL, getOpening, getOpenings, isOpenNow, openingJobNode, placeOf } from '@/lib/careers';
import { fmtDate } from '@/lib/creators';

export const revalidate = 300;
export const dynamicParams = true;

export async function generateStaticParams() {
  return (await getOpenings()).map((o) => ({ slug: o.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const o = await getOpening((await params).slug);
  if (!o) return { title: 'Job not found', robots: { index: false } };
  const path = `/careers/${o.slug}`;
  const open = isOpenNow(o);
  const title = `${o.title} Job in ${o.work_mode === 'remote' ? 'India (Remote)' : o.locality ? `${o.locality}, ${o.city}` : o.city ?? 'Delhi'}${open ? '' : ' (closed)'}`;
  const description = `${EMPLOYMENT_LABEL[o.employment_type]} · ${placeOf(o)}${o.hours ? ` · ${o.hours}` : ''}. ${o.summary}`.slice(0, 160);
  return {
    title, description, alternates: { canonical: path },
    ...(open ? {} : { robots: { index: false, follow: true } }),
    ...socialMeta({ title, description, path }),
  };
}

export default async function OpeningPage({ params }: { params: Promise<{ slug: string }> }) {
  const o = await getOpening((await params).slug);
  if (!o) notFound();
  const path = `/careers/${o.slug}`;
  const open = isOpenNow(o);
  const job = openingJobNode(o);
  const crumbs = [{ name: 'Home', path: '/' }, { name: 'Careers', path: '/careers' }, { name: o.title, path }];
  const facts: [string, React.ReactNode][] = [
    ['Job type', EMPLOYMENT_LABEL[o.employment_type]],
    ['Where', placeOf(o)],
    ...(o.hours ? [['Hours and days', o.hours] as [string, React.ReactNode]] : []),
    ['Salary', o.salary_text],
    ['Age', ageText(o)],
    ...(o.positions > 1 ? [['Positions', String(o.positions)] as [string, React.ReactNode]] : []),
    ['Apply by', o.apply_by ? fmtDate(o.apply_by) : 'Until filled'],
    ['Fee to apply', 'None, ever'],
  ];
  return (
    <>
      <JsonLd data={graph([
        webPageNode({ path, name: o.title, description: o.summary, hasBreadcrumb: true, dateModified: o.updated_at.slice(0, 10) }),
        breadcrumbNode(crumbs, path),
        ...(job ? [job] : []),
      ])} />
      <SiteShell>
        <article>
          <div className="wrap pt-8"><Breadcrumbs crumbs={crumbs} /></div>
          <header className="wrap mt-10 max-w-4xl">
            <p className="eyebrow">Careers · {o.department ?? 'Social ScaleX'}</p>
            <h1 className="mt-4 text-4xl text-ink sm:text-5xl">{o.title}</h1>
            <p className="mt-6 max-w-2xl text-lg text-ink-2">{o.summary}</p>
            {!open ? <p role="status" className="mt-6 rounded-xl border border-line bg-paper-2 p-4 text-ink">This job is closed and no longer takes applications. <Link href="/careers#profile" className="underline">Send your profile</Link> and we’ll call you when a role fits.</p> : null}
          </header>
          <div className="wrap mt-12 grid grid-cols-1 gap-12 pb-section lg:grid-cols-[1.4fr_1fr]">
            <div className="min-w-0">
              <h2 className="text-3xl text-ink">About the job</h2>
              {o.description.split(/\n{2,}/).map((p, i) => <p key={i} className="mt-4 whitespace-pre-line text-ink-2">{p}</p>)}
              {o.responsibilities.length ? <>
                <h2 className="mt-10 text-3xl text-ink">What you’ll do</h2>
                <ul className="mt-4 list-disc space-y-2 pl-5 text-ink-2">{o.responsibilities.map((d) => <li key={d}>{d}</li>)}</ul>
              </> : null}
              {o.requirements.length ? <>
                <h2 className="mt-10 text-3xl text-ink">Who can apply</h2>
                <ul className="mt-4 list-disc space-y-2 pl-5 text-ink-2">{o.requirements.map((d) => <li key={d}>{d}</li>)}</ul>
              </> : null}
              <h2 className="mt-10 text-3xl text-ink">No fee, ever</h2>
              <p className="mt-4 text-ink-2">Social ScaleX never charges anything to apply, for an interview, for training or for joining. If anyone asks you for money in our name, it isn’t us.</p>
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
                <h2 id="apply-title" className="text-3xl text-ink sm:text-4xl">Apply for this job</h2>
                <p className="mt-3 text-ink-2">Three short steps, about two minutes. No account and no fee. We reply to every application.</p>
                <div className="mt-8 rounded-3xl border border-line bg-surface p-5 sm:p-8">
                  <CareerApplyForm opening={o.slug} openingTitle={o.title} ageMin={o.age_min} ageMax={o.age_max} returnUrl={abs(path)} />
                </div>
              </div>
            </section>
          ) : null}
        </article>
      </SiteShell>
    </>
  );
}
