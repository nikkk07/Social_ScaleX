import type { MetadataRoute } from 'next';
import { abs } from '@/lib/site';

/**
 * Public marketing routes only. /crm and /login are absent on purpose and are
 * Disallow-ed in robots.ts — a URL in the sitemap is a request to index it,
 * which would contradict the Disallow.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date('2026-08-30');

  return [
    { url: abs('/'), lastModified, changeFrequency: 'weekly', priority: 1.0 },
    { url: abs('/services'), lastModified, changeFrequency: 'monthly', priority: 0.9 },
    { url: abs('/case-studies'), lastModified, changeFrequency: 'monthly', priority: 0.9 },
    { url: abs('/about'), lastModified, changeFrequency: 'monthly', priority: 0.7 },
    { url: abs('/privacy'), lastModified, changeFrequency: 'yearly', priority: 0.2 },
    { url: abs('/terms'), lastModified, changeFrequency: 'yearly', priority: 0.2 },
  ];
}
