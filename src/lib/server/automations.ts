import 'server-only';
import { AutomationInput, cleanKeywords } from '@/lib/app/rules';
import { HttpError } from '@/lib/server/appServer';

/** Validates builder input and turns it into an ig_automations row. */
export function toRow(body: unknown) {
  const parsed = AutomationInput.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    throw new HttpError(400, 'invalid_input', first?.message ?? 'Please check the form.');
  }
  const v = parsed.data;
  const keywords = v.triggerMode === 'keywords' ? cleanKeywords(v.keywords) : [];
  if (v.triggerMode === 'keywords' && !keywords.length) throw new HttpError(400, 'invalid_input', 'Add at least one keyword.');
  const media = v.mediaScope === 'selected' ? v.media : [];
  const replies = [...new Set(v.publicReplies.map((r) => r.trim()).filter(Boolean))];
  return {
    name: v.name,
    media_scope: v.mediaScope,
    media_ids: media.map((m) => m.id),
    media_meta: media,
    trigger_mode: v.triggerMode,
    keywords,
    public_replies: replies,
    dm_text: v.dmText,
    ...(v.isEnabled === undefined ? {} : { is_enabled: v.isEnabled }),
  };
}

/** A soft cap that stops runaway scripts, far above any real use. */
export const MAX_AUTOMATIONS_PER_ACCOUNT = 200;
