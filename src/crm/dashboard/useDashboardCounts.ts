// The three numbers across the top of /crm.
//
// Every one is a HEAD request with an exact count — PostgREST returns the count
// in the Content-Range header and no rows at all. Counting by fetching ids and
// reading .length would both cost bandwidth and silently cap at the 1000-row
// response limit, so a busy week would render "1000" forever.
//
// Each count's filter matches a partial index added in 090010, and matches the
// list view its tile links to, so the number and the screen behind it agree.
import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { RECENT_DAYS, daysAgoISO } from '../leads/leadsQuery';

export interface DashboardCounts {
  followup: number;
  recent: number;
  openEnquiries: number;
}

export type CountsState =
  | { status: 'loading' }
  | { status: 'ready'; counts: DashboardCounts }
  | { status: 'error' };

export function useDashboardCounts(): CountsState & { refetch: () => void } {
  const [state, setState] = useState<CountsState>({ status: 'loading' });
  const reqIdRef = useRef(0);

  const load = useCallback(async () => {
    const reqId = ++reqIdRef.current;
    setState({ status: 'loading' });
    // One instant for all three, so the tiles are a coherent snapshot.
    const cutoff = daysAgoISO(RECENT_DAYS);
    try {
      const [followup, recent, openEnquiries] = await Promise.all([
        supabase
          .from('leads')
          .select('id', { count: 'exact', head: true })
          .is('deleted_at', null)
          .eq('status', 'contacted')
          .is('outcome', null)
          .lte('contacted_at', cutoff),
        supabase
          .from('leads')
          .select('id', { count: 'exact', head: true })
          .is('deleted_at', null)
          .gte('created_at', cutoff),
        supabase
          .from('inbound_enquiries')
          .select('id', { count: 'exact', head: true })
          .is('converted_lead_id', null),
      ]);
      if (reqId !== reqIdRef.current) return;
      const first = [followup, recent, openEnquiries].find((r) => r.error);
      if (first) throw first.error;
      setState({
        status: 'ready',
        counts: {
          followup: followup.count ?? 0,
          recent: recent.count ?? 0,
          openEnquiries: openEnquiries.count ?? 0,
        },
      });
    } catch {
      if (reqId !== reqIdRef.current) return;
      setState({ status: 'error' });
    }
  }, []);

  useEffect(() => {
    void load();
    return () => {
      // Mutating the live ref IS the invalidation; a copied value would let
      // a stale in-flight response through, which is the bug this guards.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      reqIdRef.current++;
    };
  }, [load]);

  return { ...state, refetch: load };
}
