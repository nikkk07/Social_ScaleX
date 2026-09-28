'use client';
import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as DM from '@radix-ui/react-dropdown-menu';
import {
  ArrowLeft, Ban, CalendarPlus, ChevronDown, ExternalLink, FileText, Instagram, MessageCircle, Pencil, Phone,
  RotateCcw, Archive, Trophy, XCircle, Moon, ShieldAlert,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { LeadPhone, LeadStage, LostReason, Quotation } from '@/lib/database.types';
import { formatPhone } from '@/lib/crm/normalize';
import { useMe } from '../auth/AuthProvider';
import { Badge, Card, CardHeader, EmptyState, ErrorState, Field, Spinner, inputClass } from '../ui/kit';
import { Btn, Modal } from '../ui/Modal';
import { ChoiceChips } from '../ui/kit';
import { invalidateCrm, useLead, useProfiles, type LeadBundle } from '../data/hooks';
import { TaskItem } from '../tasks/TaskItem';
import { ScheduleDialog } from '../tasks/TaskDialogs';
import { useOutcome } from '../outcome/OutcomeProvider';
import { QuoteFields, emptyQuote, quoteErrors, quotePayload, type QuoteDraft } from '../ui/QuoteFields';
import {
  LOST_REASON_LABEL, MEETING_MODE_LABEL, OUTCOME_LABEL, QUOTE_REJECT_REASONS, QUOTE_STATUS_LABEL, RESULT_LABEL,
  SOURCE_LABEL, STAGE_LABEL, STAGE_TONE, STAGES, TASK_LABEL, NOT_INTERESTED_REASONS,
} from '../lib/labels';
import { formatDateOnly, formatDateTime, formatFull, relative } from '../lib/time';
import { scoreLead } from '../lib/score';
import { rpc } from '../lib/api';
import { friendlyError } from '../lib/errors';
import { NotFoundView } from '../layout/NotFoundView';
import { ContactsEditor } from './ContactsEditor';
import { cn } from '@/components/ui/utils';

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

export function LeadDetailPage({ id }: { id: string }) {
  const q = useLead(id);
  if (q.isLoading) return <Spinner label="Loading lead…" />;
  if (q.isError) return <ErrorState message={friendlyError(q.error)} onRetry={() => void q.refetch()} />;
  if (!q.data) return <NotFoundView what="lead" />;
  return <Loaded b={q.data} />;
}

type StageAction = 'won' | 'lost' | 'nurture' | 'dnc' | 'reopen';

function Loaded({ b }: { b: LeadBundle }) {
  const { lead } = b;
  const { isAdmin, id: me } = useMe();
  const qc = useQueryClient();
  const { startContact } = useOutcome();
  const profiles = useProfiles().data ?? [];
  const names = new Map(profiles.map((p) => [p.id, p.name]));
  const [dialog, setDialog] = useState<null | 'schedule' | 'quote' | 'contacts' | { stage: StageAction } | { decide: Quotation }>(null);
  const [note, setNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const refresh = () => { setDialog(null); invalidateCrm(qc, lead.id); };

  const archived = !!lead.deleted_at;
  const closed = lead.stage === 'won' || lead.stage === 'lost' || lead.stage === 'dnc';
  const canContact = !archived && !lead.dnc;
  const score = scoreLead(lead);
  const openTasks = b.tasks.filter((t) => t.status === 'open');
  const allPhones = [...b.contacts.flatMap((c) => c.phones.map((p) => ({ ...p, who: c.name }))), ...b.officePhones.map((p) => ({ ...p, who: 'Office' }))];
  const bestPhone = allPhones.find((p) => !p.is_invalid);
  const bestWa = allPhones.find((p) => !p.is_invalid && !p.no_whatsapp);

  const call = (p: LeadPhone, channel: 'call' | 'whatsapp') =>
    void startContact({ lead: { id: lead.id, brand_name: lead.brand_name, stage: lead.stage }, phone: p, channel });

  async function addNote(e: React.FormEvent) {
    e.preventDefault();
    if (!note.trim()) return;
    setSavingNote(true);
    try {
      await rpc('add_note', { p_lead: lead.id, p_text: note.trim() });
      setNote('');
      invalidateCrm(qc, lead.id);
    } catch (e2) {
      toast.error(friendlyError(e2));
    } finally {
      setSavingNote(false);
    }
  }

  async function setOwner(owner: string) {
    try {
      await rpc('reassign_leads', { p_leads: [lead.id], p_owner: (owner || null) as string });
      toast.success(owner ? `Assigned to ${names.get(owner)}.` : 'Moved to the unassigned pool.');
      invalidateCrm(qc, lead.id);
    } catch (e) {
      toast.error(friendlyError(e));
    }
  }

  async function setArchived(on: boolean) {
    const { error } = await supabase.from('leads').update({ deleted_at: on ? new Date().toISOString() : null }).eq('id', lead.id);
    if (error) { toast.error(friendlyError(error)); return; }
    toast.success(on ? 'Lead archived.' : 'Lead restored.');
    invalidateCrm(qc, lead.id);
  }

  return (
    <>
      <Link href="/crm/leads" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden="true" /> Leads
      </Link>

      {/* Header */}
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">{lead.brand_name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Badge tone={STAGE_TONE[lead.stage]}>{STAGE_LABEL[lead.stage]}</Badge>
            {lead.stage === 'lost' && lead.lost_reason ? <span>{LOST_REASON_LABEL[lead.lost_reason]}</span> : null}
            {score ? (
              <span title={score.reasons.join('\n')} className="rounded-full border border-border px-2 py-0.5 text-xs">
                Score <strong className="tabular">{score.value}</strong> · {score.band}
              </span>
            ) : null}
            <span>· in stage {relative(lead.stage_changed_at).replace(' ago', '')}</span>
            {lead.instagram_username ? (
              <a href={`https://instagram.com/${lead.instagram_username}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-foreground">
                <Instagram className="size-3.5" aria-hidden="true" />@{lead.instagram_username}
              </a>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canContact && bestPhone ? (
            <Btn onClick={() => call(bestPhone, 'call')}><Phone aria-hidden="true" /> Call</Btn>
          ) : null}
          {canContact && bestWa ? (
            <Btn variant="secondary" onClick={() => call(bestWa, 'whatsapp')}><MessageCircle aria-hidden="true" /> WhatsApp</Btn>
          ) : null}
          {!archived && !lead.dnc ? <Btn variant="secondary" onClick={() => setDialog('schedule')}><CalendarPlus aria-hidden="true" /> Schedule</Btn> : null}
          <DM.Root>
            <DM.Trigger asChild>
              <button type="button" className="inline-flex h-9 items-center gap-1 rounded-lg border border-border bg-card px-3 text-sm font-medium hover:bg-muted">
                More <ChevronDown className="size-4" aria-hidden="true" />
              </button>
            </DM.Trigger>
            <DM.Portal>
              <DM.Content align="end" sideOffset={4} className="z-50 min-w-52 rounded-lg border border-border bg-popover p-1 text-sm text-popover-foreground shadow-lg">
                {!archived ? (
                  <>
                    <MenuItem asLink href={`/crm/leads/${lead.id}/edit`} icon={<Pencil />}>Edit details</MenuItem>
                    {!closed ? <MenuItem onSelect={() => setDialog('quote')} icon={<FileText />}>Record a quotation</MenuItem> : null}
                    {!closed ? <MenuItem onSelect={() => setDialog({ stage: 'won' })} icon={<Trophy />}>Mark as won</MenuItem> : null}
                    {!closed ? <MenuItem onSelect={() => setDialog({ stage: 'lost' })} icon={<XCircle />}>Mark as lost</MenuItem> : null}
                    {!closed && lead.stage !== 'nurture' ? <MenuItem onSelect={() => setDialog({ stage: 'nurture' })} icon={<Moon />}>Move to nurture</MenuItem> : null}
                    {!lead.dnc ? <MenuItem onSelect={() => setDialog({ stage: 'dnc' })} icon={<Ban />} danger>Do not contact</MenuItem> : null}
                    {isAdmin ? <MenuItem onSelect={() => setDialog({ stage: 'reopen' })} icon={<RotateCcw />}>Change stage…</MenuItem> : null}
                  </>
                ) : null}
                {isAdmin ? (
                  <>
                    <DM.Separator className="my-1 h-px bg-border" />
                    <MenuItem onSelect={() => void setArchived(!archived)} icon={archived ? <RotateCcw /> : <Archive />} danger={!archived}>
                      {archived ? 'Restore lead' : 'Archive lead'}
                    </MenuItem>
                  </>
                ) : null}
              </DM.Content>
            </DM.Portal>
          </DM.Root>
        </div>
      </div>

      {archived ? <Banner tone="muted">This lead is archived and hidden from every list. {isAdmin ? 'Restore it from “More” to work on it again.' : 'Ask an admin to restore it.'}</Banner> : null}
      {lead.dnc ? <Banner tone="danger"><ShieldAlert className="size-4 shrink-0" aria-hidden="true" /> This lead asked not to be contacted{lead.dnc_at ? ` (${formatDateOnly(lead.dnc_at.slice(0, 10))})` : ''}. Calls and WhatsApp are disabled.</Banner> : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="min-w-0 space-y-6">
          <Card>
            <CardHeader title="Next steps" action={!archived && !lead.dnc ? <Btn size="sm" variant="secondary" onClick={() => setDialog('schedule')}><CalendarPlus aria-hidden="true" /> Add</Btn> : null} />
            {openTasks.length === 0 ? (
              <EmptyState title="Nothing scheduled">{closed ? 'This lead is closed.' : 'Call them, or schedule a call-back or meeting.'}</EmptyState>
            ) : (
              <ul className="divide-y divide-border">
                {openTasks.map((t) => (
                  <TaskItem key={t.id} showLead={false} showDate
                    task={{ ...t, lead: { id: lead.id, brand_name: lead.brand_name, stage: lead.stage, dnc: lead.dnc } }}
                    assigneeName={t.assignee_id && t.assignee_id !== me ? names.get(t.assignee_id) ?? null : null} />
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader title="Activity" />
            {!archived ? (
              <form onSubmit={addNote} className="flex gap-2 border-b border-border px-4 py-3">
                <label htmlFor="new-note" className="sr-only">Add a note</label>
                <textarea id="new-note" rows={1} value={note} maxLength={2000} onChange={(e) => setNote(e.target.value)}
                  placeholder="Add a note…" className={cn(inputClass, 'min-h-9 resize-y')} />
                <Btn type="submit" disabled={savingNote || !note.trim()}>{savingNote ? 'Saving…' : 'Add'}</Btn>
              </form>
            ) : null}
            <Timeline b={b} />
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Contacts" action={!archived ? <Btn size="sm" variant="secondary" onClick={() => setDialog('contacts')}><Pencil aria-hidden="true" /> Edit</Btn> : null} />
            {b.contacts.length === 0 && b.officePhones.length === 0 ? (
              <EmptyState title="No contacts yet" action={!archived ? <Btn size="sm" onClick={() => setDialog('contacts')}>Add a contact</Btn> : null} />
            ) : (
              <ul className="divide-y divide-border">
                {b.contacts.map((c) => (
                  <li key={c.id} className="px-4 py-3">
                    <p className="text-sm font-medium">{c.name}{c.is_primary ? <span className="ml-1.5 text-xs font-normal text-muted-foreground">· main</span> : null}</p>
                    {c.designation || c.email ? (
                      <p className="text-xs text-muted-foreground">
                        {c.designation}{c.designation && c.email ? ' · ' : ''}
                        {c.email ? <a href={`mailto:${c.email}`} className="hover:underline">{c.email}</a> : null}
                      </p>
                    ) : null}
                    <PhoneList phones={c.phones} canContact={canContact} onContact={call} />
                  </li>
                ))}
                {b.officePhones.length ? (
                  <li className="px-4 py-3">
                    <p className="text-sm font-medium">Office</p>
                    <PhoneList phones={b.officePhones} canContact={canContact} onContact={call} />
                  </li>
                ) : null}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader title="Quotations" action={!closed && !archived ? <Btn size="sm" variant="secondary" onClick={() => setDialog('quote')}><FileText aria-hidden="true" /> New</Btn> : null} />
            {b.quotes.length === 0 ? <EmptyState title="No quotations yet" /> : (
              <ul className="divide-y divide-border">
                {b.quotes.map((qt) => (
                  <li key={qt.id} className="px-4 py-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold tabular">{inr.format(Number(qt.amount_inr))}</span>
                      <Badge tone={qt.status === 'accepted' ? 'green' : qt.status === 'rejected' ? 'red' : qt.status === 'sent' ? 'amber' : 'neutral'}>
                        v{qt.version} · {QUOTE_STATUS_LABEL[qt.status]}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Sent {formatDateTime(qt.sent_at)}{qt.valid_until ? ` · valid till ${formatDateOnly(qt.valid_until)}` : ''}
                      {qt.decision_reason ? ` · ${LOST_REASON_LABEL[qt.decision_reason]}` : ''}
                    </p>
                    {qt.services ? <p className="mt-1 whitespace-pre-line text-xs">{qt.services}</p> : null}
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {qt.link ? <a href={qt.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">Open <ExternalLink className="size-3" aria-hidden="true" /></a> : null}
                      {qt.status === 'sent' && !archived ? (
                        <Btn size="sm" variant="secondary" onClick={() => setDialog({ decide: qt })}>Record decision</Btn>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader title="Details" action={!archived ? <Link href={`/crm/leads/${lead.id}/edit`} className="text-sm font-medium text-primary hover:underline">Edit</Link> : null} />
            <dl className="grid grid-cols-[7.5rem_1fr] gap-x-3 gap-y-2 px-4 py-3 text-sm">
              <dt className="text-muted-foreground">Owner</dt>
              <dd>
                {isAdmin && !archived ? (
                  <>
                    <label htmlFor="owner-select" className="sr-only">Owner</label>
                    <select id="owner-select" value={lead.owner_id ?? ''} onChange={(e) => void setOwner(e.target.value)} className="w-full rounded-md border border-input bg-input-background px-2 py-1 text-sm">
                      <option value="">Unassigned</option>
                      {profiles.filter((p) => p.is_active || p.id === lead.owner_id).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </>
                ) : (lead.owner_id ? names.get(lead.owner_id) ?? '—' : 'Unassigned')}
              </dd>
              <dt className="text-muted-foreground">Source</dt><dd>{SOURCE_LABEL[lead.source]}</dd>
              <dt className="text-muted-foreground">Found on</dt><dd>{formatDateOnly(lead.lead_found_on)}</dd>
              {lead.address ? <><dt className="text-muted-foreground">Address</dt><dd className="break-words">{lead.address}</dd></> : null}
              <dt className="text-muted-foreground">Attempts</dt><dd className="tabular">{lead.attempt_count}{lead.last_connected_at ? ` · last spoke ${relative(lead.last_connected_at)}` : ''}</dd>
              {lead.deal_value_inr != null ? <><dt className="text-muted-foreground">Deal value</dt><dd className="tabular">{inr.format(Number(lead.deal_value_inr))}</dd></> : null}
              {lead.competitor_name || lead.competitor_contract_end ? (
                <><dt className="text-muted-foreground">Current agency</dt><dd>{lead.competitor_name ?? '—'}{lead.competitor_contract_end ? ` · until ${formatDateOnly(lead.competitor_contract_end)}` : ''}</dd></>
              ) : null}
              {lead.stage === 'won' ? (
                <>
                  <dt className="text-muted-foreground">Project</dt>
                  <dd>
                    {lead.project_start_date ? `Starts ${formatDateOnly(lead.project_start_date)}` : 'Start date not set'}
                    {lead.expected_delivery_date ? ` · delivery ${formatDateOnly(lead.expected_delivery_date)}` : ''}
                    {lead.project_end_date ? ` · ends ${formatDateOnly(lead.project_end_date)}` : ''}
                  </dd>
                </>
              ) : null}
              <dt className="text-muted-foreground">Created</dt><dd>{formatFull(lead.created_at)}</dd>
            </dl>
            {lead.notes ? <p className="whitespace-pre-line border-t border-border px-4 py-3 text-sm">{lead.notes}</p> : null}
          </Card>
        </div>
      </div>

      {dialog === 'schedule' ? <ScheduleDialog leadId={lead.id} brand={lead.brand_name} onClose={() => setDialog(null)} onSaved={refresh} /> : null}
      {dialog === 'quote' ? <QuoteDialog leadId={lead.id} brand={lead.brand_name} onClose={() => setDialog(null)} onSaved={refresh} /> : null}
      {dialog === 'contacts' ? <ContactsEditor b={b} onClose={() => setDialog(null)} onSaved={refresh} /> : null}
      {dialog && typeof dialog === 'object' && 'stage' in dialog ? (
        <StageDialog leadId={lead.id} brand={lead.brand_name} current={lead.stage} action={dialog.stage} onClose={() => setDialog(null)} onSaved={refresh} />
      ) : null}
      {dialog && typeof dialog === 'object' && 'decide' in dialog ? (
        <DecideQuoteDialog quote={dialog.decide} brand={lead.brand_name} onClose={() => setDialog(null)} onSaved={refresh} />
      ) : null}
    </>
  );
}

function MenuItem({ children, icon, onSelect, danger, asLink, href }: {
  children: React.ReactNode; icon: React.ReactNode; onSelect?: () => void; danger?: boolean; asLink?: boolean; href?: string;
}) {
  const cls = cn('flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 outline-none data-[highlighted]:bg-muted [&_svg]:size-4', danger && 'text-destructive');
  if (asLink && href) {
    return <DM.Item asChild className={cls}><Link href={href}><span aria-hidden="true">{icon}</span>{children}</Link></DM.Item>;
  }
  return <DM.Item onSelect={onSelect} className={cls}><span aria-hidden="true">{icon}</span>{children}</DM.Item>;
}

function Banner({ tone, children }: { tone: 'muted' | 'danger'; children: React.ReactNode }) {
  return (
    <div role="status" className={cn('mb-5 flex items-center gap-2 rounded-xl px-4 py-3 text-sm',
      tone === 'danger' ? 'border border-destructive/40 bg-red-50 text-red-900 dark:bg-red-950/40 dark:text-red-200' : 'bg-muted text-muted-foreground')}>
      {children}
    </div>
  );
}

function PhoneList({ phones, canContact, onContact }: { phones: LeadPhone[]; canContact: boolean; onContact: (p: LeadPhone, ch: 'call' | 'whatsapp') => void }) {
  if (!phones.length) return null;
  return (
    <ul className="mt-1.5 space-y-1">
      {phones.map((p) => (
        <li key={p.id} className="flex items-center gap-2 text-sm">
          <span className={cn('tabular', p.is_invalid && 'text-muted-foreground line-through')}>{formatPhone(p.phone_e164)}</span>
          {p.label ? <span className="text-xs text-muted-foreground">{p.label}</span> : null}
          {p.is_invalid ? <Badge tone="red">Wrong number</Badge> : null}
          {p.no_whatsapp && !p.is_invalid ? <Badge tone="slate">No WhatsApp</Badge> : null}
          {canContact && !p.is_invalid ? (
            <span className="ml-auto flex gap-0.5">
              <Btn size="sm" variant="ghost" onClick={() => onContact(p, 'call')} aria-label={`Call ${formatPhone(p.phone_e164)}`} title="Call"><Phone aria-hidden="true" /></Btn>
              {!p.no_whatsapp ? <Btn size="sm" variant="ghost" onClick={() => onContact(p, 'whatsapp')} aria-label={`WhatsApp ${formatPhone(p.phone_e164)}`} title="WhatsApp"><MessageCircle aria-hidden="true" /></Btn> : null}
            </span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

// ── Timeline ────────────────────────────────────────────────────────
type TimelineEntry = { id: string; at: string; who: string; title: string; body?: string | null; tone?: 'call' | 'note' | 'stage' | 'default' };

function actorName(a: { full_name: string | null; email: string } | null): string {
  return a ? a.full_name || a.email : 'System';
}

function Timeline({ b }: { b: LeadBundle }) {
  const entries = useMemo<TimelineEntry[]>(() => {
    const out: TimelineEntry[] = [];
    for (const c of b.calls) {
      if (!c.result) {
        out.push({ id: `c${c.id}`, at: c.started_at, who: actorName(c.actor), title: `${c.channel === 'whatsapp' ? 'WhatsApp' : 'Call'} started — outcome not logged yet`, tone: 'call' });
        continue;
      }
      const res = RESULT_LABEL[c.result];
      const oc = c.outcome ? ` · ${OUTCOME_LABEL[c.outcome]}` : '';
      const lr = c.lost_reason ? ` (${LOST_REASON_LABEL[c.lost_reason]})` : '';
      out.push({
        id: `c${c.id}`, at: c.started_at, who: actorName(c.actor),
        title: `${c.channel === 'whatsapp' ? 'WhatsApp' : 'Call'}${c.phone_e164 ? ` ${formatPhone(c.phone_e164)}` : ''}: ${res}${oc}${lr}`,
        body: c.note, tone: 'call',
      });
    }
    for (const a of b.activities) {
      const d = (a.detail ?? {}) as Record<string, unknown>;
      const who = actorName(a.actor);
      const s = (k: string) => (typeof d[k] === 'string' ? (d[k] as string) : null);
      switch (a.kind) {
        case 'outcome_logged': break; // shown via the call entry
        case 'created': out.push({ id: a.id, at: a.created_at, who, title: 'Lead created' }); break;
        case 'note': out.push({ id: a.id, at: a.created_at, who, title: 'Note', body: s('text'), tone: 'note' }); break;
        case 'stage_changed': {
          const from = s('from') as LeadStage | null; const to = s('to') as LeadStage | null;
          const lr = s('lost_reason') as LostReason | null;
          const label = (x: LeadStage | null, legacy: string | null) => (x && (STAGES as readonly string[]).includes(x) ? STAGE_LABEL[x] : legacy ?? '—');
          out.push({ id: a.id, at: a.created_at, who, tone: 'stage',
            title: `Stage: ${label(from, s('legacy_from'))} → ${label(to, s('legacy_to'))}${lr ? ` (${LOST_REASON_LABEL[lr]})` : ''}`, body: s('note') });
          break;
        }
        case 'assigned': out.push({ id: a.id, at: a.created_at, who, title: s('to_name') ? `Assigned to ${s('to_name')}` : 'Moved to the unassigned pool' }); break;
        case 'task_scheduled': {
          const t = s('type') as keyof typeof TASK_LABEL | null; const due = s('due_at'); const mode = s('mode') as keyof typeof MEETING_MODE_LABEL | null;
          out.push({ id: a.id, at: a.created_at, who, title: `${t ? TASK_LABEL[t] : 'Follow-up'} scheduled${due ? ` for ${formatDateTime(due)}` : ''}${mode ? ` · ${MEETING_MODE_LABEL[mode]}` : ''}` });
          break;
        }
        case 'task_rescheduled': {
          const t = s('type') as keyof typeof TASK_LABEL | null; const to = s('to');
          out.push({ id: a.id, at: a.created_at, who, title: `${t ? TASK_LABEL[t] : 'Follow-up'} moved${to ? ` to ${formatDateTime(to)}` : ''}`, body: s('reason') });
          break;
        }
        case 'task_cancelled': {
          const t = s('type') as keyof typeof TASK_LABEL | null;
          out.push({ id: a.id, at: a.created_at, who, title: `${t ? TASK_LABEL[t] : 'Follow-up'} cancelled`, body: s('reason') });
          break;
        }
        case 'meeting_outcome': {
          const r = s('result');
          const txt = r === 'held_positive' ? 'went well' : r === 'held_needs_time' ? 'client needs time' : r === 'no_show' ? 'client didn’t show' : r === 'not_interested' ? 'not interested' : r;
          out.push({ id: a.id, at: a.created_at, who, title: `Meeting: ${txt}`, body: s('note'), tone: 'stage' });
          break;
        }
        case 'quote_sent': out.push({ id: a.id, at: a.created_at, who, title: `Quotation v${String(d.version ?? '')} sent · ${inr.format(Number(d.amount ?? 0))}`, tone: 'stage' }); break;
        case 'quote_decided': out.push({ id: a.id, at: a.created_at, who, title: `Quotation ${s('decision') ?? 'decided'}${s('reason') ? ` (${LOST_REASON_LABEL[s('reason') as LostReason] ?? s('reason')})` : ''}`, tone: 'stage' }); break;
        case 'archived': out.push({ id: a.id, at: a.created_at, who, title: 'Archived' }); break;
        case 'restored': out.push({ id: a.id, at: a.created_at, who, title: 'Restored' }); break;
        case 'edited': out.push({ id: a.id, at: a.created_at, who, title: 'Details edited' }); break;
        case 'contacts_edited': out.push({ id: a.id, at: a.created_at, who, title: 'Contacts updated' }); break;
        default: out.push({ id: a.id, at: a.created_at, who, title: a.kind.replace(/_/g, ' ') });
      }
    }
    return out.sort((x, y) => (x.at < y.at ? 1 : x.at > y.at ? -1 : 0));
  }, [b]);

  if (!entries.length) return <EmptyState title="No activity yet" />;
  return (
    <ol className="divide-y divide-border">
      {entries.map((e) => (
        <li key={e.id} className="flex gap-3 px-4 py-3">
          <span aria-hidden="true" className={cn('mt-1.5 size-2 shrink-0 rounded-full',
            e.tone === 'call' ? 'bg-sky-500' : e.tone === 'note' ? 'bg-amber-500' : e.tone === 'stage' ? 'bg-violet-500' : 'bg-muted-foreground/40')} />
          <div className="min-w-0 flex-1">
            <p className="text-sm">{e.title}</p>
            {e.body ? <p className="mt-0.5 whitespace-pre-line break-words text-sm text-muted-foreground">{e.body}</p> : null}
            <p className="mt-0.5 text-xs text-muted-foreground"><time dateTime={e.at} title={formatFull(e.at)}>{formatDateTime(e.at)}</time> · {e.who}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

// ── Dialogs ─────────────────────────────────────────────────────────
function QuoteDialog({ leadId, brand, onClose, onSaved }: { leadId: string; brand: string; onClose: () => void; onSaved: () => void }) {
  const [q, setQ] = useState<QuoteDraft>(emptyQuote());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  async function save(e?: React.FormEvent) {
    e?.preventDefault();
    const er = quoteErrors(q, true) as Record<string, string>;
    setErrors(er);
    if (Object.keys(er).length) return;
    setBusy(true);
    try {
      const p = quotePayload(q);
      await rpc('create_quotation', { p_lead: leadId, p_amount: p.amount, p_valid_until: p.valid_until as string, p_services: p.services ?? undefined, p_link: p.link ?? undefined });
      toast.success('Quotation recorded. A follow-up has been scheduled.');
      onSaved();
    } catch (e2) {
      toast.error(friendlyError(e2));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal open onOpenChange={(o) => { if (!o) onClose(); }} title={`New quotation · ${brand}`} onSubmit={save}
      description="Recording a new version supersedes the one awaiting a decision."
      footer={<><Btn variant="secondary" onClick={onClose}>Cancel</Btn><Btn type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save quotation'}</Btn></>}>
      <QuoteFields value={q} onChange={setQ} errors={errors} />
    </Modal>
  );
}

function DecideQuoteDialog({ quote, brand, onClose, onSaved }: { quote: Quotation; brand: string; onClose: () => void; onSaved: () => void }) {
  const [decision, setDecision] = useState<'accepted' | 'rejected' | null>(null);
  const [reason, setReason] = useState<LostReason | null>(null);
  const [note, setNote] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function save(e?: React.FormEvent) {
    e?.preventDefault();
    if (!decision) { setErr('Choose the decision.'); return; }
    if (decision === 'rejected' && !reason) { setErr('Choose a reason.'); return; }
    setBusy(true);
    try {
      await rpc('decide_quotation', { p_quote: quote.id, p_decision: decision, p_reason: (reason ?? undefined) as LostReason, p_note: note.trim() || undefined });
      toast.success(decision === 'accepted' ? `${brand} is won.` : 'Recorded as lost. A re-engage reminder was scheduled.');
      onSaved();
    } catch (e2) {
      toast.error(friendlyError(e2));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal open onOpenChange={(o) => { if (!o) onClose(); }} size="sm" title={`Quotation v${quote.version} · ${brand}`}
      description={inr.format(Number(quote.amount_inr))} onSubmit={save}
      footer={<><Btn variant="secondary" onClick={onClose}>Cancel</Btn><Btn type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save decision'}</Btn></>}>
      <div className="space-y-4">
        <ChoiceChips label="Client’s decision" value={decision} onChange={(v) => { setDecision(v); setErr(null); }} options={[
          { value: 'accepted', label: 'Accepted', hint: 'Marks the lead won', tone: 'success' },
          { value: 'rejected', label: 'Rejected', hint: 'Marks the lead lost', tone: 'danger' },
        ]} />
        {decision === 'rejected' ? (
          <ChoiceChips label="Why" value={reason} onChange={setReason} options={QUOTE_REJECT_REASONS.map((r) => ({ value: r, label: LOST_REASON_LABEL[r] }))} />
        ) : null}
        <Field label="Note (optional)">{({ id }) => <textarea id={id} rows={2} value={note} maxLength={2000} onChange={(e) => setNote(e.target.value)} className={inputClass} />}</Field>
        {err ? <p role="alert" className="text-sm font-medium text-destructive">{err}</p> : null}
      </div>
    </Modal>
  );
}

function StageDialog({ leadId, brand, current, action, onClose, onSaved }: {
  leadId: string; brand: string; current: LeadStage; action: StageAction; onClose: () => void; onSaved: () => void;
}) {
  const [stage, setStage] = useState<LeadStage>(action === 'reopen' ? current : action);
  const [reason, setReason] = useState<LostReason | null>(null);
  const [note, setNote] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const title = action === 'won' ? `Mark ${brand} as won` : action === 'lost' ? `Mark ${brand} as lost` : action === 'nurture' ? `Move ${brand} to nurture`
    : action === 'dnc' ? `Do not contact ${brand}` : `Change stage · ${brand}`;
  async function save(e?: React.FormEvent) {
    e?.preventDefault();
    if (stage === 'lost' && !reason) { setErr('Choose a reason.'); return; }
    if (stage === current) { onClose(); return; }
    setBusy(true);
    try {
      await rpc('set_lead_stage', { p_lead: leadId, p_stage: stage, p_reason: (reason ?? undefined) as LostReason, p_note: note.trim() || undefined });
      toast.success(`Stage set to ${STAGE_LABEL[stage]}.`);
      onSaved();
    } catch (e2) {
      toast.error(friendlyError(e2));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal open onOpenChange={(o) => { if (!o) onClose(); }} size="sm" title={title} onSubmit={save}
      description={action === 'dnc' ? 'Calls and WhatsApp will be switched off and every open follow-up cancelled.' : action === 'won' ? 'Open follow-ups will be closed.' : undefined}
      footer={<><Btn variant="secondary" onClick={onClose}>Cancel</Btn><Btn type="submit" variant={action === 'dnc' || stage === 'lost' ? 'danger' : 'primary'} disabled={busy}>{busy ? 'Saving…' : 'Confirm'}</Btn></>}>
      <div className="space-y-4">
        {action === 'reopen' ? (
          <Field label="Stage">
            {({ id }) => (
              <select id={id} value={stage} onChange={(e) => setStage(e.target.value as LeadStage)} className={inputClass}>
                {STAGES.map((s) => <option key={s} value={s}>{STAGE_LABEL[s]}</option>)}
              </select>
            )}
          </Field>
        ) : null}
        {stage === 'lost' ? (
          <ChoiceChips label="Reason" value={reason} onChange={setReason}
            options={[...NOT_INTERESTED_REASONS, 'price', 'scope', 'chose_competitor', 'no_response'].filter((v, i, a) => a.indexOf(v) === i)
              .map((r) => ({ value: r as LostReason, label: LOST_REASON_LABEL[r as LostReason] }))} />
        ) : null}
        <Field label="Note (optional)">{({ id }) => <textarea id={id} rows={2} value={note} maxLength={2000} onChange={(e) => setNote(e.target.value)} className={inputClass} />}</Field>
        {err ? <p role="alert" className="text-sm font-medium text-destructive">{err}</p> : null}
      </div>
    </Modal>
  );
}
