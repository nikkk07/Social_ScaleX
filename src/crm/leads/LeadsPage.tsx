'use client';
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  AlertTriangle, ChevronLeft, ChevronRight, Download, MessageCircle, Phone, Search, Upload, UserPlus, X,
} from 'lucide-react';
import { useSearchParams } from '@/lib/router';
import { supabase } from '@/lib/supabase';
import { useMe } from '../auth/AuthProvider';
import { Badge, Card, EmptyState, ErrorState, PageHeader, Spinner, inputClass } from '../ui/kit';
import { Btn, Modal } from '../ui/Modal';
import { invalidateCrm, useProfiles } from '../data/hooks';
import {
  DEFAULT_LEADS_QUERY, PAGE_SIZE, hasFilters, leadsQueryToParams, parseLeadsQuery, toCsv, type LeadsQuery,
} from './leadsQuery';
import { fetchAllLeads, useLeadsList, type LeadListRow } from './useLeadsList';
import { OPEN_STAGES, SOURCE_LABEL, STAGES, STAGE_LABEL, STAGE_TONE, TASK_LABEL, LOST_REASON_LABEL } from '../lib/labels';
import { formatDateTime, relative, todayKey } from '../lib/time';
import { scoreLead } from '../lib/score';
import { asJson, rpc } from '../lib/api';
import { friendlyError } from '../lib/errors';
import { useContactLead } from '../outcome/useContactLead';
import { ImportDialog } from './ImportDialog';
import { PipelineBoard } from './PipelineBoard';
import { LayoutGrid, List as ListIcon } from 'lucide-react';
import { cn } from '@/components/ui/utils';

