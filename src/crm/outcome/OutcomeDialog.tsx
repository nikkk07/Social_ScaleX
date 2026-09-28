'use client';
// The outcome pop-up. Three short steps, only the fields each answer needs:
//   1. Did you connect?        (call)   /  What happened?  (WhatsApp)
//   2. What did the client say?
//   3. Next step details        (time, meeting, quote, reason…)
// The server (log_outcome) applies the pipeline rules and schedules the
// follow-up; this component only collects valid input.
import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  Ban, CalendarClock, CalendarDays, CheckCircle2, Clock, FileText, HelpCircle, Languages, MessageCircle,
  PhoneMissed, PhoneOff, PhoneOutgoing, PhoneForwarded, Send, ThumbsDown, ThumbsUp, UserX, WifiOff, XCircle,
} from 'lucide-react';
import type { AttemptResult, ConnectOutcome, LostReason, MeetingMode } from '@/lib/database.types';
import { normalizePhone, formatPhone } from '@/lib/crm/normalize';
import { Modal, Btn } from '../ui/Modal';
import { ChoiceChips, Field, inputClass } from '../ui/kit';
import { DateTimeField } from '../ui/DateTimeField';
import { QuoteFields, emptyQuote, quoteErrors, quotePayload, type QuoteDraft } from '../ui/QuoteFields';
import { asJson, rpc } from '../lib/api';
import { friendlyError } from '../lib/errors';
import {
  LOST_REASON_LABEL, MEETING_MODE_LABEL, NOT_INTERESTED_REASONS, QUOTE_REJECT_REASONS, STAGE_LABEL,
} from '../lib/labels';
import { formatDateTime, relative } from '../lib/time';
import { useSettings, type PendingAttempt } from '../data/hooks';

type NextStep = 'callback' | 'meeting' | 'send_details' | 'send_quote';

const NOT_CONNECTED: { value: AttemptResult; label: string; hint: string; icon: React.ReactNode }[] = [
  { value: 'no_answer', label: 'No answer', hint: 'Rang, nobody picked up', icon: <PhoneMissed className="size-4" /> },
  { value: 'busy', label: 'Busy', hint: 'Line busy / on another call', icon: <PhoneForwarded className="size-4" /> },
  { value: 'switched_off', label: 'Switched off', hint: 'Phone is off', icon: <PhoneOff className="size-4" /> },
  { value: 'not_reachable', label: 'Not reachable', hint: 'Out of coverage / network error', icon: <WifiOff className="size-4" /> },
  { value: 'rejected', label: 'Call cut', hint: 'They declined the call', icon: <XCircle className="size-4" /> },
  { value: 'wrong_number', label: 'Wrong number', hint: 'Marks this number as wrong', icon: <UserX className="size-4" /> },
];

