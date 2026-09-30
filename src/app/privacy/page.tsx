import React from 'react';
import type { Metadata } from 'next';
import { LegalPage } from '@/components/site/LegalPage';
import { JsonLd } from '@/components/seo/JsonLd';
import { breadcrumbNode, graph, webPageNode } from '@/lib/schema';

const TITLE = 'Privacy Policy';
const DESCRIPTION = 'What Social ScaleX collects when you send an enquiry, how it is used, and how to have it deleted.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/privacy' },
};

const CRUMBS = [
  { name: 'Home', path: '/' },
  { name: TITLE, path: '/privacy' },
];

export default function Page() {
  return (
    <>
      <JsonLd
        data={graph([
          webPageNode({
            path: '/privacy',
            name: TITLE,
            description: DESCRIPTION,
            hasBreadcrumb: true,
          }),
          breadcrumbNode(CRUMBS, '/privacy'),
        ])}
      />
      <LegalPage title={TITLE} updated="September 2026" crumbs={CRUMBS}>
      <section>
        <h2>What we collect</h2>
        <p>
          When you send the enquiry form on our website, we collect what you type in: your
          name, mobile number, the service you&apos;re interested in, your Instagram handle or
          website if you add it, and anything you tell us about your brand. We also store the
          page you sent it from and your browser&apos;s user-agent string, so we can see which
          page the enquiry came from and spot spam. Nothing else is collected.
        </p>
      </section>
      <section>
        <h2>How we use it</h2>
        <p>
          We use your contact details for one purpose: to get back to you about working
          together. We don&apos;t sell your information, we don&apos;t rent it out, and we don&apos;t add
          you to mailing lists you didn&apos;t ask for.
        </p>
      </section>
      <section>
        <h2>Client account data</h2>
        <p>
          If you become a client and give us access to your Instagram, Facebook, or YouTube
          accounts, that access is used strictly to deliver the services you hired us for.
          Account credentials remain yours, analytics data remains yours, and any performance
          numbers we publish (like the ones on our homepage) appear only with the client&apos;s
          explicit permission.
        </p>
      </section>
      <section>
        <h2>Cookies and analytics</h2>
        <p>
          This site may use basic analytics to understand how visitors use it — page views
          and rough location, never anything that identifies you personally. No advertising
          trackers run on this site.
        </p>
      </section>
      <section>
        <h2>Your choices</h2>
        <p>
          Want your details removed from our records? Call or message us at
          +91 80777 27669 and we&apos;ll delete them. No forms, no waiting periods.
        </p>
      </section>
    </LegalPage>
    </>
  );
}
