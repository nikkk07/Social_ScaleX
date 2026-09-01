// The /crm leads list. Everything is server-side: paging (25/page, exact
// count), sorting, filtering, and search — nothing is fetched-all-and-filtered
// in the browser (PostgREST caps at 1000 rows, so that would silently
// truncate). URL reflects q/status/owner/etc so a view is bookmarkable.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useNavigate, useSearchParams } from '@/lib/router';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Download,
  MoreHorizontal,
  Plus,
  Search,
  X,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useLeads } from './useLeads';
import { useProfiles } from './useProfiles';
import { LeadStatusControl, type StatusChange } from './LeadStatusControl';
import { PhoneActions } from './PhoneActions';
import {
  DEFAULT_QUERY,
  PAGE_SIZE,
  RECENT_DAYS,
  fetchAllLeads,
  fromSearchParams,
  hasActiveFilters,
  leadsToCsv,
  downloadCsv,
  primaryContact,
  primaryPhone,
  toSearchParams,
  type LeadRow,
  type LeadsQuery,
  type SortColumn,
} from './leadsQuery';

const SOURCE_LABEL: Record<LeadRow['source'], string> = {
  manual: 'Manual',
  website_callback: 'Callback',
  website_query: 'Query',
  import: 'Import',
};

const inputClass =
  'rounded-lg border border-[var(--border)] bg-[var(--input-background)] px-3 py-2 text-sm text-[var(--color-ink)] placeholder:text-white/30 outline-none transition focus-visible:border-[var(--color-violet-light)] focus-visible:ring-2 focus-visible:ring-[var(--color-violet-light)]';

function OutcomeBadge({ outcome }: { outcome: LeadRow['outcome'] }) {
  if (outcome === 'interested')
    return (
      <Badge className="border-transparent bg-[color-mix(in_oklab,var(--color-emerald)_18%,transparent)] text-[var(--color-emerald)]">
        Interested
      </Badge>
    );
  if (outcome === 'not_interested')
    return (
      <Badge className="border-transparent bg-[color-mix(in_oklab,var(--destructive)_16%,transparent)] text-[var(--destructive)]">
        Not interested
      </Badge>
    );
  return <span className="text-white/25">—</span>;
}

function InstagramLink({ handle }: { handle: string | null }) {
  if (!handle) return <span className="text-white/25">—</span>;
  return (
    <a
      href={`https://instagram.com/${handle}`}
      target="_blank"
      rel="noopener noreferrer"
      className="text-[var(--color-violet-light)] hover:underline"
    >
      @{handle}
    </a>
  );
}

