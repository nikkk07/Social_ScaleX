import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Briefcase, Clock, MapPin, Sparkles } from 'lucide-react';
import { SiteShell } from '@/components/site/SiteShell';
import { PageIntro } from '@/components/site/PageIntro';
import { SectionHead } from '@/components/site/SectionHead';
import { FaqList } from '@/components/site/FaqList';
import { CareerApplyForm } from '@/components/site/CareerApplyForm';
import { JsonLd } from '@/components/seo/JsonLd';
import { breadcrumbNode, faqNode, graph, itemListNode, webPageNode } from '@/lib/schema';
import { abs, socialMeta } from '@/lib/site';
import { CAREER_FAQS, CAREER_STEPS, CAREERS_DESCRIPTION, CAREERS_INTRO, CAREERS_TITLE, EMPLOYMENT_LABEL, getOpenings, isOpenNow, placeOf } from '@/lib/careers';

export const revalidate = 300;

const CRUMBS = [{ name: 'Home', path: '/' }, { name: 'Careers', path: '/careers' }];

export const metadata: Metadata = {
  title: CAREERS_TITLE, description: CAREERS_DESCRIPTION, alternates: { canonical: '/careers' },
  ...socialMeta({ title: CAREERS_TITLE, description: CAREERS_DESCRIPTION, path: '/careers' }),
};

// The hub carries no JobPosting (Google allows it only on each job's own page) and the profile form is a plain form.
export default async function Careers() {
  const open = (await getOpenings()).filter(isOpenNow);
  return (
    <>
      <JsonLd data={graph([
        webPageNode({ path: '/careers', name: CAREERS_TITLE, description: CAREERS_DESCRIPTION, type: 'CollectionPage', hasBreadcrumb: true }),
        breadcrumbNode(CRUMBS, '/careers'),
        ...(open.length ? [itemListNode('/careers#jobs', open.map((o) => ({ name: o.title, path: `/careers/${o.slug}` })))] : []),
        faqNode(CAREER_FAQS, '/careers'),
      ])} />
      <SiteShell>
        <PageIntro crumbs={CRUMBS} eyebrow="Careers" title="Jobs in Delhi" lede={CAREERS_INTRO}>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#jobs" className="btn btn-primary btn-lg">See open jobs ({open.length})</a>
            <a href="#profile" className="btn btn-secondary btn-lg">Send your profile</a>
          </div>
          <p className="mt-6 text-sm text-ink-3">Are you a creator looking for paid brand work instead? <Link href="/creators" className="link">Go to the Creator Hub</Link>.</p>
        </PageIntro>

        <section id="jobs" aria-labelledby="jobs-title" className="scroll-mt-24 py-section">
          <div className="wrap">
            <SectionHead id="jobs-title" eyebrow="Open now" title={open.length ? `${open.length} open job${open.length === 1 ? '' : 's'}` : 'No open jobs right now'} />
            {open.length ? (
              <ul className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2">
                {open.map((o) => (
                  <li key={o.slug}>
                    <article className="card card-link relative flex h-full flex-col p-6 sm:p-7">
                      <p className="text-sm text-ink-3">{o.for_client ? `${o.employer ?? 'A client'} · hiring through Social ScaleX` : 'Social ScaleX team'}</p>
                      <h3 className="mt-2 font-display text-2xl text-ink"><Link href={`/careers/${o.slug}`} className="after:absolute after:inset-0">{o.title}</Link></h3>
                      <p className="mt-3 text-ink-2">{o.summary}</p>
                      <ul className="mt-5 flex flex-wrap gap-2 text-sm text-ink-2">
                        <li className="inline-flex items-center gap-1.5 rounded-full bg-paper-2 px-3 py-1"><Briefcase className="size-3.5" aria-hidden />{EMPLOYMENT_LABEL[o.employment_type]}</li>
                        <li className="inline-flex items-center gap-1.5 rounded-full bg-paper-2 px-3 py-1"><MapPin className="size-3.5" aria-hidden />{placeOf(o)}</li>
                        {o.hours ? <li className="inline-flex items-center gap-1.5 rounded-full bg-paper-2 px-3 py-1"><Clock className="size-3.5" aria-hidden />{o.hours.split('(')[0]!.trim()}</li> : null}
                      </ul>
                      <span className="mt-6 font-semibold text-coral-text">Read the job and apply →</span>
                    </article>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-6 max-w-2xl text-ink-2">We’re not hiring for a listed role at the moment. Send your profile below and we’ll call you when a role fits.</p>
            )}
          </div>
        </section>

        <section id="profile" aria-labelledby="profile-title" className="scroll-mt-24 border-t border-line py-section">
          <div className="wrap grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1.7fr]">
            <div>
              <SectionHead id="profile-title" eyebrow="Independent job seekers" title="Send your profile" />
              <p className="mt-4 text-ink-2">Don’t see your role? Tell us what you do, once. We keep your profile for 12 months and call you when something fits: office jobs, video editing, design, sales, internships and more.</p>
              <p className="mt-4 flex items-start gap-2 text-sm text-ink-3"><Sparkles className="mt-0.5 size-4 shrink-0 text-coral-text" aria-hidden />Freshers welcome. No fee, ever.</p>
            </div>
            <div className="rounded-3xl border border-line bg-surface p-5 sm:p-8"><CareerApplyForm returnUrl={abs('/careers')} /></div>
          </div>
        </section>

        <section aria-labelledby="how-title" className="border-t border-line py-section">
          <div className="wrap">
            <SectionHead id="how-title" eyebrow="How hiring works" title="From application to offer" />
            <ol className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {CAREER_STEPS.map((s, i) => (
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
            <SectionHead id="faq-title" eyebrow="Questions job seekers ask" title="Before you apply" />
            <FaqList faqs={CAREER_FAQS} />
          </div>
        </section>
      </SiteShell>
    </>
  );
}
