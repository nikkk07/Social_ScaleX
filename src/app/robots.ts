import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

/**
 * robots.txt, generated so the Sitemap URL can never drift from SITE_URL.
 *
 * The AI crawlers are listed explicitly even though `User-agent: *` already
 * allows them. That is deliberate: an explicit Allow is unambiguous, it
 * survives someone later tightening the wildcard rule, and it documents that
 * their access is a decision rather than an oversight.
 */
export default function robots(): MetadataRoute.Robots {
  // Preview deployments: block everything so they never compete with production.
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production') {
    return { rules: [{ userAgent: '*', disallow: '/' }] };
  }
  // Auth keeps people out of the CRM; this keeps its pages out of search.
  const disallow = ['/crm', '/crm/', '/login', '/api/'];

  const aiCrawlers = [
    'GPTBot',        // OpenAI — ChatGPT training + browsing
    'OAI-SearchBot', // OpenAI — ChatGPT search index
    'ChatGPT-User',  // OpenAI — user-initiated page fetches
    'ClaudeBot',     // Anthropic
    'Claude-Web',
    'anthropic-ai',
    'PerplexityBot', // Perplexity index
    'Perplexity-User',
    'Google-Extended', // Gemini / AI Overviews grounding
    'CCBot',         // Common Crawl — feeds many downstream models
    'Applebot-Extended',
    'cohere-ai',
    'meta-externalagent',
  ];

  return {
    rules: [
      { userAgent: '*', allow: '/', disallow },
      ...aiCrawlers.map((userAgent) => ({ userAgent, allow: '/', disallow })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
