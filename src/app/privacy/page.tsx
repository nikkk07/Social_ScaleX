import React from 'react';
import type { Metadata } from 'next';
import { LegalPage } from '@/components/site/LegalPage';
import { JsonLd } from '@/components/seo/JsonLd';
import { breadcrumbNode, graph, webPageNode } from '@/lib/schema';
import { GA_ID, META_PIXEL_ID } from '@/lib/tracking';
import { socialMeta } from '@/lib/site';

const TITLE = 'Privacy Policy';
const DESCRIPTION = 'What Social ScaleX collects when you send an enquiry, how it is used, and how to have it deleted.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/privacy' },
  ...socialMeta({ title: TITLE, description: DESCRIPTION, path: '/privacy' }),
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
      <LegalPage title={TITLE} updated="October 2026" crumbs={CRUMBS}>
      <section>
        <h2>What we collect</h2>
        <p>
          When you send the enquiry form on our website, we collect what you type in: your
          name, mobile number, the service you&apos;re interested in, your Instagram handle or
          website if you add it, and anything you tell us about your brand. We also store the
          page you sent it from and your browser&apos;s user-agent string, so we can see which
          page the enquiry came from and spot spam. The form collects nothing else. It also has a
          hidden field that people never see; it only catches spam bots, and a form that fills
          it in is not sent. Analytics, when it is switched on, is described below.
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
      <section id="comment-to-dm">
        <h2>Comment-to-DM automation</h2>
        <p>
          If you use our self-serve comment-to-DM automation, you sign in with Google or an email
          and password, and connect an Instagram professional account through Instagram&apos;s own
          login. We store your email, the Instagram account&apos;s ID, username, name and profile
          picture link, and an access token Instagram issues to us, encrypted. We never see your
          Instagram password.
        </p>
        <p>
          We use that access only to do what you set up: read your list of posts so you can pick
          them, receive new comments on your posts, send the one direct message you wrote to the
          person who commented, and post your public reply. For each comment we keep the
          commenter&apos;s username, the comment text and whether the message went out, so you can
          see it in your dashboard. That history is deleted after 90 days. Payments are processed
          by Razorpay; we store the payment and subscription IDs, never card or UPI details.
        </p>
        <p>
          You can remove an account from your dashboard at any time, which deletes its automations,
          history and token. Removing our app in Instagram&apos;s settings (Settings → Website
          permissions → Apps and websites) also cuts our access, and a data deletion request sent
          through Instagram deletes everything we hold for that account.
        </p>
      </section>
      <section>
        <h2>Cookies and analytics</h2>
        {GA_ID || META_PIXEL_ID ? (
          <>
            {GA_ID ? (
              <p>
                We use Google Analytics 4 to see which pages are read and where visitors come
                from. It sets cookies and records page views, device type and approximate
                location. It also counts clicks on our call, WhatsApp and email buttons and
                successful enquiry sends, without the number, address or anything you typed. Google&apos;s use of this data is covered by its{' '}
                <a href="https://policies.google.com/privacy" rel="noopener noreferrer" target="_blank">privacy policy</a>.
              </p>
            ) : null}
            {META_PIXEL_ID ? (
              <p>
                We use the Meta Pixel to measure our Facebook and Instagram ads and to show our
                ads to people who have visited this site. It sets cookies and shares page visits
                with Meta under Meta&apos;s{' '}
                <a href="https://www.facebook.com/privacy/policy/" rel="noopener noreferrer" target="_blank">privacy policy</a>.
                You can turn off ad personalisation in your Facebook or Instagram ad settings.
              </p>
            ) : null}
            <p>
              You can block or delete these cookies in your browser settings at any time; the
              site works the same without them.
            </p>
          </>
        ) : (
          <p>
            No analytics or advertising trackers run on this site at the moment.
          </p>
        )}
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
