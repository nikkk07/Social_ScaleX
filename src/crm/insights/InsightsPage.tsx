'use client';
// Sales insights. Every chart here is a single series in one hue with the
// value printed beside it, so nothing relies on colour; each is a real
// <table> for screen readers. The heatmap uses one hue, light → dark.
import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useMe } from '../auth/AuthProvider';
import { Card, CardHeader, EmptyState, ErrorState, KpiTile, PageHeader, Spinner, inputClass } from '../ui/kit';
import { qk, useProfiles } from '../data/hooks';
import { rpc } from '../lib/api';
import { friendlyError } from '../lib/errors';
import { LOST_REASON_LABEL, OUTCOME_LABEL, RESULT_LABEL, STAGES, STAGE_LABEL } from '../lib/labels';
import { addDaysKey, todayKey } from '../lib/time';
import type { AttemptResult, ConnectOutcome, LeadStage, LostReason } from '@/lib/database.types';
import { cn } from '@/components/ui/utils';

interface Insights {
  calls: number; connected: number; whatsapp: number;
  results: Partial<Record<AttemptResult, number>>;
  outcomes: Partial<Record<ConnectOutcome, number>>;
  funnel: { new_leads: number; connected: number; interested: number; meetings_held: number; quotes_sent: number; won: number };
  meetings: { held: number; no_show: number };
  quotes: { sent: number; accepted: number; rejected: number; value_won: number };
  lost_reasons: Partial<Record<LostReason, number>>;
  pipeline: Partial<Record<LeadStage, number>>;
  heatmap: { dow: number; hour: number; calls: number; connected: number }[];
  members: { id: string; name: string; calls: number; connected: number; interested: number; won: number; overdue: number }[] | null;
}

type Range = '7' | '30' | 'month' | 'custom';
const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const pct = (a: number, b: number) => (b > 0 ? `${Math.round((a / b) * 100)}%` : '—');

