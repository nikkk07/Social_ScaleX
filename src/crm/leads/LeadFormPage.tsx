'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useBlocker, useNavigate, useSearchParams } from '@/lib/router';
import type { Lead, LeadSource } from '@/lib/database.types';
import { normalizeInstagram, normalizePhone } from '@/lib/crm/normalize';
import { useMe } from '../auth/AuthProvider';
import { Card, ErrorState, Field, PageHeader, Spinner, inputClass } from '../ui/kit';
import { Btn, Modal } from '../ui/Modal';
import { invalidateCrm, useLead, useProfiles } from '../data/hooks';
import { asJson, rpc } from '../lib/api';
import { friendlyError } from '../lib/errors';
import { SOURCE_LABEL } from '../lib/labels';
import { todayKey } from '../lib/time';
import { NotFoundView } from '../layout/NotFoundView';
import { ContactsFields, contactsPayload, emptyContact, validateContacts, type ContactsDraft } from './ContactsFields';

interface Scalars {
  brand_name: string;
  instagram: string;
  address: string;
  source: LeadSource;
  lead_found_on: string;
  notes: string;
  owner_id: string;
  deal_value: string;
  competitor_name: string;
  competitor_contract_end: string;
  project_start_date: string;
  expected_delivery_date: string;
  project_end_date: string;
}

const blank = (): Scalars => ({
  brand_name: '', instagram: '', address: '', source: 'manual', lead_found_on: todayKey(), notes: '', owner_id: '',
  deal_value: '', competitor_name: '', competitor_contract_end: '', project_start_date: '', expected_delivery_date: '', project_end_date: '',
});

function fromLead(l: Lead): Scalars {
  return {
    brand_name: l.brand_name, instagram: l.instagram_username ?? '', address: l.address ?? '', source: l.source,
    lead_found_on: l.lead_found_on, notes: l.notes ?? '', owner_id: l.owner_id ?? '',
    deal_value: l.deal_value_inr != null ? String(l.deal_value_inr) : '', competitor_name: l.competitor_name ?? '',
    competitor_contract_end: l.competitor_contract_end ?? '', project_start_date: l.project_start_date ?? '',
    expected_delivery_date: l.expected_delivery_date ?? '', project_end_date: l.project_end_date ?? '',
  };
}

export function LeadFormPage({ mode, id }: { mode: 'add' | 'edit'; id?: string }) {
  if (mode === 'edit' && id) return <EditLoader id={id} />;
  return <AddLoader />;
}

function AddLoader() {
  const [sp] = useSearchParams();
  const enquiryId = sp.get('enquiry') ?? '';
  const valid = /^[0-9a-f-]{36}$/i.test(enquiryId);
  const enq = useQuery({
    queryKey: ['enquiry', enquiryId],
    enabled: valid,
    queryFn: async () => {
      const { data, error } = await supabase.from('inbound_enquiries').select('*').eq('id', enquiryId).maybeSingle();
      if (error) throw new Error(error.message);
      return data;
    },
  });
  if (valid && enq.isLoading) return <Spinner label="Loading enquiry…" />;
  if (valid && enq.isError) return <ErrorState message={friendlyError(enq.error)} onRetry={() => void enq.refetch()} />;
  const e = valid ? enq.data : null;
  if (valid && !e) return <NotFoundView what="enquiry" />;
  if (e?.converted_lead_id) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm">This enquiry was already converted.</p>
        <Link href={`/crm/leads/${e.converted_lead_id}`} className="mt-3 inline-block text-sm font-medium text-primary hover:underline">Open the lead</Link>
      </div>
    );
  }
  const scalars = blank();
  const contacts: ContactsDraft = { contacts: [emptyContact(true)], office: [] };
  if (e) {
    scalars.source = e.kind === 'callback' ? 'website_callback' : 'website_query';
    scalars.lead_found_on = e.created_at.slice(0, 10);
    scalars.notes = [e.message, e.best_time ? `Best time to call: ${e.best_time}` : null].filter(Boolean).join('\n');
    contacts.contacts = [{
      name: e.name, designation: '', email: e.email ?? '', is_primary: true,
      phones: [{ phone: e.phone ?? '', label: 'Mobile', is_primary: true }],
    }];
  }
  return <LeadForm mode="add" initial={scalars} initialContacts={contacts} enquiry={e ? { id: e.id, name: e.name } : null} />;
}

