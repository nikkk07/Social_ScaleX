import { NextResponse, type NextFetchEvent, type NextRequest } from 'next/server';
import { BOT_UA, COLLECT_ON, CRM_COLLECT } from '@/lib/crm-collect';

/**
 * Logs AI and search crawlers (GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot, Googlebot, Bingbot …) to the CRM, so
 * Website → AI search shows which pages each AI reads. People pass straight through: one regex test, no network call.
 * The bot's request is never delayed either: the log is sent after the response (waitUntil).
 */
export function proxy(req: NextRequest, event: NextFetchEvent) {
  const ua = req.headers.get('user-agent') ?? '';
  if (COLLECT_ON && BOT_UA.test(ua)) {
    const body = JSON.stringify({ h: req.nextUrl.hostname, p: req.nextUrl.pathname, ua: ua.slice(0, 300), bot: 1, c: req.headers.get('x-vercel-ip-country') ?? undefined });
    event.waitUntil(fetch(CRM_COLLECT, { method: 'POST', body, headers: { 'content-type': 'text/plain' }, signal: AbortSignal.timeout(3000) }).catch(() => undefined));
  }
  return NextResponse.next();
}

export const config = {
  // pages, robots.txt, sitemap.xml, llms.txt — not build assets, images or the API
  matcher: ['/((?!_next/|api/|favicon|icon|apple-icon|.*\\.(?:png|jpe?g|webp|avif|svg|gif|ico|woff2?|css|js|map|mp4|webm)$).*)'],
};
