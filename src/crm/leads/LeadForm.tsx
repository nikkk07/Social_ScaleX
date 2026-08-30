// Add / edit a lead. ADD creates lead + contacts + phones atomically via the
// create_lead_with_contacts RPC. EDIT updates lead-level fields via the leads
// row (contact editing lives on the detail view via update_lead_with_contacts).
//
// Also here: duplicate detection (handle + phone, non-blocking), an unsaved-
// changes guard (in-app nav + tab close), Esc-to-leave, and ⌘/Ctrl+Enter save.
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useNavigate } from '@/lib/router';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import type { Json } from '@/lib/database.types';
import { useProfiles } from './useProfiles';
import { ContactsFields } from './ContactsFields';
import { useDuplicateCheck, type DupLead } from './useDuplicateCheck';
import { useUnsavedGuard } from './useUnsavedGuard';
import { UnsavedChangesDialog } from './UnsavedChangesDialog';
import {
  leadFormSchema,
  toRpcPayload,
  toUpdatePayload,
  type LeadFormValues,
} from './leadFormSchema';

const inputClass =
  'w-full rounded-lg border border-[var(--border)] bg-[var(--input-background)] px-3 py-2 text-sm text-[var(--color-ink)] placeholder:text-white/30 outline-none transition focus-visible:border-[var(--color-violet-light)] focus-visible:ring-2 focus-visible:ring-[var(--color-violet-light)]';
const labelClass = 'mb-1.5 block text-sm font-medium text-white/80';
const errClass = 'mt-1 text-xs text-[var(--destructive)]';

function friendlyError(e: unknown): string {
  const msg = (e as { message?: string })?.message ?? '';
  if (/leads_instagram_unique/.test(msg)) return 'A lead with that Instagram handle already exists.';
  if (/leads_instagram_normalised/.test(msg)) return 'That Instagram handle isn’t valid — use the bare handle, e.g. nimbuscoffee.';
  if (/lead_phones_e164/.test(msg)) return 'A phone number isn’t in E.164 format, e.g. +918077727669.';
  if (/outcome_requires_contacted/.test(msg)) return 'An outcome can only be set once the lead is contacted.';
  if (/lead_found_not_future/.test(msg)) return 'Found date can’t be in the future.';
  // 090010: the enquiry was converted by someone else between opening this
  // form and saving. The lead was rolled back with it, so nothing was created.
  if (/enquiry_already_converted/.test(msg))
    return 'That enquiry was already converted by someone else. Nothing was saved — reopen it from Enquiries to see the lead.';
  return msg || 'Something went wrong. Please try again.';
}

function DupBanner({ label, lead }: { label: string; lead: DupLead }) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-[color-mix(in_oklab,var(--color-amber)_45%,transparent)] bg-[color-mix(in_oklab,var(--color-amber)_12%,transparent)] px-3 py-2 text-sm text-[var(--color-amber)]"
    >
      {label}{' '}
      <Link href={`/crm/leads/${lead.id}`} className="font-semibold underline hover:no-underline">
        {lead.brand_name}
      </Link>
      . You can still save.
    </div>
  );
}