export function InsightsPage() {
  const { isAdmin } = useMe();
  const profiles = (useProfiles().data ?? []).filter((p) => p.is_active);
  const [range, setRange] = useState<Range>('30');
  const [from, setFrom] = useState(addDaysKey(todayKey(), -29));
  const [to, setTo] = useState(todayKey());
  const [member, setMember] = useState('');

  const [f, t] = useMemo(() => {
    const today = todayKey();
    if (range === '7') return [addDaysKey(today, -6), today];
    if (range === '30') return [addDaysKey(today, -29), today];
    if (range === 'month') return [today.slice(0, 8) + '01', today];
    return [from, to];
  }, [range, from, to]);

  const q = useQuery({
    queryKey: qk.insights({ f, t, member }),
    queryFn: async () => (await rpc('crm_insights', { p_from: f, p_to: t, p_member: (member || undefined) as string })) as unknown as Insights,
    enabled: f <= t,
  });
  const d = q.data;

  return (
    <>
      <PageHeader title="Insights" description={isAdmin ? 'How the team is converting, and where leads drop off.' : 'How your calls are converting.'} />
      <div className="mb-5 flex flex-wrap items-end gap-2">
        <div role="tablist" aria-label="Date range" className="inline-flex rounded-lg border border-border bg-card p-0.5">
          {([['7', 'Last 7 days'], ['30', 'Last 30 days'], ['month', 'This month'], ['custom', 'Custom']] as [Range, string][]).map(([v, label]) => (
            <button key={v} type="button" role="tab" aria-selected={range === v} onClick={() => setRange(v)}
              className={cn('rounded-md px-3 py-1.5 text-sm', range === v ? 'bg-accent font-medium text-accent-foreground' : 'text-muted-foreground hover:text-foreground')}>
              {label}
            </button>
          ))}
        </div>
        {range === 'custom' ? (
          <>
            <label className="text-sm">From <input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} className={cn(inputClass, 'inline-block w-auto')} /></label>
            <label className="text-sm">To <input type="date" value={to} min={from} max={todayKey()} onChange={(e) => setTo(e.target.value)} className={cn(inputClass, 'inline-block w-auto')} /></label>
          </>
        ) : null}
        {isAdmin ? (
          <>
            <label className="sr-only" htmlFor="ins-member">Team member</label>
            <select id="ins-member" value={member} onChange={(e) => setMember(e.target.value)} className={cn(inputClass, 'w-auto')}>
              <option value="">Whole team</option>
              {profiles.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </>
        ) : null}
      </div>

      {q.isLoading ? <Spinner /> : q.isError ? <ErrorState message={friendlyError(q.error)} onRetry={() => void q.refetch()} /> : !d ? null : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <KpiTile label="Calls made" value={d.calls} hint={`${d.whatsapp} WhatsApp too`} />
            <KpiTile label="Connect rate" value={pct(d.connected, d.calls + d.whatsapp)} hint={`${d.connected} conversations`} />
            <KpiTile label="Meeting show-up" value={pct(d.meetings.held, d.meetings.held + d.meetings.no_show)} hint={`${d.meetings.held} held · ${d.meetings.no_show} no-show`} />
            <KpiTile label="Quote win rate" value={pct(d.quotes.accepted, d.quotes.accepted + d.quotes.rejected)} hint={`${inr.format(d.quotes.value_won)} won`} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader title="Funnel" description="Leads reaching each step in this period" />
              <Bars caption="Funnel" rows={[
                ['New leads', d.funnel.new_leads], ['Spoke to', d.funnel.connected], ['Interested', d.funnel.interested],
                ['Meetings held', d.funnel.meetings_held], ['Quotes sent', d.funnel.quotes_sent], ['Won', d.funnel.won],
              ]} />
            </Card>
            <Card>
              <CardHeader title="Call results" />
              <Bars caption="Call results" sort rows={(Object.keys(RESULT_LABEL) as AttemptResult[]).map((k) => [RESULT_LABEL[k], d.results[k] ?? 0])} />
            </Card>
            <Card>
              <CardHeader title="What clients said" description="When a call connected" />
              <Bars caption="Outcomes" sort rows={(Object.keys(OUTCOME_LABEL) as ConnectOutcome[]).map((k) => [OUTCOME_LABEL[k], d.outcomes[k] ?? 0])} />
            </Card>
            <Card>
              <CardHeader title="Why leads were lost" />
              <Bars caption="Lost reasons" sort rows={(Object.keys(LOST_REASON_LABEL) as LostReason[]).map((k) => [LOST_REASON_LABEL[k], d.lost_reasons[k] ?? 0])} />
            </Card>
          </div>

          <Card>
            <CardHeader title="Best time to call" description="Share of calls answered, by weekday and hour (IST). Darker = more answered." />
            <Heatmap cells={d.heatmap} />
          </Card>

          <Card>
            <CardHeader title="Pipeline now" description={member ? 'Leads owned by this member' : isAdmin ? 'All open and closed leads' : 'Your leads'} />
            <Bars caption="Pipeline by stage" rows={STAGES.map((s) => [STAGE_LABEL[s], d.pipeline[s] ?? 0])} />
          </Card>

          {d.members && d.members.length ? (
            <Card>
              <CardHeader title="Team" description="In this period · overdue is as of now" />
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <caption className="sr-only">Team performance</caption>
                  <thead className="border-b border-border text-left text-xs text-muted-foreground">
                    <tr>{['Member', 'Calls', 'Spoke to', 'Connect rate', 'Interested', 'Won', 'Overdue'].map((h) => <th key={h} scope="col" className="px-4 py-2 font-medium">{h}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-border tabular">
                    {d.members.map((m) => (
                      <tr key={m.id}>
                        <th scope="row" className="px-4 py-2.5 text-left font-medium">{m.name}</th>
                        <td className="px-4 py-2.5">{m.calls}</td>
                        <td className="px-4 py-2.5">{m.connected}</td>
                        <td className="px-4 py-2.5">{pct(m.connected, m.calls)}</td>
                        <td className="px-4 py-2.5">{m.interested}</td>
                        <td className="px-4 py-2.5">{m.won}</td>
                        <td className={cn('px-4 py-2.5', m.overdue > 0 && 'font-semibold text-destructive')}>{m.overdue}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : null}
        </div>
      )}
    </>
  );
}

function Bars({ rows, caption, sort = false }: { rows: [string, number][]; caption: string; sort?: boolean }) {
  const data = (sort ? [...rows].sort((a, b) => b[1] - a[1]) : rows).filter((r) => !sort || r[1] > 0);
  const max = Math.max(1, ...data.map((r) => r[1]));
  if (!data.length || data.every((r) => r[1] === 0)) return <EmptyState title="No data in this period" />;
  return (
    <table className="w-full text-sm">
      <caption className="sr-only">{caption}</caption>
      <tbody>
        {data.map(([label, value]) => (
          <tr key={label} title={`${label}: ${value}`} className="group">
            <th scope="row" className="w-44 py-1.5 pl-4 pr-3 text-left text-xs font-normal text-muted-foreground">{label}</th>
            <td className="py-1.5 pr-2">
              <div className="h-3.5 rounded-r bg-muted">
                <div className="h-3.5 rounded-r bg-primary transition-[width] group-hover:opacity-80" style={{ width: `${(value / max) * 100}%`, minWidth: value > 0 ? 3 : 0 }} />
              </div>
            </td>
            <td className="w-12 py-1.5 pr-4 text-right text-xs font-medium tabular">{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function Heatmap({ cells }: { cells: Insights['heatmap'] }) {
  const hours = useMemo(() => {
    const hs = cells.map((c) => c.hour);
    const lo = Math.min(9, ...hs);
    const hi = Math.max(20, ...hs);
    return Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
  }, [cells]);
  if (!cells.length) return <EmptyState title="No calls in this period" />;
  const map = new Map(cells.map((c) => [`${c.dow}-${c.hour}`, c]));
  return (
    <div className="overflow-x-auto px-4 pb-4 pt-2">
      <table className="text-xs">
        <caption className="sr-only">Answer rate by weekday and hour. Each cell shows answered over total calls.</caption>
        <thead>
          <tr>
            <th scope="col" className="w-10" />
            {hours.map((h) => <th key={h} scope="col" className="px-0.5 pb-1 text-center font-normal text-muted-foreground">{h % 12 === 0 ? 12 : h % 12}{h < 12 ? 'a' : 'p'}</th>)}
          </tr>
        </thead>
        <tbody>
          {DOW.map((name, i) => (
            <tr key={name}>
              <th scope="row" className="pr-2 text-left font-normal text-muted-foreground">{name}</th>
              {hours.map((h) => {
                const c = map.get(`${i + 1}-${h}`);
                const rate = c && c.calls ? c.connected / c.calls : 0;
                return (
                  <td key={h} className="p-0.5">
                    <div
                      title={c ? `${name} ${h}:00 — ${c.connected}/${c.calls} answered (${Math.round(rate * 100)}%)` : `${name} ${h}:00 — no calls`}
                      className="flex size-8 items-center justify-center rounded text-[10px] tabular"
                      style={{
                        background: c ? `color-mix(in oklab, var(--primary) ${Math.round(12 + rate * 78)}%, var(--card))` : 'var(--muted)',
                        color: c && rate > 0.6 ? 'var(--primary-foreground)' : c ? 'var(--foreground)' : 'var(--muted-foreground)',
                      }}
                    >
                      {c ? `${Math.round(rate * 100)}` : ''}
                      <span className="sr-only">{c ? `% answered of ${c.calls} calls` : 'no calls'}</span>
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
