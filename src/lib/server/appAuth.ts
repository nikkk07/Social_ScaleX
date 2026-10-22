import 'server-only';
// ─────────────────────────────────────────────────────────────────────
// Customer sign-in. Public sign-ups stay OFF in Supabase (the CRM depends on
// that), so customer accounts are created here with the service role, and a
// session is minted for the browser:
//   Google → verify the ID token with Google → create/find the user →
//            magic-link token → verifyOtp → session
//   Email  → create the user (sign-up) or check the password (sign-in)
// The handle_new_user() trigger gives these users no CRM profile, because
// they have no app_metadata.crm_role.
// ─────────────────────────────────────────────────────────────────────
import { randomBytes } from 'node:crypto';
import { anon, db, HttpError } from '@/lib/server/appServer';

export interface SessionOut {
  access_token: string;
  refresh_token: string;
  expires_at: number | null;
}

/**
 * Creates the customer if the email is new. Returns true when created.
 * `verified` = the email was proven (Google). Email/password sign-ups are not
 * proven, which matters if the real owner of that email shows up later
 * (see claimWithGoogle).
 */
export async function ensureUser(email: string, name: string | null, password?: string, verified = false): Promise<boolean> {
  const { error } = await db().auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: name ? { full_name: name } : {},
    app_metadata: { customer: true, verified },
  });
  if (!error) return true;
  if (/already|registered|exists/i.test(error.message)) return false;
  throw error;
}

async function linkFor(email: string): Promise<{ hash: string; userId: string; appMeta: Record<string, unknown> }> {
  const { data, error } = await db().auth.admin.generateLink({ type: 'magiclink', email });
  const hash = data?.properties?.hashed_token;
  if (error || !hash || !data.user) throw new HttpError(500, 'session_failed', 'Could not sign you in. Please try again.');
  return { hash, userId: data.user.id, appMeta: (data.user.app_metadata ?? {}) as Record<string, unknown> };
}

async function verify(hash: string): Promise<SessionOut> {
  const { data: s, error } = await anon().auth.verifyOtp({ token_hash: hash, type: 'magiclink' });
  if (error || !s.session) throw new HttpError(500, 'session_failed', 'Could not sign you in. Please try again.');
  return { access_token: s.session.access_token, refresh_token: s.session.refresh_token, expires_at: s.session.expires_at ?? null };
}

/**
 * Google proved this person owns the email. If the account was created
 * earlier with an unproven email/password sign-up, someone else may know
 * that password: replace it with a random one, sign every other session
 * out, and mark the account verified. Then hand back a fresh session.
 */
export async function claimWithGoogle(email: string): Promise<SessionOut> {
  const first = await linkFor(email);
  if (first.appMeta.verified === true) return verify(first.hash);
  // A CRM staff login: never touch its password from here.
  if (typeof first.appMeta.crm_role === 'string') {
    throw new HttpError(409, 'staff_email', 'This email is a Social ScaleX team login. Use a different email for the automation.');
  }
  await db().auth.admin.updateUserById(first.userId, {
    password: randomBytes(24).toString('base64url'),
    app_metadata: { ...first.appMeta, customer: true, verified: true },
  });
  const temp = await verify(first.hash);
  await db().auth.admin.signOut(temp.access_token, 'global');
  const second = await linkFor(email);
  return verify(second.hash);
}

export interface GoogleIdentity {
  email: string;
  name: string | null;
}

/** Verifies a Google Identity Services credential (ID token) with Google. */
export async function verifyGoogle(credential: string): Promise<GoogleIdentity> {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim();
  if (!clientId) throw new HttpError(503, 'google_off', 'Google sign-in is not set up yet. Use email instead.');
  const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`, { cache: 'no-store' });
  if (!res.ok) throw new HttpError(401, 'google_invalid', 'Google sign-in failed. Please try again.');
  const t = (await res.json()) as { aud?: string; iss?: string; email?: string; email_verified?: string | boolean; name?: string; exp?: string };
  const verified = t.email_verified === true || t.email_verified === 'true';
  const issOk = t.iss === 'accounts.google.com' || t.iss === 'https://accounts.google.com';
  const fresh = Number(t.exp ?? 0) * 1000 > Date.now();
  if (t.aud !== clientId || !issOk || !verified || !fresh || !t.email) {
    throw new HttpError(401, 'google_invalid', 'Google sign-in failed. Please try again.');
  }
  return { email: t.email.toLowerCase(), name: t.name ?? null };
}
