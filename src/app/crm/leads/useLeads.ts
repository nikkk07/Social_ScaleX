// Fetch ONE server-side page of leads for the given query. Staff-only access is
// enforced by RLS (leads_select → is_staff()); soft-deleted rows are excluded
// in the query. Distinct loading / ready / error states — zero rows is a valid
// ready state (empty or no-match), never an error.
//
// The reqIdRef supersession guard matters MORE with debounced search + rapid
// filter changes: several fetches can be in flight; only the newest may write.
import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchLeadsPage, type LeadRow, type LeadsQuery } from './leadsQuery';

export type { LeadRow };

export type LeadsState =
  | { status: 'loading' }
  | { status: 'ready'; leads: LeadRow[]; total: number }
  | { status: 'error' };

export function useLeads(query: LeadsQuery): LeadsState & { refetch: () => void } {
  const [state, setState] = useState<LeadsState>({ status: 'loading' });
  const reqIdRef = useRef(0);

  const load = useCallback(async () => {
    const reqId = ++reqIdRef.current;
    setState({ status: 'loading' });
    try {
      const { rows, total } = await fetchLeadsPage(query);
      if (reqId !== reqIdRef.current) return; // superseded by a newer load
      setState({ status: 'ready', leads: rows, total });
    } catch {
      if (reqId !== reqIdRef.current) return;
      setState({ status: 'error' });
    }
  }, [query]);

  useEffect(() => {
    void load();
    return () => {
      reqIdRef.current++; // ignore any in-flight result after unmount/refetch
    };
  }, [load]);

  return { ...state, refetch: load };
}
