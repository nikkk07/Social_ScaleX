// Query building for the leads list. Everything here pushes work to the
// database — no fetch-all-and-filter-in-JS. PostgREST caps responses at 1000
// rows, so client-side filtering silently truncates past lead 1000; server-side
// paging + filtering is a correctness requirement, not an optimisation.
import { supabase } from '@/lib/supabase';
import type {
  Database,
  LeadStatus,
  LeadOutcome,
} from '@/lib/database.types';
import type { LeadAccessInfo } from './leadAccessControl';

export const PAGE_SIZE = 25;
export const EXPORT_PAGE_SIZE = 1000; // PostgREST's default hard cap

// Nested select: contacts + their phones in one round trip (no N+1).
export const LEAD_SELECT =
  'id, brand_name, phone, email, status, source, address, created_at, assigned_to, notes';

export type SortColumn = 'created_at' | 'brand_name' | 'status';

// Both dashboard tiles use a 7-day window. Single source of truth: the tile's
// COUNT and the list it links to must never disagree, or the tile reads "4" and
// opens a list of 6.
export const RECENT_DAYS = 7;

export function daysAgoISO(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

export interface LeadsQuery {
  q: string;
  status: string;
  owner: string; // assigned_to, or '' for any
  foundFrom: string; // 'YYYY-MM-DD' or ''
  foundTo: string; // 'YYYY-MM-DD' or ''
  followup: boolean;
  recent: boolean;
  sort: SortColumn;
  dir: 'asc' | 'desc';
  page: number; // 1-based
}

export const DEFAULT_QUERY: LeadsQuery = {
  q: '',
  status: '',
  owner: '',
  foundFrom: '',
  foundTo: '',
  followup: false,
  recent: false,
  sort: 'created_at',
  dir: 'desc',
  page: 1,
};

export type LeadRow = Pick<
  Database['public']['Tables']['leads']['Row'],
  | 'id'
  | 'brand_name'
  | 'phone'
  | 'email'
  | 'status'
  | 'source'
  | 'address'
  | 'created_at'
  | 'assigned_to'
  | 'notes'
>;

// Strip only what's STRUCTURAL in PostgREST's or()/filter grammar (commas,
// parens), the `%` wildcard, and the escape char `\`, so a user typing `%` or
// `,` can't corrupt the filter. We deliberately KEEP `_` and `*`:
//   - `_` is a real character in handles (e.g. "the_subh_journey"); stripping
//     it makes that lead unfindable. In ILIKE `_` matches any single char, so
//     an unstripped "the_subh" still matches "the_subh_journey" — harmless.
//   - `*` isn't special in ILIKE at all.
// (For strict-literal matching we'd instead escape `\_`/`\%` with an ESCAPE
// clause, which PostgREST's .ilike doesn't expose — so keep-and-tolerate wins.)
export function sanitizeSearch(raw: string): string {
  return raw
    .replace(/[,()]/g, ' ')
    .replace(/[%\\]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Base builder with all filters applied; caller adds order + range.
//
// `cutoff` is passed in, never computed here: fetchAllLeads calls this once per
// export page, so a freshly-computed "7 days ago" would slide forward a few
// milliseconds between pages. For `recent` (created_at >= cutoff) a later
// cutoff drops rows off the front of the result, which renumbers every
// subsequent offset — the export would silently skip rows. One instant for the
// whole query.
function filteredLeads(q: LeadsQuery, withCount: boolean, cutoff: string) {
  let b = withCount
    ? supabase.from('leads').select(LEAD_SELECT, { count: 'exact' })
    : supabase.from('leads').select(LEAD_SELECT);
  b = b.eq('is_deleted', false);
  
  if (q.status) b = b.eq('status', q.status);
  if (q.recent) b = b.gte('created_at', cutoff);
  if (q.owner) b = b.eq('assigned_to', q.owner);
  
  const s = sanitizeSearch(q.q);
  if (s) {
    // Search brand_name, email, or phone
    b = b.or(`brand_name.ilike.%${s}%,email.ilike.%${s}%,phone.ilike.%${s}%`);
  }
  return b;
}

export interface LeadsPage {
  rows: LeadRow[];
  total: number;
}

// One page for the table.
export async function fetchLeadsPage(
  q: LeadsQuery,
  accessInfo?: LeadAccessInfo | null
): Promise<LeadsPage> {
  const from = (q.page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  
  let query = filteredLeads(q, true, daysAgoISO(RECENT_DAYS));
  
  // Apply access control filter for members
  if (accessInfo && !accessInfo.canAccessAllLeads) {
    if (accessInfo.assignedLeadIds && accessInfo.assignedLeadIds.length > 0) {
      query = query.in('id', accessInfo.assignedLeadIds);
    } else {
      // No accessible leads - return empty
      return { rows: [], total: 0 };
    }
  }
  
  const { data, error, count } = await query
    .order(q.sort, { ascending: q.dir === 'asc' })
    .order('id', { ascending: true }) // stable tiebreaker → deterministic paging
    .range(from, to);
  if (error) throw error;
  return { rows: (data ?? []) as unknown as LeadRow[], total: count ?? 0 };
}

// Every matching row, fetched server-side in pages (for CSV export). Never the
// on-screen page only, and never one-query-per-row.
//
// Driven by the exact COUNT, not by "a short batch means we're done" — if the
// server's row cap (db-max-rows) is lower than EXPORT_PAGE_SIZE, EVERY batch
// comes back short and the old "< PAGE_SIZE → stop" logic would export one page
// and silently drop the rest (the very truncation 4b exists to prevent). We
// advance by the number of rows actually returned (robust to any cap) and fail
// loudly if a page comes back empty before we've reached the total.
export async function fetchAllLeads(q: LeadsQuery): Promise<LeadRow[]> {
  const all: LeadRow[] = [];
  let total = Infinity;
  const cutoff = daysAgoISO(RECENT_DAYS); // pinned for the whole export
  while (all.length < total) {
    const from = all.length;
    const to = from + EXPORT_PAGE_SIZE - 1;
    const { data, error, count } = await filteredLeads(q, true, cutoff)
      .order(q.sort, { ascending: q.dir === 'asc' })
      .order('id', { ascending: true })
      .range(from, to);
    if (error) throw error;
    if (typeof count === 'number') total = count;
    const batch = (data ?? []) as unknown as LeadRow[];
    if (batch.length === 0) {
      if (all.length < total) {
        throw new Error(
          `Export incomplete: fetched ${all.length} of ${total} leads before ` +
            `the server returned an empty page (row cap lower than expected?).`,
        );
      }
      break;
    }
    all.push(...batch);
  }
  return all;
}

// ── Primary resolution ────────────────────────────────────────────────
// For your simplified schema, phone and email are directly on the lead

export function primaryContact(lead: LeadRow): { name: string } | null {
  return lead.brand_name ? { name: lead.brand_name } : null;
}

export function primaryPhone(lead: LeadRow): { phone_e164: string } | null {
  return lead.phone ? { phone_e164: lead.phone } : null;
}

// wa.me wants digits only (no '+'); tel: keeps the E.164 form.
export function waNumber(e164: string): string {
  if (!e164) return '';
  return e164.replace(/\D/g, '');
}

// ── URL <-> query state ───────────────────────────────────────────────
export function toSearchParams(q: LeadsQuery): URLSearchParams {
  const p = new URLSearchParams();
  if (q.q) p.set('q', q.q);
  if (q.status) p.set('status', q.status);
  if (q.owner) p.set('owner', q.owner);
  if (q.foundFrom) p.set('from', q.foundFrom);
  if (q.foundTo) p.set('to', q.foundTo);
  if (q.followup) p.set('followup', '1');
  if (q.recent) p.set('recent', '1');
  if (q.sort !== DEFAULT_QUERY.sort) p.set('sort', q.sort);
  if (q.dir !== DEFAULT_QUERY.dir) p.set('dir', q.dir);
  if (q.page > 1) p.set('page', String(q.page));
  return p;
}

// Whitelists so a stale or hand-edited URL can't push an invalid value into a
// PostgREST filter (which would 400 and blank the screen). Anything unknown
// falls back to a safe default rather than being cast through with `as`.
const SORT_COLUMNS: readonly SortColumn[] = [
  'created_at',
  'brand_name',
  'status',
];
const STATUSES = ['pending', 'contacted', 'interested', 'not_interested', 'callback', 'meeting'] as const;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function oneOf<T extends string>(
  value: string | null,
  allowed: readonly T[],
  fallback: T,
): T {
  return value != null && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback;
}

export function fromSearchParams(p: URLSearchParams): LeadsQuery {
  const num = parseInt(p.get('page') ?? '1', 10);
  const owner = p.get('owner') ?? '';
  const from = p.get('from') ?? '';
  const to = p.get('to') ?? '';
  return {
    q: p.get('q') ?? '',
    status: p.get('status') ?? '',
    owner: UUID_RE.test(owner) ? owner : '',
    foundFrom: DATE_RE.test(from) ? from : '',
    foundTo: DATE_RE.test(to) ? to : '',
    followup: p.get('followup') === '1',
    recent: p.get('recent') === '1',
    sort: oneOf(p.get('sort'), SORT_COLUMNS, DEFAULT_QUERY.sort),
    dir: oneOf(p.get('dir'), ['asc', 'desc'] as const, DEFAULT_QUERY.dir),
    page: Number.isFinite(num) && num > 0 ? num : 1,
  };
}

// True when any filter/search is active (to tell "no matches" from "no leads").
export function hasActiveFilters(q: LeadsQuery): boolean {
  return Boolean(
    q.q ||
      q.status ||
      q.owner ||
      q.foundFrom ||
      q.foundTo ||
      q.followup ||
      q.recent,
  );
}

// ── CSV ───────────────────────────────────────────────────────────────
// Neutralise spreadsheet formula injection BEFORE quoting. Excel/Sheets execute
// a cell that begins with = + - @ (or a leading tab/CR) on open. This is
// reachable end-to-end: a stranger's public-form submission becomes an enquiry,
// then (Phase 8) a lead_contacts.name, then a CSV cell that fires on our
// machine. Prefixing a single quote defuses it; the quote is standard, harmless
// text once imported.
function csvCell(value: string): string {
  let s = value ?? '';
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function leadsToCsv(rows: LeadRow[]): string {
  const header = [
    'Brand',
    'Phone',
    'Email',
    'Address',
    'Status',
    'Source',
    'Created',
  ];
  const lines = [header.join(',')];
  for (const l of rows) {
    lines.push(
      [
        l.brand_name,
        l.phone ?? '',
        l.email ?? '',
        l.address ?? '',
        l.status ?? '',
        l.source ?? '',
        l.created_at,
      ]
        .map(csvCell)
        .join(','),
    );
  }
  return lines.join('\r\n');
}

export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
