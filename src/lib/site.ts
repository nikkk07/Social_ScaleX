import type { Metadata } from 'next';

// ─────────────────────────────────────────────────────────────────────
// Single source of truth for every absolute URL, contact detail and
// entity fact the site publishes.
//
// The Vite build scattered the host across 13 places (index.html canonical,
// og:url, og:image, twitter:image, five JSON-LD @id/url/publisher fields,
// robots.txt, three sitemap <loc>s) and docs/MERGE_CHECKLIST.md §7 existed
// only to keep them in sync. They are all derived from SITE_URL now:
// change it here, in one place, when a real domain is registered.
// ─────────────────────────────────────────────────────────────────────

/**
 * Canonical origin, no trailing slash.
 *
 * Defaults to the live domain, https://www.socialscalex.in.
 * A canonical pointing at a host nobody serves gets a site indexed nowhere,
 * so this must never be aspirational.
 */
export const SITE_URL = (
  (process.env.NEXT_PUBLIC_SITE_URL ?? '').trim() || 'https://www.socialscalex.in'
).replace(/\/$/, '');

/** The domain the business owns; the www host above is its canonical form. */
export const OWNED_DOMAIN = 'socialscalex.in';

export const SITE_NAME = 'Social ScaleX';

/** One brand definition. Reused verbatim in JSON-LD, llms.txt and /about so
 *  answer engines resolve a single consistent entity. */
export const SITE_TAGLINE =
  'Social media marketing agency in Delhi NCR managing Instagram, Facebook and YouTube for brands and creators: Reels production, page management, Meta and Google Ads, and reporting from your own analytics.';

/** Where shoots happen in person. Everything else runs remotely across India. */
export const AREAS_SERVED = ['Delhi', 'Noida', 'Gurugram', 'Ghaziabad', 'Faridabad'] as const;
export const FOUNDING_YEAR = '2025';

/** `linkedin`: the founder's own public profile (owner-supplied, 15 Oct 2026);
 *  empty = none yet. Shown on /about and emitted as the Person's `sameAs`. */
export const CONTACTS = [
  { name: 'Nikhil Bisht', role: 'Co-founder', phone: '+918077727669', display: '+91 80777 27669', linkedin: 'https://www.linkedin.com/in/nikhil07bisht/' },
  { name: 'Abhishek Anand', role: 'Co-founder', phone: '+917827810150', display: '+91 78278 10150', linkedin: '' },
] as const;

export const PRIMARY_PHONE = CONTACTS[0];

export const WHATSAPP_URL = 'https://wa.me/918077727669';

/** WhatsApp link with a first message already typed, so the chat opens with context. */
export function whatsappLink(text: string): string {
  return `${WHATSAPP_URL}?text=${encodeURIComponent(text)}`;
}

/**
 * Public profile URLs. Empty strings are filtered out everywhere they are
 * consumed — the footer hides the icon and `sameAs` omits the entry — so
 * nothing ever links to "#" or claims a profile that does not exist.
 * Fill these in and both the footer and the Organization schema update.
 */
export const SOCIAL_PROFILES = {
  instagram: 'https://www.instagram.com/social_scalex/',
  linkedin: 'https://www.linkedin.com/company/143428030/',
  youtube: '',
} as const;

export const sameAs = Object.values(SOCIAL_PROFILES).filter(Boolean);

/** Absolute URL for a site-relative path. */
export function abs(path: string): string {
  return path === '/' ? `${SITE_URL}/` : `${SITE_URL}${path}`;
}

export const OG_IMAGE = {
  url: `${SITE_URL}/og-image.png`,
  width: 1200,
  height: 630,
  alt: 'Social ScaleX, social media marketing agency in Delhi NCR',
} as const;

/**
 * Open Graph and X/Twitter card for one page.
 *
 * Next.js merges metadata shallowly: a page that sets its own `openGraph` or
 * `twitter` replaces the root layout's whole object, image and site name
 * included (nextjs.org/docs/app/api-reference/functions/generate-metadata,
 * "Merging"). Before this helper, 35 pages shipped no og:image and sent the
 * homepage title as their X card. Every page calls this instead of writing
 * `openGraph` by hand, so the share preview can't drift again.
 */
export function socialMeta(p: {
  title: string;
  description: string;
  path: string;
  article?: { publishedTime: string; modifiedTime: string };
}): Pick<Metadata, 'openGraph' | 'twitter'> {
  const title = `${p.title} | ${SITE_NAME}`;
  const base = {
    siteName: SITE_NAME,
    locale: 'en_IN',
    url: p.path,
    title,
    description: p.description,
    images: [OG_IMAGE],
  };
  const openGraph: Metadata['openGraph'] = p.article
    ? { ...base, type: 'article', publishedTime: p.article.publishedTime, modifiedTime: p.article.modifiedTime }
    : { ...base, type: 'website' };
  return {
    openGraph,
    twitter: { card: 'summary_large_image', title, description: p.description, images: [OG_IMAGE.url] },
  };
}

/** Stable JSON-LD node identifiers. Every schema graph on the site points at
 *  these two @ids so the org is one entity, not one per page. */
export const ORG_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;
