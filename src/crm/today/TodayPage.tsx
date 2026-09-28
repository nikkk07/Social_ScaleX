'use client';
import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AlertTriangle, CalendarCheck2, CalendarDays, CheckCircle2, Inbox, MessageCircle, Phone, Sparkles, Trophy, UserPlus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useMe } from '../auth/AuthProvider';
import { Card, CardHeader, EmptyState, ErrorState, KpiTile, PageHeader, Spinner, Badge } from '../ui/kit';
import { Btn } from '../ui/Modal';
import { invalidateCrm, useDashboard, useProfiles, useTasks } from '../data/hooks';
import { TaskItem } from '../tasks/TaskItem';
import { addDaysKey, istDayStart, todayKey, relative } from '../lib/time';
import { rpc } from '../lib/api';
import { useContactLead } from '../outcome/useContactLead';
import { STAGE_LABEL, STAGE_TONE } from '../lib/labels';

function greeting(): string {
  const h = Number(new Intl.DateTimeFormat('en-IN', { hour: 'numeric', hour12: false, timeZone: 'Asia/Kolkata' }).format(new Date()));
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

export function TodayPage() {
  const { profile, isAdmin, role } = useMe();
  const qc = useQueryClient();
  const dash = useDashboard();
  const tomorrow = istDayStart(addDaysKey(todayKey(), 1));
  const tasks = useTasks({ status: 'open', assignee: isAdmin ? undefined : profile.id, to: tomorrow, limit: 100 });
  const profiles = useProfiles().data;
  const names = new Map((profiles ?? []).map((p) => [p.id, p.name]));
  const { contact, pickerEl } = useContactLead();

  // Members get their daily share of fresh leads on the first visit of the day.
  const toppedUp = useRef(false);
  useEffect(() => {
    if (role !== 'member' || toppedUp.current) return;
    toppedUp.current = true;
    rpc('top_up_leads', {})
      .then((n) => {
        if (typeof n === 'number' && n > 0) {
          toast.success(`${n} new lead${n === 1 ? '' : 's'} assigned to you today.`);
          invalidateCrm(qc);
        }
      })
      .catch(() => undefined);
  }, [role, qc]);

  const fresh = useQuery({
    queryKey: ['leads', { today: 'fresh', owner: profile.id }],
    queryFn: async () => {
      const { data, error } = await supabase.from('leads')
        .select('id, brand_name, stage, dnc, created_at, assigned_at, attempt_count')
        .eq('owner_id', profile.id).is('deleted_at', null).in('stage', ['new', 'attempting'])
        .is('next_action_at', null)
        .order('assigned_at', { ascending: true, nullsFirst: false }).limit(8);
      if (error) throw new Error(error.message);
      return data;
    },
  });

  const d = dash.data;
  const firstName = (profile.full_name || '').split(' ')[0] || 'there';

  return (
    <>
      <PageHeader
        title={`${greeting()}, ${firstName}`}
        description={new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Asia/Kolkata' }).format(new Date())}
        actions={<Link href="/crm/leads/new" className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"><UserPlus className="size-4" aria-hidden="true" /> Add lead</Link>}
      />

      {dash.isError ? <ErrorState message="Couldn’t load today’s numbers." onRetry={() => void dash.refetch()} /> : null}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiTile label="Overdue" value={d?.overdue ?? '—'} tone={d && d.overdue > 0 ? 'danger' : 'default'} href="/crm/follow-ups?when=overdue" icon={<AlertTriangle className="size-4" />} hint="Follow-ups past their time" />
        <KpiTile label="Call-backs today" value={d?.callbacks_today ?? '—'} href="/crm/follow-ups?when=today&type=callback" icon={<Phone className="size-4" />} />
        <KpiTile label="Meetings today" value={d?.meetings_today ?? '—'} href="/crm/follow-ups?when=today&type=meeting" icon={<CalendarDays className="size-4" />} />
        <KpiTile label="Won this month" value={d?.won_this_month ?? '—'} href="/crm/leads?stage=won" icon={<Trophy className="size-4" />} />
        <KpiTile label={isAdmin ? 'New leads (all)' : 'My new leads'} value={d?.new_leads ?? '—'} href="/crm/leads?stage=new" icon={<Sparkles className="size-4" />} />
        <KpiTile label="Calls logged today" value={d?.calls_today ?? '—'} icon={<CheckCircle2 className="size-4" />} />
        <KpiTile label="Open enquiries" value={d?.open_enquiries ?? '—'} href="/crm/enquiries" icon={<Inbox className="size-4" />} />
        {isAdmin ? (
          <KpiTile label="Unassigned leads" value={d?.unassigned ?? '—'} href="/crm/leads?owner=none" hint="Pool for daily top-ups" icon={<UserPlus className="size-4" />} />
        ) : (
          <KpiTile label="Due later today" value={d?.due_today ?? '—'} href="/crm/follow-ups?when=today" icon={<CalendarCheck2 className="size-4" />} />
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_20rem]">
        <Card>
          <CardHeader
            title="Up next"
            description={isAdmin ? 'Everyone’s overdue and today’s follow-ups' : 'Your overdue and today’s follow-ups'}
            action={<Link href="/crm/follow-ups" className="text-sm font-medium text-primary hover:underline">All follow-ups</Link>}
          />
          {tasks.isLoading ? <Spinner /> : tasks.isError ? (
            <ErrorState message="Couldn’t load follow-ups." onRetry={() => void tasks.refetch()} />
          ) : (tasks.data ?? []).length === 0 ? (
            <EmptyState icon={<CheckCircle2 className="size-8" />} title="You’re all caught up">
              Nothing is due today. Start on your fresh leads, or add a new one.
            </EmptyState>
          ) : (
            <ul className="divide-y divide-border">
              {(tasks.data ?? []).map((t) => (
                <TaskItem key={t.id} task={t} assigneeName={isAdmin ? names.get(t.assignee_id ?? '') ?? 'Unassigned' : null} />
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="Fresh leads" description="Not called yet — oldest first" />
          {fresh.isLoading ? <Spinner /> : (fresh.data ?? []).length === 0 ? (
            <EmptyState title="No fresh leads">
              {role === 'member' ? 'New leads arrive each morning up to your daily quota.' : 'Leads you own that haven’t been called show up here.'}
            </EmptyState>
          ) : (
            <ul className="divide-y divide-border">
              {(fresh.data ?? []).map((l) => (
                <li key={l.id} className="flex items-center gap-2 px-4 py-2.5">
                  <div className="min-w-0 flex-1">
                    <Link href={`/crm/leads/${l.id}`} className="block truncate text-sm font-medium hover:underline">{l.brand_name}</Link>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge tone={STAGE_TONE[l.stage]}>{STAGE_LABEL[l.stage]}</Badge>
                      <span>{relative(l.assigned_at ?? l.created_at)}</span>
                    </div>
                  </div>
                  <Btn size="sm" onClick={() => void contact(l, 'call')} aria-label={`Call ${l.brand_name}`}><Phone aria-hidden="true" /></Btn>
                  <Btn size="sm" variant="secondary" onClick={() => void contact(l, 'whatsapp')} aria-label={`WhatsApp ${l.brand_name}`}><MessageCircle aria-hidden="true" /></Btn>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
      {pickerEl}
    </>
  );
}
