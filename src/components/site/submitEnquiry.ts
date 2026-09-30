// Sends the public enquiry form to public.inbound_enquiries.
//
// A plain fetch to Supabase's REST endpoint with the public anon key, so the
// marketing pages never load supabase-js (57 kB) for one insert. The anon
// role may only INSERT enquiries (RLS + a size CHECK, see supabase/README.md).
// Nothing is collected about the visitor beyond the form and a truncated
// user agent: no IP, no fingerprint.

export interface EnquiryPayload {
  kind: 'callback' | 'query';
  name: string;
  phone?: string | null;
  email?: string | null;
  best_time?: string | null;
  message?: string | null;
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

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  try {
    if (!url || !key) throw new Error('Supabase env missing');
    const res = await fetch(`${url.replace(/\/$/, '')}/rest/v1/inbound_enquiries`, {
      method: 'POST',
      headers: {
        apikey: key,
        authorization: `Bearer ${key}`,
        'content-type': 'application/json',
        prefer: 'return=minimal',
      },
      body: JSON.stringify({ ...payload, user_agent: userAgent() }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  } catch {
    // Missing env, offline, or a rejected insert. The visitor gets one honest
    // message with a phone number; nothing here claims a send that failed.
    return { ok: false, kind: 'failed' };
  }

  // Only a confirmed write counts against the throttle, so a failed attempt
  // can be retried at once.
  recordSend(now);
  return { ok: true };
}