export function LeadsList() {
  const [sp, setSp] = useSearchParams();
  const spString = sp.toString();
  const query = useMemo<LeadsQuery>(
    () => fromSearchParams(new URLSearchParams(spString)),
    [spString],
  );

  const leadsResult = useLeads(query);
  const profiles = useProfiles();

  // Local, optimistically-editable copy of the current page.
  const [rows, setRows] = useState<LeadRow[]>([]);
  // Extracted rather than inlined into the dep array so the dependency is
  // statically checkable. Behaviour is unchanged and the narrowness is the
  // point: re-syncing on every status transition would throw away optimistic
  // edits each time the list refetched.
  const readyLeads = leadsResult.status === 'ready' ? leadsResult.leads : null;
  useEffect(() => {
    if (readyLeads) setRows(readyLeads);
  }, [readyLeads]);

  const total = leadsResult.status === 'ready' ? leadsResult.total : 0;

  // ── URL-backed query setters ──────────────────────────────────────────
  const setFilters = useCallback(
    (patch: Partial<LeadsQuery>) => {
      // Any filter/search change resets to page 1.
      setSp(toSearchParams({ ...query, ...patch, page: 1 }));
    },
    [query, setSp],
  );
  const setPage = useCallback(
    (page: number) => setSp(toSearchParams({ ...query, page })),
    [query, setSp],
  );
  const setSort = useCallback(
    (col: SortColumn) => {
      const dir = query.sort === col && query.dir === 'desc' ? 'asc' : 'desc';
      setSp(toSearchParams({ ...query, sort: col, dir, page: 1 }));
    },
    [query, setSp],
  );

  // ── Debounced search (~300ms) ────────────────────────────────────────
  const [searchInput, setSearchInput] = useState(query.q);
  useEffect(() => setSearchInput(query.q), [query.q]); // sync on back/forward
  useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput !== query.q) setFilters({ q: searchInput });
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput, query.q, setFilters]);

  // ── Optimistic mutations ─────────────────────────────────────────────
  const applyStatus = useCallback(
    async (lead: LeadRow, change: StatusChange) => {
      const snapshot = rows;
      setRows((rs) =>
        rs.map((r) =>
          r.id === lead.id
            ? { ...r, status: change.status, outcome: change.outcome }
            : r,
        ),
      );
      const { error } = await supabase
        .from('leads')
        .update({ status: change.status, outcome: change.outcome })
        .eq('id', lead.id);
      if (error) {
        setRows(snapshot); // rollback
        toast.error(error.message || 'Could not update the lead.');
      }
    },
    [rows],
  );

  const archive = useCallback(
    async (lead: LeadRow) => {
      const snapshot = rows;
      setRows((rs) => rs.filter((r) => r.id !== lead.id));
      const { error } = await supabase
        .from('leads')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', lead.id);
      if (error) {
        setRows(snapshot); // rollback
        // Surfaces the tg_leads_guard_soft_delete message for a member role.
        toast.error(error.message || 'Could not archive the lead.');
      } else {
        toast.success(`Archived ${lead.brand_name}.`);
        leadsResult.refetch(); // keep count/pagination correct
      }
    },
    [rows, leadsResult],
  );

  // ── CSV export (current filtered set, fetched server-side in pages) ──
  const [exporting, setExporting] = useState(false);
  const onExport = useCallback(async () => {
    setExporting(true);
    try {
      const all = await fetchAllLeads(query);
      downloadCsv(
        `leads-${new Date().toISOString().slice(0, 10)}.csv`,
        leadsToCsv(all),
      );
      toast.success(`Exported ${all.length} lead${all.length === 1 ? '' : 's'}.`);
    } catch {
      toast.error('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  }, [query]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const rangeStart = total === 0 ? 0 : (query.page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(query.page * PAGE_SIZE, total);
  const filtersActive = hasActiveFilters(query);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      {/* Toolbar — always mounted so the search box keeps focus across loads */}
      <div className="mb-4 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold">Leads</h1>
            <p className="text-sm text-white/50" aria-live="polite">
              {leadsResult.status === 'ready'
                ? total === 0
                  ? 'No results'
                  : `Showing ${rangeStart}–${rangeEnd} of ${total}`
                : leadsResult.status === 'loading'
                  ? 'Loading…'
                  : '—'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onExport}
              disabled={exporting || total === 0}
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-white/80 transition-colors hover:bg-white/5 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-violet-light)]"
            >
              <Download size={15} />
              {exporting ? 'Exporting…' : 'Export CSV'}
            </button>
            <Link href="/crm/leads/new"
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-violet-cta)] px-3 py-2 text-sm font-semibold text-white transition-transform hover:scale-[1.03] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-violet-light)]"
            >
              <Plus size={15} /> Add lead
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="relative w-full sm:w-64">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              aria-label="Search leads by brand or Instagram"
              placeholder="Search brand or @handle"
              className={`${inputClass} w-full pl-9`}
            />
          </div>

          {/* Disabled (not hidden) while "needs follow-up" is on: that view
              already pins status=contacted + no outcome, so leaving these live
              would let you pick a combination the query quietly ignores. */}
          <select
            aria-label="Filter by status"
            value={query.followup ? 'contacted' : query.status}
            disabled={query.followup}
            title={query.followup ? 'Set by the follow-up view' : undefined}
            onChange={(e) =>
              setFilters({ status: e.target.value as LeadsQuery['status'] })
            }
            className={`${inputClass} disabled:opacity-50`}
          >
            <option value="">Any status</option>
            <option value="pending">Pending</option>
            <option value="contacted">Contacted</option>
          </select>

          <select
            aria-label="Filter by outcome"
            value={query.followup ? '' : query.outcome}
            disabled={query.followup}
            title={query.followup ? 'Set by the follow-up view' : undefined}
            onChange={(e) =>
              setFilters({ outcome: e.target.value as LeadsQuery['outcome'] })
            }
            className={`${inputClass} disabled:opacity-50`}
          >
            <option value="">Any outcome</option>
            <option value="interested">Interested</option>
            <option value="not_interested">Not interested</option>
          </select>

          <select
            aria-label="Filter by owner"
            value={query.owner}
            onChange={(e) => setFilters({ owner: e.target.value })}
            className={inputClass}
          >
            <option value="">Any owner</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>

          <label className="flex items-center gap-1 text-xs text-white/40">
            Found
            <input
              type="date"
              aria-label="Found on or after"
              value={query.foundFrom}
              max={query.foundTo || undefined}
              onChange={(e) => setFilters({ foundFrom: e.target.value })}
              className={`${inputClass} py-1.5`}
            />
            <span aria-hidden="true">–</span>
            <input
              type="date"
              aria-label="Found on or before"
              value={query.foundTo}
              min={query.foundFrom || undefined}
              onChange={(e) => setFilters({ foundTo: e.target.value })}
              className={`${inputClass} py-1.5`}
            />
          </label>

          {filtersActive && (
            <button
              type="button"
              onClick={() => setSp(toSearchParams(DEFAULT_QUERY))}
              className="text-sm text-white/50 hover:text-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-violet-light)] rounded"
            >
              Clear
            </button>
          )}
        </div>

        {/* Arriving from a dashboard tile, the list is filtered by something
            none of the controls above show. Without this the view just looks
            mysteriously short. */}
        {(query.followup || query.recent) && (
          <div className="flex flex-wrap items-center gap-2">
            {query.followup && (
              <FilterChip
                label={`Needs follow-up · contacted over ${RECENT_DAYS} days ago, no outcome`}
                onClear={() => setFilters({ followup: false })}
              />
            )}
            {query.recent && (
              <FilterChip
                label={`Added in the last ${RECENT_DAYS} days`}
                onClear={() => setFilters({ recent: false })}
              />
            )}
          </div>
        )}
      </div>

      {/* Content area */}
      {leadsResult.status === 'error' ? (
        <ErrorState onRetry={leadsResult.refetch} />
      ) : leadsResult.status === 'loading' ? (
        <LoadingState />
      ) : total === 0 ? (
        <EmptyState filtersActive={filtersActive} />
      ) : (
        <>
          <DesktopTable
            rows={rows}
            sort={query.sort}
            dir={query.dir}
            onSort={setSort}
            onStatus={applyStatus}
            onArchive={archive}
          />
          <MobileCards rows={rows} onStatus={applyStatus} onArchive={archive} />
          <Pagination
            page={query.page}
            totalPages={totalPages}
            onPage={setPage}
          />
        </>
      )}
    </div>
  );
}

