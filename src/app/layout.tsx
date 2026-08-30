import React from 'react';
import type { Metadata, Viewport } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import { JsonLd } from '@/components/seo/JsonLd';
import { graph, organizationNode, websiteNode } from '@/lib/schema';
import { OG_IMAGE, SITE_NAME, SITE_URL } from '@/lib/site';
import '@/styles/index.css';

// Self-hosted, subset to latin, and served from our own origin — no
// third-party DNS lookup and no FOUT-inducing @import before first paint.
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-inter',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  display: 'swap',
  variable: '--font-space-grotesk',
});

export const metadata: Metadata = {
  // Makes every relative canonical / OG URL below resolve absolutely.
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} | Social Media Marketing Agency in Delhi NCR`,
    // Brand last, so the distinctive words survive Google's title truncation.
    template: `%s | ${SITE_NAME}`,
  },
  description:
    'Social ScaleX grows brands on Instagram, Facebook & YouTube — 9.3M+ monthly views, 496K+ followers managed. Delhi NCR agency, verified client results.',
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  alternates: { canonical: '/' },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    locale: 'en_IN',
    url: '/',
    title: `${SITE_NAME} | Social Media Marketing Agency in Delhi NCR`,
    description:
      'Instagram, Facebook & YouTube growth for brands and creators. 9.3M+ monthly views, 496K+ followers managed. Real clients, verified results.',
    images: [OG_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} | Social Media Marketing Agency in Delhi NCR`,
    description:
      'Instagram, Facebook & YouTube growth for brands and creators. Real clients, verified results.',
    images: [OG_IMAGE.url],
  },
  icons: { icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }] },
  category: 'Marketing',
};

export const viewport: Viewport = {
  themeColor: '#050508',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <head>
        {/* Organisation + WebSite are declared once here, at stable @ids, and
            referenced by every per-page graph. Static HTML, so a crawler that
            does not execute JavaScript still reads them. */}
        <JsonLd data={graph([organizationNode(), websiteNode()])} />
      </head>
      <body>{children}</body>
    </html>
  );
}
