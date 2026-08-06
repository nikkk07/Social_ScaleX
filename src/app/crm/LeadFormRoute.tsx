// Route for /crm/leads/new (add) and /crm/leads/:id/edit (edit). Behind
// RequireAuth like the rest of the CRM. In edit mode it loads the lead first
// and handles loading / not-found / error before mounting the form.
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { RequireAuth } from './auth/RequireAuth';
import { supabase } from '../../lib/supabase';
import { LeadForm } from './leads/LeadForm';
import { emptyLeadForm, type LeadFormValues } from './leads/leadFormSchema';

const shell =
  'crm-root dark min-h-screen bg-[var(--color-void-black)] text-[var(--color-ink)]';

export default function LeadFormRoute() {
  const { id } = useParams();
  return (
    <RequireAuth>
      <div className={shell}>
        {id ? (
          <EditLoader id={id} />
        ) : (
          <LeadForm mode="add" initial={emptyLeadForm()} />
        )}
      </div>
    </RequireAuth>
  );
}

type LoadState =
  | { kind: 'loading' }
  | { kind: 'error' }
  | { kind: 'notfound' }
  | { kind: 'ready'; values: LeadFormValues };

function EditLoader({ id }: { id: string }) {
  const [state, setState] = useState<LoadState>({ kind: 'loading' });

  useEffect(() => {
    let active = true;
    supabase
      .from('leads')
      .select(
        'brand_name, instagram_username, address, lead_found_on, status, outcome, source, notes, owner_id',
      )
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          setState({ kind: 'error' });
          return;
        }
        if (!data) {
          setState({ kind: 'notfound' });
          return;
        }
        setState({
          kind: 'ready',
          values: {
            brand_name: data.brand_name,
            instagram_username: data.instagram_username ?? '',
            address: data.address ?? '',
            lead_found_on: data.lead_found_on,
            status: data.status,
            outcome: data.outcome ?? '',
            source: data.source,
            notes: data.notes ?? '',
            owner_id: data.owner_id ?? '',
            contacts: [],
            lead_phones: [],
          },
        });
      });
    return () => {
      active = false;
    };
  }, [id]);

  if (state.kind === 'loading') {
    return <Centered>Loading lead…</Centered>;
  }
  if (state.kind === 'notfound') {
    return <Centered>Lead not found, or it’s been archived.</Centered>;
  }
  if (state.kind === 'error') {
    return <Centered>Couldn’t load this lead. Please try again.</Centered>;
  }
  return <LeadForm mode="edit" leadId={id} initial={state.values} />;
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center px-6 text-center text-sm text-white/60">
      {children}
    </div>
  );
}
