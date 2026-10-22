import 'server-only';
// ─────────────────────────────────────────────────────────────────────
// The comment-to-DM engine: one Instagram comment in, at most one DM and
// one public reply out. Everything that can go wrong in real life is
// handled here and written to ig_events so the customer can see why.
// ─────────────────────────────────────────────────────────────────────
import { db, decrypt, isPaid } from '@/lib/server/appServer';
import { friendly, IgError, privateReply, replyToComment } from '@/lib/server/instagram';
import { personalize, pickReply, pickRule } from '@/lib/app/rules';
import type { IgAccountRow, IgAutomationRow, IgBillingRow } from '@/lib/server/appTypes';

export interface CommentEvent {
  igUserId: string;
  commentId: string;
  parentId: string | null;
  text: string;
  fromId: string | null;
  fromUsername: string | null;
  mediaId: string | null;
}

/** Pulls comment events out of a webhook body, tolerating both payload spellings. */
export function extractComments(body: unknown): CommentEvent[] {
  const out: CommentEvent[] = [];
  if (!body || typeof body !== 'object') return out;
  const b = body as { object?: string; entry?: unknown[] };
  if (b.object !== 'instagram' || !Array.isArray(b.entry)) return out;
  for (const e of b.entry) {
    const entry = e as { id?: string | number; changes?: unknown[] };
    if (!entry?.id || !Array.isArray(entry.changes)) continue;
    for (const c of entry.changes) {
      const ch = c as { field?: string; value?: Record<string, unknown> };
      if (ch?.field !== 'comments' || !ch.value) continue;
      const v = ch.value;
      const id = (v.id ?? v.comment_id) as string | number | undefined;
      if (!id) continue;
      const from = (v.from ?? {}) as { id?: string | number; username?: string };
      const media = (v.media ?? {}) as { id?: string | number };
      out.push({
        igUserId: String(entry.id),
        commentId: String(id),
        parentId: v.parent_id ? String(v.parent_id) : null,
        text: typeof v.text === 'string' ? v.text : '',
        fromId: from.id ? String(from.id) : null,
        fromUsername: typeof from.username === 'string' ? from.username : null,
        mediaId: media.id ? String(media.id) : null,
      });
    }
  }
  return out;
}

const RECENT_WINDOW_MS = 24 * 60 * 60_000;

async function log(eventId: number, patch: Record<string, unknown>): Promise<void> {
  await db().from('ig_events').update(patch).eq('id', eventId);
}

export async function handleComment(ev: CommentEvent): Promise<void> {
  const sb = db();
  const { data: acct } = await sb.from('ig_accounts').select('*').eq('ig_user_id', ev.igUserId).maybeSingle();
  const account = acct as IgAccountRow | null;
  if (!account) return; // not one of ours (or removed)

  // Our own comments, including the public replies we post: never answer
  // them, or the account would reply to itself forever.
  if ((ev.fromId && ev.fromId === account.ig_user_id) || (ev.fromUsername && ev.fromUsername.toLowerCase() === account.username.toLowerCase())) return;

  // Dedupe first: Meta retries the same comment for up to 36 hours.
  const { data: inserted } = await sb
    .from('ig_events')
    .upsert(
      {
        account_id: account.id,
        comment_id: ev.commentId,
        media_id: ev.mediaId,
        commenter_id: ev.fromId,
        commenter_username: ev.fromUsername,
        comment_text: ev.text.slice(0, 500),
      },
      { onConflict: 'account_id,comment_id', ignoreDuplicates: true },
    )
    .select('id')
    .maybeSingle();
  const eventId = (inserted as { id: number } | null)?.id;
  if (!eventId) return; // already handled

  if (ev.parentId) return void (await log(eventId, { status: 'skipped', detail: 'Reply inside a thread, not a new comment.' }));
  if (account.status !== 'connected' || !account.token_enc) {
    return void (await log(eventId, { status: 'skipped', detail: 'Instagram is not connected. Reconnect the account.' }));
  }

  const { data: bill } = await sb.from('ig_billing').select('paid_until').eq('account_id', account.id).maybeSingle();
  if (!isPaid((bill as Pick<IgBillingRow, 'paid_until'> | null)?.paid_until)) {
    return void (await log(eventId, { status: 'skipped', detail: 'Plan not active. Pay ₹99 to switch the automation on.' }));
  }

  const { data: rulesData } = await sb.from('ig_automations').select('*').eq('account_id', account.id).eq('is_enabled', true);
  const rule = pickRule((rulesData ?? []) as IgAutomationRow[], ev.mediaId, ev.text);
  if (!rule) return void (await log(eventId, { status: 'skipped', detail: 'No automation matched this comment.' }));

  // One DM per person per automation per post per day: stops someone who
  // comments the keyword ten times from getting ten DMs.
  if (ev.fromId) {
    const since = new Date(Date.now() - RECENT_WINDOW_MS).toISOString();
    const { count } = await sb
      .from('ig_events')
      .select('id', { count: 'exact', head: true })
      .eq('account_id', account.id)
      .eq('commenter_id', ev.fromId)
      .eq('automation_id', rule.id)
      .eq('dm_sent', true)
      .gte('created_at', since)
      .match(ev.mediaId ? { media_id: ev.mediaId } : {});
    if ((count ?? 0) > 0) {
      return void (await log(eventId, { automation_id: rule.id, status: 'skipped', detail: 'Already sent this person a DM for this post today.' }));
    }
  }

  let token: string;
  try {
    token = decrypt(account.token_enc);
  } catch {
    await sb.from('ig_accounts').update({ status: 'reconnect', last_error: 'Stored access could not be read. Reconnect.' }).eq('id', account.id);
    return void (await log(eventId, { automation_id: rule.id, status: 'failed', detail: 'Reconnect Instagram.' }));
  }

  let dmSent = false;
  let replySent = false;
  const problems: string[] = [];

  try {
    await privateReply(account.ig_user_id, token, ev.commentId, personalize(rule.dm_text, ev.fromUsername));
    dmSent = true;
  } catch (e) {
    problems.push(`DM: ${friendly(e)}`);
    if (e instanceof IgError && e.needsReconnect) {
      await sb.from('ig_accounts').update({ status: 'reconnect', last_error: friendly(e) }).eq('id', account.id);
      return void (await log(eventId, { automation_id: rule.id, status: 'failed', detail: problems.join(' ') }));
    }
  }

  const replyTemplate = pickReply(rule.public_replies, ev.commentId);
  if (replyTemplate) {
    try {
      await replyToComment(token, ev.commentId, personalize(replyTemplate, ev.fromUsername));
      replySent = true;
    } catch (e) {
      problems.push(`Public reply: ${friendly(e)}`);
    }
  }

  const status = dmSent ? 'sent' : 'failed';
  await log(eventId, {
    automation_id: rule.id,
    status,
    dm_sent: dmSent,
    reply_sent: replySent,
    detail: problems.length ? problems.join(' ') : null,
  });
}
