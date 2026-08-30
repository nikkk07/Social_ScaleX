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
 * Defaults to the Vercel deployment URL, which actually serves the site.
 * A canonical pointing at a host nobody serves gets a site indexed nowhere,
 * so this must never be aspirational.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://social-scalex.vercel.app'
).replace(/\/$/, '');

export const SITE_NAME = 'Social ScaleX';

/** One brand definition. Reused verbatim in JSON-LD, llms.txt and /about so
 *  answer engines resolve a single consistent entity. */
export const SITE_TAGLINE =
  'Social media marketing agency in Delhi NCR managing Instagram, Facebook and YouTube for brands and creators — content production, page management, paid advertising and analytics.';

export const CONTACTS = [
  { name: 'Nikhil Bisht', phone: '+918077727669', display: '+91 80777 27669' },
  { name: 'Abhishek Anand', phone: '+917827810150', display: '+91 78278 10150' },
] as const;

export const WHATSAPP_URL = 'https://wa.me/918077727669';

/**
 * Public profile URLs. Empty strings are filtered out everywhere they are
 * consumed — the footer hides the icon and `sameAs` omits the entry — so
 * nothing ever links to "#" or claims a profile that does not exist.
 * Fill these in and both the footer and the Organization schema update.
 */
export const SOCIAL_PROFILES = {
  instagram: '',
  linkedin: '',
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
  alt: 'Social ScaleX — social media marketing agency in Delhi NCR',
} as const;

/** Stable JSON-LD node identifiers. Every schema graph on the site points at
 *  these two @ids so the org is one entity, not one per page. */
export const ORG_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;
