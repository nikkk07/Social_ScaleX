// ─────────────────────────────────────────────────────────────────────
// /api/webhooks/instagram   (Meta → us)
//   GET  verification: echo hub.challenge when hub.verify_token matches
//   POST comment events: verify X-Hub-Signature-256, then answer each comment
// Comments are processed before the 200 goes back. If anything throws, the
// 500 makes Meta retry, and ig_events' unique (account, comment) key turns
// the retry into a no-op for comments already handled.
// ─────────────────────────────────────────────────────────────────────
import { NextResponse } from 'next/server';
import { env, hmacHex, safeEqual } from '@/lib/server/appServer';
import { extractComments, handleComment } from '@/lib/server/engine';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(req: Request) {
  const u = new URL(req.url);
  const mode = u.searchParams.get('hub.mode');
  const token = u.searchParams.get('hub.verify_token') ?? '';
  const challenge = u.searchParams.get('hub.challenge') ?? '';
  let expected = '';
  try {
    expected = env('IG_WEBHOOK_VERIFY_TOKEN');
  } catch {
    return new NextResponse('not configured', { status: 500 });
  }
  if (mode === 'subscribe' && safeEqual(token, expected) && /^[\w-]{1,200}$/.test(challenge)) {
    return new NextResponse(challenge, { status: 200, headers: { 'Content-Type': 'text/plain' } });
  }
  return new NextResponse('forbidden', { status: 403 });
}

const CONCURRENCY = 5;

export async function POST(req: Request) {
  const raw = await req.text();
  let secret: string;
  try {
    secret = env('IG_APP_SECRET');
  } catch {
    return new NextResponse('not configured', { status: 500 });
  }
  const sig = req.headers.get('x-hub-signature-256') ?? '';
  if (!sig.startsWith('sha256=') || !safeEqual(sig.slice(7), hmacHex(secret, raw))) {
    return new NextResponse('bad signature', { status: 401 });
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return new NextResponse('ok', { status: 200 }); // malformed: retrying won't fix it
  }

  const comments = extractComments(body);
  let failed = 0;
  for (let i = 0; i < comments.length; i += CONCURRENCY) {
    const batch = comments.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(batch.map((c) => handleComment(c)));
    for (const r of results) {
      if (r.status === 'rejected') {
        failed++;
        console.error('[ig webhook]', r.reason);
      }
    }
  }
  // Ask Meta to retry only when something crashed (e.g. the database was down).
  return new NextResponse(failed ? 'retry' : 'ok', { status: failed ? 500 : 200 });
}
