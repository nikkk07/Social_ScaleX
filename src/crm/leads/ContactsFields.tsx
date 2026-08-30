// Reusable contacts + office-phones editor (add lead form AND the detail
// view's contact editor). RHF control/register are typed loosely (`any`) on
// purpose: this presentational component is shared across two different form
// value types that both carry `contacts` and `lead_phones`, and threading RHF's
// invariant generics through would add noise without real safety — the shapes
// are pinned by leadFormSchema + covered by tests.
import React from 'react';
import { useFieldArray } from 'react-hook-form';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';

/* eslint-disable @typescript-eslint/no-explicit-any */
// Deliberately loose: this presentational editor is shared across two RHF form
// value types (LeadFormValues and ContactsEditValues). RHF's register/control
// are contravariant on the form's field-path union, so a concrete register
// isn't assignable to UseFormRegister<any>; plain permissive signatures sidestep
// that. The value shapes are still pinned by leadFormSchema + covered by tests.
type AnyControl = any;
type AnyRegister = (name: any, options?: any) => any;
type AnyGet = (name?: any) => any;
type AnySet = (name: any, value: any) => void;

const inputClass =
  'w-full rounded-lg border border-[var(--border)] bg-[var(--input-background)] px-3 py-2 text-sm text-[var(--color-ink)] placeholder:text-white/30 outline-none transition focus-visible:border-[var(--color-violet-light)] focus-visible:ring-2 focus-visible:ring-[var(--color-violet-light)]';
const labelClass = 'mb-1.5 block text-sm font-medium text-white/80';
const errClass = 'mt-1 text-xs text-[var(--destructive)]';
const iconBtn = 'text-white/40 hover:text-white/80 disabled:opacity-30 disabled:hover:text-white/40';

export interface ContactsFieldsProps {
  control: AnyControl;
  register: AnyRegister;
  getValues: AnyGet;
  setValue: AnySet;
  errors: any;
  /** Called on phone blur with the raw value (for duplicate detection). */
  onPhoneBlur?: (value: string) => void;
}

