'use client';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Lead } from '@/lib/database.types';
import { OPEN_STAGES } from '../lib/labels';
import { PAGE_SIZE, phoneDigits, sanitizeSearch, type LeadsQuery } from './leadsQuery';

export type LeadListRow = Pick<Lead,
  'id' | 'brand_name' | 'instagram_username' | 'stage' | 'owner_id' | 'source' | 'dnc' | 'attempt_count'
  | 'last_attempt_at' | 'last_connected_at' | 'next_action_at' | 'next_action_type' | 'stage_changed_at'
  | 'created_at' | 'deal_value_inr' | 'deleted_at' | 'lost_reason' | 'address'> & {
  contacts: { name: string; is_primary: boolean }[];
};

const SELECT =
  'id, brand_name, instagram_username, stage, owner_id, source, dnc, attempt_count, last_attempt_at, ' +
  'last_connected_at, next_action_at, next_action_type, stage_changed_at, created_at, deal_value_inr, ' +
  'deleted_at, lost_reason, address, contacts:lead_contacts(name, is_primary)';

async function leadIdsByPhone(digits: string): Promise<string[]> {
  const { data, error } = await supabase.from('lead_phones').select('lead_id').like('phone_e164', `%${digits}%`).limit(200);
  if (error) throw new Error(error.message);
  return [...new Set((data ?? []).map((r) => r.lead_id))];
}

/** Builds and runs the list query. `range` null = all rows (export). */
export async function fetchLeads(q: LeadsQuery, me: string, range: [number, number] | null) {
  let b = supabase.from('leads').select(SELECT, { count: 'exact' });
  b = q.archived ? b.not('deleted_at', 'is', null) : b.is('deleted_at', null);
  if (q.stage === 'open') b = b.in('stage', [...OPEN_STAGES]);
  else if (q.stage !== 'all') b = b.eq('stage', q.stage);
  if (q.owner === 'none') b = b.is('owner_id', null);
  else if (q.owner === 'me') b = b.eq('owner_id', me);
  else if (q.owner) b = b.eq('owner_id', q.owner);
  if (q.source) b = b.eq('source', q.source);

  const digits = phoneDigits(q.q);
  if (digits) {
    const ids = await leadIdsByPhone(digits);
    if (ids.length === 0) return { rows: [] as LeadListRow[], total: 0 };
    b = b.in('id', ids);
  } else {
    const s = sanitizeSearch(q.q);
    if (s) {
      const handle = s.replace(/^@/, '').toLowerCase();
      b = b.or(`brand_name.ilike.%${s}%,instagram_username.ilike.%${handle}%,address.ilike.%${s}%`);
    }
  }

  switch (q.sort) {
    case 'newest': b = b.order('created_at', { ascending: false }); break;
    case 'oldest': b = b.order('created_at', { ascending: true }); break;
    case 'brand': b = b.order('brand_name', { ascending: true }); break;
    case 'recent_activity': b = b.order('last_attempt_at', { ascending: false, nullsFirst: false }); break;
    default: b = b.order('next_action_at', { ascending: true, nullsFirst: false }).order('created_at', { ascending: true });
  }
  b = b.order('id', { ascending: true });
  if (range) b = b.range(range[0], range[1]);
  const { data, error, count } = await b;
  if (error) throw new Error(error.message);
  return { rows: (data ?? []) as unknown as LeadListRow[], total: count ?? 0 };
}

export function useLeadsList(q: LeadsQuery, me: string) {
  return useQuery({
    queryKey: ['leads', q],
    queryFn: () => fetchLeads(q, me, [(q.page - 1) * PAGE_SIZE, q.page * PAGE_SIZE - 1]),
    placeholderData: (prev) => prev,
  });
}

/** Every row matching the filters, in 1,000-row pages (PostgREST's default cap). */
export async function fetchAllLeads(q: LeadsQuery, me: string): Promise<LeadListRow[]> {
  const all: LeadListRow[] = [];
  for (let from = 0; from < 20_000; from += 1000) {
    const { rows } = await fetchLeads(q, me, [from, from + 999]);
    all.push(...rows);
    if (rows.length < 1000) break;
  }
  return all;
}
