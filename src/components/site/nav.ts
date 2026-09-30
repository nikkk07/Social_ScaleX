import { SERVICES } from '@/lib/content';
import { AUTOMATIONS, PLAN_99 } from '@/lib/automation';
import { GOALS } from '@/lib/goals';
export const NAV = [
  { href: '/case-studies', label: 'Results' },
  { href: '/guides', label: 'Guides' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
] as const;

export const SERVICE_LINKS = SERVICES.map((s) => ({
  href: `/services/${s.slug}`,
  label: s.name,
  outcome: s.outcome,
}));


export const AUTOMATION_LINKS = AUTOMATIONS.map((a) => ({
  href: `/automation/${a.slug}`,
  label: a.priced ? `${a.short} · ₹${PLAN_99.price}/mo` : a.name,
  outcome: a.outcome,
}));

export const GOAL_LINKS = GOALS.map((g) => ({ href: `/solutions/${g.slug}`, label: g.name }));
