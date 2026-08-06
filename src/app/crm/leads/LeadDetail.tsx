// Lead detail (/crm/leads/:id): the full record + activity timeline, with
// notes / status editable in place and contacts edited via the replace-children
// update_lead_with_contacts RPC.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { ArrowLeft, Pencil } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import type { Json } from '../../../lib/database.types';
import { useAuth } from '../auth/AuthProvider';
import { Skeleton } from '../../components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog';
import { LeadStatusControl, type StatusChange } from './LeadStatusControl';
import { PhoneActions } from './PhoneActions';
import { ContactsFields } from './ContactsFields';
import {
  contactsEditSchema,
  toChildrenPayload,
  type ContactsEditValues,
} from './leadFormSchema';
import type { LeadOutcome, LeadStatus, LeadSource } from '../../../lib/database.types';

interface DetailPhone {
  id: string;
  phone_e164: string;
  label: string | null;
  is_primary: boolean;
  sort_order: number;
  contact_id: string | null;
}
interface DetailContact {
  id: string;
  name: string;
  designation: string | null;
  email: string | null;
  is_primary: boolean;
  sort_order: number;
  lead_phones: DetailPhone[];
}
interface DetailActivity {
  id: string;
  kind: string;
  detail: Json;
  created_at: string;
  actor: { full_name: string | null; email: string } | null;
}
interface DetailLead {
  id: string;
  brand_name: string;
  instagram_username: string | null;
  address: string | null;
  lead_found_on: string;
  status: LeadStatus;
  outcome: LeadOutcome | null;
  source: LeadSource;
  notes: string | null;
  owner_id: string | null;
  created_at: string;
  deleted_at: string | null;
  lead_contacts: DetailContact[];
}

type State =
  | { kind: 'loading' }
  | { kind: 'notfound' }
  | { kind: 'error' }
  | { kind: 'ready'; lead: DetailLead; office: DetailPhone[]; activities: DetailActivity[] };

const bySort = <T extends { sort_order: number }>(a: T, b: T) => a.sort_order - b.sort_order;

