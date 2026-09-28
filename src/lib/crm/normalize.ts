// ─────────────────────────────────────────────────────────────────────
// Input normalisation shared by the browser, the API routes and the unit
// tests. Each function mirrors its SQL twin in migration 090012
// (public.normalize_phone / public.normalize_instagram) exactly — the
// database re-normalises everything, so a mismatch can only ever produce a
// validation message, never bad data.
// ─────────────────────────────────────────────────────────────────────

/** E.164 (+<country><number>) or null. Bare 10-digit Indian mobiles get +91. */
export function normalizePhone(raw: string | null | undefined): string | null {
  let s = (raw ?? '').replace(/[\s\-.()]/g, '');
  if (s === '') return null;
  if (s.startsWith('00')) s = '+' + s.slice(2);
  if (s.startsWith('+')) {
    const d = s.slice(1);
    return /^[1-9][0-9]{6,14}$/.test(d) ? '+' + d : null;
  }
  const d = s.replace(/^0+/, '');
  if (!/^[0-9]+$/.test(d)) return null;
  if (d.length === 10 && /^[6-9]/.test(d)) return '+91' + d;
  if (d.length === 12 && d.startsWith('91') && /^[6-9]$/.test(d.charAt(2))) return '+' + d;
  return null;
}

/** Bare lowercase Instagram username, or null when it cannot be one. */
export function normalizeInstagram(raw: string | null | undefined): string | null {
  let h = (raw ?? '').trim();
  h = h.replace(/^(https?:\/\/)?(www\.)?instagram\.com\//i, '');
  h = h.replace(/^@+/, '');
  h = (h.split('/')[0] ?? '').split('?')[0] ?? '';
  h = (h.split(' ')[0] ?? '').toLowerCase();
  return /^[a-z0-9._]{1,30}$/.test(h) ? h : null;
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim());
}

/**
 * Staff password rule: 8–72 characters (bcrypt ignores bytes past 72) with at
 * least one letter and one digit. Returns an error message or null.
 */
export function passwordProblem(pw: string): string | null {
  if (pw.length < 8) return 'Use at least 8 characters.';
  if (new TextEncoder().encode(pw).length > 72) return 'Use at most 72 characters.';
  if (!/[A-Za-z]/.test(pw) || !/[0-9]/.test(pw)) return 'Use at least one letter and one number.';
  return null;
}

/**
 * Accounts created with only a phone number still need an email for
 * password sign-in without an SMS provider. This address is never shown or
 * mailed: `.invalid` is reserved by RFC 2606 and can never be delivered.
 */
export const PHONE_ONLY_EMAIL_DOMAIN = 'phone.socialscalex.invalid';

export function phoneOnlyEmail(e164: string): string {
  return `p${e164.replace(/\D/g, '')}@${PHONE_ONLY_EMAIL_DOMAIN}`;
}

export function isPhoneOnlyEmail(email: string | null | undefined): boolean {
  return !!email && email.toLowerCase().endsWith('@' + PHONE_ONLY_EMAIL_DOMAIN);
}

/** "+919876543210" → "+91 98765 43210"; other countries are left grouped by 3–4. */
export function formatPhone(e164: string | null | undefined): string {
  if (!e164) return '';
  if (/^\+91[6-9]\d{9}$/.test(e164)) return `+91 ${e164.slice(3, 8)} ${e164.slice(8)}`;
  return e164;
}

/** wa.me wants digits only, no plus. */
export function waNumber(e164: string): string {
  return e164.replace(/\D/g, '');
}
