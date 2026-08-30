// Route for /crm/leads/new (add), /crm/leads/new?enquiry=<id> (convert a
// website enquiry) and /crm/leads/:id/edit (edit). Behind RequireAuth like the
// rest of the CRM. Edit and convert both load their source record first and
// handle loading / not-found / error before mounting the form.
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from '@/lib/router';
import { RequireAuth } from './auth/RequireAuth';
import { supabase } from '@/lib/supabase';
import { LeadForm } from './leads/LeadForm';
import { emptyLeadForm, type LeadFormValues } from './leads/leadFormSchema';
import { ENQUIRY_SELECT, type EnquiryRow } from './enquiries/enquiriesQuery';
import { enquiryToLeadForm } from './enquiries/enquiryPrefill';

const shell =
  'crm-root dark min-h-screen bg-[var(--color-void-black)] text-[var(--color-ink)]';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function LeadFormRoute({ id }: { id?: string }) {
  const [sp] = useSearchParams();
  // Validated before it reaches PostgREST: a hand-edited ?enquiry=garbage
  // would otherwise 400 on a uuid cast and blank the screen.
  const raw = sp.get('enquiry') ?? '';
  const enquiryId = UUID_RE.test(raw) ? raw : '';

  return (
    <RequireAuth>
      <div className={shell}>
        {id ? (
          <EditLoader id={id} />
        ) : enquiryId ? (
          <ConvertLoader enquiryId={enquiryId} />
        ) : (
          <LeadForm mode="add" initial={emptyLeadForm()} />
        )}
      </div>
    </RequireAuth>
  );
}

type ConvertState =
  | { kind: 'loading' }
  | { kind: 'error' }
  | { kind: 'notfound' }
  | { kind: 'done'; leadId: string | null } // already converted
  | { kind: 'ready'; enquiry: EnquiryRow; values: LeadFormValues };

function ConvertLoader({ enquiryId }: { enquiryId: string }) {
  const [state, setState] = useState<ConvertState>({ kind: 'loading' });

  useEffect(() => {
    let active = true;
    supabase
      .from('inbound_enquiries')
      .select(ENQUIRY_SELECT)
      .eq('id', enquiryId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) return setState({ kind: 'error' });
        if (!data) return setState({ kind: 'notfound' });
        const enquiry = data as unknown as EnquiryRow;
        // Catch the already-converted case HERE so the person doesn't fill in
        // a whole form before the RPC rejects it. The RPC still refuses (and
        // rolls the lead back) if someone converts it in the meantime — this
        // is the courtesy check, that one is the guarantee.
        if (enquiry.converted_lead_id) {
          return setState({ kind: 'done', leadId: enquiry.converted_lead_id });
        }
        setState({
          kind: 'ready',
          enquiry,
          values: enquiryToLeadForm(enquiry),
        });
      });
    return () => {
      active = false;
    };
  }, [enquiryId]);

  if (state.kind === 'loading') return <Centered>Loading enquiry…</Centered>;
  if (state.kind === 'notfound')
    return <Centered>That enquiry no longer exists.</Centered>;
  if (state.kind === 'error')
    return <Centered>Couldn’t load this enquiry. Please try again.</Centered>;
  if (state.kind === 'done') {
    return (
      <Centered>
        <span>
          This enquiry has already been converted.{' '}
          {state.leadId ? (
            <Link href={`/crm/leads/${state.leadId}`}
              className="text-[var(--color-violet-light)] hover:underline"
            >
              Open the lead
            </Link>
          ) : (
            <Link href="/crm/enquiries"
              className="text-[var(--color-violet-light)] hover:underline"
            >
              Back to enquiries
            </Link>
          )}
        </span>
      </Centered>
    );
  }
  return (
    <LeadForm
      mode="add"
      initial={state.values}
      enquiry={{ id: state.enquiry.id, name: state.enquiry.name }}
    />
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
