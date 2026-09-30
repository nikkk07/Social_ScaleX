import type { MetadataRoute } from 'next';
import { SERVICES } from '@/lib/content';
import { GUIDES } from '@/lib/guides';
import { abs } from '@/lib/site';

/** Public pages only. /crm and /login are disallowed in robots.ts and must never appear here. */
export default function sitemap(): MetadataRoute.Sitemap {
  const site = new Date('2026-09-30');
  return [
    { url: abs('/'), lastModified: site, changeFrequency: 'weekly', priority: 1 },
    { url: abs('/services'), lastModified: site, changeFrequency: 'monthly', priority: 0.9 },
    ...SERVICES.map((s) => ({ url: abs(`/services/${s.slug}`), lastModified: site, changeFrequency: 'monthly' as const, priority: 0.9 })),
    { url: abs('/case-studies'), lastModified: site, changeFrequency: 'monthly', priority: 0.8 },
    { url: abs('/about'), lastModified: site, changeFrequency: 'monthly', priority: 0.6 },
    { url: abs('/contact'), lastModified: site, changeFrequency: 'yearly', priority: 0.7 },
    { url: abs('/guides'), lastModified: site, changeFrequency: 'weekly', priority: 0.7 },
    ...GUIDES.map((g) => ({ url: abs(`/guides/${g.slug}`), lastModified: new Date(g.updated), changeFrequency: 'monthly' as const, priority: 0.7 })),
    { url: abs('/privacy'), lastModified: site, changeFrequency: 'yearly', priority: 0.2 },
    { url: abs('/terms'), lastModified: new Date('2026-07-01'), changeFrequency: 'yearly', priority: 0.2 },
  ];
}
