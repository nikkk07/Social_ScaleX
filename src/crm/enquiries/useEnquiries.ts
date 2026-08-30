// One server-side page of inbound enquiries. Mirrors useLeads: distinct
// loading / ready / error states (zero rows is a valid ready state — an empty
// work queue is the goal, not a failure), and a supersession guard so a slow
// earlier fetch can't overwrite a newer one.
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  fetchEnquiriesPage,
  type EnquiriesQuery,
  type EnquiryRow,
} from './enquiriesQuery';

export type { EnquiryRow };

export type EnquiriesState =
  | { status: 'loading' }
  | { status: 'ready'; enquiries: EnquiryRow[]; total: number }
  | { status: 'error' };

export function useEnquiries(
  query: EnquiriesQuery,
): EnquiriesState & { refetch: () => void } {
  const [state, setState] = useState<EnquiriesState>({ status: 'loading' });
  const reqIdRef = useRef(0);

  const load = useCallback(async () => {
    const reqId = ++reqIdRef.current;
    setState({ status: 'loading' });
    try {
      const { rows, total } = await fetchEnquiriesPage(query);
      if (reqId !== reqIdRef.current) return; // superseded by a newer load
      setState({ status: 'ready', enquiries: rows, total });
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
