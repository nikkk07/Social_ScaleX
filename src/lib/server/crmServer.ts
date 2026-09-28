import 'server-only';
// ─────────────────────────────────────────────────────────────────────
// Server-only helpers for /api routes: the service-role client, caller
// authentication and the staff hierarchy.
//
// The service-role key bypasses Row Level Security, so every route that uses
// it must first prove who is calling (a valid Supabase access token for an
// ACTIVE staff profile) and then check the hierarchy itself:
//   owner  → may manage everyone (but the last active owner stays an owner)
//   admin  → may manage members only
//   member → may manage nobody (own password via /api/crm/me/password)
// ─────────────────────────────────────────────────────────────────────
import { NextResponse } from 'next/server';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { AppRole, Database } from '@/lib/database.types';

export type AdminClient = SupabaseClient<Database>;

let cached: AdminClient | null = null;

/** Created lazily so `next build` never needs the secret. */
export function adminClient(): AdminClient {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new ConfigError('Server is missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  }
  cached = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return cached;
}

/** A throwaway anon client for server-side password checks. */
export function anonClient(): SupabaseClient<Database> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new ConfigError('Server is missing the public Supabase env vars.');
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

export class ConfigError extends Error {}

export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message?: string,
  ) {
    super(message ?? code);
  }
}

export interface Caller {
  id: string;
  role: AppRole;
  email: string;
  fullName: string | null;
}

/** Verifies the bearer token and loads the caller's ACTIVE staff profile. */
export async function requireCaller(req: Request): Promise<Caller> {
  const header = req.headers.get('authorization') ?? '';
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (!match?.[1]) throw new HttpError(401, 'unauthenticated', 'Sign in again.');
  const admin = adminClient();
  const { data, error } = await admin.auth.getUser(match[1]);
  if (error || !data.user) throw new HttpError(401, 'unauthenticated', 'Sign in again.');
  const { data: profile } = await admin
    .from('profiles')
    .select('id, role, email, full_name, is_active')
    .eq('id', data.user.id)
    .maybeSingle();
  if (!profile || !profile.is_active) throw new HttpError(403, 'not_authorized', 'Your account is not active.');
  return { id: profile.id, role: profile.role, email: profile.email, fullName: profile.full_name };
}

const RANK: Record<AppRole, number> = { member: 0, admin: 1, owner: 2 };

/** Can `actor` manage an account that has (or will have) `targetRole`? */
export function canManage(actor: AppRole, targetRole: AppRole): boolean {
  if (actor === 'owner') return true;
  if (actor === 'admin') return targetRole === 'member';
  return false;
}

export function outranks(a: AppRole, b: AppRole): boolean {
  return RANK[a] > RANK[b];
}

export async function audit(
  actorId: string | null,
  action: string,
  entity: string,
  entityId: string | null,
  detail: Record<string, unknown> = {},
): Promise<void> {
  try {
    await adminClient().from('audit_log').insert({
      actor_id: actorId,
      action,
      entity,
      entity_id: entityId,
      detail: detail as Database['public']['Tables']['audit_log']['Insert']['detail'],
    });
  } catch {
    // Auditing must never turn a successful action into a failure.
  }
}

/** One JSON error shape for every route. Never leaks internals. */
export function errorResponse(e: unknown): NextResponse {
  if (e instanceof HttpError) {
    return NextResponse.json({ error: e.code, message: e.message }, { status: e.status, headers: NO_STORE });
  }
  if (e instanceof ConfigError) {
    console.error('[crm api] configuration:', e.message);
    return NextResponse.json(
      { error: 'server_misconfigured', message: 'The server is not configured. Contact the owner.' },
      { status: 500, headers: NO_STORE },
    );
  }
  console.error('[crm api] unexpected:', e);
  return NextResponse.json(
    { error: 'unexpected', message: 'Something went wrong. Please try again.' },
    { status: 500, headers: NO_STORE },
  );
}

export const NO_STORE = { 'Cache-Control': 'no-store' } as const;

export async function readJson(req: Request): Promise<unknown> {
  const len = Number(req.headers.get('content-length') ?? '0');
  if (len > 20_000) throw new HttpError(413, 'too_large', 'Request is too large.');
  try {
    return await req.json();
  } catch {
    throw new HttpError(400, 'invalid_json', 'Request body must be JSON.');
  }
}
