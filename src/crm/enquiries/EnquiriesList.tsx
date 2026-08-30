// /crm/enquiries — the inbound work queue from the public contact form.
//
// This is a queue, not an archive: the default view is what's still open, and
// the only action that matters is "convert to lead". Converting hands off to
// the normal add-lead form (prefilled, with the enquiry id along for the ride)
// so there is exactly ONE place where a lead gets created and validated.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from '@/lib/router';
import { format, formatDistanceToNow } from 'date-fns';
import { ChevronLeft, ChevronRight, Mail, Phone, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useEnquiries } from './useEnquiries';
import {
  DEFAULT_ENQUIRIES_QUERY,
  PAGE_SIZE,
  fromSearchParams,
  hasActiveFilters,
  toSearchParams,
  type EnquiriesQuery,
  type EnquiryRow,
} from './enquiriesQuery';

const inputClass =
  'rounded-lg border border-[var(--border)] bg-[var(--input-background)] px-3 py-2 text-sm text-[var(--color-ink)] placeholder:text-white/30 outline-none transition focus-visible:border-[var(--color-violet-light)] focus-visible:ring-2 focus-visible:ring-[var(--color-violet-light)]';

function KindBadge({ kind }: { kind: string }) {
  const callback = kind === 'callback';
  return (
    <Badge
      className={
        callback
          ? 'border-transparent bg-[color-mix(in_oklab,var(--color-amber)_16%,transparent)] text-[var(--color-amber)]'
          : 'border-transparent bg-[color-mix(in_oklab,var(--color-violet-light)_18%,transparent)] text-[var(--color-violet-light)]'
      }
    >
      {callback ? 'Callback' : 'Query'}
    </Badge>
  );
}

// Received-at: relative for the recent stuff (a queue is about "how long has
// this been sitting"), absolute once that stops being meaningful.
function Received({ iso }: { iso: string }) {
  const d = new Date(iso);
  const days = (Date.now() - d.getTime()) / 86_400_000;
  return (
    <span title={format(d, 'd MMM yyyy, HH:mm')}>
      {days < 7 ? `${formatDistanceToNow(d)} ago` : format(d, 'd MMM yyyy')}
    </span>
  );
}

function ContactLinks({ e }: { e: EnquiryRow }) {
  if (!e.phone && !e.email) return <span className="text-white/25">—</span>;
  return (
    <div className="flex flex-col gap-1">
      {e.phone && (
        <a
          href={`tel:${e.phone}`}
          className="inline-flex items-center gap-1.5 text-[var(--color-violet-light)] hover:underline"
        >
          <Phone size={13} aria-hidden="true" />
          {e.phone}
        </a>
      )}
      {e.email && (
        <a
          href={`mailto:${e.email}`}
          className="inline-flex items-center gap-1.5 break-all text-[var(--color-violet-light)] hover:underline"
        >
          <Mail size={13} aria-hidden="true" />
          {e.email}
        </a>
      )}
    </div>
  );
}

function ConvertCell({ e }: { e: EnquiryRow }) {
  if (e.converted_lead_id) {
    return (
      <span className="text-xs text-white/50">
        Converted
        {e.converted_lead && (
          <>
            {' → '}
            <Link href={`/crm/leads/${e.converted_lead.id}`}
              className="text-[var(--color-violet-light)] hover:underline"
            >
              {e.converted_lead.brand_name}
            </Link>
          </>
        )}
      </span>
    );
  }
  return (
    <Link href={`/crm/leads/new?enquiry=${e.id}`}
      className="inline-flex items-center rounded-lg bg-[var(--color-violet-cta)] px-3 py-1.5 text-xs font-semibold text-white transition-transform hover:scale-[1.03] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-violet-light)]"
    >
      Convert to lead
    </Link>
  );
}

