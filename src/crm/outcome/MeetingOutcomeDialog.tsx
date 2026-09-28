'use client';
import React, { useState } from 'react';
import { toast } from 'sonner';
import { CalendarX2, Clock, ThumbsDown, ThumbsUp } from 'lucide-react';
import type { LeadTask, LostReason } from '@/lib/database.types';
import { Modal, Btn } from '../ui/Modal';
import { ChoiceChips, Field, inputClass } from '../ui/kit';
import { DateTimeField } from '../ui/DateTimeField';
import { QuoteFields, emptyQuote, quoteErrors, quotePayload, type QuoteDraft } from '../ui/QuoteFields';
import { asJson, rpc } from '../lib/api';
import { friendlyError } from '../lib/errors';
import { LOST_REASON_LABEL, MEETING_MODE_LABEL, NOT_INTERESTED_REASONS } from '../lib/labels';
import { formatDateTime } from '../lib/time';

type Result = 'held_positive' | 'held_needs_time' | 'no_show' | 'not_interested';

export function MeetingOutcomeDialog({ task, brand, onClose, onSaved }: {
  task: Pick<LeadTask, 'id' | 'lead_id' | 'meeting_mode' | 'location' | 'due_at'>;
  brand: string;
  onClose: () => void;
  onSaved: (leadId: string) => void;
}) {
  const [result, setResult] = useState<Result | null>(null);
  const [sendQuote, setSendQuote] = useState(true);
  const [quote, setQuote] = useState<QuoteDraft>(emptyQuote());
  const [due, setDue] = useState<string | null>(null);
  const [reason, setReason] = useState<LostReason | null>(null);
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const needsDue = (result === 'held_positive' && !sendQuote) || result === 'held_needs_time' || result === 'no_show';

  async function save(e?: React.FormEvent) {
    e?.preventDefault();
    const err: Record<string, string> = {};
    if (!result) err.result = 'Choose how the meeting went.';
    if (needsDue && !due) err.due = 'Pick a date and time.';
    if (result === 'held_positive' && sendQuote) Object.assign(err, quoteErrors(quote, true));
    if (result === 'not_interested' && !reason) err.reason = 'Choose a reason.';
    setErrors(err);
    if (Object.keys(err).length || busy) return;
    const payload: Record<string, unknown> = { result, note: note.trim() || null };
    if (needsDue) payload.due_at = due;
    if (result === 'held_positive' && sendQuote) payload.quote = quotePayload(quote);
    if (result === 'not_interested') payload.lost_reason = reason;
    setBusy(true);
    try {
      await rpc('complete_meeting', { p_task: task.id, payload: asJson(payload) });
      toast.success('Meeting outcome saved.');
      onSaved(task.lead_id);
    } catch (e2) {
      toast.error(friendlyError(e2));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open
      onOpenChange={(o) => { if (!o) onClose(); }}
      title={`Meeting outcome · ${brand}`}
      description={`${task.meeting_mode ? MEETING_MODE_LABEL[task.meeting_mode] : 'Meeting'} · ${formatDateTime(task.due_at)}`}
      onSubmit={save}
      footer={
        <>
          <Btn variant="secondary" onClick={onClose} disabled={busy}>Cancel</Btn>
          <Btn type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save'}</Btn>
        </>
      }
    >
      <div className="space-y-5">
        <ChoiceChips
          label="How did it go?"
          value={result}
          onChange={(v) => { setResult(v); setErrors({}); }}
          options={[
            { value: 'held_positive', label: 'Went well', hint: 'Send the quotation', icon: <ThumbsUp className="size-4" />, tone: 'success' },
            { value: 'held_needs_time', label: 'Needs time', hint: 'Schedule a follow-up', icon: <Clock className="size-4" /> },
            { value: 'no_show', label: 'Client didn’t show', hint: 'Reschedule', icon: <CalendarX2 className="size-4" /> },
            { value: 'not_interested', label: 'Not interested', icon: <ThumbsDown className="size-4" />, tone: 'danger' },
          ]}
        />
        {errors.result ? <p className="text-xs font-medium text-destructive">{errors.result}</p> : null}

        {result === 'held_positive' ? (
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={sendQuote} onChange={(e) => setSendQuote(e.target.checked)} className="size-4 accent-[var(--primary)]" />
              Record the quotation now
            </label>
            {sendQuote ? <QuoteFields value={quote} onChange={setQuote} errors={errors} /> : null}
          </div>
        ) : null}

        {needsDue ? (
          <DateTimeField
            label={result === 'no_show' ? 'New meeting time' : 'Follow up on'}
            value={due}
            onChange={setDue}
            error={errors.due}
          />
        ) : null}
        {result === 'no_show' ? (
          <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">After two no-shows the lead moves to Nurture automatically.</p>
        ) : null}

        {result === 'not_interested' ? (
          <div className="space-y-1">
            <ChoiceChips label="Reason" value={reason} onChange={setReason}
              options={NOT_INTERESTED_REASONS.map((r) => ({ value: r, label: LOST_REASON_LABEL[r] }))} />
            {errors.reason ? <p className="text-xs font-medium text-destructive">{errors.reason}</p> : null}
          </div>
        ) : null}

        {result ? (
          <Field label="Meeting notes (optional)">
            {({ id }) => (
              <textarea id={id} rows={3} value={note} maxLength={2000} onChange={(e) => setNote(e.target.value)} className={inputClass} />
            )}
          </Field>
        ) : null}
      </div>
    </Modal>
  );
}