// ── Sub-views ───────────────────────────────────────────────────────────
function FilterChip({
  label,
  onClear,
}: {
  label: string;
  onClear: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-[color-mix(in_oklab,var(--color-violet-light)_35%,transparent)] bg-[color-mix(in_oklab,var(--color-violet-light)_12%,transparent)] py-1 pl-3 pr-1 text-xs text-[var(--color-violet-light)]">
      {label}
      <button
        type="button"
        onClick={onClear}
        aria-label={`Remove filter: ${label}`}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-violet-light)]"
      >
        <X size={12} />
      </button>
    </span>
  );
}

function SortHeader({
  label,
  col,
  sort,
  dir,
  onSort,
  className,
}: {
  label: string;
  col: SortColumn;
  sort: SortColumn;
  dir: 'asc' | 'desc';
  onSort: (c: SortColumn) => void;
  className?: string;
}) {
  const active = sort === col;
  return (
    <TableHead className={`text-white/50 ${className ?? ''}`}>
      <button
        type="button"
        onClick={() => onSort(col)}
        className="inline-flex items-center gap-1 hover:text-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-violet-light)] rounded"
        aria-label={`Sort by ${label}`}
      >
        {label}
        {active &&
          (dir === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />)}
      </button>
    </TableHead>
  );
}

