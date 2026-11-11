// ─────────────────────────────────────────────────────────────────────
// Social ScaleX Reel Studio (studio.socialscalex.in).
//
// Plans and prices confirmed by the owner on 11 Nov 2026 (no GST charged).
// Product rules come from the Studio's public Terms and Privacy Policy,
// effective 25 Oct 2026. Do not add features here that those pages or the
// owner have not confirmed.
// ─────────────────────────────────────────────────────────────────────

export const STUDIO_URL = 'https://studio.socialscalex.in/';
export const STUDIO_TERMS_URL = 'https://studio.socialscalex.in/terms';
export const STUDIO_PRIVACY_URL = 'https://studio.socialscalex.in/privacy';

export interface StudioPlan {
  name: string;
  /** Approved reels per month. */
  reels: number;
  /** Monthly price in rupees. */
  price: number;
  /** Who it suits, in one line. */
  fit: string;
}

export const STUDIO_PLANS: readonly StudioPlan[] = [
  { name: 'Starter', reels: 6, price: 2499, fit: 'One or two reels a week.' },
  { name: 'Growth', reels: 15, price: 4999, fit: 'Three to four reels a week.' },
  { name: 'Business', reels: 30, price: 8999, fit: 'About one reel a day.' },
];

/** True in every plan, per the owner. */
export const STUDIO_INCLUDED = [
  'Comment-to-DM automation, at no extra cost',
  'You approve every reel before it posts',
  'Alerts on the website, by email and on WhatsApp',
] as const;

/** Plan rules from the Terms of Service (section 2). */
export const STUDIO_PLAN_RULES = [
  'Only an approved reel uses a reel from your plan.',
  'Re-generating a reel before you approve it is free, within a daily fair-use limit.',
  'Unused reels don’t carry over to the next month.',
] as const;

export const rupees = (n: number) => `₹${n.toLocaleString('en-IN')}`;
