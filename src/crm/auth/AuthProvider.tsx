// ─────────────────────────────────────────────────────────────────────
// CRM auth context.
//
// Deliberately NOT a boolean `loading`. There are four decisive states plus
// an error branch; conflating them is what produces redirect loops, blank
// screens, and — post Phase-2 hardening — a fully-rendered but empty CRM for
// a user with no profiles row (profiles_select now gates on is_staff(), so
// such a user reads zero rows from every table with no error).
// ─────────────────────────────────────────────────────────────────────
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { AppRole, Profile } from '@/lib/database.types';

export type AuthStatus =
  | 'initialising' // session restore in flight — render nothing decisive
  | 'signed_out' // no session
  | 'signed_in_provisioned' // session AND a profiles row — may enter the CRM
  | 'signed_in_unprovisioned' // valid session, NO profiles row
  | 'error'; // profile query FAILED (network/RLS) — distinct from "0 rows"

export type SignInResult =
  | { ok: true }
  | { ok: false; kind: 'invalid' | 'rate_limited' | 'unexpected' };

interface AuthContextValue {
  status: AuthStatus;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  role: AppRole | null;
  signIn: (email: string, password: string) => Promise<SignInResult>;
  signOut: () => Promise<void>;
  /** Re-attempt the profile fetch after an `error` status. */
  retry: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [status, setStatus] = useState<AuthStatus>('initialising');

  // Guards against out-of-order async writes: every profile fetch captures the
  // current token; a newer auth event bumps it and stale results are dropped.
  const reqIdRef = useRef(0);
  // Cheap refs so the auth listener can skip a redundant profile refetch on
  // token refresh without re-subscribing on every render.
  const currentUserIdRef = useRef<string | null>(null);
  const statusRef = useRef<AuthStatus>('initialising');
  const setStatusTracked = useCallback((s: AuthStatus) => {
    statusRef.current = s;
    setStatus(s);
  }, []);

  // Resolve a session into a decisive state by looking up the profiles row.
  const resolveForSession = useCallback(
    async (sess: Session | null) => {
      const reqId = ++reqIdRef.current;
      setSession(sess);

      if (!sess) {
        currentUserIdRef.current = null;
        setProfile(null);
        setStatusTracked('signed_out');
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', sess.user.id)
        .maybeSingle();

      if (reqId !== reqIdRef.current) return; // superseded by a newer event

      if (error) {
        // A real failure (network down, RLS/PostgREST error). NOT the same as
        // "no row" — do not strand the user on the unprovisioned screen.
        currentUserIdRef.current = sess.user.id;
        setProfile(null);
        setStatusTracked('error');
        return;
      }

      currentUserIdRef.current = sess.user.id;
      if (!data) {
        setProfile(null);
        setStatusTracked('signed_in_unprovisioned');
        return;
      }
      setProfile(data as Profile);
      setStatusTracked('signed_in_provisioned');
    },
    [setStatusTracked],
  );

  useEffect(() => {
    let active = true;

    const { data: sub } = supabase.auth.onAuthStateChange((event, sess) => {
      if (!active) return;

      if (event === 'SIGNED_OUT' || !sess) {
        reqIdRef.current++; // cancel any in-flight profile fetch
        currentUserIdRef.current = null;
        setSession(null);
        setProfile(null);
        setStatusTracked('signed_out');
        return;
      }

      // INITIAL_SESSION is covered by the getSession() call below; skip it to
      // avoid a duplicate profile fetch on first load.
      if (event === 'INITIAL_SESSION') return;

      // Token refresh for the SAME already-resolved user: just refresh the
      // session object, keep the profile, don't flip status (no flicker).
      if (
        event === 'TOKEN_REFRESHED' &&
        sess.user.id === currentUserIdRef.current &&
        (statusRef.current === 'signed_in_provisioned' ||
          statusRef.current === 'signed_in_unprovisioned')
      ) {
        setSession(sess);
        return;
      }

      void resolveForSession(sess);
    });

    // Deterministic first resolve.
    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          setStatusTracked('error');
          return;
        }
        void resolveForSession(data.session);
      })
      .catch(() => {
        if (active) setStatusTracked('error');
      });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [resolveForSession, setStatusTracked]);

  const signIn = useCallback(
    async (email: string, password: string): Promise<SignInResult> => {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (!error) return { ok: true }; // SIGNED_IN event drives the resolve
      const httpStatus = (error as { status?: number }).status;
      if (httpStatus === 429) return { ok: false, kind: 'rate_limited' };
      // 400 = "Invalid login credentials" for BOTH wrong password and unknown
      // email — Supabase does not distinguish, so neither do we.
      if (httpStatus === 400) return { ok: false, kind: 'invalid' };
      return { ok: false, kind: 'unexpected' };
    },
    [],
  );

  const signOut = useCallback(async () => {
    // Clear in-memory CRM state immediately so a shared laptop never leaks the
    // previous session's data into the next, even before the network returns.
    // Future data caches (Phase 4+) must reset here or on the signed_out
    // transition — nothing should outlive sign-out in memory.
    reqIdRef.current++;
    currentUserIdRef.current = null;
    setSession(null);
    setProfile(null);
    setStatusTracked('signed_out');
    await supabase.auth.signOut(); // fires SIGNED_OUT here and in other tabs
  }, [setStatusTracked]);

  const retry = useCallback(() => {
    setStatusTracked('initialising');
    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (error) {
          setStatusTracked('error');
          return;
        }
        void resolveForSession(data.session);
      })
      .catch(() => setStatusTracked('error'));
  }, [resolveForSession, setStatusTracked]);

  const value: AuthContextValue = {
    status,
    session,
    user: session?.user ?? null,
    profile,
    role: profile?.role ?? null,
    signIn,
    signOut,
    retry,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within <AuthProvider>');
  }
  return ctx;
}
