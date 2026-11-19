import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteShell } from '@/components/site/SiteShell';
import { PageIntro } from '@/components/site/PageIntro';

// Where the CRM sends people back after a form post with JavaScript off. Never indexed.
export const metadata: Metadata = { title: 'Application sent', robots: { index: false, follow: false }, alternates: { canonical: '/creators/thanks' } };

const ERRORS: Record<string, string> = {
  under_18: 'Sorry, you need to be 18 or older to apply.',
  no_consent: 'Please go back and tick the box to agree to how we use your details.',
  invalid_phone: 'Please go back and enter a valid 10-digit mobile number.',
  invalid_whatsapp: 'You chose “No” for WhatsApp: please go back and enter your WhatsApp number.',
  bad_date: 'Please go back and choose your date of birth.',
  bad_email: 'That e-mail address doesn’t look right. Please go back and check it.',
  brief_closed: 'This brief has closed. Have a look at the other open briefs.',
  unknown_brief: 'We couldn’t find that brief. It may have been taken down.',
  bad_url: 'Work links must be full web addresses, like https://www.instagram.com/reel/…. Please go back and check them.',
  bad_instagram: 'That Instagram handle doesn’t look right. Please go back and check it.',
  too_many: 'Too many applications from this connection. Please try again in an hour.',
  bot: 'The “I’m human” check didn’t pass. Please go back and try again.',
};

export default async function Thanks({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const crumbs = [{ name: 'Home', path: '/' }, { name: 'Creator Hub', path: '/creators' }, { name: error ? 'Not sent' : 'Sent', path: '/creators/thanks' }];
  return (
    <SiteShell>
      <PageIntro crumbs={crumbs} eyebrow="Creator Hub" title={error ? 'Your application wasn’t sent' : 'Applied successfully. Welcome to Social ScaleX!'}
        lede={error ? (ERRORS[error] ?? 'Something went wrong. Please go back and try again, or message us on WhatsApp.')
          : 'A person on our team reads every application. If you gave an e-mail, a confirmation is on its way. We reply by WhatsApp or e-mail either way.'}>
        <div className="mt-8"><Link href="/creators" className="btn btn-secondary btn-lg">Back to the Creator Hub</Link></div>
      </PageIntro>
    </SiteShell>
  );
}
