// The /crm leads list. List-only for this phase: no detail view, no create/
// edit, no server-side filtering — those are later phases. Search is a cheap
// client-side filter over the already-loaded rows.
import React, { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Search } from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { useLeads, type LeadRow } from './useLeads';

const SOURCE_LABEL: Record<LeadRow['source'], string> = {
  manual: 'Manual',
  website_callback: 'Callback',
  website_query: 'Query',
  import: 'Import',
};

function StatusBadge({ status }: { status: LeadRow['status'] }) {
  return status === 'contacted' ? (
    <Badge className="border-transparent bg-[var(--accent)] text-[var(--color-violet-light)]">
      Contacted
    </Badge>
  ) : (
    <Badge variant="outline" className="text-white/60">
      Pending
    </Badge>
  );
}

function OutcomeBadge({ outcome }: { outcome: LeadRow['outcome'] }) {
  if (outcome === 'interested') {
    return (
      <Badge className="border-transparent bg-[color-mix(in_oklab,var(--color-emerald)_18%,transparent)] text-[var(--color-emerald)]">
        Interested
      </Badge>
    );
  }
  if (outcome === 'not_interested') {
    return (
      <Badge className="border-transparent bg-[color-mix(in_oklab,var(--destructive)_16%,transparent)] text-[var(--destructive)]">
        Not interested
      </Badge>
    );
  }
  return <span className="text-white/25">—</span>;
}

function CenteredState({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center px-6 text-center">
      {children}
    </div>
  );
}

export function LeadsList() {
  const leads = useLeads();
  const [query, setQuery] = useState('');

  const rows = leads.status === 'ready' ? leads.leads : [];
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (l) =>
        l.brand_name.toLowerCase().includes(q) ||
        (l.instagram_username?.toLowerCase().includes(q) ?? false),
    );
  }, [rows, query]);

  if (leads.status === 'loading') {
    return (
      <CenteredState>
        <div className="flex flex-col items-center gap-4" role="status" aria-live="polite">
          <span
            className="h-8 w-8 rounded-full border-2 border-white/20 border-t-[var(--color-violet-light)] animate-spin"
            aria-hidden="true"
          />
          <span className="text-sm text-white/50">Loading leads…</span>
        </div>
      </CenteredState>
    );
  }

  if (leads.status === 'error') {
    return (
      <CenteredState>
        <div className="max-w-md" role="alert">
          <h2 className="mb-2 text-lg font-semibold">Couldn’t load leads</h2>
          <p className="mb-6 text-sm text-white/60">
            Something went wrong reaching the server. Check your connection and
            try again.
          </p>
          <button
            type="button"
            onClick={leads.refetch}
            className="inline-flex items-center justify-center rounded-lg bg-[var(--color-violet-cta)] px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.03] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-violet-light)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-void-black)]"
          >
            Try again
          </button>
        </div>
      </CenteredState>
    );
  }

  // status === 'ready'
  if (rows.length === 0) {
    return (
      <CenteredState>
        <div className="max-w-md">
          <h2 className="mb-2 text-lg font-semibold">No leads yet</h2>
          <p className="text-sm text-white/60">
            Leads you add — and website enquiries you convert — will show up
            here.
          </p>
        </div>
      </CenteredState>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold">Leads</h1>
          <p className="text-sm text-white/50">
            {filtered.length}
            {query.trim() ? ` of ${rows.length}` : ''}{' '}
            {rows.length === 1 && !query.trim() ? 'lead' : 'leads'}
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search leads by brand or Instagram"
            placeholder="Search brand or @handle"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--input-background)] py-2 pl-9 pr-3 text-sm text-[var(--color-ink)] placeholder:text-white/30 outline-none transition focus-visible:border-[var(--color-violet-light)] focus-visible:ring-2 focus-visible:ring-[var(--color-violet-light)]"
          />
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)]">
        <Table>
          <TableHeader>
            <TableRow className="border-[var(--border)] hover:bg-transparent">
              <TableHead className="pl-4 text-white/50">Brand</TableHead>
              <TableHead className="text-white/50">Instagram</TableHead>
              <TableHead className="text-white/50">Status</TableHead>
              <TableHead className="text-white/50">Outcome</TableHead>
              <TableHead className="text-white/50">Source</TableHead>
              <TableHead className="pr-4 text-white/50">Found</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow className="border-[var(--border)] hover:bg-transparent">
                <TableCell colSpan={6} className="py-10 text-center text-sm text-white/40">
                  No leads match “{query.trim()}”.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((lead) => (
                <TableRow key={lead.id} className="border-[var(--border)]">
                  <TableCell className="pl-4 font-medium text-white/90">
                    {lead.brand_name}
                  </TableCell>
                  <TableCell className="text-white/60">
                    {lead.instagram_username ? (
                      <a
                        href={`https://instagram.com/${lead.instagram_username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--color-violet-light)] hover:underline"
                      >
                        @{lead.instagram_username}
                      </a>
                    ) : (
                      <span className="text-white/25">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={lead.status} />
                  </TableCell>
                  <TableCell>
                    <OutcomeBadge outcome={lead.outcome} />
                  </TableCell>
                  <TableCell className="text-white/60">
                    {SOURCE_LABEL[lead.source]}
                  </TableCell>
                  <TableCell className="pr-4 text-white/60">
                    {format(new Date(lead.lead_found_on), 'd MMM yyyy')}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