export function LeadsPage() {
  const { id: me, isAdmin } = useMe();
  const qc = useQueryClient();
  const [sp, setSp] = useSearchParams();
  const spKey = sp.toString();
  const q = useMemo(() => parseLeadsQuery(new URLSearchParams(spKey)), [spKey]);
  const view = sp.get('view') === 'board' ? 'board' : 'list';
  const list = useLeadsList(q, me);
  const profilesData = useProfiles().data;
  const profiles = useMemo(() => profilesData ?? [], [profilesData]);
  const names = useMemo(() => new Map(profiles.map((p) => [p.id, p.name])), [profiles]);
  const { contact, pickerEl } = useContactLead();

  const [search, setSearch] = useState(q.q);
  useEffect(() => setSearch(q.q), [q.q]);
  const setQ = (next: LeadsQuery) => {
    const p = leadsQueryToParams(next);
    if (view === 'board') p.set('view', 'board');
    setSp(p);
  };
  const update = (patch: Partial<LeadsQuery>) => setQ({ ...q, page: 1, ...patch });
  useEffect(() => {
    const t = window.setTimeout(() => { if (search !== q.q) update({ q: search }); }, 300);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  useEffect(() => setSelected(new Set()), [spKey]);
  const [bulk, setBulk] = useState<'assign' | 'archive' | null>(null);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const rows = list.data?.rows ?? [];
  const total = list.data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  async function exportCsv() {
    setExporting(true);
    try {
      const all = await fetchAllLeads(q, me);
      const csv = toCsv(
        ['Brand', 'Instagram', 'Stage', 'Lost reason', 'Owner', 'Source', 'Next action', 'Next action at (IST)', 'Attempts', 'Last spoke', 'Deal value (INR)', 'Created'],
        all.map((l) => [
          l.brand_name, l.instagram_username ?? '', STAGE_LABEL[l.stage], l.lost_reason ? LOST_REASON_LABEL[l.lost_reason] : '',
          l.owner_id ? names.get(l.owner_id) ?? '' : 'Unassigned', SOURCE_LABEL[l.source],
          l.next_action_type ? TASK_LABEL[l.next_action_type] : '', l.next_action_at ? formatDateTime(l.next_action_at) : '',
          l.attempt_count, l.last_connected_at ? formatDateTime(l.last_connected_at) : '', l.deal_value_inr ?? '',
          formatDateTime(l.created_at),
        ]),
      );
      await rpc('log_export', { p_count: all.length, p_filters: asJson(q) });
      const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leads-${todayKey()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${all.length} lead${all.length === 1 ? '' : 's'}.`);
    } catch (e) {
      toast.error(friendlyError(e));
    } finally {
      setExporting(false);
    }
  }

  const allOnPage = rows.length > 0 && rows.every((r) => selected.has(r.id));

  return (
    <>
      <PageHeader
        title="Leads"
        description={isAdmin ? 'Every lead in the CRM.' : 'Leads assigned to you.'}
        actions={
          <>
            <Btn variant="secondary" onClick={exportCsv} disabled={exporting || total === 0}><Download aria-hidden="true" />{exporting ? 'Exporting…' : 'Export'}</Btn>
            {isAdmin ? <Btn variant="secondary" onClick={() => setImporting(true)}><Upload aria-hidden="true" />Import</Btn> : null}
            <Link href="/crm/leads/new" className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              <UserPlus className="size-4" aria-hidden="true" /> Add lead
            </Link>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search leads"
            placeholder="Brand, @handle, city or phone" className={cn(inputClass, 'pl-9')} />
        </div>
        <label className="sr-only" htmlFor="f-stage">Stage</label>
        <select id="f-stage" value={q.stage} onChange={(e) => update({ stage: e.target.value as LeadsQuery['stage'] })} className={cn(inputClass, 'w-auto')}>
          <option value="open">Open pipeline</option>
          <option value="all">All stages</option>
          {STAGES.map((s) => <option key={s} value={s}>{STAGE_LABEL[s]}</option>)}
        </select>
        {isAdmin ? (
          <>
            <label className="sr-only" htmlFor="f-owner">Owner</label>
            <select id="f-owner" value={q.owner} onChange={(e) => update({ owner: e.target.value })} className={cn(inputClass, 'w-auto')}>
              <option value="">Any owner</option>
              <option value="me">Mine</option>
              <option value="none">Unassigned</option>
              {profiles.map((p) => <option key={p.id} value={p.id}>{p.name}{p.is_active ? '' : ' (inactive)'}</option>)}
            </select>
          </>
        ) : null}
        <label className="sr-only" htmlFor="f-sort">Sort</label>
        <select id="f-sort" value={q.sort} onChange={(e) => update({ sort: e.target.value as LeadsQuery['sort'] })} className={cn(inputClass, 'w-auto')}>
          <option value="next_action">Next action first</option>
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="recent_activity">Recently contacted</option>
          <option value="brand">Brand A–Z</option>
        </select>
        {isAdmin ? (
          <label className="flex items-center gap-2 px-1 text-sm text-muted-foreground">
            <input type="checkbox" checked={q.archived} onChange={(e) => update({ archived: e.target.checked })} className="size-4 accent-[var(--primary)]" />
            Archived
          </label>
        ) : null}
        {hasFilters(q) ? (
          <button type="button" onClick={() => setQ(DEFAULT_LEADS_QUERY)} className="inline-flex items-center gap-1 px-2 text-sm text-muted-foreground hover:text-foreground">
            <X className="size-3.5" aria-hidden="true" /> Clear
          </button>
        ) : null}
      </div>

      <div role="tablist" aria-label="View" className="mb-3 inline-flex rounded-lg border border-border bg-card p-0.5">
        {([['list', 'List', <ListIcon key="l" className="size-4" />], ['board', 'Board', <LayoutGrid key="b" className="size-4" />]] as const).map(([v, label, icon]) => (
          <button key={v} type="button" role="tab" aria-selected={view === v}
            onClick={() => { const n = new URLSearchParams(sp.toString()); if (v === 'board') n.set('view', 'board'); else n.delete('view'); setSp(n); }}
            className={cn('inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm', view === v ? 'bg-accent font-medium text-accent-foreground' : 'text-muted-foreground hover:text-foreground')}>
            <span aria-hidden="true">{icon}</span>{label}
          </button>
        ))}
      </div>

      {view === 'board' ? <PipelineBoard q={q} me={me} names={names} /> : null}

      {view === 'list' && isAdmin && selected.size > 0 ? (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-primary/30 bg-accent px-4 py-2 text-sm">
          <span className="font-medium">{selected.size} selected</span>
          <Btn size="sm" variant="secondary" onClick={() => setBulk('assign')}>Assign…</Btn>
          {!q.archived ? <Btn size="sm" variant="secondary" onClick={() => setBulk('archive')}>Archive</Btn> : null}
          <button type="button" onClick={() => setSelected(new Set())} className="ml-auto text-xs text-muted-foreground hover:underline">Clear selection</button>
        </div>
      ) : null}

      {view === 'list' ? <Card>
        {list.isLoading ? <Spinner label="Loading leads…" /> : list.isError ? (
          <ErrorState message={friendlyError(list.error)} onRetry={() => void list.refetch()} />
        ) : rows.length === 0 ? (
          <EmptyState title={hasFilters(q) ? 'No leads match these filters' : 'No leads yet'}
            action={<Link href="/crm/leads/new" className="text-sm font-medium text-primary hover:underline">Add a lead</Link>}>
            {hasFilters(q) ? 'Try clearing a filter or searching for something else.' : isAdmin ? 'Add one, import a sheet, or convert a website enquiry.' : 'New leads are assigned to you each morning.'}
          </EmptyState>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <caption className="sr-only">Leads, {total} total</caption>
                <thead className="border-b border-border text-left text-xs text-muted-foreground">
                  <tr>
                    {isAdmin ? (
                      <th scope="col" className="w-10 px-4 py-2">
                        <input type="checkbox" aria-label="Select all on this page" checked={allOnPage}
                          onChange={(e) => setSelected(e.target.checked ? new Set(rows.map((r) => r.id)) : new Set())}
                          className="size-4 accent-[var(--primary)]" />
                      </th>
                    ) : null}
                    <th scope="col" className="px-4 py-2 font-medium">Brand</th>
                    <th scope="col" className="px-4 py-2 font-medium">Stage</th>
                    <th scope="col" className="px-4 py-2 font-medium">Next action</th>
                    {isAdmin ? <th scope="col" className="px-4 py-2 font-medium">Owner</th> : null}
                    <th scope="col" className="px-4 py-2 font-medium">Last spoke</th>
                    <th scope="col" className="px-4 py-2 text-right font-medium"><span className="sr-only">Contact</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rows.map((l) => (
                    <LeadRow key={l.id} l={l} admin={isAdmin} owner={l.owner_id ? names.get(l.owner_id) ?? '—' : 'Unassigned'}
                      selected={selected.has(l.id)}
                      onSelect={(on) => setSelected((s) => { const n = new Set(s); if (on) n.add(l.id); else n.delete(l.id); return n; })}
                      onCall={(ch) => void contact(l, ch)} />
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobile cards */}
            <ul className="divide-y divide-border md:hidden">
              {rows.map((l) => (
                <li key={l.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <Link href={`/crm/leads/${l.id}`} className="block truncate font-medium">{l.brand_name}</Link>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <Badge tone={STAGE_TONE[l.stage]}>{STAGE_LABEL[l.stage]}</Badge>
                      <NextAction l={l} />
                    </div>
                  </div>
                  {!l.dnc && !l.deleted_at ? (
                    <>
                      <Btn size="sm" onClick={() => void contact(l, 'call')} aria-label={`Call ${l.brand_name}`}><Phone aria-hidden="true" /></Btn>
                      <Btn size="sm" variant="secondary" onClick={() => void contact(l, 'whatsapp')} aria-label={`WhatsApp ${l.brand_name}`}><MessageCircle aria-hidden="true" /></Btn>
                    </>
                  ) : null}
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-2.5 text-sm">
              <span className="text-muted-foreground tabular">
                {(q.page - 1) * PAGE_SIZE + 1}–{Math.min(q.page * PAGE_SIZE, total)} of {total}
                {list.isFetching ? ' · updating…' : ''}
              </span>
              <div className="flex items-center gap-1">
                <Btn size="sm" variant="secondary" disabled={q.page <= 1} onClick={() => setQ({ ...q, page: q.page - 1 })} aria-label="Previous page"><ChevronLeft aria-hidden="true" /></Btn>
                <span className="px-2 tabular" aria-live="polite">Page {q.page} of {pages}</span>
                <Btn size="sm" variant="secondary" disabled={q.page >= pages} onClick={() => setQ({ ...q, page: q.page + 1 })} aria-label="Next page"><ChevronRight aria-hidden="true" /></Btn>
              </div>
            </div>
          </>
        )}
      </Card> : null}

      {bulk ? (
        <BulkDialog kind={bulk} ids={[...selected]} onClose={() => setBulk(null)}
          onDone={() => { setBulk(null); setSelected(new Set()); invalidateCrm(qc); }} />
      ) : null}
      {importing ? <ImportDialog onClose={() => setImporting(false)} onDone={() => invalidateCrm(qc)} /> : null}
      {pickerEl}
    </>
  );
}

function NextAction({ l }: { l: LeadListRow }) {
  if (!l.next_action_at || !l.next_action_type) return <span className="text-muted-foreground">—</span>;
  const overdue = new Date(l.next_action_at).getTime() < Date.now();
  return (
    <span className={cn('inline-flex items-center gap-1', overdue && 'font-medium text-destructive')}>
      {overdue ? <AlertTriangle className="size-3.5" aria-hidden="true" /> : null}
      {TASK_LABEL[l.next_action_type]} · {formatDateTime(l.next_action_at)}
      {overdue ? <span className="sr-only">(overdue)</span> : null}
    </span>
  );
}

function LeadRow({ l, admin, owner, selected, onSelect, onCall }: {
  l: LeadListRow; admin: boolean; owner: string; selected: boolean; onSelect: (on: boolean) => void;
  onCall: (ch: 'call' | 'whatsapp') => void;
}) {
  const score = scoreLead(l);
  const primary = l.contacts.find((c) => c.is_primary) ?? l.contacts[0];
  return (
    <tr className={cn('hover:bg-muted/50', selected && 'bg-accent/50')}>
      {admin ? (
        <td className="px-4 py-2.5">
          <input type="checkbox" aria-label={`Select ${l.brand_name}`} checked={selected} onChange={(e) => onSelect(e.target.checked)} className="size-4 accent-[var(--primary)]" />
        </td>
      ) : null}
      <td className="max-w-72 px-4 py-2.5">
        <Link href={`/crm/leads/${l.id}`} className="block truncate font-medium hover:underline">{l.brand_name}</Link>
        <span className="block truncate text-xs text-muted-foreground">
          {[l.instagram_username ? `@${l.instagram_username}` : null, primary?.name, l.address].filter(Boolean).join(' · ') || SOURCE_LABEL[l.source]}
        </span>
      </td>
      <td className="px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <Badge tone={STAGE_TONE[l.stage]}>{STAGE_LABEL[l.stage]}</Badge>
          {score ? (
            <span title={score.reasons.join('\n')} className={cn('rounded px-1 text-[11px] font-semibold tabular',
              score.band === 'hot' ? 'text-emerald-700 dark:text-emerald-300' : score.band === 'warm' ? 'text-amber-700 dark:text-amber-300' : 'text-muted-foreground')}>
              {score.value}<span className="sr-only"> lead score, {score.band}</span>
            </span>
          ) : null}
        </div>
      </td>
      <td className="px-4 py-2.5 text-xs"><NextAction l={l} /></td>
      {admin ? <td className="px-4 py-2.5 text-xs text-muted-foreground">{owner}</td> : null}
      <td className="px-4 py-2.5 text-xs text-muted-foreground">
        {l.last_connected_at ? relative(l.last_connected_at) : l.attempt_count ? `${l.attempt_count} attempt${l.attempt_count === 1 ? '' : 's'}` : 'Never'}
      </td>
      <td className="px-4 py-2.5">
        {!l.dnc && !l.deleted_at && (OPEN_STAGES as readonly string[]).concat(['won', 'lost']).includes(l.stage) ? (
          <div className="flex justify-end gap-1">
            <Btn size="sm" variant="ghost" onClick={() => onCall('call')} aria-label={`Call ${l.brand_name}`} title="Call"><Phone aria-hidden="true" /></Btn>
            <Btn size="sm" variant="ghost" onClick={() => onCall('whatsapp')} aria-label={`WhatsApp ${l.brand_name}`} title="WhatsApp"><MessageCircle aria-hidden="true" /></Btn>
          </div>
        ) : null}
      </td>
    </tr>
  );
}

function BulkDialog({ kind, ids, onClose, onDone }: { kind: 'assign' | 'archive'; ids: string[]; onClose: () => void; onDone: () => void }) {
  const profiles = (useProfiles().data ?? []).filter((p) => p.is_active);
  const [owner, setOwner] = useState('');
  const [busy, setBusy] = useState(false);
  async function run(e?: React.FormEvent) {
    e?.preventDefault();
    setBusy(true);
    try {
      if (kind === 'assign') {
        const n = await rpc('reassign_leads', { p_leads: ids, p_owner: (owner || null) as string });
        toast.success(`${n} lead${n === 1 ? '' : 's'} ${owner ? 'assigned' : 'moved to the unassigned pool'}.`);
      } else {
        const { error } = await supabase.from('leads').update({ deleted_at: new Date().toISOString() }).in('id', ids);
        if (error) throw new Error(error.message);
        toast.success(`${ids.length} lead${ids.length === 1 ? '' : 's'} archived.`);
      }
      onDone();
    } catch (e2) {
      toast.error(friendlyError(e2));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal open onOpenChange={(o) => { if (!o) onClose(); }} size="sm" onSubmit={run}
      title={kind === 'assign' ? `Assign ${ids.length} lead${ids.length === 1 ? '' : 's'}` : `Archive ${ids.length} lead${ids.length === 1 ? '' : 's'}?`}
      description={kind === 'archive' ? 'Archived leads leave every list and queue. You can restore them from the Archived filter.' : 'Open follow-ups move to the new owner.'}
      footer={<><Btn variant="secondary" onClick={onClose}>Cancel</Btn><Btn type="submit" variant={kind === 'archive' ? 'danger' : 'primary'} disabled={busy}>{busy ? 'Working…' : kind === 'assign' ? 'Assign' : 'Archive'}</Btn></>}>
      {kind === 'assign' ? (
        <label className="block space-y-1.5 text-sm">
          <span className="font-medium">New owner</span>
          <select value={owner} onChange={(e) => setOwner(e.target.value)} className={inputClass}>
            <option value="">Unassigned (pool)</option>
            {profiles.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </label>
      ) : null}
    </Modal>
  );
}
