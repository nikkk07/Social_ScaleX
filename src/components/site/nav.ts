import { SERVICES } from '@/lib/content';
import { AUTOMATIONS, PLAN_99 } from '@/lib/automation';
import { GOALS } from '@/lib/goals';
export const NAV = [
  { href: '/case-studies', label: 'Results' },
  { href: '/guides', label: 'Guides' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
] as const;

/** "For Creators": independent creators and job seekers. Shown in the header, the mobile menu and the footer. */
export const CREATOR_LINKS = [
  { href: '/creators', label: 'Paid brand briefs', outcome: 'UGC, Reels and influencer work, mostly from home. Pay shown upfront.' },
  { href: '/creators/join', label: 'Join the creator network', outcome: 'Apply once; we contact you when a paid brief fits you.' },
  { href: '/careers', label: 'Jobs & careers', outcome: 'Jobs in Delhi with our team and the businesses we recruit for.' },
] as const;

export const SERVICE_LINKS = SERVICES.map((s) => ({
  href: `/services/${s.slug}`,
  label: s.name,
  outcome: s.outcome,
}));


export const AUTOMATION_LINKS = AUTOMATIONS.map((a) => ({
  href: `/automation/${a.slug}`,
  label: a.priced ? `${a.short}\u00a0· ₹${PLAN_99.price}/mo` : a.name,
  outcome: a.outcome,
}));

export const GOAL_LINKS = GOALS.map((g) => ({ href: `/solutions/${g.slug}`, label: g.name }));
