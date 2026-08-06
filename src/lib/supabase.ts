// ─────────────────────────────────────────────────────────────────────
// Single Supabase browser client for the whole app.
//
// IMPORTANT: importing this module CREATES the client (and reads/writes the
// auth token in localStorage). The marketing homepage must never pull it into
// its initial bundle — only CRM code and the deferred `useSession()` reader
// import it, both behind dynamic import()/React.lazy so it lands in a separate
// async chunk. See src/app/hooks/useSession.ts for the marketing path.
// ─────────────────────────────────────────────────────────────────────
import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// Fail loudly and actionably at module load rather than letting `undefined`
// slip through to a confusing "fetch failed" deep in an auth call.
if (!url || !anonKey) {
  const missing = [
    !url && 'VITE_SUPABASE_URL',
    !anonKey && 'VITE_SUPABASE_ANON_KEY',
  ]
    .filter(Boolean)
    .join(' and ');
  throw new Error(
    `[supabase] Missing ${missing}. Copy .env.example to .env.local and set ` +
      `your project URL and anon key, then restart the dev server (Vite only ` +
      `reads env at startup). These are safe to expose in the client bundle.`,
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
