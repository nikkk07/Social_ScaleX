'use client';
// ─────────────────────────────────────────────────────────────────────
// Browser side of the customer app: one Supabase client (created on first
// use, never on the server, separate storage key from the CRM) and a fetch
// helper that adds the access token and turns errors into plain messages.
// ─────────────────────────────────────────────────────────────────────
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

export function appSupabase(): SupabaseClient {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase is not configured.');
  client = createClient(url, key, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: 'ssx-app-auth' },
  });
  return client;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: string,
  ) {
    super(message);
  }
}

export async function accessToken(): Promise<string | null> {
  const { data } = await appSupabase().auth.getSession();
  return data.session?.access_token ?? null;
}

export async function api<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const token = await accessToken();
  if (!token) throw new ApiError('Please sign in again.', 401, 'unauthenticated');
  let res: Response;
  try {
    res = await fetch(path, {
      method: init?.method ?? 'GET',
      headers: { Authorization: `Bearer ${token}`, ...(init?.body !== undefined ? { 'Content-Type': 'application/json' } : {}) },
      body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
      cache: 'no-store',
    });
  } catch {
    throw new ApiError('No internet connection. Check it and try again.', 0, 'offline');
  }
  const json = (await res.json().catch(() => null)) as (T & { message?: string; error?: string }) | null;
  if (!res.ok) throw new ApiError(json?.message ?? 'Something went wrong. Please try again.', res.status, json?.error ?? 'error');
  return json as T;
}

/** Signs the browser in with tokens minted by our server. */
export async function adoptSession(s: { access_token: string; refresh_token: string }): Promise<void> {
  const { error } = await appSupabase().auth.setSession(s);
  if (error) throw new ApiError('Could not sign you in. Please try again.', 401, 'session');
}

/** Same-origin path only, so ?next= can't send people to another site. */
export function safeNext(next: string | null, fallback = '/dashboard'): string {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : fallback;
}

// ── Shapes returned by /api/app/* ────────────────────────────────────
export interface Billing {
  mode: 'autopay' | 'once' | null;
  status: string | null;
  paidUntil: string | null;
  active: boolean;
}

export interface AccountSummary {
  id: string;
  ig_user_id: string;
  username: string;
  name: string | null;
  avatar_url: string | null;
  status: 'connected' | 'reconnect' | 'disconnected';
  last_error: string | null;
  billing: Billing | null;
  automations: { total: number; enabled: number };
}

export interface MediaItem {
  id: string;
  type: 'reel' | 'post' | 'carousel' | 'video';
  thumb: string | null;
  caption: string | null;
  permalink: string | null;
  timestamp?: string | null;
}

export interface Automation {
  id: string;
  account_id: string;
  name: string;
  media_scope: 'all' | 'selected';
  media_ids: string[];
  media_meta: { id: string; thumb: string | null; caption: string | null; permalink: string | null }[];
  trigger_mode: 'any' | 'keywords';
  keywords: string[];
  public_replies: string[];
  dm_text: string;
  is_enabled: boolean;
  created_at: string;
}

export interface EventItem {
  id: number;
  automation_id: string | null;
  commenter_username: string | null;
  comment_text: string | null;
  status: 'pending' | 'sent' | 'skipped' | 'failed';
  detail: string | null;
  dm_sent: boolean;
  reply_sent: boolean;
  created_at: string;
}

export interface AccountDetail {
  account: Omit<AccountSummary, 'billing' | 'automations'>;
  billing: Billing | null;
  automations: Automation[];
  events: EventItem[];
}

export const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }) : '';