export function ContactsFields({
  control,
  register,
  getValues,
  setValue,
  errors,
  onPhoneBlur,
}: ContactsFieldsProps) {
  const contacts = useFieldArray({ control, name: 'contacts' });
  const office = useFieldArray({ control, name: 'lead_phones' });

  const setPrimaryContact = (idx: number, checked: boolean) =>
    (getValues('contacts') as unknown[]).forEach((_, i) =>
      setValue(`contacts.${i}.is_primary`, checked && i === idx),
    );
  const setPrimaryOffice = (idx: number, checked: boolean) =>
    (getValues('lead_phones') as unknown[]).forEach((_, i) =>
      setValue(`lead_phones.${i}.is_primary`, checked && i === idx),
    );

  const blur = (e: React.FocusEvent<HTMLInputElement>) =>
    onPhoneBlur?.(e.target.value);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white/80">Contacts</h2>
        <button
          type="button"
          onClick={() =>
            contacts.append({
              name: '',
              designation: '',
              email: '',
              is_primary: contacts.fields.length === 0,
              phones: [],
            })
          }
          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm text-white/80 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-violet-light)]"
        >
          <Plus size={14} /> Add contact
        </button>
      </div>
      {typeof errors?.contacts?.message === 'string' && (
        <p className={errClass}>{errors.contacts.message}</p>
      )}

      {contacts.fields.map((f, i) => (
        <div key={f.id} className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
          <div className="mb-2 flex items-center justify-end gap-1">
            <button type="button" aria-label="Move up" disabled={i === 0} onClick={() => contacts.move(i, i - 1)} className={iconBtn}>
              <ArrowUp size={15} />
            </button>
            <button type="button" aria-label="Move down" disabled={i === contacts.fields.length - 1} onClick={() => contacts.move(i, i + 1)} className={iconBtn}>
              <ArrowDown size={15} />
            </button>
            <button type="button" aria-label="Remove contact" onClick={() => contacts.remove(i)} className="ml-1 text-white/40 hover:text-[var(--destructive)]">
              <Trash2 size={16} />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Name <span className="text-[var(--destructive)]">*</span></label>
              <input className={inputClass} {...register(`contacts.${i}.name`)} />
              {errors?.contacts?.[i]?.name && <p className={errClass}>{errors.contacts[i].name.message}</p>}
            </div>
            <div>
              <label className={labelClass}>Designation</label>
              <input className={inputClass} {...register(`contacts.${i}.designation`)} />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input className={inputClass} {...register(`contacts.${i}.email`)} />
              {errors?.contacts?.[i]?.email && <p className={errClass}>{errors.contacts[i].email.message}</p>}
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-1.5 text-sm text-white/70">
                <input type="checkbox" {...register(`contacts.${i}.is_primary`)} onChange={(e) => setPrimaryContact(i, e.target.checked)} />
                Primary contact
              </label>
            </div>
          </div>

          <ContactPhones
            control={control}
            register={register}
            contactIndex={i}
            errors={errors}
            onPhoneBlur={onPhoneBlur}
          />
        </div>
      ))}

      <div className="flex items-center justify-between pt-2">
        <h2 className="text-sm font-semibold text-white/80">Office phones</h2>
        <button
          type="button"
          onClick={() => office.append({ phone_e164: '', label: '', is_primary: office.fields.length === 0 })}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm text-white/80 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-violet-light)]"
        >
          <Plus size={14} /> Add office phone
        </button>
      </div>
      {typeof errors?.lead_phones?.message === 'string' && (
        <p className={errClass}>{errors.lead_phones.message}</p>
      )}
      {office.fields.map((f, i) => (
        <div key={f.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-[var(--border)] p-3">
          <input placeholder="+91…" className={`${inputClass} flex-1`} onBlurCapture={blur} {...register(`lead_phones.${i}.phone_e164`)} />
          <input placeholder="Label" className={`${inputClass} w-32`} {...register(`lead_phones.${i}.label`)} />
          <label className="flex items-center gap-1.5 text-xs text-white/60">
            <input type="checkbox" {...register(`lead_phones.${i}.is_primary`)} onChange={(e) => setPrimaryOffice(i, e.target.checked)} />
            Primary
          </label>
          <button type="button" onClick={() => office.remove(i)} aria-label="Remove phone" className="text-white/40 hover:text-[var(--destructive)]">
            <Trash2 size={15} />
          </button>
          {errors?.lead_phones?.[i]?.phone_e164 && <p className={`${errClass} w-full`}>{errors.lead_phones[i].phone_e164.message}</p>}
        </div>
      ))}
    </div>
  );
}

function ContactPhones({
  control,
  register,
  contactIndex,
  errors,
  onPhoneBlur,
}: {
  control: AnyControl;
  register: AnyRegister;
  contactIndex: number;
  errors: any;
  onPhoneBlur?: (value: string) => void;
}) {
  const phones = useFieldArray({ control, name: `contacts.${contactIndex}.phones` });
  return (
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
      {typeof errors?.contacts?.[contactIndex]?.phones?.message === 'string' && (
        <p className={errClass}>{errors.contacts[contactIndex].phones.message}</p>
      )}
      <div className="space-y-2">
        {phones.fields.map((pf, j) => (
          <div key={pf.id} className="flex flex-wrap items-center gap-2">
            <input
              placeholder="+91…"
              className={`${inputClass} flex-1`}
              onBlurCapture={(e) => onPhoneBlur?.(e.target.value)}
              {...register(`contacts.${contactIndex}.phones.${j}.phone_e164`)}
            />
            <input placeholder="Label" className={`${inputClass} w-28`} {...register(`contacts.${contactIndex}.phones.${j}.label`)} />
            <label className="flex items-center gap-1 text-xs text-white/60">
              <input type="checkbox" {...register(`contacts.${contactIndex}.phones.${j}.is_primary`)} />
              Primary
            </label>
            <button type="button" onClick={() => phones.remove(j)} aria-label="Remove phone" className="text-white/40 hover:text-[var(--destructive)]">
              <Trash2 size={14} />
            </button>
            {errors?.contacts?.[contactIndex]?.phones?.[j]?.phone_e164 && (
              <p className={`${errClass} w-full`}>{errors.contacts[contactIndex].phones[j].phone_e164.message}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
