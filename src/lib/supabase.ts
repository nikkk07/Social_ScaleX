// ─────────────────────────────────────────────────────────────────────
// Single Supabase browser client for the whole app.
//
// IMPORTANT: importing this module CREATES the client (and reads/writes the
// auth token in localStorage). Two consequences:
//
//  1. The marketing pages must never pull it into their bundle. Only CRM code
//     and the deferred `useSession()` reader import it, and the marketing-side
//     readers use runtime `import()` so it lands in a separate async chunk.
//  2. It must never be evaluated on the server. The whole CRM subtree is
//     mounted through `next/dynamic` with `ssr: false` (see
//     src/components/crm/CrmClient.tsx) so this never runs during the build,
//     where the env vars and localStorage do not exist.
// ─────────────────────────────────────────────────────────────────────
import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// Read as full static expressions, never destructured: Next.js inlines
// `process.env.NEXT_PUBLIC_*` by literal text substitution at build time, and
// a destructured or computed lookup is left as `undefined` in the bundle.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Fail loudly and actionably at module load rather than letting `undefined`
// slip through to a confusing "fetch failed" deep in an auth call.
if (!url || !anonKey) {
  const missing = [
    !url && 'NEXT_PUBLIC_SUPABASE_URL',
    !anonKey && 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ]
    .filter(Boolean)
    .join(' and ');
  throw new Error(
    `[supabase] Missing ${missing}. Copy .env.example to .env.local and set ` +
      `your project URL and anon key, then restart the dev server (Next.js ` +
      `only reads env at startup). These are safe to expose in the client ` +
      `bundle — the anon key is designed for it and RLS does the enforcing.`,
  );
}

export const supabase = createClient<Database>(url, anonKey, {
  auth: {
    // Persist + auto-refresh the session, and mirror sign-in/out across tabs
    // (a storage event in one tab fires onAuthStateChange in the others).
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'ssx-crm-auth',
  },
});
