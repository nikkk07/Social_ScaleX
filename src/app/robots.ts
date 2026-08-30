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
  // Gated by Supabase auth (signup is closed and the handle_new_user() trigger
  // rejects any email not in allowed_emails), so this is not what keeps people
  // out — it keeps the login page out of search results rather than having it
  // surface on a query for the brand name.
  const disallow = ['/crm', '/crm/', '/login'];

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
    host: SITE_URL,
  };
}
