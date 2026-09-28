// URL ⇄ filter state for the Leads list, plus the query itself. Kept pure
// (no React) so it is unit-tested in leadsQuery.test.ts.
import type { LeadSource, LeadStage } from '@/lib/database.types';
import { STAGES } from '../lib/labels';

export const PAGE_SIZE = 25;

export type StageFilter = LeadStage | 'open' | 'all';
export type SortKey = 'next_action' | 'newest' | 'oldest' | 'brand' | 'recent_activity';

export interface LeadsQuery {
  q: string;
  stage: StageFilter;
  owner: string; // '' any · 'none' unassigned · 'me' · uuid
  source: LeadSource | '';
  archived: boolean;
  sort: SortKey;
  page: number;
}

export const DEFAULT_LEADS_QUERY: LeadsQuery = {
  q: '', stage: 'open', owner: '', source: '', archived: false, sort: 'next_action', page: 1,
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SOURCES: readonly LeadSource[] = ['manual', 'website_callback', 'website_query', 'import'];
const SORTS: readonly SortKey[] = ['next_action', 'newest', 'oldest', 'brand', 'recent_activity'];

export function parseLeadsQuery(p: URLSearchParams): LeadsQuery {
  const stage = p.get('stage') ?? '';
  const owner = p.get('owner') ?? '';
  const source = p.get('source') ?? '';
  const sort = p.get('sort') ?? '';
  const page = Number.parseInt(p.get('page') ?? '1', 10);
  return {
    q: (p.get('q') ?? '').slice(0, 100),
    stage: stage === 'all' || stage === 'open' ? stage : (STAGES as readonly string[]).includes(stage) ? (stage as LeadStage) : DEFAULT_LEADS_QUERY.stage,
    owner: owner === 'none' || owner === 'me' || UUID.test(owner) ? owner : '',
    source: (SOURCES as readonly string[]).includes(source) ? (source as LeadSource) : '',
    archived: p.get('archived') === '1',
    sort: (SORTS as readonly string[]).includes(sort) ? (sort as SortKey) : DEFAULT_LEADS_QUERY.sort,
    page: Number.isFinite(page) && page > 0 && page < 100_000 ? page : 1,
  };
}

export function leadsQueryToParams(q: LeadsQuery): URLSearchParams {
  const p = new URLSearchParams();
  if (q.q) p.set('q', q.q);
  if (q.stage !== DEFAULT_LEADS_QUERY.stage) p.set('stage', q.stage);
  if (q.owner) p.set('owner', q.owner);
  if (q.source) p.set('source', q.source);
  if (q.archived) p.set('archived', '1');
  if (q.sort !== DEFAULT_LEADS_QUERY.sort) p.set('sort', q.sort);
  if (q.page > 1) p.set('page', String(q.page));
  return p;
}

export function hasFilters(q: LeadsQuery): boolean {
  return !!(q.q || q.stage !== DEFAULT_LEADS_QUERY.stage || q.owner || q.source || q.archived);
}

/**
 * Makes free text safe inside a PostgREST `or=(…)` filter: commas and
 * parentheses would split or close the expression, `%`/`\` are wildcards.
 */
export function sanitizeSearch(raw: string): string {
  return raw.replace(/[,()*\\%"]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80);
}

/** Digits a search should match against phone numbers, or null. */
export function phoneDigits(raw: string): string | null {
  const d = raw.replace(/\D/g, '');
  return d.length >= 5 && /^[\d\s+\-()]+$/.test(raw.trim()) ? d.slice(-10) : null;
}

/** CSV cell with formula-injection protection (=, +, -, @, tab, CR). */
export function csvCell(value: unknown): string {
  let s = value == null ? '' : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(header: string[], rows: unknown[][]): string {
  return [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n');
}
