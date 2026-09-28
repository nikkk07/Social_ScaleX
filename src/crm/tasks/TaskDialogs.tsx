'use client';
import React, { useState } from 'react';
import { toast } from 'sonner';
import { CalendarClock, CalendarDays, ListTodo } from 'lucide-react';
import type { MeetingMode, TaskType } from '@/lib/database.types';
import { Modal, Btn } from '../ui/Modal';
import { ChoiceChips, Field, inputClass } from '../ui/kit';
import { DateTimeField } from '../ui/DateTimeField';
import { rpc } from '../lib/api';
import { friendlyError } from '../lib/errors';
import { MEETING_MODE_LABEL, TASK_LABEL } from '../lib/labels';
import { formatDateTime } from '../lib/time';

export function ScheduleDialog({ leadId, brand, initialType = 'callback', onClose, onSaved }: {
  leadId: string; brand: string; initialType?: 'callback' | 'meeting' | 'follow_up';
  onClose: () => void; onSaved: () => void;
}) {
  const [type, setType] = useState<'callback' | 'meeting' | 'follow_up'>(initialType);
  const [due, setDue] = useState<string | null>(null);
  const [mode, setMode] = useState<MeetingMode>('video');
  const [location, setLocation] = useState('');
  const [note, setNote] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save(e?: React.FormEvent) {
    e?.preventDefault();
    if (!due) { setErr('Pick a date and time.'); return; }
    if (new Date(due).getTime() < Date.now() - 60_000) { setErr('That time is in the past.'); return; }
    setErr(null);
    setBusy(true);
    try {
      await rpc('schedule_task', {
        p_lead: leadId, p_type: type, p_due: due, p_note: note.trim() || undefined,
        p_mode: type === 'meeting' ? mode : undefined,
        p_location: type === 'meeting' ? location.trim() || undefined : undefined,
      });
      toast.success(`${TASK_LABEL[type]} scheduled for ${formatDateTime(due)}.`);
      onSaved();
    } catch (e2) {
      toast.error(friendlyError(e2));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open onOpenChange={(o) => { if (!o) onClose(); }} title={`Schedule · ${brand}`} onSubmit={save}
      footer={<><Btn variant="secondary" onClick={onClose}>Cancel</Btn><Btn type="submit" disabled={busy}>{busy ? 'Saving…' : 'Schedule'}</Btn></>}>
      <div className="space-y-5">
        <ChoiceChips label="What" value={type} onChange={setType} columns={3} options={[
          { value: 'callback', label: 'Call-back', icon: <CalendarClock className="size-4" /> },
          { value: 'meeting', label: 'Meeting', icon: <CalendarDays className="size-4" /> },
          { value: 'follow_up', label: 'Follow-up', icon: <ListTodo className="size-4" /> },
        ]} />
        <DateTimeField label="When" value={due} onChange={setDue} error={err} />
        {type === 'meeting' ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Meeting type">
              {({ id }) => (
                <select id={id} value={mode} onChange={(e) => setMode(e.target.value as MeetingMode)} className={inputClass}>
                  {(Object.keys(MEETING_MODE_LABEL) as MeetingMode[]).map((m) => <option key={m} value={m}>{MEETING_MODE_LABEL[m]}</option>)}
                </select>
              )}
            </Field>
            <Field label={mode === 'in_person' ? 'Address' : 'Link / details'}>
              {({ id }) => <input id={id} value={location} maxLength={500} onChange={(e) => setLocation(e.target.value)} className={inputClass} />}
            </Field>
          </div>
        ) : null}
        <Field label="Note (optional)">
          {({ id }) => <textarea id={id} rows={2} value={note} maxLength={2000} onChange={(e) => setNote(e.target.value)} className={inputClass} />}
        </Field>
      </div>
    </Modal>
  );
}

export function RescheduleDialog({ task, brand, onClose, onSaved }: {
  task: { id: string; type: TaskType; due_at: string }; brand: string; onClose: () => void; onSaved: () => void;
}) {
  const [due, setDue] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [errs, setErrs] = useState<{ due?: string; reason?: string }>({});
  const [busy, setBusy] = useState(false);

  async function save(e?: React.FormEvent) {
    e?.preventDefault();
    const x: typeof errs = {};
    if (!due) x.due = 'Pick the new date and time.';
    else if (new Date(due).getTime() < Date.now() - 60_000) x.due = 'That time is in the past.';
    if (!reason.trim()) x.reason = 'Say why, in a few words.';
    setErrs(x);
    if (Object.keys(x).length) return;
    setBusy(true);
    try {
      await rpc('reschedule_task', { p_task: task.id, p_due: due as string, p_reason: reason.trim() });
      toast.success(`Moved to ${formatDateTime(due as string)}.`);
      onSaved();
    } catch (e2) {
      toast.error(friendlyError(e2));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal open onOpenChange={(o) => { if (!o) onClose(); }} title={`Reschedule ${TASK_LABEL[task.type].toLowerCase()} · ${brand}`}
      description={`Currently ${formatDateTime(task.due_at)}`} onSubmit={save} size="sm"
      footer={<><Btn variant="secondary" onClick={onClose}>Cancel</Btn><Btn type="submit" disabled={busy}>{busy ? 'Saving…' : 'Reschedule'}</Btn></>}>
      <div className="space-y-4">
        <DateTimeField label="New time" value={due} onChange={setDue} error={errs.due} />
        <Field label="Reason" required error={errs.reason}>
          {({ id, describedBy, invalid }) => (
            <input id={id} value={reason} maxLength={500} onChange={(e) => setReason(e.target.value)} className={inputClass}
              placeholder="e.g. Client asked for next week" aria-describedby={describedBy} aria-invalid={invalid || undefined} />
          )}
        </Field>
      </div>
    </Modal>
  );
}

export function CancelTaskDialog({ task, brand, onClose, onSaved }: {
  task: { id: string; type: TaskType }; brand: string; onClose: () => void; onSaved: () => void;
}) {
  const [reason, setReason] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function save(e?: React.FormEvent) {
    e?.preventDefault();
    if (!reason.trim()) { setErr('Say why, in a few words.'); return; }
    setBusy(true);
    try {
      await rpc('cancel_task', { p_task: task.id, p_reason: reason.trim() });
      toast.success('Follow-up cancelled.');
      onSaved();
    } catch (e2) {
      toast.error(friendlyError(e2));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal open onOpenChange={(o) => { if (!o) onClose(); }} title={`Cancel ${TASK_LABEL[task.type].toLowerCase()} · ${brand}`} size="sm" onSubmit={save}
      footer={<><Btn variant="secondary" onClick={onClose}>Keep it</Btn><Btn type="submit" variant="danger" disabled={busy}>{busy ? 'Cancelling…' : 'Cancel follow-up'}</Btn></>}>
      <Field label="Reason" required error={err}>
        {({ id, describedBy, invalid }) => (
          <input id={id} value={reason} maxLength={500} onChange={(e) => setReason(e.target.value)} className={inputClass}
            aria-describedby={describedBy} aria-invalid={invalid || undefined} autoFocus />
        )}
      </Field>
    </Modal>
  );
}
