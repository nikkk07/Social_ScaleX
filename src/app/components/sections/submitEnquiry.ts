// Submitting the public contact form to public.inbound_enquiries.
//
// ── Why the Supabase client is imported the way it is ────────────────
// This form lives on the HOMEPAGE, so it is the first marketing code that
// touches Supabase. useSession's trick doesn't apply here: it can skip the
// client entirely because an anonymous visitor has no stored session to read,
// but a visitor filling this form genuinely needs it.
//
// So the client is loaded on FIRST INTERACTION with the form — not at module
// scope (every visitor pays 57 kB to look at a page), and not on idle (same
// cost, just later). Someone who scrolls past the form and leaves, which is
// most visitors, never fetches it. Someone who focuses a field is about to
// need it, and the fetch overlaps with them typing, so submit still feels
// instant.
//
// ── What is sent ─────────────────────────────────────────────────────
// The form fields, plus user_agent. Nothing else about the visitor: no IP
// collection, no fingerprint, no referrer. user_agent is truncated to 400
// chars to match the inbound_enquiries_bounds CHECK (090011).
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../../lib/database.types';

export type EnquiryKind = 'callback' | 'query';

export interface CallbackPayload {
  kind: 'callback';
  name: string;
  phone: string;
  best_time: string | null;
}
export interface QueryPayload {
  kind: 'query';
  name: string;
  email: string;
  message: string;
}
export type EnquiryPayload = CallbackPayload | QueryPayload;

// ── Lazy client ──────────────────────────────────────────────────────
// The promise is cached, so focus → blur → focus doesn't refetch, and a submit
// that lands mid-fetch reuses the in-flight one rather than starting a second.
let clientPromise: Promise<SupabaseClient<Database>> | null = null;

export function warmSupabase(): void {
  void loadSupabase().catch(() => {
    // Swallowed here on purpose: warming is speculative and must never surface
    // an error to someone who has merely focused a field. The submit path
    // calls loadSupabase() again and reports the failure there, where the
    // person is actually waiting on an answer.
  });
}

function loadSupabase(): Promise<SupabaseClient<Database>> {
  if (!clientPromise) {
    clientPromise = import('../../../lib/supabase').then((m) => m.supabase);
    // A failed import must not be cached as permanently broken — a transient
    // chunk fetch failure should be retryable on the next attempt.
    clientPromise.catch(() => {
      clientPromise = null;
    });
  }
  return clientPromise;
}

// Exposed for tests; also lets a page reset between suites.
export function __resetClientForTests(): void {
  clientPromise = null;
}

// ── Throttle ─────────────────────────────────────────────────────────
// The database cannot rate-limit: a CHECK can't express "N per hour", and
// there is no edge function in this stack. This is the rate guard, and it is
// CLIENT-SIDE, so anyone driving the REST endpoint directly walks past it.
// That gap is accepted and documented (docs/DEPLOYMENT.md); what makes it
// survivable is the per-row size cap in 090011. This stops casual double-taps
// and naive bots hitting the real form, which is most of what actually arrives.
export const THROTTLE_KEY = 'ssx-enquiry-sends';
export const MIN_GAP_MS = 30_000; // between consecutive sends
export const WINDOW_MS = 60 * 60_000; // rolling hour
export const MAX_PER_WINDOW = 5;

export interface ThrottleVerdict {
  allowed: boolean;
  retryAfterMs: number;
  reason?: 'too-soon' | 'hourly-cap';
}

// Pure so it can be tested without a clock or a DOM.
export function checkThrottle(sends: number[], now: number): ThrottleVerdict {
  const recent = sends.filter((t) => now - t < WINDOW_MS);
  const last = recent.length ? Math.max(...recent) : null;

  if (last != null && now - last < MIN_GAP_MS) {
    return { allowed: false, retryAfterMs: MIN_GAP_MS - (now - last), reason: 'too-soon' };
  }
  if (recent.length >= MAX_PER_WINDOW) {
    const oldest = Math.min(...recent);
    return { allowed: false, retryAfterMs: WINDOW_MS - (now - oldest), reason: 'hourly-cap' };
  }
  return { allowed: true, retryAfterMs: 0 };
}

// Drop anything outside the window so the stored list can't grow unbounded.
export function pruneSends(sends: number[], now: number): number[] {
  return sends.filter((t) => now - t < WINDOW_MS);
}

function readSends(): number[] {
  try {
    const raw = window.localStorage.getItem(THROTTLE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((n): n is number => typeof n === 'number') : [];
  } catch {
    // Private mode / blocked storage / corrupt JSON. Fail OPEN: a visitor with
    // storage disabled must still be able to send an enquiry. The honeypot and
    // the row-size cap still apply.
    return [];
  }
}

function recordSend(now: number): void {
  try {
    const next = pruneSends(readSends(), now).concat(now);
    window.localStorage.setItem(THROTTLE_KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable — see readSends */
  }
}

// ── Submit ───────────────────────────────────────────────────────────
export type SubmitResult =
  | { ok: true }
  | { ok: false; kind: 'throttled'; retryAfterMs: number }
  | { ok: false; kind: 'failed' };

function userAgent(): string | null {
  const ua = typeof navigator === 'undefined' ? '' : navigator.userAgent;
  return ua ? ua.slice(0, 400) : null;
}

export async function submitEnquiry(payload: EnquiryPayload): Promise<SubmitResult> {
  const now = Date.now();
  const verdict = checkThrottle(readSends(), now);
  if (!verdict.allowed) {
    return { ok: false, kind: 'throttled', retryAfterMs: verdict.retryAfterMs };
  }

  try {
    const supabase = await loadSupabase();
    const { error } = await supabase.from('inbound_enquiries').insert({
      ...payload,
      user_agent: userAgent(),
    });
    if (error) throw error;
  } catch {
    // Covers a missing-env import throw, a chunk that didn't load, an offline
    // network, and a rejected insert. The visitor gets one honest message with
    // a way to reach us; nothing here ever claims success it didn't get.
    return { ok: false, kind: 'failed' };
  }

  // Only a CONFIRMED write counts against the throttle. Otherwise a visitor
  // whose first attempt failed would be locked out of retrying for 30s.
  recordSend(now);
  return { ok: true };
}
