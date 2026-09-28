'use client';
// ─────────────────────────────────────────────────────────────────────
// CRM session + profile.
//
// Five explicit states instead of a `loading` boolean, so the UI never
// flashes the login page during a refresh and never renders an empty CRM
// for an account that has no staff profile:
//   initialising → signed_out | signed_in (active profile) | unprovisioned | error
//
// Sign-in goes through /api/auth/sign-in (email OR phone + password, with
// brute-force lock-out) and the returned tokens are handed to supabase-js.
// The profile is re-checked on focus and every 5 minutes, and the session is
// ended after the configured idle time — a deactivated account or an
// unattended office PC does not stay signed in.
// ─────────────────────────────────────────────────────────────────────
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { AppRole, Profile } from '@/lib/database.types';

export type AuthStatus = 'initialising' | 'signed_out' | 'signed_in' | 'unprovisioned' | 'error';

interface AuthValue {
  status: AuthStatus;
  session: Session | null;
  profile: Profile | null;
  role: AppRole | null;
  isAdmin: boolean;
  isOwner: boolean;
  signIn: (identifier: string, password: string) => Promise<{ ok: true } | { ok: false; message: string }>;
  signOut: (reason?: 'idle' | 'inactive') => Promise<void>;
  retry: () => void;
  refreshProfile: () => Promise<void>;
  signedOutReason: 'idle' | 'inactive' | null;
}

const AuthContext = createContext<AuthValue | null>(null);

const RECHECK_MS = 5 * 60_000;
const DEFAULT_IDLE_MIN = 60;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [status, setStatus] = useState<AuthStatus>('initialising');
  const [signedOutReason, setSignedOutReason] = useState<'idle' | 'inactive' | null>(null);
  const reqId = useRef(0);
  const userIdRef = useRef<string | null>(null);
  const queryClient = useQueryClient();

  const resolve = useCallback(async (sess: Session | null) => {
    const id = ++reqId.current;
    setSession(sess);
    if (!sess) {
      userIdRef.current = null;
      setProfile(null);
      setStatus('signed_out');
      return;
    }
    const { data, error } = await supabase.from('profiles').select('*').eq('id', sess.user.id).maybeSingle();
    if (id !== reqId.current) return;
    userIdRef.current = sess.user.id;
    if (error) {
      setStatus('error');
      return;
    }
    if (!data || !data.is_active) {
      setProfile(null);
      setStatus('unprovisioned');
      return;
    }
    setProfile(data);
    setStatus('signed_in');
  }, []);

  useEffect(() => {
    let active = true;
    const { data: sub } = supabase.auth.onAuthStateChange((event, sess) => {
      if (!active) return;
      if (event === 'SIGNED_OUT' || !sess) {
        // Nothing from the previous user may survive in memory.
        queryClient.clear();
        reqId.current++;
        userIdRef.current = null;
        setSession(null);
        setProfile(null);
        setStatus('signed_out');
        return;
      }
      if (event === 'TOKEN_REFRESHED' && sess.user.id === userIdRef.current) {
        setSession(sess);
        return;
      }
      // Defer: supabase-js warns against awaiting other calls inside the callback.
      setTimeout(() => void resolve(sess), 0);
    });
    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) setStatus('error');
      else void resolve(data.session);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [resolve, queryClient]);

  const signOut = useCallback(async (reason?: 'idle' | 'inactive') => {
    setSignedOutReason(reason ?? null);
    await supabase.auth.signOut({ scope: 'local' });
  }, []);

  const refreshProfile = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    await resolve(data.session);
  }, [resolve]);

  // Re-check the profile: deactivation takes effect within minutes, not hours.
  useEffect(() => {
    if (status !== 'signed_in') return;
    const check = async () => {
      const uid = userIdRef.current;
      if (!uid) return;
      const { data, error } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle();
      if (error) return; // offline — try again later
      if (!data || !data.is_active) {
        await signOut('inactive');
        return;
      }
      setProfile(data);
    };
    const t = window.setInterval(check, RECHECK_MS);
    const onFocus = () => void check();
    window.addEventListener('focus', onFocus);
    return () => {
      window.clearInterval(t);
      window.removeEventListener('focus', onFocus);
    };
  }, [status, signOut]);

  // Idle sign-out.
  const [idleMinutes, setIdleMinutes] = useState(DEFAULT_IDLE_MIN);
  useEffect(() => {
    if (status !== 'signed_in') return;
    supabase.from('crm_settings').select('idle_timeout_minutes').eq('id', 1).maybeSingle().then(({ data }) => {
      if (data?.idle_timeout_minutes) setIdleMinutes(data.idle_timeout_minutes);
    });
  }, [status]);
  useEffect(() => {
    if (status !== 'signed_in') return;
    let last = Date.now();
    const bump = () => { last = Date.now(); };
    const events = ['pointerdown', 'keydown', 'scroll', 'touchstart'] as const;
    events.forEach((e) => window.addEventListener(e, bump, { passive: true }));
    const t = window.setInterval(() => {
      if (Date.now() - last > idleMinutes * 60_000) void signOut('idle');
    }, 30_000);
    return () => {
      events.forEach((e) => window.removeEventListener(e, bump));
      window.clearInterval(t);
    };
  }, [status, idleMinutes, signOut]);

  const signIn = useCallback<AuthValue['signIn']>(async (identifier, password) => {
    setSignedOutReason(null);
    let res: Response;
    try {
      res = await fetch('/api/auth/sign-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
        cache: 'no-store',
      });
    } catch {
      return { ok: false, message: 'You seem to be offline. Check your connection and try again.' };
    }
    const body = (await res.json().catch(() => null)) as
      | { access_token?: string; refresh_token?: string; message?: string }
      | null;
    if (!res.ok || !body?.access_token || !body.refresh_token) {
      return { ok: false, message: body?.message ?? 'Something went wrong. Please try again.' };
    }
    const { data, error } = await supabase.auth.setSession({
      access_token: body.access_token,
      refresh_token: body.refresh_token,
    });
    if (error || !data.session) return { ok: false, message: 'Could not start your session. Please try again.' };
    // Resolve the profile before returning, so the caller never navigates
    // into the CRM while the auth state still says "signed out".
    await resolve(data.session);
    return { ok: true };
  }, [resolve]);

  const retry = useCallback(() => {
    setStatus('initialising');
    supabase.auth.getSession().then(({ data }) => void resolve(data.session));
  }, [resolve]);

  const value = useMemo<AuthValue>(() => {
    const role = profile?.role ?? null;
    return {
      status, session, profile, role,
      isAdmin: role === 'owner' || role === 'admin',
      isOwner: role === 'owner',
      signIn, signOut, retry, refreshProfile, signedOutReason,
    };
  }, [status, session, profile, signIn, signOut, retry, refreshProfile, signedOutReason]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const v = useContext(AuthContext);
  if (!v) throw new Error('useAuth must be used inside <AuthProvider>');
  return v;
}

/** For components that only render inside the signed-in shell. */
export function useMe(): { id: string; profile: Profile; role: AppRole; isAdmin: boolean; isOwner: boolean } {
  const a = useAuth();
  if (!a.profile || !a.role) throw new Error('useMe outside a signed-in view');
  return { id: a.profile.id, profile: a.profile, role: a.role, isAdmin: a.isAdmin, isOwner: a.isOwner };
}
