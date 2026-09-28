'use client';
// Pipeline board: open leads as cards in stage columns. Stages move through
// the call-outcome workflow (so every move has a reason on record), which is
// why cards open the lead instead of being dragged.
import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle } from 'lucide-react';
import type { LeadStage } from '@/lib/database.types';
import { Spinner, ErrorState } from '../ui/kit';
import { OPEN_STAGES, STAGE_LABEL, TASK_LABEL } from '../lib/labels';
import { formatDateTime } from '../lib/time';
import { scoreLead } from '../lib/score';
import { friendlyError } from '../lib/errors';
import { fetchLeads, type LeadListRow } from './useLeadsList';
import type { LeadsQuery } from './leadsQuery';
import { cn } from '@/components/ui/utils';

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

export function PipelineBoard({ q, me, names }: { q: LeadsQuery; me: string; names: Map<string, string> }) {
  const board = useQuery({
    queryKey: ['leads', { board: true, ...q, page: 1, stage: 'open', archived: false }],
    queryFn: () => fetchLeads({ ...q, stage: 'open', archived: false, page: 1 }, me, [0, 499]),
  });
  if (board.isLoading) return <Spinner label="Loading pipeline…" />;
  if (board.isError) return <ErrorState message={friendlyError(board.error)} onRetry={() => void board.refetch()} />;
  const rows = board.data?.rows ?? [];
  const by = new Map<LeadStage, LeadListRow[]>();
  for (const r of rows) {
    const l = by.get(r.stage) ?? [];
    l.push(r);
    by.set(r.stage, l);
  }
  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
      {board.data && board.data.total > rows.length ? (
        <p className="mb-2 text-xs text-muted-foreground">Showing the first {rows.length} of {board.data.total} open leads — narrow with search or owner.</p>
      ) : null}
      <div className="flex min-w-max gap-3">
        {OPEN_STAGES.map((s) => {
          const list = by.get(s) ?? [];
          const value = list.reduce((a, l) => a + (Number(l.deal_value_inr) || 0), 0);
          return (
            <section key={s} aria-label={`${STAGE_LABEL[s]}, ${list.length} leads`} className="w-64 shrink-0 rounded-xl border border-border bg-muted/40 p-2">
              <h2 className="flex items-baseline justify-between px-1 pb-2 text-xs font-semibold">
                <span>{STAGE_LABEL[s]} <span className="font-normal text-muted-foreground">· {list.length}</span></span>
                {value > 0 ? <span className="font-normal text-muted-foreground tabular">{inr.format(value)}</span> : null}
              </h2>
              <ul className="max-h-[65vh] space-y-2 overflow-y-auto">
                {list.map((l) => {
                  const overdue = l.next_action_at && new Date(l.next_action_at).getTime() < Date.now();
                  const sc = scoreLead(l);
                  return (
                    <li key={l.id}>
                      <Link href={`/crm/leads/${l.id}`} className="block rounded-lg border border-border bg-card p-2.5 text-sm shadow-xs hover:border-primary/40">
                        <span className="flex items-start justify-between gap-2">
                          <span className="font-medium leading-5">{l.brand_name}</span>
                          {sc ? <span className="text-[11px] font-semibold text-muted-foreground tabular" title={sc.reasons.join('\n')}>{sc.value}</span> : null}
                        </span>
                        {l.next_action_at && l.next_action_type ? (
                          <span className={cn('mt-1 flex items-center gap-1 text-xs', overdue ? 'font-medium text-destructive' : 'text-muted-foreground')}>
                            {overdue ? <AlertTriangle className="size-3" aria-hidden="true" /> : null}
                            {TASK_LABEL[l.next_action_type]} · {formatDateTime(l.next_action_at)}
                          </span>
                        ) : <span className="mt-1 block text-xs text-muted-foreground">No next step</span>}
                        {l.owner_id && l.owner_id !== me ? <span className="mt-1 block text-xs text-muted-foreground">{names.get(l.owner_id) ?? ''}</span> : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
