'use client';
import React, { useMemo } from 'react';
import Link from 'next/link';
import { CalendarCheck2, CheckCircle2, List, CalendarRange, Users } from 'lucide-react';
import type { TaskType } from '@/lib/database.types';
import { useSearchParams } from '@/lib/router';
import { useMe } from '../auth/AuthProvider';
import { Badge, Card, EmptyState, ErrorState, PageHeader, Spinner } from '../ui/kit';
import { useProfiles, useTasks, type TaskFilter, type TaskRow } from '../data/hooks';
import { TaskItem } from '../tasks/TaskItem';
import { TASK_LABEL, TASK_TONE } from '../lib/labels';
import { addDaysKey, formatDate, formatTime, istDateKey, istDayStart, todayKey } from '../lib/time';
import { cn } from '@/components/ui/utils';

type When = 'due' | 'tomorrow' | 'week' | 'upcoming' | 'done';
type View = 'list' | 'week' | 'member';

const WHEN: { v: When; label: string }[] = [
  { v: 'due', label: 'Overdue & today' },
  { v: 'tomorrow', label: 'Tomorrow' },
  { v: 'week', label: 'Next 7 days' },
  { v: 'upcoming', label: 'All upcoming' },
  { v: 'done', label: 'Done (7 days)' },
];
const TYPES: TaskType[] = ['callback', 'meeting', 'follow_up', 'quote_follow_up', 'retry_call', 're_engage', 'nurture'];

function filterFor(when: When, types: TaskType[], member: string | undefined): TaskFilter {
  const t = todayKey();
  const tomorrow = istDayStart(addDaysKey(t, 1));
  const dayAfter = istDayStart(addDaysKey(t, 2));
  const week = istDayStart(addDaysKey(t, 7));
  switch (when) {
    case 'due': return { status: 'open', to: tomorrow, types, assignee: member };
    case 'tomorrow': return { status: 'open', from: tomorrow, to: dayAfter, types, assignee: member };
    case 'week': return { status: 'open', to: week, types, assignee: member };
    case 'upcoming': return { status: 'open', types, assignee: member };
    case 'done': return { status: 'done', from: istDayStart(addDaysKey(t, -7)), types, assignee: member };
  }
}

