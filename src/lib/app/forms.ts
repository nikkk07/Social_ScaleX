// ─────────────────────────────────────────────────────────────────────
// Sign-up / sign-in / Instagram-search input rules, shared by the browser
// (instant feedback) and the API (the real check). Pure: unit-tested in
// forms.test.ts.
// ─────────────────────────────────────────────────────────────────────
import { z } from 'zod';

/**
 * Indian mobile → "+91XXXXXXXXXX", or null. Accepts what people actually
 * type: spaces, dashes, a leading 0, +91 or 91 in front.
 */
export function normalizeMobile(raw: string): string | null {
  let d = raw.replace(/[^\d]/g, '');
  if (d.length === 12 && d.startsWith('91')) d = d.slice(2);
  else if (d.length === 11 && d.startsWith('0')) d = d.slice(1);
  return /^[6-9]\d{9}$/.test(d) ? `+91${d}` : null;
}

/** "+919876543210" → "98765 43210" for display. */
export function prettyMobile(e164: string): string {
  const d = e164.replace(/^\+91/, '');
  return d.length === 10 ? `${d.slice(0, 5)} ${d.slice(5)}` : e164;
}

export const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s.trim());

const mobile = z.string().transform((v, ctx) => {
  const n = normalizeMobile(v);
  if (!n) ctx.addIssue({ code: 'custom', message: 'Enter a valid 10-digit Indian mobile number.' });
  return n ?? '';
});

const name = z.string().trim().min(2, 'Enter your name.').max(80, 'Name is too long.');

export const ProfileInput = z
  .object({
    name,
    mobile,
    whatsappSame: z.boolean(),
    whatsapp: z.string().optional(),
  })
  .transform((v, ctx) => {
    const wa = v.whatsappSame ? v.mobile : normalizeMobile(v.whatsapp ?? '');
    if (!wa) ctx.addIssue({ code: 'custom', path: ['whatsapp'], message: 'Enter a valid WhatsApp number.' });
    return { name: v.name, mobile: v.mobile, whatsapp: wa ?? '' };
  });
export type ProfileInput = z.input<typeof ProfileInput>;

export const RegisterInput = z
  .object({
    name,
    mobile,
    whatsappSame: z.boolean(),
    whatsapp: z.string().optional(),
    email: z.string().trim().toLowerCase().max(200).refine(isEmail, 'Enter a valid email address.'),
    password: z.string().min(8, 'Use at least 8 characters.').max(72, 'Use at most 72 characters.'),
    confirm: z.string(),
  })
  .superRefine((v, ctx) => {
    if (v.password !== v.confirm) ctx.addIssue({ code: 'custom', path: ['confirm'], message: 'Passwords don’t match.' });
  })
  .transform((v, ctx) => {
    const wa = v.whatsappSame ? v.mobile : normalizeMobile(v.whatsapp ?? '');
    if (!wa) ctx.addIssue({ code: 'custom', path: ['whatsapp'], message: 'Enter a valid WhatsApp number.' });
    return { name: v.name, mobile: v.mobile, whatsapp: wa ?? '', email: v.email, password: v.password };
  });
export type RegisterInput = z.input<typeof RegisterInput>;

export const LoginInput = z.object({
  identifier: z.string().trim().min(3).max(200),
  password: z.string().min(1).max(200),
});

/** First message per field, for showing under each input. */
export function fieldErrors(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of err.issues) {
    const k = String(i.path[0] ?? 'form');
    if (!out[k]) out[k] = i.message;
  }
  return out;
}

/**
 * What the customer typed into the Instagram search → a clean username, or
 * null. Accepts "@name", "name", "Name ", and profile links such as
 * instagram.com/name, https://www.instagram.com/name/?igsh=… or instagr.am/name.
 */
export function parseInstagramInput(raw: string): string | null {
  let s = raw.trim();
  const link = /(?:instagram\.com|instagr\.am)\/([A-Za-z0-9._]{1,30})/i.exec(s);
  if (link?.[1]) s = link[1];
  s = s.replace(/^@+/, '').toLowerCase();
  if (!/^[a-z0-9._]{1,30}$/.test(s)) return null;
  if (s.startsWith('.') || s.endsWith('.') || s.includes('..')) return null;
  const reserved = ['p', 'reel', 'reels', 'stories', 'explore', 'accounts', 'direct', 'tv'];
  return reserved.includes(s) ? null : s;
}
