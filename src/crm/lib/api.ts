// Thin, typed wrappers around Supabase RPCs and the CRM's own /api routes.
import { supabase } from '@/lib/supabase';
import type { Database, Json } from '@/lib/database.types';

type Fns = Database['public']['Functions'];

/** Calls a Postgres function and throws on error (message stays machine-readable). */
export async function rpc<N extends keyof Fns & string>(
  name: N,
  args: Fns[N]['Args'],
): Promise<Fns[N]['Returns']> {
  const { data, error } = await supabase.rpc(name, args as never);
  if (error) throw new Error(error.message);
  return data as Fns[N]['Returns'];
}

export function asJson(v: unknown): Json {
  return v as Json;
}

/** fetch() to our own /api routes with the caller's access token attached. */
export async function apiFetch<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  let res: Response;
  try {
    res = await fetch(path, { ...init, headers, cache: 'no-store' });
  } catch {
    throw new Error('Failed to fetch');
  }
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  if (!res.ok) {
    const b = body as { message?: string; error?: string } | null;
    throw new Error(b?.message || b?.error || `Request failed (${res.status})`);
  }
  return body as T;
}
