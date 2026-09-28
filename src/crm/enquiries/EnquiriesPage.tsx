'use client';
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, Inbox, Mail, MessageCircle, Phone, Search, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useSearchParams } from '@/lib/router';
import { formatPhone, normalizePhone, waNumber } from '@/lib/crm/normalize';
import { useMe } from '../auth/AuthProvider';
import { Badge, Card, EmptyState, ErrorState, PageHeader, Spinner, inputClass } from '../ui/kit';
import { Btn, Modal } from '../ui/Modal';
import { qk, type EnquiryRow } from '../data/hooks';
import { sanitizeSearch } from '../leads/leadsQuery';
import { formatDateTime, relative } from '../lib/time';
import { friendlyError } from '../lib/errors';
import { cn } from '@/components/ui/utils';

const PAGE = 20;
type State = 'open' | 'converted' | 'all';

export function EnquiriesPage() {
  const { isAdmin } = useMe();
  const qc = useQueryClient();
  const [sp, setSp] = useSearchParams();
  const state: State = sp.get('state') === 'converted' || sp.get('state') === 'all' ? (sp.get('state') as State) : 'open';
  const kind = sp.get('kind') === 'callback' || sp.get('kind') === 'query' ? sp.get('kind') as 'callback' | 'query' : '';
  const qText = sp.get('q') ?? '';
  const page = Math.max(1, Number.parseInt(sp.get('page') ?? '1', 10) || 1);
  const [search, setSearch] = useState(qText);
  useEffect(() => setSearch(qText), [qText]);
  const set = (patch: Record<string, string | null>) => {
    const n = new URLSearchParams(sp.toString());
    for (const [k, val] of Object.entries(patch)) { if (val) n.set(k, val); else n.delete(k); }
    if (!('page' in patch)) n.delete('page');
    setSp(n);
  };
  useEffect(() => {
    const t = window.setTimeout(() => { if (search !== qText) set({ q: search || null }); }, 300);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const filters = useMemo(() => ({ state, kind, q: qText, page }), [state, kind, qText, page]);
  const list = useQuery({
    queryKey: qk.enquiries(filters),
    placeholderData: (p) => p,
    queryFn: async () => {
      let b = supabase.from('inbound_enquiries').select('*, converted_lead:leads(id, brand_name)', { count: 'exact' });
      if (state === 'open') b = b.is('converted_lead_id', null);
      if (state === 'converted') b = b.not('converted_lead_id', 'is', null);
      if (kind) b = b.eq('kind', kind);
      const s = sanitizeSearch(qText);
      if (s) b = b.or(`name.ilike.%${s}%,email.ilike.%${s}%,phone.ilike.%${s.replace(/\D/g, '') || s}%,message.ilike.%${s}%`);
      const { data, error, count } = await b.order('created_at', { ascending: false }).order('id').range((page - 1) * PAGE, page * PAGE - 1);
      if (error) throw new Error(error.message);
      return { rows: (data ?? []) as unknown as EnquiryRow[], total: count ?? 0 };
    },
  });
  const [del, setDel] = useState<EnquiryRow | null>(null);
  const rows = list.data?.rows ?? [];
  const total = list.data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE));

  return (
    <>
      <PageHeader title="Enquiries" description="Call-back requests and questions from the website. Convert one to start working it as a lead." />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div role="tablist" aria-label="Status" className="inline-flex rounded-lg border border-border bg-card p-0.5">
          {(['open', 'converted', 'all'] as State[]).map((s) => (
            <button key={s} type="button" role="tab" aria-selected={state === s} onClick={() => set({ state: s === 'open' ? null : s })}
              className={cn('rounded-md px-3 py-1.5 text-sm capitalize', state === s ? 'bg-accent font-medium text-accent-foreground' : 'text-muted-foreground hover:text-foreground')}>
              {s === 'open' ? 'Open' : s === 'converted' ? 'Converted' : 'All'}
            </button>
          ))}
        </div>
        <label className="sr-only" htmlFor="enq-kind">Type</label>
        <select id="enq-kind" value={kind} onChange={(e) => set({ kind: e.target.value || null })} className={cn(inputClass, 'w-auto')}>
          <option value="">All types</option>
          <option value="callback">Call-back requests</option>
          <option value="query">Questions</option>
        </select>
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search enquiries" placeholder="Name, email, phone or text" className={cn(inputClass, 'pl-9')} />
        </div>
      </div>

      <Card>
        {list.isLoading ? <Spinner /> : list.isError ? <ErrorState message={friendlyError(list.error)} onRetry={() => void list.refetch()} /> : rows.length === 0 ? (
          <EmptyState icon={<Inbox className="size-8" />} title={state === 'open' ? 'No open enquiries' : 'Nothing here'}>
            {state === 'open' ? 'New website enquiries appear here as soon as they’re submitted.' : 'Try another filter.'}
          </EmptyState>
        ) : (
          <>
            <ul className="divide-y divide-border">
              {rows.map((e) => {
                const phone = normalizePhone(e.phone);
                return (
                  <li key={e.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{e.name}</span>
                        <Badge tone={e.kind === 'callback' ? 'violet' : 'info'}>{e.kind === 'callback' ? 'Call-back request' : 'Question'}</Badge>
                        {e.converted_lead ? (
                          <Link href={`/crm/leads/${e.converted_lead.id}`}><Badge tone="green">Lead: {e.converted_lead.brand_name}</Badge></Link>
                        ) : null}
                        <span className="text-xs text-muted-foreground" title={formatDateTime(e.created_at)}>{relative(e.created_at)}</span>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        {e.phone ? <span className="tabular">{phone ? formatPhone(phone) : e.phone}</span> : null}
                        {e.email ? <a href={`mailto:${e.email}`} className="hover:underline">{e.email}</a> : null}
                        {e.best_time ? <span>Best time: {e.best_time}</span> : null}
                      </div>
                      {e.message ? <p className="mt-1.5 line-clamp-3 whitespace-pre-line break-words text-sm">{e.message}</p> : null}
                    </div>
                    <div className="flex shrink-0 flex-wrap items-start gap-1.5">
                      {phone ? (
                        <>
                          <a href={`tel:${phone}`} className="inline-flex size-8 items-center justify-center rounded-lg border border-border hover:bg-muted" aria-label={`Call ${e.name}`} title="Call"><Phone className="size-4" aria-hidden="true" /></a>
                          <a href={`https://wa.me/${waNumber(phone)}`} target="_blank" rel="noopener noreferrer" className="inline-flex size-8 items-center justify-center rounded-lg border border-border hover:bg-muted" aria-label={`WhatsApp ${e.name}`} title="WhatsApp"><MessageCircle className="size-4" aria-hidden="true" /></a>
                        </>
                      ) : null}
                      {e.email ? <a href={`mailto:${e.email}`} className="inline-flex size-8 items-center justify-center rounded-lg border border-border hover:bg-muted" aria-label={`Email ${e.name}`} title="Email"><Mail className="size-4" aria-hidden="true" /></a> : null}
                      {!e.converted_lead_id ? (
                        <Link href={`/crm/leads/new?enquiry=${e.id}`} className="inline-flex h-8 items-center rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90">Convert to lead</Link>
                      ) : null}
                      {isAdmin ? (
                        <button type="button" onClick={() => setDel(e)} className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-destructive" aria-label={`Delete enquiry from ${e.name}`} title="Delete (spam)">
                          <Trash2 className="size-4" aria-hidden="true" />
                        </button>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="flex items-center justify-between border-t border-border px-4 py-2.5 text-sm">
              <span className="text-muted-foreground tabular">{total} enquir{total === 1 ? 'y' : 'ies'}</span>
              <div className="flex items-center gap-1">
                <Btn size="sm" variant="secondary" disabled={page <= 1} onClick={() => set({ page: String(page - 1) })} aria-label="Previous page"><ChevronLeft aria-hidden="true" /></Btn>
                <span className="px-2 tabular">Page {page} of {pages}</span>
                <Btn size="sm" variant="secondary" disabled={page >= pages} onClick={() => set({ page: String(page + 1) })} aria-label="Next page"><ChevronRight aria-hidden="true" /></Btn>
              </div>
            </div>
          </>
        )}
      </Card>

      {del ? (
        <Modal open size="sm" onOpenChange={(o) => { if (!o) setDel(null); }} title="Delete this enquiry?"
          description={`From ${del.name}. This can’t be undone — use it for spam and test entries.`}
          footer={<>
            <Btn variant="secondary" onClick={() => setDel(null)}>Cancel</Btn>
            <Btn variant="danger" onClick={async () => {
              const { error } = await supabase.from('inbound_enquiries').delete().eq('id', del.id);
              if (error) { toast.error(friendlyError(error)); return; }
              toast.success('Enquiry deleted.');
              setDel(null);
              void qc.invalidateQueries({ queryKey: ['enquiries'] });
              void qc.invalidateQueries({ queryKey: ['dashboard'] });
            }}>Delete</Btn>
          </>}>
          <p className="text-sm text-muted-foreground">{del.message ?? 'No message.'}</p>
        </Modal>
      ) : null}
    </>
  );
}
