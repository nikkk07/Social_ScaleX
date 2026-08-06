// Fetch the leads list. Staff-only access is enforced by RLS (leads_select →
// is_staff()); a provisioned user reaches this, an unprovisioned one never does
// (RequireAuth stops them). Soft-deleted rows (deleted_at) are excluded.
//
// States mirror the AuthProvider discipline: distinct loading / ready / error,
// never a bare boolean. "Zero rows" is a valid ready state (empty list), NOT an
// error — the same distinction that mattered in Phase 3.
import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import type { Database } from '../../../lib/database.types';

// Only the columns the list needs — keeps the payload small.
export type LeadRow = Pick<
  Database['public']['Tables']['leads']['Row'],
  | 'id'
  | 'brand_name'
  | 'instagram_username'
  | 'status'
  | 'outcome'
  | 'source'
  | 'lead_found_on'
  | 'created_at'
>;

const COLUMNS =
  'id, brand_name, instagram_username, status, outcome, source, lead_found_on, created_at';

export type LeadsState =
  | { status: 'loading' }
  | { status: 'ready'; leads: LeadRow[] }
  | { status: 'error' };

export function useLeads(): LeadsState & { refetch: () => void } {
  const [state, setState] = useState<LeadsState>({ status: 'loading' });
  const reqIdRef = useRef(0);

  const load = useCallback(async () => {
    const reqId = ++reqIdRef.current;
    setState({ status: 'loading' });

    const { data, error } = await supabase
      .from('leads')
      .select(COLUMNS)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (reqId !== reqIdRef.current) return; // superseded by a newer load

    if (error) {
      setState({ status: 'error' });
      return;
    }
    setState({ status: 'ready', leads: (data ?? []) as LeadRow[] });
  }, []);

  useEffect(() => {
    void load();
    return () => {
      reqIdRef.current++; // ignore any in-flight result after unmount
    };
  }, [load]);

  return { ...state, refetch: load };
}