function RowActions({
  lead,
  onArchive,
}: {
  lead: LeadRow;
  onArchive: (l: LeadRow) => void;
}) {
  const navigate = useNavigate();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Actions for ${lead.brand_name}`}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-white/50 hover:bg-white/5 hover:text-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-violet-light)]"
        >
          <MoreHorizontal size={16} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => navigate(`/crm/leads/${lead.id}/edit`)}>
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          onSelect={() => onArchive(lead)}
        >
          Archive
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DesktopTable({
  rows,
  sort,
  dir,
  onSort,
  onStatus,
  onArchive,
}: {
  rows: LeadRow[];
  sort: SortColumn;
  dir: 'asc' | 'desc';
  onSort: (c: SortColumn) => void;
  onStatus: (l: LeadRow, c: StatusChange) => void;
  onArchive: (l: LeadRow) => void;
}) {
  return (
    <div className="hidden rounded-xl border border-[var(--border)] bg-[var(--card)] md:block">
      <Table>
        <TableHeader>
          <TableRow className="border-[var(--border)] hover:bg-transparent">
            <SortHeader label="Brand" col="brand_name" sort={sort} dir={dir} onSort={onSort} className="pl-4" />
            <TableHead className="text-white/50">Instagram</TableHead>
            <SortHeader label="Status / Outcome" col="status" sort={sort} dir={dir} onSort={onSort} />
            <TableHead className="text-white/50">Primary Contact</TableHead>
            <TableHead className="text-white/50">Primary Phone</TableHead>
            <SortHeader label="Found" col="lead_found_on" sort={sort} dir={dir} onSort={onSort} />
            <TableHead className="pr-4 text-right text-white/50">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((lead) => {
            const contact = primaryContact(lead);
            const phone = primaryPhone(contact);
            return (
              <TableRow key={lead.id} className="border-[var(--border)]">
                <TableCell className="pl-4 font-medium text-white/90">
                  <Link href={`/crm/leads/${lead.id}`} className="hover:text-[var(--color-violet-light)] hover:underline">
                    {lead.brand_name}
                  </Link>
                </TableCell>
                <TableCell className="text-white/60">
                  <InstagramLink handle={lead.instagram_username} />
                </TableCell>
                <TableCell>
                  <LeadStatusControl
                    status={lead.status}
                    outcome={lead.outcome}
                    onChange={(c) => onStatus(lead, c)}
                  />
                </TableCell>
                <TableCell className="text-white/70">
                  {contact ? contact.name : <span className="text-white/25">No contact</span>}
                </TableCell>
                <TableCell>
                  {phone ? (
                    <PhoneActions phone={phone} />
                  ) : (
                    <span className="text-white/25">—</span>
                  )}
                </TableCell>
                <TableCell className="text-white/60">
                  {format(new Date(lead.lead_found_on), 'd MMM yyyy')}
                </TableCell>
                <TableCell className="pr-4 text-right">
                  <RowActions lead={lead} onArchive={onArchive} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function MobileCards({
  rows,
  onStatus,
  onArchive,
}: {
  rows: LeadRow[];
  onStatus: (l: LeadRow, c: StatusChange) => void;
  onArchive: (l: LeadRow) => void;
}) {
  return (
    <div className="space-y-3 md:hidden">
      {rows.map((lead) => {
        const contact = primaryContact(lead);
        const phone = primaryPhone(contact);
        return (
          <div
            key={lead.id}
            className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4"
          >
            <div className="mb-3 flex items-start justify-between gap-2">
              <div>
                <Link href={`/crm/leads/${lead.id}`} className="font-medium text-white/90 hover:text-[var(--color-violet-light)]">
                  {lead.brand_name}
                </Link>
                <div className="text-sm">
                  <InstagramLink handle={lead.instagram_username} />
                </div>
              </div>
              <RowActions lead={lead} onArchive={onArchive} />
            </div>

            <div className="mb-3">
              <LeadStatusControl
                status={lead.status}
                outcome={lead.outcome}
                onChange={(c) => onStatus(lead, c)}
              />
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 text-sm">
                {contact ? (
                  <span className="text-white/70">{contact.name}</span>
                ) : (
                  <span className="text-white/25">No contact</span>
                )}
              </div>
              {phone ? (
                <PhoneActions phone={phone} />
              ) : (
                <span className="text-sm text-white/25">No phone</span>
              )}
            </div>

            <div className="mt-3 border-t border-[var(--border)] pt-2 text-xs text-white/40">
              Found {format(new Date(lead.lead_found_on), 'd MMM yyyy')} ·{' '}
              {SOURCE_LABEL[lead.source]}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  onPage,
}: {
  page: number;
  totalPages: number;
  onPage: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  const btn =
    'inline-flex items-center gap-1 rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm text-white/80 transition-colors hover:bg-white/5 disabled:opacity-40 disabled:hover:bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-violet-light)]';
  return (
    <div className="mt-4 flex items-center justify-between">
      <button type="button" onClick={() => onPage(page - 1)} disabled={page <= 1} className={btn}>
        <ChevronLeft size={15} /> Prev
      </button>
      <span className="text-sm text-white/50">
        Page {page} of {totalPages}
      </span>
      <button
        type="button"
        onClick={() => onPage(page + 1)}
        disabled={page >= totalPages}
        className={btn}
      >
        Next <ChevronRight size={15} />
      </button>
    </div>
  );
}

function LoadingState() {
  const rows = Array.from({ length: 8 });
  return (
    <>
      {/* Desktop skeleton keeps the table shape visible immediately */}
      <div className="hidden overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] md:block">
        <div className="flex items-center gap-4 border-b border-[var(--border)] px-4 py-3">
          {['Brand', 'Instagram', 'Status', 'Contact', 'Phone', 'Found', ''].map(
            (h, i) => (
              <Skeleton key={i} className="h-3 flex-1" />
            ),
          )}
        </div>
        {rows.map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-[var(--border)] px-4 py-4 last:border-0">
            {Array.from({ length: 7 }).map((__, j) => (
              <Skeleton key={j} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>
      {/* Mobile skeleton cards */}
      <div className="space-y-3 md:hidden">
        {rows.slice(0, 5).map((_, i) => (
          <div key={i} className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
            <Skeleton className="mb-2 h-4 w-1/2" />
            <Skeleton className="mb-3 h-3 w-1/3" />
            <Skeleton className="h-8 w-40" />
          </div>
        ))}
      </div>
    </>
  );
}

function EmptyState({ filtersActive }: { filtersActive: boolean }) {
  return (
    <div className="flex min-h-[36vh] items-center justify-center px-6 text-center">
      <div className="max-w-md">
        <h2 className="mb-2 text-lg font-semibold">
          {filtersActive ? 'No leads match these filters' : 'No leads yet'}
        </h2>
        <p className="text-sm text-white/60">
          {filtersActive
            ? 'Try widening your search, clearing filters, or a different date range.'
            : 'Leads you add — and website enquiries you convert — will show up here.'}
        </p>
      </div>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex min-h-[36vh] items-center justify-center px-6 text-center">
      <div className="max-w-md" role="alert">
        <h2 className="mb-2 text-lg font-semibold">Couldn’t load leads</h2>
        <p className="mb-6 text-sm text-white/60">
          Something went wrong reaching the server. Check your connection and try
          again.
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center justify-center rounded-lg bg-[var(--color-violet-cta)] px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.03] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-violet-light)]"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