export function LeadDetail({ id }: { id: string }) {
  const [state, setState] = useState<State>({ kind: 'loading' });

  const load = useCallback(async () => {
    setState({ kind: 'loading' });
    const [leadRes, officeRes, actRes] = await Promise.all([
      supabase
        .from('leads')
        .select('*, lead_contacts(*, lead_phones(*))')
        .eq('id', id)
        .maybeSingle(),
      supabase.from('lead_phones').select('*').eq('lead_id', id).is('contact_id', null),
      supabase
        .from('lead_activities')
        .select('id, kind, detail, created_at, actor:profiles(full_name, email)')
        .eq('lead_id', id)
        .order('created_at', { ascending: false }),
    ]);
    if (leadRes.error || officeRes.error || actRes.error) {
      setState({ kind: 'error' });
      return;
    }
    if (!leadRes.data) {
      setState({ kind: 'notfound' });
      return;
    }
    setState({
      kind: 'ready',
      lead: leadRes.data as unknown as DetailLead,
      office: (officeRes.data ?? []) as unknown as DetailPhone[],
      activities: (actRes.data ?? []) as unknown as DetailActivity[],
    });
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (state.kind === 'loading') return <DetailSkeleton />;
  if (state.kind === 'notfound') return <Centered>Lead not found.</Centered>;
  if (state.kind === 'error')
    return (
      <Centered>
        <div>
          <p className="mb-4">Couldn’t load this lead.</p>
          <button onClick={load} className="rounded-lg bg-[var(--color-violet-cta)] px-4 py-2 text-sm font-semibold text-white">
            Try again
          </button>
        </div>
      </Centered>
    );

  return <Loaded state={state} reload={load} />;
}

function Loaded({
  state,
  reload,
}: {
  state: Extract<State, { kind: 'ready' }>;
  reload: () => void;
}) {
  const { lead, office, activities } = state;
  const navigate = useNavigate();
  const { role } = useAuth();
  const canArchive = role === 'owner' || role === 'admin';
  const archived = lead.deleted_at != null;

  const contacts = useMemo(() => [...lead.lead_contacts].sort(bySort), [lead]);
  const [editingContacts, setEditingContacts] = useState(false);
  const [notes, setNotes] = useState(lead.notes ?? '');
  const [savingNotes, setSavingNotes] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);

  const saveNotes = async () => {
    setSavingNotes(true);
    const { error } = await supabase.from('leads').update({ notes: notes.trim() || null }).eq('id', lead.id);
    setSavingNotes(false);
    if (error) toast.error(error.message || 'Could not save notes.');
    else toast.success('Notes saved.');
  };

  const changeStatus = async (change: StatusChange) => {
    const { error } = await supabase
      .from('leads')
      .update({ status: change.status, outcome: change.outcome })
      .eq('id', lead.id);
    if (error) toast.error(error.message || 'Could not update status.');
    else reload();
  };

  const doArchive = async () => {
    setConfirmArchive(false);
    const patch = archived ? { deleted_at: null } : { deleted_at: new Date().toISOString() };
    const { error } = await supabase.from('leads').update(patch).eq('id', lead.id);
    if (error) {
      toast.error(error.message || 'Action failed.'); // surfaces the trigger message
      return;
    }
    if (archived) {
      toast.success('Lead restored.');
      reload();
    } else {
      toast.success('Lead archived.');
      navigate('/crm');
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <Link to="/crm" className="inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-white/90">
          <ArrowLeft size={15} /> Leads
        </Link>
        <div className="flex items-center gap-2">
          <Link to={`/crm/leads/${lead.id}/edit`} className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm text-white/80 hover:bg-white/5">
            <Pencil size={14} /> Edit fields
          </Link>
          {canArchive && (
            <button
              type="button"
              onClick={() => setConfirmArchive(true)}
              className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm text-white/80 hover:bg-white/5"
            >
              {archived ? 'Restore' : 'Archive'}
            </button>
          )}
        </div>
      </div>

      {archived && (
        <div className="mb-4 rounded-lg border border-[color-mix(in_oklab,var(--color-amber)_45%,transparent)] bg-[color-mix(in_oklab,var(--color-amber)_12%,transparent)] px-3 py-2 text-sm text-[var(--color-amber)]">
          This lead is archived (read-only). {canArchive ? 'Restore it to make changes.' : 'Ask an owner/admin to restore it.'}
        </div>
      )}

      <div className="mb-1 flex items-baseline gap-3">
        <h1 className="text-xl font-semibold">{lead.brand_name}</h1>
        {lead.instagram_username && (
          <a href={`https://instagram.com/${lead.instagram_username}`} target="_blank" rel="noopener noreferrer" className="text-sm text-[var(--color-violet-light)] hover:underline">
            @{lead.instagram_username}
          </a>
        )}
      </div>
      <p className="mb-6 text-sm text-white/40">
        {lead.address || 'No address'} · {SOURCE_LABEL[lead.source]} · found {format(new Date(lead.lead_found_on), 'd MMM yyyy')}
      </p>

      {/* Status */}
      <Section title="Status">
        {archived ? (
          <span className="text-sm text-white/50">{lead.status}{lead.outcome ? ` · ${lead.outcome}` : ''}</span>
        ) : (
          <LeadStatusControl status={lead.status} outcome={lead.outcome} onChange={changeStatus} />
        )}
      </Section>

      {/* Contacts */}
      <Section
        title="Contacts & phones"
        action={
          !archived && !editingContacts ? (
            <button onClick={() => setEditingContacts(true)} className="text-sm text-[var(--color-violet-light)] hover:underline">
              Edit
            </button>
          ) : null
        }
      >
        {editingContacts ? (
          <ContactsEditor
            leadId={lead.id}
            initial={{
              contacts: contacts.map((c) => ({
                name: c.name,
                designation: c.designation ?? '',
                email: c.email ?? '',
                is_primary: c.is_primary,
                phones: [...c.lead_phones].sort(bySort).map((p) => ({ phone_e164: p.phone_e164, label: p.label ?? '', is_primary: p.is_primary })),
              })),
              lead_phones: [...office].sort(bySort).map((p) => ({ phone_e164: p.phone_e164, label: p.label ?? '', is_primary: p.is_primary })),
            }}
            onDone={() => {
              setEditingContacts(false);
              reload();
            }}
            onCancel={() => setEditingContacts(false)}
          />
        ) : contacts.length === 0 && office.length === 0 ? (
          <p className="text-sm text-white/40">No contacts yet.</p>
        ) : (
          <div className="space-y-3">
            {contacts.map((c) => (
              <div key={c.id} className="rounded-lg border border-[var(--border)] p-3">
                <div className="mb-2 flex items-center gap-2">
                  <span className="font-medium text-white/90">{c.name}</span>
                  {c.is_primary && <span className="rounded bg-[var(--accent)] px-1.5 py-0.5 text-xs text-[var(--color-violet-light)]">Primary</span>}
                  {c.designation && <span className="text-xs text-white/40">{c.designation}</span>}
                </div>
                {c.email && <div className="mb-2 text-sm text-white/60">{c.email}</div>}
                <PhoneList phones={c.lead_phones} />
              </div>
            ))}
            {office.length > 0 && (
              <div className="rounded-lg border border-[var(--border)] p-3">
                <div className="mb-2 text-sm font-medium text-white/70">Office lines</div>
                <PhoneList phones={office} />
              </div>
            )}
          </div>
        )}
      </Section>

      {/* Notes */}
      <Section title="Notes">
        <textarea
          rows={3}
          value={notes}
          disabled={archived}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--input-background)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-violet-light)] disabled:opacity-60"
        />
        {!archived && (
          <button
            onClick={saveNotes}
            disabled={savingNotes || notes === (lead.notes ?? '')}
            className="mt-2 rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm text-white/80 hover:bg-white/5 disabled:opacity-40"
          >
            {savingNotes ? 'Saving…' : 'Save notes'}
          </button>
        )}
      </Section>

      {/* Timeline */}
      <Section title="Activity">
        {activities.length === 0 ? (
          <p className="text-sm text-white/40">No activity yet.</p>
        ) : (
          <ol className="space-y-3">
            {activities.map((a) => (
              <li key={a.id} className="flex gap-3 text-sm">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-violet-light)]" aria-hidden="true" />
                <div>
                  <div className="text-white/80">{activityLabel(a)}</div>
                  <div className="text-xs text-white/40">
                    {actorLabel(a.actor)} · {format(new Date(a.created_at), 'd MMM yyyy, h:mm a')}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </Section>

      <AlertDialog open={confirmArchive} onOpenChange={setConfirmArchive}>
        <AlertDialogContent className="crm-root dark">
          <AlertDialogHeader>
            <AlertDialogTitle>{archived ? 'Restore this lead?' : 'Archive this lead?'}</AlertDialogTitle>
            <AlertDialogDescription>
              {archived
                ? 'It will reappear in the default list.'
                : 'It will be removed from the default list. You can restore it later.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={doArchive}>{archived ? 'Restore' : 'Archive'}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ContactsEditor({
  leadId,
  initial,
  onDone,
  onCancel,
}: {
  leadId: string;
  initial: ContactsEditValues;
  onDone: () => void;
  onCancel: () => void;
}) {
  const {
    register,
    control,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ContactsEditValues>({
    resolver: zodResolver(contactsEditSchema),
    defaultValues: initial,
  });

  const onSubmit = async (values: ContactsEditValues) => {
    const { error } = await supabase.rpc('update_lead_with_contacts', {
      p_lead_id: leadId,
      payload: toChildrenPayload(values) as unknown as Json,
    });
    if (error) {
      toast.error(error.message || 'Could not save contacts.');
      return;
    }
    toast.success('Contacts updated.');
    onDone();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <ContactsFields control={control} register={register} getValues={getValues} setValue={setValue} errors={errors} />
      <div className="flex items-center gap-3">
        <button type="submit" disabled={isSubmitting} className="rounded-lg bg-[var(--color-violet-cta)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
          {isSubmitting ? 'Saving…' : 'Save contacts'}
        </button>
        <button type="button" onClick={onCancel} className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-white/80 hover:bg-white/5">
          Cancel
        </button>
      </div>
    </form>
  );
}

const SOURCE_LABEL: Record<LeadSource, string> = {
  manual: 'Manual',
  website_callback: 'Website callback',
  website_query: 'Website query',
  import: 'Import',
};

function PhoneList({ phones }: { phones: DetailPhone[] }) {
  const sorted = [...phones].sort(bySort);
  if (sorted.length === 0) return <p className="text-sm text-white/25">No phone</p>;
  return (
    <ul className="space-y-1.5">
      {sorted.map((p) => (
        <li key={p.id} className="flex items-center justify-between gap-3">
          <span className="text-sm text-white/70">
            {p.phone_e164}
            {p.label ? <span className="ml-2 text-xs text-white/40">{p.label}</span> : null}
            {p.is_primary ? <span className="ml-2 text-xs text-[var(--color-violet-light)]">primary</span> : null}
          </span>
          <PhoneActions phone={p} />
        </li>
      ))}
    </ul>
  );
}

function activityLabel(a: DetailActivity): string {
  const d = (a.detail ?? {}) as Record<string, unknown>;
  switch (a.kind) {
    case 'created':
      return 'Lead created';
    case 'status_changed':
      return `Status: ${d.from_status ?? '?'} → ${d.to_status ?? '?'}${d.to_outcome ? ` (${d.to_outcome})` : ''}`;
    case 'archived':
      return 'Archived';
    case 'edited':
      return 'Contacts edited';
    case 'note':
      return 'Note added';
    default:
      return a.kind;
  }
}

function actorLabel(actor: DetailActivity['actor']): string {
  if (!actor) return 'System';
  return actor.full_name || actor.email;
}

function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white/80">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-[40vh] items-center justify-center px-6 text-center text-sm text-white/60">{children}</div>;
}

function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      <Skeleton className="mb-4 h-4 w-24" />
      <Skeleton className="mb-2 h-7 w-1/2" />
      <Skeleton className="mb-6 h-4 w-2/3" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="mb-6">
          <Skeleton className="mb-2 h-4 w-32" />
          <Skeleton className="h-20 w-full" />
        </div>
      ))}
    </div>
  );
}
