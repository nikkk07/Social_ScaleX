// Add / edit a lead. ADD creates the lead + contacts + phones atomically via
// the create_lead_with_contacts RPC (one transaction — a partial failure never
// orphans rows). EDIT updates the lead-level fields via the leads row; editing
// existing contacts/phones lands with the lead detail view (a reconcile against
// the single-primary partial-unique indexes), so it's out of scope here.
import React, { useEffect } from 'react';
import { useForm, useFieldArray, type Control, type UseFormRegister } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import type { Json } from '../../../lib/database.types';
import { useProfiles } from './useProfiles';
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
  if (/leads_instagram_unique/.test(msg))
    return 'A lead with that Instagram handle already exists.';
  if (/outcome_requires_contacted/.test(msg))
    return 'An outcome can only be set once the lead is contacted.';
  if (/lead_found_not_future/.test(msg))
    return 'Found date can’t be in the future.';
  return msg || 'Something went wrong. Please try again.';
}

export function LeadForm({
  mode,
  leadId,
  initial,
}: {
  mode: 'add' | 'edit';
  leadId?: string;
  initial: LeadFormValues;
}) {
  const navigate = useNavigate();
  const profiles = useProfiles();
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: initial,
  });

  const status = watch('status');
  useEffect(() => {
    if (status === 'pending' && getValues('outcome') !== '') {
      setValue('outcome', '');
    }
  }, [status, getValues, setValue]);

  const contacts = useFieldArray({ control, name: 'contacts' });
  const officePhones = useFieldArray({ control, name: 'lead_phones' });

  // Enforce single-primary in the UI (the DB enforces it too).
  const setPrimaryContact = (idx: number, checked: boolean) => {
    getValues('contacts').forEach((_, i) =>
      setValue(`contacts.${i}.is_primary`, checked && i === idx),
    );
  };
  const setPrimaryOfficePhone = (idx: number, checked: boolean) => {
    getValues('lead_phones').forEach((_, i) =>
      setValue(`lead_phones.${i}.is_primary`, checked && i === idx),
    );
  };

  const onSubmit = async (values: LeadFormValues) => {
    try {
      if (mode === 'add') {
        const { error } = await supabase.rpc('create_lead_with_contacts', {
          payload: toRpcPayload(values) as unknown as Json,
        });
        if (error) throw error;
        toast.success('Lead created.');
      } else {
        const { error } = await supabase
          .from('leads')
          .update(toUpdatePayload(values))
          .eq('id', leadId!);
        if (error) throw error;
        toast.success('Lead updated.');
      }
      navigate('/crm');
    } catch (e) {
      toast.error(friendlyError(e));
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <h1 className="mb-6 text-lg font-semibold">
        {mode === 'add' ? 'Add lead' : 'Edit lead'}
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-8">
        {/* ── Lead fields ── */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="brand_name" className={labelClass}>
              Brand name <span className="text-[var(--destructive)]">*</span>
            </label>
            <input id="brand_name" className={inputClass} {...register('brand_name')} />
            {errors.brand_name && <p className={errClass}>{errors.brand_name.message}</p>}
          </div>

          <div>
            <label htmlFor="instagram_username" className={labelClass}>Instagram</label>
            <input
              id="instagram_username"
              placeholder="@handle or profile URL"
              className={inputClass}
              {...register('instagram_username')}
            />
            <p className="mt-1 text-xs text-white/35">Stored as the lowercase handle.</p>
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
            <select
              id="outcome"
              className={inputClass}
              disabled={status !== 'contacted'}
              {...register('outcome')}
            >
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

        {/* ── Contacts + phones (add mode only) ── */}
        {mode === 'add' ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white/80">Contacts</h2>
              <button
                type="button"
                onClick={() =>
                  contacts.append({ name: '', designation: '', email: '', is_primary: contacts.fields.length === 0, phones: [] })
                }
                className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm text-white/80 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-violet-light)]"
              >
                <Plus size={14} /> Add contact
              </button>
            </div>
            {typeof errors.contacts?.message === 'string' && (
              <p className={errClass}>{errors.contacts.message}</p>
            )}
            {contacts.fields.map((f, i) => (
              <ContactCard
                key={f.id}
                index={i}
                control={control}
                register={register}
                onRemove={() => contacts.remove(i)}
                onPrimary={(checked) => setPrimaryContact(i, checked)}
                nameError={errors.contacts?.[i]?.name?.message}
                emailError={errors.contacts?.[i]?.email?.message}
                phonesError={
                  typeof errors.contacts?.[i]?.phones?.message === 'string'
                    ? (errors.contacts?.[i]?.phones?.message as string)
                    : undefined
                }
                phoneItemError={(j) =>
                  errors.contacts?.[i]?.phones?.[j]?.phone_e164?.message
                }
              />
            ))}

            <div className="flex items-center justify-between pt-2">
              <h2 className="text-sm font-semibold text-white/80">Office phones</h2>
              <button
                type="button"
                onClick={() =>
                  officePhones.append({ phone_e164: '', label: '', is_primary: officePhones.fields.length === 0 })
                }
                className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm text-white/80 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-violet-light)]"
              >
                <Plus size={14} /> Add office phone
              </button>
            </div>
            {typeof errors.lead_phones?.message === 'string' && (
              <p className={errClass}>{errors.lead_phones.message}</p>
            )}
            {officePhones.fields.map((f, i) => (
              <div key={f.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-[var(--border)] p-3">
                <input placeholder="+91…" className={`${inputClass} flex-1`} {...register(`lead_phones.${i}.phone_e164`)} />
                <input placeholder="Label" className={`${inputClass} w-32`} {...register(`lead_phones.${i}.label`)} />
                <label className="flex items-center gap-1.5 text-xs text-white/60">
                  <input
                    type="checkbox"
                    {...register(`lead_phones.${i}.is_primary`)}
                    onChange={(e) => setPrimaryOfficePhone(i, e.target.checked)}
                  />
                  Primary
                </label>
                <button type="button" onClick={() => officePhones.remove(i)} aria-label="Remove phone" className="text-white/40 hover:text-[var(--destructive)]">
                  <Trash2 size={15} />
                </button>
                {errors.lead_phones?.[i]?.phone_e164 && (
                  <p className={`${errClass} w-full`}>{errors.lead_phones[i]?.phone_e164?.message}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3 text-xs text-white/40">
            Contacts and phone numbers are managed from the lead’s detail view
            (coming in a later phase). This form edits the lead’s own fields.
          </p>
        )}

        {/* ── Actions ── */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-[var(--color-violet-cta)] px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-violet-light)]"
          >
            {isSubmitting ? 'Saving…' : mode === 'add' ? 'Create lead' : 'Save changes'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/crm')}
            className="rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm text-white/80 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-violet-light)]"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function ContactCard({
  index,
  control,
  register,
  onRemove,
  onPrimary,
  nameError,
  emailError,
  phonesError,
  phoneItemError,
}: {
  index: number;
  control: Control<LeadFormValues>;
  register: UseFormRegister<LeadFormValues>;
  onRemove: () => void;
  onPrimary: (checked: boolean) => void;
  nameError?: string;
  emailError?: string;
  phonesError?: string;
  phoneItemError: (j: number) => string | undefined;
}) {
  const phones = useFieldArray({ control, name: `contacts.${index}.phones` });
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Name <span className="text-[var(--destructive)]">*</span></label>
          <input className={inputClass} {...register(`contacts.${index}.name`)} />
          {nameError && <p className={errClass}>{nameError}</p>}
        </div>
        <div>
          <label className={labelClass}>Designation</label>
          <input className={inputClass} {...register(`contacts.${index}.designation`)} />
        </div>
        <div>
          <label className={labelClass}>Email</label>
          <input className={inputClass} {...register(`contacts.${index}.email`)} />
          {emailError && <p className={errClass}>{emailError}</p>}
        </div>
        <div className="flex items-end justify-between">
          <label className="flex items-center gap-1.5 text-sm text-white/70">
            <input
              type="checkbox"
              {...register(`contacts.${index}.is_primary`)}
              onChange={(e) => onPrimary(e.target.checked)}
            />
            Primary contact
          </label>
          <button type="button" onClick={onRemove} aria-label="Remove contact" className="text-white/40 hover:text-[var(--destructive)]">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="mt-3 border-t border-[var(--border)] pt-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium text-white/60">Phones</span>
          <button
            type="button"
            onClick={() => phones.append({ phone_e164: '', label: '', is_primary: phones.fields.length === 0 })}
            className="inline-flex items-center gap-1 text-xs text-[var(--color-violet-light)] hover:underline"
          >
            <Plus size={12} /> Add phone
          </button>
        </div>
        {phonesError && <p className={errClass}>{phonesError}</p>}
        <div className="space-y-2">
          {phones.fields.map((pf, j) => (
            <div key={pf.id} className="flex flex-wrap items-center gap-2">
              <input placeholder="+91…" className={`${inputClass} flex-1`} {...register(`contacts.${index}.phones.${j}.phone_e164`)} />
              <input placeholder="Label" className={`${inputClass} w-28`} {...register(`contacts.${index}.phones.${j}.label`)} />
              <label className="flex items-center gap-1 text-xs text-white/60">
                <input type="checkbox" {...register(`contacts.${index}.phones.${j}.is_primary`)} />
                Primary
              </label>
              <button type="button" onClick={() => phones.remove(j)} aria-label="Remove phone" className="text-white/40 hover:text-[var(--destructive)]">
                <Trash2 size={14} />
              </button>
              {phoneItemError(j) && <p className={`${errClass} w-full`}>{phoneItemError(j)}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
