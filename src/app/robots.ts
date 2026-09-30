import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

/**
 * robots.txt, generated so the Sitemap URL can never drift from SITE_URL.
 *
 * Every public page is open to every crawler. Search and AI crawlers are also
 * listed by name: a crawler that finds its own group reads only that group,
 * so each one repeats the same disallow list, and an explicit Allow documents
 * that their access is a decision rather than an oversight.
 * Tokens are the ones each company documents (checked 30 Sep 2026).
 */
const CRAWLERS = [
  // Search engines
  'Googlebot', 'Googlebot-Image', 'Bingbot', 'Slurp', 'DuckDuckBot', 'YandexBot', 'Applebot',
  // Google Gemini (training and grounding; does not affect Google Search)
  'Google-Extended',
  // OpenAI: ChatGPT search index, user-triggered fetches, training
  'OAI-SearchBot', 'ChatGPT-User', 'GPTBot',
  // Anthropic: Claude search index, user-triggered fetches, training
  'Claude-SearchBot', 'Claude-User', 'ClaudeBot',
  // Perplexity: search index and user-triggered fetches
  'PerplexityBot', 'Perplexity-User',
  // Microsoft Copilot answers come from Bing (Bingbot above)
  // Others
  'DuckAssistBot', 'Applebot-Extended', 'Amazonbot', 'meta-externalagent', 'MistralAI-User', 'CCBot', 'cohere-ai',
];

export default function robots(): MetadataRoute.Robots {
  // Preview deployments: block everything so they never compete with production.
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production') {
    return { rules: [{ userAgent: '*', disallow: '/' }] };
  }
  // Auth keeps people out of the CRM; this keeps its pages out of search.
  const disallow = ['/crm', '/crm/', '/login', '/api/'];

  return {
    rules: [
      { userAgent: '*', allow: '/', disallow },
      { userAgent: CRAWLERS, allow: '/', disallow },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
