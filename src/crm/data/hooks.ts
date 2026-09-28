'use client';
// ─────────────────────────────────────────────────────────────────────
// Every read the CRM makes, as React Query hooks. RLS decides what rows come
// back (members: only their own leads/tasks), so the same query serves every
// role; the UI never filters for security, only for convenience.
// ─────────────────────────────────────────────────────────────────────
import { useEffect } from 'react';
import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type {
  AppRole, CallLog, CrmSettings, InboundEnquiry, Lead, LeadActivity, LeadContact, LeadPhone,
  LeadStage, LeadTask, Quotation, TaskType,
} from '@/lib/database.types';
import { rpc } from '../lib/api';

export const qk = {
  dashboard: ['dashboard'] as const,
  profiles: ['profiles'] as const,
  settings: ['settings'] as const,
  pending: ['pending'] as const,
  tasks: (f: object) => ['tasks', f] as const,
  leads: (f: object) => ['leads', f] as const,
  lead: (id: string) => ['lead', id] as const,
  enquiries: (f: object) => ['enquiries', f] as const,
  insights: (f: object) => ['insights', f] as const,
  audit: ['audit'] as const,
};

/** After any write: refresh every view that could show the change. */
export function invalidateCrm(qc: QueryClient, leadId?: string) {
  void qc.invalidateQueries({ queryKey: ['dashboard'] });
  void qc.invalidateQueries({ queryKey: ['tasks'] });
  void qc.invalidateQueries({ queryKey: ['leads'] });
  void qc.invalidateQueries({ queryKey: ['pending'] });
  void qc.invalidateQueries({ queryKey: ['insights'] });
  if (leadId) void qc.invalidateQueries({ queryKey: ['lead', leadId] });
}

function unwrap<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

// ── Dashboard ────────────────────────────────────────────────────────
export interface Dashboard {
  overdue: number; due_today: number; callbacks_today: number; meetings_today: number;
  pending_outcomes: number; new_leads: number; unassigned: number | null; open_enquiries: number;
  won_this_month: number; calls_today: number;
}
export function useDashboard() {
  return useQuery({
    queryKey: qk.dashboard,
    queryFn: async () => (await rpc('crm_dashboard', {})) as unknown as Dashboard,
    refetchInterval: 60_000,
  });
}

// ── Team (names for dropdowns / timelines) ───────────────────────────
export interface StaffOption { id: string; name: string; role: AppRole; is_active: boolean; daily_lead_quota: number | null }
export function useProfiles() {
  return useQuery({
    queryKey: qk.profiles,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const rows = unwrap(await supabase.from('profiles')
        .select('id, full_name, email, role, is_active, daily_lead_quota').order('full_name'));
      return rows.map<StaffOption>((p) => ({
        id: p.id, name: p.full_name || p.email || 'Unnamed', role: p.role, is_active: p.is_active,
        daily_lead_quota: p.daily_lead_quota,
      }));
    },
  });
}

export function useSettings() {
  return useQuery({
    queryKey: qk.settings,
    staleTime: 10 * 60_000,
    queryFn: async () => unwrap(await supabase.from('crm_settings').select('*').eq('id', 1).single()) as CrmSettings,
  });
}

// ── Pending call outcomes (mine) ─────────────────────────────────────
export type PendingAttempt = Pick<CallLog, 'id' | 'lead_id' | 'phone_id' | 'phone_e164' | 'channel' | 'started_at' | 'task_id'> & {
  lead: { id: string; brand_name: string; stage: LeadStage } | null;
};
export function usePendingAttempts(userId: string | undefined) {
  return useQuery({
    queryKey: qk.pending,
    enabled: !!userId,
    queryFn: async () =>
      unwrap(await supabase.from('call_logs')
        .select('id, lead_id, phone_id, phone_e164, channel, started_at, task_id, lead:leads(id, brand_name, stage)')
        .eq('actor_id', userId as string).is('result', null).order('started_at', { ascending: true })) as unknown as PendingAttempt[],
  });
}