export function EnquiriesList() {
  const [sp, setSp] = useSearchParams();
  const spString = sp.toString();
  const query = useMemo<EnquiriesQuery>(
    () => fromSearchParams(new URLSearchParams(spString)),
    [spString],
  );

  const result = useEnquiries(query);
  const total = result.status === 'ready' ? result.total : 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const filtersActive = hasActiveFilters(query);

  const setFilters = useCallback(
    (patch: Partial<EnquiriesQuery>) => {
      setSp(toSearchParams({ ...query, ...patch, page: 1 }));
    },
    [query, setSp],
  );
  const setPage = useCallback(
    (page: number) => setSp(toSearchParams({ ...query, page })),
    [query, setSp],
  );

  // Debounced search (~300ms), same as the leads list.
  const [searchInput, setSearchInput] = useState(query.q);
  useEffect(() => setSearchInput(query.q), [query.q]); // sync on back/forward
  useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput !== query.q) setFilters({ q: searchInput });
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput, query.q, setFilters]);

  const rows = result.status === 'ready' ? result.enquiries : [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <div className="mb-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold">Website enquiries</h1>
            <p className="text-sm text-white/50" aria-live="polite">
              {result.status === 'ready'
                ? `${total} ${total === 1 ? 'enquiry' : 'enquiries'}`
                : ' '}
            </p>
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
              aria-label="Search enquiries by name, phone or email"
              placeholder="Search name, phone or email"
              className={`${inputClass} w-full pl-9`}
            />
          </div>

          <select
            aria-label="Filter by conversion state"
            value={query.state}
            onChange={(e) =>
              setFilters({ state: e.target.value as EnquiriesQuery['state'] })
            }
            className={inputClass}
          >
            <option value="open">Not converted</option>
            <option value="converted">Converted</option>
            <option value="all">All</option>
          </select>

          <select
            aria-label="Filter by kind"
            value={query.kind}
            onChange={(e) =>
              setFilters({ kind: e.target.value as EnquiriesQuery['kind'] })
            }
            className={inputClass}
          >
            <option value="">Any kind</option>
            <option value="callback">Callback</option>
            <option value="query">Query</option>
          </select>

          {filtersActive && (
            <button
              type="button"
              onClick={() => setSp(toSearchParams(DEFAULT_ENQUIRIES_QUERY))}
              className="rounded text-sm text-white/50 hover:text-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-violet-light)]"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {result.status === 'error' ? (
        <ErrorState onRetry={result.refetch} />
      ) : result.status === 'loading' ? (
        <LoadingState />
      ) : total === 0 ? (
        <EmptyState query={query} />
      ) : (
        <>
          <DesktopTable rows={rows} />
          <MobileCards rows={rows} />
          <Pagination page={query.page} totalPages={totalPages} onPage={setPage} />
        </>
      )}
    </div>
  );
}

function DesktopTable({ rows }: { rows: EnquiryRow[] }) {
  return (
    <div className="hidden overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] md:block">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="text-white/50">Name</TableHead>
            <TableHead className="text-white/50">Kind</TableHead>
            <TableHead className="text-white/50">Contact</TableHead>
            <TableHead className="text-white/50">Message</TableHead>
            <TableHead className="text-white/50">Received</TableHead>
            <TableHead className="text-right text-white/50">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((e) => (
            <TableRow key={e.id}>
              <TableCell className="font-medium">
                {e.name}
                {e.best_time && (
                  <span className="mt-0.5 block text-xs text-white/40">
                    Prefers {e.best_time}
                  </span>
                )}
              </TableCell>
              <TableCell>
                <KindBadge kind={e.kind} />
              </TableCell>
              <TableCell className="text-sm">
                <ContactLinks e={e} />
              </TableCell>
              <TableCell className="max-w-[22rem] text-sm text-white/70">
                {e.message ? (
                  // Full text on hover; the cell itself stays one tidy row.
                  <span className="line-clamp-2 block" title={e.message}>
                    {e.message}
                  </span>
                ) : (
                  <span className="text-white/25">—</span>
                )}
              </TableCell>
              <TableCell className="whitespace-nowrap text-sm text-white/60">
                <Received iso={e.created_at} />
              </TableCell>
              <TableCell className="text-right">
                <ConvertCell e={e} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function MobileCards({ rows }: { rows: EnquiryRow[] }) {
  return (
    <div className="space-y-3 md:hidden">
      {rows.map((e) => (
        <div
          key={e.id}
          className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4"
        >
          <div className="mb-2 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="font-medium">{e.name}</div>
              <div className="text-xs text-white/40">
                <Received iso={e.created_at} />
                {e.best_time ? ` · prefers ${e.best_time}` : ''}
              </div>
            </div>
            <KindBadge kind={e.kind} />
          </div>

          <div className="mb-3 text-sm">
            <ContactLinks e={e} />
          </div>

          {e.message && (
            <p className="mb-3 text-sm text-white/70">{e.message}</p>
          )}

          <div className="border-t border-[var(--border)] pt-3">
            <ConvertCell e={e} />
          </div>
        </div>
      ))}
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
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4"
        >
          <Skeleton className="mb-2 h-4 w-1/3" />
          <Skeleton className="mb-3 h-3 w-1/4" />
          <Skeleton className="h-8 w-36" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ query }: { query: EnquiriesQuery }) {
  // An empty DEFAULT view is success — the queue is clear — so it must not
  // read like the "nothing matched" dead end that filters produce.
  const isCleanQueue = !hasActiveFilters(query);
  return (
    <div className="flex min-h-[36vh] items-center justify-center px-6 text-center">
      <div className="max-w-md">
        <h2 className="mb-2 text-lg font-semibold">
          {isCleanQueue ? 'You’re all caught up' : 'No enquiries match these filters'}
        </h2>
        <p className="text-sm text-white/60">
          {isCleanQueue
            ? 'Every website enquiry has been converted or dealt with. New ones land here automatically.'
            : 'Try a different search, kind, or conversion state.'}
        </p>
      </div>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex min-h-[36vh] items-center justify-center px-6 text-center">
      <div className="max-w-md" role="alert">
        <h2 className="mb-2 text-lg font-semibold">Couldn’t load enquiries</h2>
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
