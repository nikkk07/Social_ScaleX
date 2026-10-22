// ─────────────────────────────────────────────────────────────────────
// Comment-to-DM rules: shared by the builder (browser), the API (validation)
// and the webhook engine (matching). Pure functions only, no I/O, so the
// matching behaviour is unit-tested in rules.test.ts.
// ─────────────────────────────────────────────────────────────────────
import { z } from 'zod';

export const LIMITS = {
  keywords: 30,
  keywordLength: 40,
  replies: 5,
  replyLength: 300,
  dmLength: 1000,
  media: 100,
  nameLength: 80,
} as const;

const trimmed = (max: number) => z.string().trim().min(1).max(max);

/** What the builder sends to POST/PATCH. The server re-validates everything. */
export const AutomationInput = z
  .object({
    name: trimmed(LIMITS.nameLength),
    mediaScope: z.enum(['all', 'selected']),
    media: z
      .array(
        z.object({
          id: z.string().regex(/^\d{1,30}$/),
          thumb: z.string().url().max(2000).nullable(),
          caption: z.string().max(200).nullable(),
          permalink: z.string().url().max(500).nullable(),
        }),
      )
      .max(LIMITS.media),
    triggerMode: z.enum(['any', 'keywords']),
    keywords: z.array(trimmed(LIMITS.keywordLength)).max(LIMITS.keywords),
    publicReplies: z.array(trimmed(LIMITS.replyLength)).max(LIMITS.replies),
    dmText: trimmed(LIMITS.dmLength),
    isEnabled: z.boolean().optional(),
  })
  .superRefine((v, ctx) => {
    if (v.mediaScope === 'selected' && v.media.length === 0) {
      ctx.addIssue({ code: 'custom', path: ['media'], message: 'Pick at least one post or Reel, or choose All posts.' });
    }
    if (v.triggerMode === 'keywords' && v.keywords.length === 0) {
      ctx.addIssue({ code: 'custom', path: ['keywords'], message: 'Add at least one keyword, or choose Any comment.' });
    }
  });
export type AutomationInput = z.infer<typeof AutomationInput>;

/** Lowercase, Unicode-normalised, punctuation turned into spaces. */
export function normalize(s: string): string {
  return s
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\p{M}\p{Extended_Pictographic}]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

/** Keywords as the user typed them, cleaned and de-duplicated (case-insensitive). */
export function cleanKeywords(list: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of list) {
    const k = raw.trim().replace(/\s+/g, ' ');
    const n = normalize(k);
    if (!k || seen.has(n || k)) continue;
    seen.add(n || k);
    out.push(k);
  }
  return out;
}

/**
 * Does the comment contain the keyword?
 * Words match whole words ("price" matches "Price?" and "price pls", not
 * "priceless"). A keyword with no letters or digits (an emoji) matches
 * anywhere in the comment.
 */
export function matchesKeyword(comment: string, keyword: string): boolean {
  const k = normalize(keyword);
  if (!k) {
    const raw = keyword.trim();
    return raw.length > 0 && comment.includes(raw);
  }
  const hasWordChar = /[\p{L}\p{N}]/u.test(k);
  const c = normalize(comment);
  if (!hasWordChar) return c.includes(k);
  return ` ${c} `.includes(` ${k} `);
}

export interface RuleForMatch {
  id: string;
  media_scope: 'all' | 'selected';
  media_ids: string[];
  trigger_mode: 'any' | 'keywords';
  keywords: string[];
  is_enabled: boolean;
  created_at: string;
}

/**
 * Picks the ONE automation that answers a comment, or null.
 * Priority: a rule for this exact post beats an all-posts rule; within that,
 * a keyword rule beats an any-comment rule; then the oldest rule wins.
 * Only one DM can be sent per comment (Meta's rule), so only one rule fires.
 */
export function pickRule<T extends RuleForMatch>(rules: T[], mediaId: string | null, text: string): T | null {
  const candidates = rules.filter((r) => {
    if (!r.is_enabled) return false;
    if (r.media_scope === 'selected' && (!mediaId || !r.media_ids.includes(mediaId))) return false;
    if (r.trigger_mode === 'keywords') return r.keywords.some((k) => matchesKeyword(text, k));
    return true;
  });
  candidates.sort((a, b) => {
    const s = Number(b.media_scope === 'selected') - Number(a.media_scope === 'selected');
    if (s) return s;
    const t = Number(b.trigger_mode === 'keywords') - Number(a.trigger_mode === 'keywords');
    if (t) return t;
    return a.created_at.localeCompare(b.created_at);
  });
  return candidates[0] ?? null;
}

/** Fills {username} in a reply or DM. Unknown placeholders are left alone. */
export function personalize(template: string, username: string | null): string {
  const u = username ? username.replace(/^@/, '') : '';
  return template.replace(/\{username\}/gi, u ? `@${u}` : 'there').trim();
}

/** Picks one of the public replies so they don't all look identical. */
export function pickReply(replies: string[], seed: string): string | null {
  if (!replies.length) return null;
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return replies[h % replies.length] ?? null;
}

export const PRICE_PAISE = 9900;
export const ONE_TIME_DAYS = 30;
