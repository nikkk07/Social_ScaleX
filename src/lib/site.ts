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
  (process.env.NEXT_PUBLIC_SITE_URL ?? '').trim() || 'https://www.socialscalex.in'
).replace(/\/$/, '');

/** The domain the business owns. It becomes the canonical the moment
 *  NEXT_PUBLIC_SITE_URL is set to it in Vercel (see docs/DEPLOYMENT.md). */
export const OWNED_DOMAIN = 'socialscalex.in';

export const SITE_NAME = 'Social ScaleX';

/** One brand definition. Reused verbatim in JSON-LD, llms.txt and /about so
 *  answer engines resolve a single consistent entity. */
export const SITE_TAGLINE =
  'Social media marketing agency in Delhi NCR managing Instagram, Facebook and YouTube for brands and creators: Reels production, page management, Meta and Google Ads, and reporting from your own analytics.';

/** Where shoots happen in person. Everything else runs remotely across India. */
export const AREAS_SERVED = ['Delhi', 'Noida', 'Gurugram', 'Ghaziabad', 'Faridabad'] as const;
export const FOUNDING_YEAR = '2025';

export const CONTACTS = [
  { name: 'Nikhil Bisht', role: 'Co-founder', phone: '+918077727669', display: '+91 80777 27669' },
  { name: 'Abhishek Anand', role: 'Co-founder', phone: '+917827810150', display: '+91 78278 10150' },
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
  instagram: '',
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

/** Stable JSON-LD node identifiers. Every schema graph on the site points at
 *  these two @ids so the org is one entity, not one per page. */
export const ORG_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;
