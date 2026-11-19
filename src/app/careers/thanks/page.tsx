import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteShell } from '@/components/site/SiteShell';
import { PageIntro } from '@/components/site/PageIntro';

// Where the CRM sends people back after a form post with JavaScript off. Never indexed.
export const metadata: Metadata = { title: 'Application sent', robots: { index: false, follow: false }, alternates: { canonical: '/careers/thanks' } };

const ERRORS: Record<string, string> = {
  under_18: 'Sorry, you need to be 18 or older to apply.',
  age_out_of_range: 'This role has an age limit, and your date of birth is outside it. You can still send your profile for other roles.',
  no_consent: 'Please go back and tick the box to agree to how we use your details.',
  invalid_phone: 'Please go back and enter a valid 10-digit mobile number.',
  invalid_whatsapp: 'You chose “No” for WhatsApp: please go back and enter your WhatsApp number.',
  bad_date: 'Please go back and choose your date of birth.',
  bad_email: 'That e-mail address doesn’t look right. Please go back and check it.',
  bad_url: 'The CV link must be a full web address. Please go back and check it.',
  cv_too_big: 'Your CV is larger than 4 MB. Please go back and upload a smaller PDF, or paste a link instead.',
  cv_not_pdf: 'Your CV must be a PDF file. Please go back and choose a PDF, or paste a link instead.',
  opening_closed: 'This job has closed. You can still send your profile for other roles.',
  unknown_opening: 'We couldn’t find that job. It may have been filled.',
  too_many: 'Too many applications from this connection. Please try again in an hour.',
  bot: 'The “I’m human” check didn’t pass. Please go back and try again.',
};

export default async function Thanks({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const crumbs = [{ name: 'Home', path: '/' }, { name: 'Careers', path: '/careers' }, { name: error ? 'Not sent' : 'Sent', path: '/careers/thanks' }];
  return (
    <SiteShell>
      <PageIntro crumbs={crumbs} eyebrow="Careers" title={error ? 'Your application wasn’t sent' : 'Applied successfully. Thank you!'}
        lede={error ? (ERRORS[error] ?? 'Something went wrong. Please go back and try again, or message us on WhatsApp.')
          : 'Your application has reached the Social ScaleX team. A person reads every one; we’ll call or WhatsApp you. If you gave an e-mail, a confirmation is on its way.'}>
        <div className="mt-8 flex flex-wrap gap-3"><Link href="/careers" className="btn btn-secondary btn-lg">Back to Careers</Link></div>
      </PageIntro>
    </SiteShell>
  );
}
