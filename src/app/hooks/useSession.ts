/**
 * Placeholder session hook for the marketing chrome.
 *
 * TODO(phase-3): replace the body with the real Supabase session pulled
 * from crm/auth/AuthProvider. The marketing Navbar and Footer read this to
 * decide logged-in vs logged-out UI (CRM pill vs "Start growing"; whether
 * to surface "Team Login"). Returning null means "logged out", which is the
 * correct default until auth exists — so Phase 3 is a one-line swap here,
 * not edits scattered across the marketing components.
 */
export interface MarketingSession {
  /** Populated in Phase 3 from the Supabase session. */
  userId: string;
}

export function useSession(): MarketingSession | null {
  return null;
}