export function FollowUpsPage() {
  const { profile, isAdmin } = useMe();
  const [sp, setSp] = useSearchParams();
  const rawWhen = sp.get('when');
  const when: When = rawWhen === 'overdue' || rawWhen === 'today' ? 'due' : (WHEN.some((w) => w.v === rawWhen) ? rawWhen as When : 'due');
  const view: View = sp.get('view') === 'week' ? 'week' : sp.get('view') === 'member' && isAdmin ? 'member' : 'list';
  const types = (sp.get('type') ?? '').split(',').filter((x): x is TaskType => (TYPES as string[]).includes(x));
  const memberParam = sp.get('member') ?? '';
  const member = isAdmin ? (memberParam || undefined) : profile.id;

  const effectiveWhen: When = view === 'week' ? 'week' : when;
  const tasks = useTasks(filterFor(effectiveWhen, types, member));
  const profilesData = useProfiles().data;
  const profiles = useMemo(() => profilesData ?? [], [profilesData]);
  const names = useMemo(() => new Map(profiles.map((p) => [p.id, p.name])), [profiles]);

  const set = (k: string, v: string | null) => {
    const n = new URLSearchParams(sp.toString());
    if (v) n.set(k, v); else n.delete(k);
    setSp(n);
  };
  const toggleType = (t: TaskType) => {
    const s = new Set(types);
    if (s.has(t)) s.delete(t); else s.add(t);
    set('type', [...s].join(',') || null);
  };

  const rows = tasks.data ?? [];

  return (
    <>
      <PageHeader title="Follow-ups" description="Call-backs, meetings and every scheduled next step, in India time." />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div role="tablist" aria-label="View" className="inline-flex rounded-lg border border-border bg-card p-0.5">
          {([
            { v: 'list', label: 'List', icon: <List className="size-4" /> },
            { v: 'week', label: 'Week', icon: <CalendarRange className="size-4" /> },
            ...(isAdmin ? [{ v: 'member', label: 'By member', icon: <Users className="size-4" /> }] : []),
          ] as { v: View; label: string; icon: React.ReactNode }[]).map((o) => (
            <button key={o.v} type="button" role="tab" aria-selected={view === o.v} onClick={() => set('view', o.v === 'list' ? null : o.v)}
              className={cn('inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm', view === o.v ? 'bg-accent font-medium text-accent-foreground' : 'text-muted-foreground hover:text-foreground')}>
              <span aria-hidden="true">{o.icon}</span>{o.label}
            </button>
          ))}
        </div>
        {view === 'list' || view === 'member' ? (
          <label className="sr-only" htmlFor="fu-when">When</label>
        ) : null}
        {view !== 'week' ? (
          <select id="fu-when" value={when} onChange={(e) => set('when', e.target.value === 'due' ? null : e.target.value)}
            className="h-9 rounded-lg border border-input bg-input-background px-2.5 text-sm">
            {WHEN.map((w) => <option key={w.v} value={w.v}>{w.label}</option>)}
          </select>
        ) : null}
        {isAdmin ? (
          <>
            <label className="sr-only" htmlFor="fu-member">Team member</label>
            <select id="fu-member" value={memberParam} onChange={(e) => set('member', e.target.value || null)}
              className="h-9 rounded-lg border border-input bg-input-background px-2.5 text-sm">
              <option value="">Everyone</option>
              {profiles.filter((p) => p.is_active).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </>
        ) : null}
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5" role="group" aria-label="Filter by type">
        {TYPES.map((t) => {
          const on = types.includes(t);
          return (
            <button key={t} type="button" aria-pressed={on} onClick={() => toggleType(t)}
              className={cn('rounded-full border px-2.5 py-1 text-xs font-medium', on ? 'border-primary bg-accent text-accent-foreground' : 'border-border text-muted-foreground hover:bg-muted')}>
              {TASK_LABEL[t]}
            </button>
          );
        })}
        {types.length ? <button type="button" onClick={() => set('type', null)} className="px-2 text-xs text-muted-foreground underline-offset-4 hover:underline">Clear</button> : null}
      </div>

      {tasks.isLoading ? <Spinner /> : tasks.isError ? (
        <ErrorState message="Couldn’t load follow-ups." onRetry={() => void tasks.refetch()} />
      ) : view === 'week' ? (
        <WeekView rows={rows} />
      ) : view === 'member' ? (
        <MemberView rows={rows} names={names} />
      ) : rows.length === 0 ? (
        <Card><EmptyState icon={<CheckCircle2 className="size-8" />} title={when === 'done' ? 'Nothing completed in the last 7 days' : 'Nothing due here'}>
          {when === 'due' ? 'You’re all caught up.' : 'Try another range or clear the filters.'}
        </EmptyState></Card>
      ) : (
        <GroupedList rows={rows} names={isAdmin ? names : null} done={when === 'done'} />
      )}
    </>
  );
}

function GroupedList({ rows, names, done }: { rows: TaskRow[]; names: Map<string, string> | null; done: boolean }) {
  const groups = useMemo(() => {
    const now = Date.now();
    const t = todayKey();
    const out = new Map<string, TaskRow[]>();
    for (const r of rows) {
      const at = done ? (r.completed_at ?? r.due_at) : r.due_at;
      const key = !done && new Date(at).getTime() < now && istDateKey(at) <= t ? 'Overdue' : formatDate(at);
      const list = out.get(key) ?? [];
      list.push(r);
      out.set(key, list);
    }
    return [...out.entries()];
  }, [rows, done]);
  return (
    <div className="space-y-5">
      {groups.map(([label, list]) => (
        <Card key={label}>
          <h2 className={cn('border-b border-border px-4 py-2.5 text-sm font-semibold', label === 'Overdue' && 'text-destructive')}>
            {label} <span className="font-normal text-muted-foreground">· {list.length}</span>
          </h2>
          <ul className="divide-y divide-border">
            {list.map((t) => <TaskItem key={t.id} task={t} assigneeName={names ? names.get(t.assignee_id ?? '') ?? 'Unassigned' : null} />)}
          </ul>
        </Card>
      ))}
    </div>
  );
}

function WeekView({ rows }: { rows: TaskRow[] }) {
  const t = todayKey();
  const days = Array.from({ length: 7 }, (_, i) => addDaysKey(t, i));
  const byDay = new Map<string, TaskRow[]>();
  const overdue: TaskRow[] = [];
  for (const r of rows) {
    const k = istDateKey(r.due_at);
    if (k < t) { overdue.push(r); continue; }
    const l = byDay.get(k) ?? [];
    l.push(r);
    byDay.set(k, l);
  }
  return (
    <div className="space-y-3">
      {overdue.length ? (
        <p className="text-sm text-destructive">{overdue.length} overdue follow-up{overdue.length === 1 ? '' : 's'} not shown — see “Overdue & today” in the list view.</p>
      ) : null}
      <div className="grid gap-3 md:grid-cols-7">
        {days.map((k) => {
          const list = byDay.get(k) ?? [];
          return (
            <section key={k} className={cn('min-h-32 rounded-xl border border-border bg-card p-2', k === t && 'border-primary')} aria-label={formatDate(k + 'T12:00:00+05:30')}>
              <h2 className="mb-2 px-1 text-xs font-semibold">
                {formatDate(k + 'T12:00:00+05:30')} <span className="font-normal text-muted-foreground">· {list.length}</span>
              </h2>
              <ul className="space-y-1.5">
                {list.map((r) => (
                  <li key={r.id}>
                    <Link href={`/crm/leads/${r.lead_id}`} className="block rounded-lg border border-border px-2 py-1.5 text-xs hover:bg-muted">
                      <span className="flex items-center justify-between gap-1">
                        <span className="font-medium tabular">{formatTime(r.due_at)}</span>
                        <Badge tone={TASK_TONE[r.type]} className="px-1.5 text-[10px]">{TASK_LABEL[r.type]}</Badge>
                      </span>
                      <span className="mt-0.5 block truncate">{r.lead?.brand_name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function MemberView({ rows, names }: { rows: TaskRow[]; names: Map<string, string> }) {
  const now = Date.now();
  const byMember = new Map<string, TaskRow[]>();
  for (const r of rows) {
    const k = r.assignee_id ?? '';
    const l = byMember.get(k) ?? [];
    l.push(r);
    byMember.set(k, l);
  }
  const entries = [...byMember.entries()].sort((a, b) => (names.get(a[0]) ?? '~').localeCompare(names.get(b[0]) ?? '~'));
  if (!entries.length) return <Card><EmptyState icon={<CalendarCheck2 className="size-8" />} title="No follow-ups in this range" /></Card>;
  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <caption className="sr-only">Follow-ups per team member</caption>
          <thead className="border-b border-border text-left text-xs text-muted-foreground">
            <tr><th scope="col" className="px-4 py-2 font-medium">Member</th><th scope="col" className="px-4 py-2 font-medium">Overdue</th><th scope="col" className="px-4 py-2 font-medium">Total</th><th scope="col" className="px-4 py-2 font-medium">Next</th></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {entries.map(([id, list]) => {
              const overdue = list.filter((r) => new Date(r.due_at).getTime() < now).length;
              const next = list.find((r) => new Date(r.due_at).getTime() >= now);
              return (
                <tr key={id || 'none'}>
                  <th scope="row" className="px-4 py-2.5 text-left font-medium">
                    <Link href={`/crm/follow-ups?member=${id}`} className="hover:underline">{names.get(id) ?? 'Unassigned'}</Link>
                  </th>
                  <td className={cn('px-4 py-2.5 tabular', overdue > 0 && 'font-semibold text-destructive')}>{overdue}</td>
                  <td className="px-4 py-2.5 tabular">{list.length}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{next ? `${formatDate(next.due_at)} ${formatTime(next.due_at)} · ${next.lead?.brand_name ?? ''}` : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
