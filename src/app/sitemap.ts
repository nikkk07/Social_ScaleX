import type { MetadataRoute } from 'next';
import { SERVICES } from '@/lib/content';
import { GUIDES } from '@/lib/guides';
import { AUTOMATIONS } from '@/lib/automation';
import { GOALS } from '@/lib/goals';
import { CITIES } from '@/lib/areas';
import { abs } from '@/lib/site';

/** Public pages only. /crm and /login are disallowed in robots.ts and must never appear here. */
/**
 * Pages whose main content changed after the 30 Sep 2026 baseline. Google uses
 * <lastmod> only when it is consistently accurate, so add a path here when its
 * visible content changes; guides use their own `updated` date.
 */
const UPDATED: Record<string, string> = {
  '/': '2026-10-15',
  '/automation': '2026-10-15',
  '/automation/instagram-comment-to-dm': '2026-10-15',
  '/automation/whatsapp-automation': '2026-10-15',
  '/automation/youtube-comment-management': '2026-10-15',
  '/solutions/brand-awareness': '2026-10-15',
  '/case-studies': '2026-10-15',
  '/about': '2026-10-15',
  '/privacy': '2026-10-15',
};

export default function sitemap(): MetadataRoute.Sitemap {
  const mod = (path: string) => new Date(UPDATED[path] ?? '2026-09-30');
  return [
    { url: abs('/'), lastModified: mod('/'), changeFrequency: 'weekly', priority: 1 },
    { url: abs('/services'), lastModified: mod('/services'), changeFrequency: 'monthly', priority: 0.9 },
    ...SERVICES.map((s) => ({ url: abs(`/services/${s.slug}`), lastModified: mod(`/services/${s.slug}`), changeFrequency: 'monthly' as const, priority: 0.9 })),
    { url: abs('/automation'), lastModified: mod('/automation'), changeFrequency: 'monthly', priority: 0.9 },
    ...AUTOMATIONS.map((a) => ({ url: abs(`/automation/${a.slug}`), lastModified: mod(`/automation/${a.slug}`), changeFrequency: 'monthly' as const, priority: a.priced ? 0.9 : 0.8 })),
    ...GOALS.map((g) => ({ url: abs(`/solutions/${g.slug}`), lastModified: mod(`/solutions/${g.slug}`), changeFrequency: 'monthly' as const, priority: 0.8 })),
    { url: abs('/areas'), lastModified: mod('/areas'), changeFrequency: 'monthly', priority: 0.8 },
    ...CITIES.map((c) => ({ url: abs(`/areas/${c.slug}`), lastModified: mod(`/areas/${c.slug}`), changeFrequency: 'monthly' as const, priority: 0.8 })),
    { url: abs('/case-studies'), lastModified: mod('/case-studies'), changeFrequency: 'monthly', priority: 0.8 },
    { url: abs('/about'), lastModified: mod('/about'), changeFrequency: 'monthly', priority: 0.6 },
    { url: abs('/contact'), lastModified: mod('/contact'), changeFrequency: 'yearly', priority: 0.7 },
    { url: abs('/guides'), lastModified: mod('/guides'), changeFrequency: 'weekly', priority: 0.7 },
    ...GUIDES.map((g) => ({ url: abs(`/guides/${g.slug}`), lastModified: new Date(g.updated), changeFrequency: 'monthly' as const, priority: 0.7 })),
    { url: abs('/privacy'), lastModified: mod('/privacy'), changeFrequency: 'yearly', priority: 0.2 },
    { url: abs('/terms'), lastModified: new Date('2026-07-01'), changeFrequency: 'yearly', priority: 0.2 },
  ];
}