// ── Tasks (follow-ups) ───────────────────────────────────────────────
export type TaskRow = LeadTask & {
  lead: { id: string; brand_name: string; stage: LeadStage; owner_id: string | null; dnc: boolean; deleted_at: string | null } | null;
};
export interface TaskFilter {
  status: 'open' | 'done';
  assignee?: string | null; // null/undefined = everyone RLS allows
  from?: string;            // ISO
  to?: string;              // ISO (exclusive)
  types?: TaskType[];
  limit?: number;
}
export function useTasks(f: TaskFilter) {
  return useQuery({
    queryKey: qk.tasks(f),
    queryFn: async () => {
      let q = supabase.from('lead_tasks')
        .select('*, lead:leads!inner(id, brand_name, stage, owner_id, dnc, deleted_at)')
        .eq('status', f.status === 'open' ? 'open' : 'done')
        .is('lead.deleted_at', null);
      if (f.assignee) q = q.eq('assignee_id', f.assignee);
      if (f.from) q = q.gte(f.status === 'open' ? 'due_at' : 'completed_at', f.from);
      if (f.to) q = q.lt(f.status === 'open' ? 'due_at' : 'completed_at', f.to);
      if (f.types && f.types.length) q = q.in('type', f.types);
      q = f.status === 'open'
        ? q.order('due_at', { ascending: true })
        : q.order('completed_at', { ascending: false });
      return unwrap(await q.limit(f.limit ?? 500)) as unknown as TaskRow[];
    },
  });
}

// ── One lead, everything about it ────────────────────────────────────
export type ContactWithPhones = LeadContact & { phones: LeadPhone[] };
export interface LeadBundle {
  lead: Lead;
  contacts: ContactWithPhones[];
  officePhones: LeadPhone[];
  tasks: LeadTask[];
  quotes: Quotation[];
  activities: (LeadActivity & { actor: { full_name: string | null; email: string } | null })[];
  calls: (CallLog & { actor: { full_name: string | null; email: string } | null })[];
}
export function useLead(id: string) {
  return useQuery({
    queryKey: qk.lead(id),
    queryFn: async (): Promise<LeadBundle | null> => {
      const [l, c, p, t, q, a, cl] = await Promise.all([
        supabase.from('leads').select('*').eq('id', id).maybeSingle(),
        supabase.from('lead_contacts').select('*').eq('lead_id', id).order('sort_order'),
        supabase.from('lead_phones').select('*').eq('lead_id', id).order('sort_order'),
        supabase.from('lead_tasks').select('*').eq('lead_id', id).order('due_at', { ascending: true }),
        supabase.from('quotations').select('*').eq('lead_id', id).order('version', { ascending: false }),
        supabase.from('lead_activities').select('*, actor:profiles!lead_activities_actor_id_fkey(full_name, email)')
          .eq('lead_id', id).order('created_at', { ascending: false }).limit(200),
        supabase.from('call_logs').select('*, actor:profiles!call_logs_actor_id_fkey(full_name, email)')
          .eq('lead_id', id).order('started_at', { ascending: false }).limit(200),
      ]);
      const lead = unwrap(l);
      if (!lead) return null;
      const phones = unwrap(p) as LeadPhone[];
      const contacts = (unwrap(c) as LeadContact[]).map((x) => ({
        ...x, phones: phones.filter((ph) => ph.contact_id === x.id),
      }));
      return {
        lead: lead as Lead,
        contacts,
        officePhones: phones.filter((ph) => !ph.contact_id),
        tasks: unwrap(t) as LeadTask[],
        quotes: unwrap(q) as Quotation[],
        activities: unwrap(a) as unknown as LeadBundle['activities'],
        calls: unwrap(cl) as unknown as LeadBundle['calls'],
      };
    },
  });
}

// ── Enquiries ────────────────────────────────────────────────────────
export type EnquiryRow = InboundEnquiry & { converted_lead: { id: string; brand_name: string } | null };

// ── Realtime: keep lists live when teammates act ─────────────────────
export function useRealtimeInvalidation(userId: string | undefined) {
  const qc = useQueryClient();
  useEffect(() => {
    if (!userId) return;
    let timer: number | undefined;
    const bump = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => invalidateCrm(qc), 400);
    };
    const ch = supabase
      .channel('crm-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lead_tasks' }, bump)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'call_logs' }, bump)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'leads' }, bump)
      .subscribe();
    return () => {
      window.clearTimeout(timer);
      void supabase.removeChannel(ch);
    };
  }, [qc, userId]);
}
