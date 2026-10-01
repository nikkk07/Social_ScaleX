import React from 'react';
import type { Metadata, Viewport } from 'next';
import { Fraunces, Inter } from 'next/font/google';
import { JsonLd } from '@/components/seo/JsonLd';
import { graph, organizationNode, personNodes, websiteNode } from '@/lib/schema';
import { OG_IMAGE, SITE_NAME, SITE_URL } from '@/lib/site';
import '@/styles/index.css';

// Self-hosted by next/font: no third-party request before first paint.
const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter' });
const fraunces = Fraunces({ subsets: ['latin'], display: 'swap', variable: '--font-fraunces' });

// Preview deployments must never compete with production in search.
const indexable = process.env.VERCEL_ENV === undefined || process.env.VERCEL_ENV === 'production';

const DEFAULT_TITLE = 'Social Media Marketing Agency in Delhi NCR';
const DEFAULT_DESCRIPTION =
  'Instagram & Facebook management, Reels production, Meta and Google Ads for Delhi NCR brands. Real client results. Book a free strategy call.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${DEFAULT_TITLE} | ${SITE_NAME}`, template: `%s | ${SITE_NAME}` },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  alternates: { canonical: '/' },
  // Search Console / Bing Webmaster verification. Only needed for a URL-prefix
  // property; a Domain property is verified with a DNS TXT record instead.
  ...(process.env.GOOGLE_SITE_VERIFICATION || process.env.BING_SITE_VERIFICATION
    ? {
        verification: {
          ...(process.env.GOOGLE_SITE_VERIFICATION ? { google: process.env.GOOGLE_SITE_VERIFICATION } : {}),
          ...(process.env.BING_SITE_VERIFICATION ? { other: { 'msvalidate.01': process.env.BING_SITE_VERIFICATION } } : {}),
        },
      }
    : {}),
  robots: indexable
    ? { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 } }
    : { index: false, follow: false },
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    locale: 'en_IN',
    url: '/',
    title: `${DEFAULT_TITLE} | ${SITE_NAME}`,
    description: DEFAULT_DESCRIPTION,
    images: [OG_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${DEFAULT_TITLE} | ${SITE_NAME}`,
    description: DEFAULT_DESCRIPTION,
    images: [OG_IMAGE.url],
  },
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
  formatDetection: { telephone: false },
  category: 'Marketing',
};

export const viewport: Viewport = {
  themeColor: '#FAF8F4',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${inter.variable} ${fraunces.variable}`}>
      <head>
        <JsonLd data={graph([organizationNode(), websiteNode(), ...personNodes()])} />
      </head>
      <body>{children}</body>
    </html>
  );
}
