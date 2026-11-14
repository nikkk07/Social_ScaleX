// The CRM's cookie-free counter (crm.socialscalex.in → Website). No cookie, no personal data, so no consent banner.
// Only production sends anything; previews and local runs stay silent.
export const CRM_COLLECT = 'https://crm.socialscalex.in/api/collect';
export const COLLECT_ON = process.env.VERCEL_ENV === 'production';

/** AI and search bots, checked in the proxy so a page view never waits for it. Kept in step with the CRM's list. */
export const BOT_UA = /OAI-SearchBot|ChatGPT-User|GPTBot|Claude-SearchBot|Claude-User|ClaudeBot|PerplexityBot|Perplexity-User|Google-Extended|GoogleOther|Googlebot|bingbot|Applebot|meta-external|meta-webindexer|Amazonbot|Amzn-SearchBot|DuckAssistBot|MistralAI|YouBot|CCBot|Bytespider|YandexBot|DuckDuckBot/i;