export function OutcomeDialog({ attempt, onClose, onSaved, onDiscarded }: {
  attempt: PendingAttempt;
  onClose: () => void;
  onSaved: (leadId: string) => void;
  onDiscarded: (leadId: string) => void;
}) {
  const settings = useSettings().data;
  const stage = attempt.lead?.stage ?? 'new';
  const quoteStage = stage === 'quotation' || stage === 'negotiation';
  const isWa = attempt.channel === 'whatsapp';

  const [connected, setConnected] = useState<boolean | null>(null);
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [outcome, setOutcome] = useState<ConnectOutcome | null>(null);
  const [step, setStep] = useState<NextStep | null>(null);
  const [due, setDue] = useState<string | null>(null);
  const [mode, setMode] = useState<MeetingMode>('video');
  const [location, setLocation] = useState('');
  const [quote, setQuote] = useState<QuoteDraft>(emptyQuote());
  const [reason, setReason] = useState<LostReason | null>(null);
  const [competitor, setCompetitor] = useState('');
  const [contractEnd, setContractEnd] = useState('');
  const [newContact, setNewContact] = useState({ name: '', phone: '', designation: '' });
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const setDueClear = (v: string | null) => { setDue(v); setErrors((e) => { const { due: _drop, ...rest } = e; void _drop; return rest; }); };
  const [busy, setBusy] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const retryHint = useMemo(() => {
    if (!result || !settings) return null;
    const m =
      result === 'no_answer' ? settings.retry_no_answer_minutes
        : result === 'busy' ? settings.retry_busy_minutes
          : result === 'rejected' ? settings.retry_rejected_minutes
            : result === 'wrong_number' ? null
              : settings.retry_unreachable_minutes;
    if (m == null) return 'We’ll mark this number as wrong. If it was the only number, the lead closes as “no valid contact”.';
    const txt = m < 60 ? `${m} minutes` : m % 60 === 0 ? `${m / 60} hour${m === 60 ? '' : 's'}` : `${Math.round(m / 60)} hours`;
    return `A retry call will be scheduled in ${txt}. After ${settings.nurture_after_misses} missed calls in a row the lead moves to Nurture.`;
  }, [result, settings]);

  // Which "connected" answers make sense for this lead right now.
  const outcomeOptions = useMemo(() => {
    const quoteOpts = [
      { value: 'quote_accepted' as const, label: 'Accepted the quote', hint: 'Mark as won', icon: <CheckCircle2 className="size-4" />, tone: 'success' as const },
      { value: 'quote_revision' as const, label: 'Wants a revised quote', icon: <FileText className="size-4" /> },
      { value: 'still_deciding' as const, label: 'Still deciding', hint: 'Follow up later', icon: <Clock className="size-4" /> },
      { value: 'quote_rejected' as const, label: 'Rejected the quote', icon: <ThumbsDown className="size-4" />, tone: 'danger' as const },
    ];
    const general = [
      { value: 'interested' as const, label: 'Interested', hint: 'Book the next step', icon: <ThumbsUp className="size-4" />, tone: 'success' as const },
      { value: 'call_later' as const, label: 'Call me later', hint: 'Undecided — pick a time', icon: <CalendarClock className="size-4" /> },
      { value: 'not_interested' as const, label: 'Not interested', hint: 'Record the reason', icon: <ThumbsDown className="size-4" />, tone: 'danger' as const },
      { value: 'wrong_person' as const, label: 'Wrong person', hint: 'Add the right contact', icon: <UserX className="size-4" /> },
      { value: 'language_barrier' as const, label: 'Language barrier', icon: <Languages className="size-4" /> },
      { value: 'call_dropped' as const, label: 'Call dropped', hint: 'Call back in 10 min', icon: <PhoneOff className="size-4" /> },
      { value: 'do_not_call' as const, label: 'Do not contact again', hint: 'Locks the lead', icon: <Ban className="size-4" />, tone: 'danger' as const },
    ];
    return quoteStage ? [...quoteOpts, ...general.filter((g) => g.value !== 'interested')] : general;
  }, [quoteStage]);

  const needsDue =
    (outcome === 'interested' && (step === 'callback' || step === 'meeting' || step === 'send_details'))
    || outcome === 'call_later' || outcome === 'still_deciding' || (isWa && result === 'wa_sent');

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!result) e.result = isWa ? 'Choose what happened.' : 'Choose what happened on the call.';
    const talked = result === 'connected' || result === 'wa_replied';
    if (talked && !outcome) e.outcome = 'Choose what the client said.';
    if (outcome === 'interested' && !step) e.step = 'Choose the next step.';
    if (needsDue && !due && !(isWa && result === 'wa_sent')) e.due = 'Pick a date and time.';
    if (due && new Date(due).getTime() < Date.now() - 60_000) e.due = 'That time is in the past.';
    if (outcome === 'interested' && step === 'meeting' && mode !== 'phone' && location.length > 500) e.location = 'Too long.';
    if (outcome === 'interested' && step === 'send_quote') Object.assign(e, prefix('quote', quoteErrors(quote, true)));
    if (outcome === 'quote_revision') Object.assign(e, prefix('quote', quoteErrors(quote, false)));
    if ((outcome === 'not_interested' || outcome === 'quote_rejected') && !reason) e.reason = 'Choose a reason.';
    if (outcome === 'wrong_person' && newContact.phone.trim() && !normalizePhone(newContact.phone)) e.ncPhone = 'Enter a valid number.';
    if (note.length > 2000) e.note = 'Notes can be up to 2,000 characters.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function save(ev?: React.FormEvent) {
    ev?.preventDefault();
    if (busy || !validate()) return;
    const payload: Record<string, unknown> = { result, note: note.trim() || null };
    const talked = result === 'connected' || result === 'wa_replied';
    if (talked) payload.outcome = outcome;
    if (outcome === 'interested') payload.next_step = step;
    if (due) payload.due_at = due;
    if (outcome === 'interested' && step === 'meeting') {
      payload.meeting_mode = mode;
      payload.location = location.trim() || null;
    }
    if ((outcome === 'interested' && step === 'send_quote') || (outcome === 'quote_revision' && quote.amount.trim())) {
      payload.quote = quotePayload(quote);
    }
    if (outcome === 'not_interested' || outcome === 'quote_rejected') {
      payload.lost_reason = reason;
      if (reason === 'using_other_agency') {
        payload.competitor_name = competitor.trim() || null;
        payload.competitor_contract_end = contractEnd || null;
      }
    }
    if (outcome === 'wrong_person' && newContact.name.trim()) {
      payload.new_contact = {
        name: newContact.name.trim(),
        phone: newContact.phone.trim() || null,
        designation: newContact.designation.trim() || null,
      };
    }
    setBusy(true);
    try {
      const res = (await rpc('log_outcome', { p_attempt: attempt.id, payload: asJson(payload) })) as { stage?: string } | null;
      const st = res?.stage as keyof typeof STAGE_LABEL | undefined;
      toast.success(`Saved${st ? ` · ${attempt.lead?.brand_name ?? 'Lead'} is now “${STAGE_LABEL[st] ?? st}”` : ''}`);
      onSaved(attempt.lead_id);
    } catch (e) {
      toast.error(friendlyError(e));
    } finally {
      setBusy(false);
    }
  }

  async function discard() {
    setBusy(true);
    try {
      await rpc('discard_attempt', { p_attempt: attempt.id });
      toast.message('Removed — nothing was logged.');
      onDiscarded(attempt.lead_id);
    } catch (e) {
      toast.error(friendlyError(e));
    } finally {
      setBusy(false);
    }
  }

  const brand = attempt.lead?.brand_name ?? 'Lead';
  const talked = result === 'connected' || result === 'wa_replied';

  return (
    <Modal
      open
      onOpenChange={(o) => { if (!o) onClose(); }}
      title={isWa ? `WhatsApp · ${brand}` : `How did the call go? · ${brand}`}
      description={`${formatPhone(attempt.phone_e164)} · started ${relative(attempt.started_at)} · ${STAGE_LABEL[stage]}`}
      closeLabel="Log later"
      onSubmit={save}
      footer={
        confirmDiscard ? (
          <>
            <span className="mr-auto text-sm text-muted-foreground">Remove this attempt without logging?</span>
            <Btn variant="secondary" onClick={() => setConfirmDiscard(false)} disabled={busy}>Keep</Btn>
            <Btn variant="danger" onClick={discard} disabled={busy}>Remove</Btn>
          </>
        ) : (
          <>
            <button type="button" onClick={() => setConfirmDiscard(true)} className="mr-auto text-xs text-muted-foreground underline-offset-4 hover:underline">
              I didn’t {isWa ? 'message' : 'call'}
            </button>
            <Btn variant="secondary" onClick={onClose} disabled={busy}>Log later</Btn>
            <Btn type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save outcome'}</Btn>
          </>
        )
      }
    >
      <div className="space-y-5">
        {/* Step 1 */}
        {isWa ? (
          <ChoiceChips
            label="What happened?"
            value={result}
            onChange={(v) => { setResult(v); setOutcome(null); setErrors({}); }}
            options={[
              { value: 'wa_sent', label: 'Message sent', hint: 'Waiting for a reply', icon: <Send className="size-4" /> },
              { value: 'wa_replied', label: 'Client replied', hint: 'Log what they said', icon: <MessageCircle className="size-4" /> },
              { value: 'not_on_whatsapp', label: 'Not on WhatsApp', hint: 'Flags this number', icon: <XCircle className="size-4" /> },
            ]}
          />
        ) : (
          <fieldset>
            <legend className="mb-2 text-sm font-medium">Did you speak to them?</legend>
            <div className="grid grid-cols-2 gap-2">
              {[
                { v: true, label: 'Yes, we spoke', icon: <PhoneOutgoing className="size-5" /> },
                { v: false, label: 'No, didn’t connect', icon: <PhoneMissed className="size-5" /> },
              ].map((o) => (
                <button
                  key={String(o.v)}
                  type="button"
                  aria-pressed={connected === o.v}
                  onClick={() => {
                    setConnected(o.v);
                    setResult(o.v ? 'connected' : null);
                    setOutcome(null);
                    setErrors({});
                  }}
                  className={`flex min-h-14 items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition-colors ${
                    connected === o.v ? 'border-primary bg-accent text-accent-foreground' : 'border-border hover:bg-muted'
                  }`}
                >
                  {o.icon}{o.label}
                </button>
              ))}
            </div>
          </fieldset>
        )}
        {errors.result ? <p className="text-xs font-medium text-destructive">{errors.result}</p> : null}

        {/* Not connected */}
        {!isWa && connected === false ? (
          <div className="space-y-2">
            <ChoiceChips label="What happened?" value={result} onChange={setResult} options={NOT_CONNECTED} />
            {retryHint ? <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">{retryHint}</p> : null}
          </div>
        ) : null}

        {/* WhatsApp sent → follow-up time */}
        {isWa && result === 'wa_sent' ? (
          <DateTimeField label="Check for a reply at" value={due} onChange={setDueClear} error={errors.due} required={false}
            hint="Leave empty for tomorrow at this time. India time (IST)." />
        ) : null}

        {/* Connected → what did they say */}
        {talked ? (
          <div className="space-y-2">
            <ChoiceChips
              label="What did the client say?"
              value={outcome}
              onChange={(v) => { setOutcome(v); setStep(null); setReason(null); setErrors({}); }}
              options={outcomeOptions}
            />
            {errors.outcome ? <p className="text-xs font-medium text-destructive">{errors.outcome}</p> : null}
          </div>
        ) : null}

        {/* Interested → next step */}
        {talked && outcome === 'interested' ? (
          <div className="space-y-2">
            <ChoiceChips
              label="Next step"
              value={step}
              onChange={(v) => { setStep(v); setErrors({}); }}
              options={[
                { value: 'callback', label: 'Schedule a call-back', icon: <CalendarClock className="size-4" /> },
                { value: 'meeting', label: 'Book a meeting', icon: <CalendarDays className="size-4" /> },
                { value: 'send_details', label: 'Send details, then follow up', icon: <Send className="size-4" /> },
                { value: 'send_quote', label: 'Send a quotation', icon: <FileText className="size-4" /> },
              ]}
            />
            {errors.step ? <p className="text-xs font-medium text-destructive">{errors.step}</p> : null}
          </div>
        ) : null}

        {needsDue && !(isWa && result === 'wa_sent') ? (
          <DateTimeField
            label={
              step === 'meeting' ? 'Meeting time'
                : step === 'send_details' ? 'Follow up on'
                  : outcome === 'still_deciding' ? 'Follow up on'
                    : 'Call back at'
            }
            value={due}
            onChange={setDueClear}
            error={errors.due}
          />
        ) : null}

        {talked && outcome === 'interested' && step === 'meeting' ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Meeting type">
              {({ id }) => (
                <select id={id} value={mode} onChange={(e) => setMode(e.target.value as MeetingMode)} className={inputClass}>
                  {(Object.keys(MEETING_MODE_LABEL) as MeetingMode[]).map((m) => (
                    <option key={m} value={m}>{MEETING_MODE_LABEL[m]}</option>
                  ))}
                </select>
              )}
            </Field>
            <Field label={mode === 'in_person' ? 'Address' : mode === 'video' ? 'Meeting link' : 'Notes'} error={errors.location}>
              {({ id, describedBy, invalid }) => (
                <input id={id} value={location} onChange={(e) => setLocation(e.target.value)} className={inputClass}
                  placeholder={mode === 'video' ? 'https://meet.google.com/…' : ''} aria-describedby={describedBy} aria-invalid={invalid || undefined} />
              )}
            </Field>
          </div>
        ) : null}

        {talked && ((outcome === 'interested' && step === 'send_quote') || outcome === 'quote_revision') ? (
          <div className="space-y-2">
            {outcome === 'quote_revision' ? (
              <p className="text-xs text-muted-foreground">Enter the revised amount to send v2 now, or leave it empty to follow up tomorrow.</p>
            ) : null}
            <QuoteFields value={quote} onChange={setQuote} errors={unprefix('quote', errors)} amountRequired={outcome !== 'quote_revision'} />
          </div>
        ) : null}

        {talked && (outcome === 'not_interested' || outcome === 'quote_rejected') ? (
          <div className="space-y-3">
            <ChoiceChips
              label="Reason"
              value={reason}
              onChange={setReason}
              options={(outcome === 'quote_rejected' ? QUOTE_REJECT_REASONS : NOT_INTERESTED_REASONS).map((r) => ({ value: r, label: LOST_REASON_LABEL[r] }))}
            />
            {errors.reason ? <p className="text-xs font-medium text-destructive">{errors.reason}</p> : null}
            {reason === 'using_other_agency' ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Which agency? (optional)">
                  {({ id }) => <input id={id} value={competitor} maxLength={200} onChange={(e) => setCompetitor(e.target.value)} className={inputClass} />}
                </Field>
                <Field label="Their contract ends (optional)" hint="We’ll remind you a week before.">
                  {({ id, describedBy }) => (
                    <input id={id} type="date" value={contractEnd} onChange={(e) => setContractEnd(e.target.value)} className={inputClass} aria-describedby={describedBy} />
                  )}
                </Field>
              </div>
            ) : null}
            <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
              The lead closes as lost and comes back as a re-engage reminder later.
            </p>
          </div>
        ) : null}

        {talked && outcome === 'do_not_call' ? (
          <p className="rounded-lg border border-destructive/40 bg-red-50 px-3 py-2 text-sm text-red-900 dark:bg-red-950/40 dark:text-red-200">
            Call and WhatsApp will be switched off for this lead and every open follow-up cancelled. Only an admin can undo this.
          </p>
        ) : null}

        {talked && outcome === 'quote_accepted' ? (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
            The latest quote will be marked accepted and the lead moves to Won.
          </p>
        ) : null}

        {talked && outcome === 'wrong_person' ? (
          <div className="space-y-2">
            <p className="text-sm font-medium">Right person to talk to (optional)</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Name">{({ id }) => <input id={id} value={newContact.name} maxLength={120} onChange={(e) => setNewContact({ ...newContact, name: e.target.value })} className={inputClass} />}</Field>
              <Field label="Phone" error={errors.ncPhone}>{({ id, describedBy, invalid }) => <input id={id} inputMode="tel" value={newContact.phone} onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })} className={inputClass} aria-describedby={describedBy} aria-invalid={invalid || undefined} />}</Field>
              <Field label="Role">{({ id }) => <input id={id} value={newContact.designation} maxLength={120} onChange={(e) => setNewContact({ ...newContact, designation: e.target.value })} className={inputClass} placeholder="Owner, Marketing…" />}</Field>
            </div>
          </div>
        ) : null}

        {result ? (
          <Field label="Note (optional)" error={errors.note}>
            {({ id, describedBy, invalid }) => (
              <textarea id={id} rows={2} value={note} maxLength={2000} onChange={(e) => setNote(e.target.value)}
                placeholder="Anything the next person should know" className={inputClass}
                aria-describedby={describedBy} aria-invalid={invalid || undefined} />
            )}
          </Field>
        ) : null}

        {due && needsDue ? (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <HelpCircle className="size-3.5" aria-hidden="true" /> Scheduled for {formatDateTime(due)} (IST).
          </p>
        ) : null}
      </div>
    </Modal>
  );
}

function prefix(p: string, e: Record<string, string | undefined>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(e)) if (v) out[`${p}.${k}`] = v;
  return out;
}
function unprefix(p: string, e: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(e)) if (k.startsWith(p + '.')) out[k.slice(p.length + 1)] = v;
  return out;
}
