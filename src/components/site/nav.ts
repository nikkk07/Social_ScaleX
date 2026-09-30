import { SERVICES } from '@/lib/content';

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
