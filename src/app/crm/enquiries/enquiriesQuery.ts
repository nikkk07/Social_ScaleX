// Query building for the inbound-enquiries work queue (/crm/enquiries).
//
// Same server-side discipline as the leads list: paging, filtering and the
// exact count all happen in the database. Enquiries arrive from the public
// contact form, so the table is anon-writable — volume is whatever the internet
// sends us, and fetch-all-then-filter would be the first thing to break.
import { supabase } from '../../../lib/supabase';
import type { Database } from '../../../lib/database.types';

export const PAGE_SIZE = 25;

export type EnquiryKind = 'callback' | 'query';
// Default is 'open': this screen is a work queue, and the thing you want on
// opening it is what still needs doing.
export type EnquiryState = 'open' | 'converted' | 'all';

export type EnquiryRow = Pick<
  Database['public']['Tables']['inbound_enquiries']['Row'],
  | 'id'
  | 'kind'
  | 'name'
  | 'phone'
  | 'email'
  | 'best_time'
  | 'message'
  | 'converted_lead_id'
  | 'created_at'
> & {
  // Nested so a converted row can link straight to the lead it became, without
  // an N+1 lookup per row.
  converted_lead: { id: string; brand_name: string } | null;
};

// No !fkey hint needed: converted_lead_id is the ONLY foreign key between these
// two tables, so the embed is unambiguous and we don't hard-code a constraint
// name that only exists by Postgres's default-naming convention.
export const ENQUIRY_SELECT =
  'id, kind, name, phone, email, best_time, message, converted_lead_id, created_at, ' +
  'converted_lead:leads(id, brand_name)';

export interface EnquiriesQuery {
  q: string;
  kind: EnquiryKind | '';
  state: EnquiryState;
  page: number; // 1-based
}

export const DEFAULT_ENQUIRIES_QUERY: EnquiriesQuery = {
  q: '',
  kind: '',
  state: 'open',
  page: 1,
};

// Same rationale as the leads list: strip only what is structural in
// PostgREST's or() grammar, plus the ILIKE wildcard and escape char.
export function sanitizeSearch(raw: string): string {
  return raw
    .replace(/[,()]/g, ' ')
    .replace(/[%\\]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function filtered(q: EnquiriesQuery) {
  let b = supabase
    .from('inbound_enquiries')
    .select(ENQUIRY_SELECT, { count: 'exact' });
  if (q.state === 'open') b = b.is('converted_lead_id', null);
  else if (q.state === 'converted') b = b.not('converted_lead_id', 'is', null);
  if (q.kind) b = b.eq('kind', q.kind);
  const s = sanitizeSearch(q.q);
  if (s) {
    // No trigram index here, unlike leads: enquiries are low-volume by nature
    // (a human fills a form) and the default 'open' view is already narrowed by
    // inbound_enquiries_unconverted_idx. Revisit if this table ever grows past
    // a few thousand rows.
    b = b.or(`name.ilike.%${s}%,phone.ilike.%${s}%,email.ilike.%${s}%`);
  }
  return b;
}

export interface EnquiriesPage {
  rows: EnquiryRow[];
  total: number;
}

export async function fetchEnquiriesPage(
  q: EnquiriesQuery,
): Promise<EnquiriesPage> {
  const from = (q.page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const { data, error, count } = await filtered(q)
    .order('created_at', { ascending: false })
    .order('id', { ascending: true }) // stable tiebreaker → deterministic paging
    .range(from, to);
  if (error) throw error;
  return { rows: (data ?? []) as unknown as EnquiryRow[], total: count ?? 0 };
}

// ── URL <-> query state ───────────────────────────────────────────────
export function toSearchParams(q: EnquiriesQuery): URLSearchParams {
  const p = new URLSearchParams();
  if (q.q) p.set('q', q.q);
  if (q.kind) p.set('kind', q.kind);
  if (q.state !== DEFAULT_ENQUIRIES_QUERY.state) p.set('state', q.state);
  if (q.page > 1) p.set('page', String(q.page));
  return p;
}

const KINDS: readonly EnquiryKind[] = ['callback', 'query'];
const STATES: readonly EnquiryState[] = ['open', 'converted', 'all'];

function oneOf<T extends string>(
  value: string | null,
  allowed: readonly T[],
  fallback: T,
): T {
  return value != null && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback;
}

export function fromSearchParams(p: URLSearchParams): EnquiriesQuery {
  const num = parseInt(p.get('page') ?? '1', 10);
  return {
    q: p.get('q') ?? '',
    kind: oneOf(p.get('kind'), KINDS, ''),
    state: oneOf(p.get('state'), STATES, DEFAULT_ENQUIRIES_QUERY.state),
    page: Number.isFinite(num) && num > 0 ? num : 1,
  };
}

export function hasActiveFilters(q: EnquiriesQuery): boolean {
  return Boolean(q.q || q.kind || q.state !== DEFAULT_ENQUIRIES_QUERY.state);
}