export function LeadForm({
  mode,
  leadId,
  initial,
  enquiry,
}: {
  mode: 'add' | 'edit';
  leadId?: string;
  initial: LeadFormValues;
  // Present only when converting a website enquiry (add mode).
  enquiry?: { id: string; name: string };
}) {
  const navigate = useNavigate();
  const profiles = useProfiles();
  const dup = useDuplicateCheck(leadId);
  const [dupConfirm, setDupConfirm] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: initial,
  });

  const { blocker, markSaved } = useUnsavedGuard(isDirty);

  const status = watch('status');
  useEffect(() => {
    if (status === 'pending' && getValues('outcome') !== '') setValue('outcome', '');
  }, [status, getValues, setValue]);

  // Any edit invalidates a prior "save anyway" acknowledgement.
  useEffect(() => {
    const sub = watch(() => setDupConfirm(false));
    return () => sub.unsubscribe();
  }, [watch]);

  const onSubmit = async (values: LeadFormValues) => {
    // Re-run duplicate checks (blur results go stale). Non-blocking: first
    // submit surfaces them and flips to "Save anyway"; second submit proceeds.
    const anyDup = await dup.checkAll(values);
    if (anyDup && !dupConfirm) {
      setDupConfirm(true);
      toast.warning('Possible duplicate — review the warning, then Save anyway.');
      return;
    }
    try {
      if (mode === 'add') {
        const { error } = await supabase.rpc('create_lead_with_contacts', {
          payload: toRpcPayload(values, enquiry?.id) as unknown as Json,
        });
        if (error) throw error;
        toast.success(enquiry ? 'Enquiry converted to a lead.' : 'Lead created.');
      } else {
        const { error } = await supabase.from('leads').update(toUpdatePayload(values)).eq('id', leadId!);
        if (error) throw error;
        toast.success('Lead updated.');
      }
      markSaved(); // successful save → no unsaved-changes prompt on redirect
      // Back to where the work came from: the queue for a conversion, the
      // lead itself after an edit, the list otherwise.
      navigate(
        mode === 'edit' && leadId
          ? `/crm/leads/${leadId}`
          : enquiry
            ? '/crm/enquiries'
            : '/crm',
      );
    } catch (e) {
      toast.error(friendlyError(e));
    }
  };

  // Cancel / Esc go back where the work came from.
  const cancelTo = enquiry ? '/crm/enquiries' : '/crm';

  const onKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      void handleSubmit(onSubmit)();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      navigate(cancelTo); // guard intercepts if dirty
    }
  };

  const handleReg = register('instagram_username');

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <UnsavedChangesDialog blocker={blocker} />
      <h1 className={`text-lg font-semibold ${enquiry ? 'mb-2' : 'mb-6'}`}>
        {mode === 'edit' ? 'Edit lead' : enquiry ? 'Convert enquiry' : 'Add lead'}
      </h1>

      {enquiry && (
        <div className="mb-6 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2.5 text-sm text-white/60">
          Converting the website enquiry from{' '}
          <span className="font-medium text-white/90">{enquiry.name}</span>. Their
          details are prefilled below — add the{' '}
          <span className="font-medium text-white/90">brand name</span>, since an
          enquiry only tells us who got in touch, not the business.
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} onKeyDown={onKeyDown} noValidate className="space-y-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="brand_name" className={labelClass}>
              Brand name <span className="text-[var(--destructive)]">*</span>
            </label>
            <input id="brand_name" className={inputClass} {...register('brand_name')} />
            {errors.brand_name && <p className={errClass}>{errors.brand_name.message}</p>}
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="instagram_username" className={labelClass}>Instagram</label>
            <input
              id="instagram_username"
              placeholder="@handle or profile URL"
              className={inputClass}
              {...handleReg}
              onBlur={(e) => {
                handleReg.onBlur(e);
                dup.checkHandle(e.target.value);
              }}
            />
            <p className="mt-1 text-xs text-white/35">Stored as the lowercase handle.</p>
            {dup.handleDup && (
              <div className="mt-2">
                <DupBanner label="This handle is already on" lead={dup.handleDup} />
              </div>
            )}
          </div>

          <div>
            <label htmlFor="lead_found_on" className={labelClass}>
              Found on <span className="text-[var(--destructive)]">*</span>
            </label>
            <input id="lead_found_on" type="date" className={inputClass} {...register('lead_found_on')} />
            {errors.lead_found_on && <p className={errClass}>{errors.lead_found_on.message}</p>}
          </div>

          <div>
            <label htmlFor="status" className={labelClass}>Status</label>
            <select id="status" className={inputClass} {...register('status')}>
              <option value="pending">Pending</option>
              <option value="contacted">Contacted</option>
            </select>
          </div>

          <div>
            <label htmlFor="outcome" className={labelClass}>Outcome</label>
            <select id="outcome" className={inputClass} disabled={status !== 'contacted'} {...register('outcome')}>
              <option value="">—</option>
              <option value="interested">Interested</option>
              <option value="not_interested">Not interested</option>
            </select>
            {errors.outcome && <p className={errClass}>{errors.outcome.message}</p>}
          </div>

          <div>
            <label htmlFor="source" className={labelClass}>Source</label>
            <select id="source" className={inputClass} {...register('source')}>
              <option value="manual">Manual</option>
              <option value="website_callback">Website callback</option>
              <option value="website_query">Website query</option>
              <option value="import">Import</option>
            </select>
          </div>

          <div>
            <label htmlFor="owner_id" className={labelClass}>Owner</label>
            <select id="owner_id" className={inputClass} {...register('owner_id')}>
              <option value="">Unassigned{mode === 'add' ? ' (you)' : ''}</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="address" className={labelClass}>Address</label>
            <input id="address" className={inputClass} {...register('address')} />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="notes" className={labelClass}>Notes</label>
            <textarea id="notes" rows={3} className={inputClass} {...register('notes')} />
          </div>
        </div>

        {mode === 'add' ? (
          <>
            <ContactsFields
              control={control}
              register={register}
              getValues={getValues}
              setValue={setValue}
              errors={errors}
              onPhoneBlur={dup.checkPhone}
            />
            {Object.entries(dup.phoneDups).length > 0 && (
              <div className="space-y-2">
                {Object.entries(dup.phoneDups).map(([phone, lead]) => (
                  <DupBanner key={phone} label={`${phone} is already on`} lead={lead} />
                ))}
              </div>
            )}
          </>
        ) : (
          <p className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3 text-xs text-white/40">
            Contacts and phone numbers are edited on the lead’s detail view.
          </p>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-[var(--color-violet-cta)] px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-violet-light)]"
          >
            {isSubmitting
              ? 'Saving…'
              : dupConfirm
                ? 'Save anyway'
                : mode === 'edit'
                  ? 'Save changes'
                  : enquiry
                    ? 'Create lead & close enquiry'
                    : 'Create lead'}
          </button>
          <button
            type="button"
            onClick={() => navigate(cancelTo)}
            className="rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm text-white/80 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-violet-light)]"
          >
            Cancel
          </button>
          <span className="ml-auto hidden text-xs text-white/30 sm:inline">⌘/Ctrl+Enter to save · Esc to leave</span>
        </div>
      </form>
    </div>
  );
}