function EditLoader({ id }: { id: string }) {
  const q = useLead(id);
  if (q.isLoading) return <Spinner label="Loading lead…" />;
  if (q.isError) return <ErrorState message={friendlyError(q.error)} onRetry={() => void q.refetch()} />;
  if (!q.data || q.data.lead.deleted_at) return <NotFoundView what="lead" />;
  return <LeadForm mode="edit" lead={q.data.lead} initial={fromLead(q.data.lead)} initialContacts={null} enquiry={null} />;
}

interface Dup { lead_id: string; brand_name: string; owner_name: string; match: string; can_open: boolean }

function LeadForm({ mode, lead, initial, initialContacts, enquiry }: {
  mode: 'add' | 'edit'; lead?: Lead; initial: Scalars; initialContacts: ContactsDraft | null; enquiry: { id: string; name: string } | null;
}) {
  const { isAdmin } = useMe();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const profiles = (useProfiles().data ?? []).filter((p) => p.is_active);
  const [v, setV] = useState<Scalars>(initial);
  const [contacts, setContacts] = useState<ContactsDraft | null>(initialContacts);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [dups, setDups] = useState<Dup[]>([]);
  const [dupAck, setDupAck] = useState(false);
  const saved = useRef(false);

  const dirty = useMemo(() => JSON.stringify(v) !== JSON.stringify(initial) || JSON.stringify(contacts) !== JSON.stringify(initialContacts), [v, contacts, initial, initialContacts]);
  const blocker = useBlocker(() => dirty && !saved.current);
  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => { if (dirty && !saved.current) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);

  const set = (k: keyof Scalars) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setV((x) => ({ ...x, [k]: e.target.value }));
    setDupAck(false);
  };

  async function checkDups(extraPhone?: string) {
    const phones = (contacts ? [...contacts.contacts.flatMap((c) => c.phones.map((p) => p.phone)), ...contacts.office.map((p) => p.phone)] : [])
      .concat(extraPhone ? [extraPhone] : [])
      .map((p) => normalizePhone(p)).filter((p): p is string => !!p);
    const handle = normalizeInstagram(v.instagram);
    if (!handle && phones.length === 0) { setDups([]); return; }
    try {
      const res = (await rpc('find_duplicates', { p_handle: handle ?? '', p_phones: phones, p_exclude: (lead?.id ?? undefined) as string })) as Dup[];
      setDups(res ?? []);
    } catch {
      setDups([]);
    }
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!v.brand_name.trim()) e.brand_name = 'Enter the brand name.';
    if (v.brand_name.length > 200) e.brand_name = 'Keep it under 200 characters.';
    if (v.instagram.trim() && !normalizeInstagram(v.instagram)) e.instagram = 'Use the handle or profile link, e.g. @nimbuscoffee.';
    if (!v.lead_found_on || v.lead_found_on > todayKey()) e.lead_found_on = 'Pick a date that isn’t in the future.';
    if (v.deal_value.trim() && !(Number(v.deal_value.replace(/[,\s₹]/g, '')) >= 0)) e.deal_value = 'Enter a valid amount.';
    if (v.notes.length > 10000) e.notes = 'Notes are too long.';
    if (contacts) Object.assign(e, validateContacts(contacts));
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function save(ev: React.FormEvent) {
    ev.preventDefault();
    if (busy || !validate()) return;
    if (dups.length && !dupAck) {
      setDupAck(true);
      toast.warning('This looks like a duplicate. Review the warning, then save again to continue.');
      return;
    }
    setBusy(true);
    try {
      if (mode === 'add') {
        const payload = {
          brand_name: v.brand_name.trim(),
          instagram_username: v.instagram.trim() || null,
          address: v.address.trim() || null,
          source: v.source,
          lead_found_on: v.lead_found_on,
          notes: v.notes.trim() || null,
          owner_id: isAdmin ? v.owner_id || null : null,
          enquiry_id: enquiry?.id ?? null,
          ...contactsPayload(contacts ?? { contacts: [], office: [] }),
        };
        const newId = await rpc('create_lead_with_contacts', { payload: asJson(payload) });
        saved.current = true;
        toast.success(enquiry ? 'Enquiry converted to a lead.' : 'Lead created.');
        invalidateCrm(qc);
        void qc.invalidateQueries({ queryKey: ['enquiries'] });
        navigate(`/crm/leads/${newId}`, { replace: true });
      } else if (lead) {
        const patch: Partial<Lead> = {
          brand_name: v.brand_name.trim(),
          instagram_username: normalizeInstagram(v.instagram),
          address: v.address.trim() || null,
          source: v.source,
          lead_found_on: v.lead_found_on,
          notes: v.notes.trim() || null,
          deal_value_inr: v.deal_value.trim() ? Number(v.deal_value.replace(/[,\s₹]/g, '')) : null,
          competitor_name: v.competitor_name.trim() || null,
          competitor_contract_end: v.competitor_contract_end || null,
          project_start_date: v.project_start_date || null,
          expected_delivery_date: v.expected_delivery_date || null,
          project_end_date: v.project_end_date || null,
        };
        const { error } = await supabase.from('leads').update(patch).eq('id', lead.id);
        if (error) throw new Error(error.message);
        saved.current = true;
        toast.success('Lead updated.');
        invalidateCrm(qc, lead.id);
        navigate(`/crm/leads/${lead.id}`, { replace: true });
      }
    } catch (e) {
      toast.error(friendlyError(e));
    } finally {
      setBusy(false);
    }
  }

  const back = lead ? `/crm/leads/${lead.id}` : enquiry ? '/crm/enquiries' : '/crm/leads';
  const txt = (k: keyof Scalars, label: string, opts: { required?: boolean; type?: string; hint?: string; placeholder?: string; max?: string; onBlur?: () => void; maxLength?: number } = {}) => (
    <Field label={label} required={opts.required} error={errors[k]} hint={opts.hint}>
      {({ id, describedBy, invalid }) => (
        <input id={id} type={opts.type ?? 'text'} value={v[k]} onChange={set(k)} onBlur={opts.onBlur} placeholder={opts.placeholder}
          max={opts.max} maxLength={opts.maxLength} aria-describedby={describedBy} aria-invalid={invalid || undefined} className={inputClass} />
      )}
    </Field>
  );

  return (
    <>
      <Link href={back} className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden="true" /> Back
      </Link>
      <PageHeader
        title={mode === 'edit' ? `Edit ${lead?.brand_name ?? 'lead'}` : enquiry ? 'Convert enquiry to lead' : 'Add lead'}
        description={enquiry ? `From the website enquiry by ${enquiry.name}. Add the business details below.` : mode === 'edit' ? 'Contacts and phones are edited on the lead page.' : undefined}
      />
      <form onSubmit={save} noValidate className="space-y-6">
        <Card className="p-4 sm:p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            {txt('brand_name', 'Brand / business name', { required: true, maxLength: 200 })}
            {txt('instagram', 'Instagram', { placeholder: '@handle or profile link', onBlur: () => void checkDups(), maxLength: 200 })}
            {txt('address', 'City / address', { maxLength: 500 })}
            <Field label="Source">
              {({ id }) => (
                <select id={id} value={v.source} onChange={set('source')} className={inputClass}>
                  {(Object.keys(SOURCE_LABEL) as LeadSource[]).map((s) => <option key={s} value={s}>{SOURCE_LABEL[s]}</option>)}
                </select>
              )}
            </Field>
            {txt('lead_found_on', 'Found on', { type: 'date', required: true, max: todayKey() })}
            {mode === 'add' && isAdmin ? (
              <Field label="Owner" hint="Leave unassigned to put it in the daily top-up pool.">
                {({ id, describedBy }) => (
                  <select id={id} value={v.owner_id} onChange={set('owner_id')} className={inputClass} aria-describedby={describedBy}>
                    <option value="">Unassigned</option>
                    {profiles.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                )}
              </Field>
            ) : null}
            {mode === 'edit' ? (
              <>
                {txt('deal_value', 'Deal value (₹)', { placeholder: 'e.g. 45000' })}
                {txt('competitor_name', 'Current agency', { maxLength: 200 })}
                {txt('competitor_contract_end', 'Their contract ends', { type: 'date' })}
                {lead?.stage === 'won' ? (
                  <>
                    {txt('project_start_date', 'Project start', { type: 'date' })}
                    {txt('expected_delivery_date', 'Expected delivery', { type: 'date' })}
                    {txt('project_end_date', 'Project end', { type: 'date' })}
                  </>
                ) : null}
              </>
            ) : null}
            <Field label="Notes" error={errors.notes} className="sm:col-span-2">
              {({ id, describedBy, invalid }) => (
                <textarea id={id} rows={3} value={v.notes} onChange={set('notes')} maxLength={10000} className={inputClass}
                  aria-describedby={describedBy} aria-invalid={invalid || undefined} />
              )}
            </Field>
          </div>
        </Card>

        {contacts ? (
          <Card className="p-4 sm:p-5">
            <h2 className="mb-3 text-sm font-semibold">Contacts</h2>
            <ContactsFields value={contacts} onChange={(d) => { setContacts(d); setDupAck(false); }} errors={errors} onPhoneBlur={(p) => void checkDups(p)} />
          </Card>
        ) : null}

        {dups.length ? (
          <div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
            <p className="flex items-center gap-2 font-medium"><AlertTriangle className="size-4" aria-hidden="true" /> Possible duplicate</p>
            <ul className="mt-1 list-disc pl-6">
              {dups.map((d) => (
                <li key={d.lead_id}>
                  {d.can_open ? <Link href={`/crm/leads/${d.lead_id}`} className="font-medium underline">{d.brand_name}</Link> : <strong>{d.brand_name}</strong>}
                  {' '}— same {d.match === 'instagram' ? 'Instagram handle' : 'phone number'}, owned by {d.owner_name}.
                </li>
              ))}
            </ul>
            {dupAck ? <p className="mt-1">Press save again to create it anyway.</p> : null}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-end gap-2">
          <Link href={back} className="inline-flex h-9 items-center rounded-lg border border-border bg-card px-3.5 text-sm font-medium hover:bg-muted">Cancel</Link>
          <Btn type="submit" disabled={busy}>{busy ? 'Saving…' : mode === 'edit' ? 'Save changes' : enquiry ? 'Create lead' : dups.length && dupAck ? 'Save anyway' : 'Create lead'}</Btn>
        </div>
      </form>

      {blocker.state === 'blocked' ? (
        <Modal open size="sm" onOpenChange={(o) => { if (!o) blocker.reset?.(); }} title="Discard your changes?"
          description="You have unsaved changes on this form."
          footer={<><Btn variant="secondary" onClick={() => blocker.reset?.()}>Keep editing</Btn><Btn variant="danger" onClick={() => { saved.current = true; blocker.proceed?.(); }}>Discard</Btn></>}>
          <p className="text-sm text-muted-foreground">If you leave now, what you typed will be lost.</p>
        </Modal>
      ) : null}
    </>
  );
}

