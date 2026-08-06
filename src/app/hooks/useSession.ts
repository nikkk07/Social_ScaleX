/**
 * Marketing-side session reader.
 *
 * The marketing Navbar/Footer use this to choose logged-in vs logged-out UI
 * (CRM pill vs "Start growing"; whether to surface "Team Login"). It is
 * INTENTIONALLY decoupled from the CRM AuthProvider — the homepage is not
 * wrapped in that provider and must not pull the Supabase client into its
 * initial bundle.
 *
 * How that constraint is met:
 *   - ZERO-COST GATE: we first read Supabase's persisted-session key from
 *     localStorage synchronously (no import, no network, no KB). An anonymous
 *     visitor — which is everyone except the two staff who ever sign in — has
 *     no such key, so the 218 kB Supabase client is NEVER fetched for them.
 *   - Only when the key is present do we DEFER (on idle) a dynamic import of
 *     the client to confirm the session and subscribe to changes. That chunk
 *     is separate from the homepage's initial chunk either way.
 *   - Until that chunk resolves — or if it fails (e.g. env missing) — the hook
 *     returns null, i.e. the nav degrades gracefully to signed-out.
 */
import { useEffect, useState } from 'react';

export interface MarketingSession {
  userId: string;
}

// MUST match the `storageKey` passed to createClient in src/lib/supabase.ts.
// supabase-js persists its session JSON under exactly this localStorage key.
const AUTH_STORAGE_KEY = 'ssx-crm-auth';

function hasStoredSession(): boolean {
  try {
    return window.localStorage.getItem(AUTH_STORAGE_KEY) != null;
  } catch {
    // localStorage unavailable (private mode / blocked) — treat as signed-out.
    return false;
  }
}

// Run a callback when the browser is idle, falling back to a short timeout.
function onIdle(cb: () => void): () => void {
  const w = window as unknown as {
    requestIdleCallback?: (cb: () => void) => number;
    cancelIdleCallback?: (h: number) => void;
  };
  if (typeof w.requestIdleCallback === 'function') {
    const handle = w.requestIdleCallback(cb);
    return () => w.cancelIdleCallback?.(handle);
  }
  const t = window.setTimeout(cb, 200);
  return () => window.clearTimeout(t);
}

export function useSession(): MarketingSession | null {
  const [session, setSession] = useState<MarketingSession | null>(null);

  useEffect(() => {
    // No stored token → the visitor has never signed in. Skip the client
    // entirely: no dynamic import, no 218 kB, stay signed-out.
    if (!hasStoredSession()) return;

    let active = true;
    let unsubscribe: (() => void) | undefined;

    const cancelIdle = onIdle(() => {
      // Dynamic import → Supabase stays out of the homepage's initial chunk.
      import('../../lib/supabase')
        .then(({ supabase }) => {
          if (!active) return;

          supabase.auth.getSession().then(({ data }) => {
            if (active && data.session) {
              setSession({ userId: data.session.user.id });
            }
          });

          const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
            if (active) setSession(s ? { userId: s.user.id } : null);
          });
          unsubscribe = () => sub.subscription.unsubscribe();
        })
        .catch(() => {
          // Client couldn't load (e.g. missing env) — stay signed-out.
        });
    });

    return () => {
      active = false;
      cancelIdle();
      unsubscribe?.();
    };
  }, []);

  return session;
}
