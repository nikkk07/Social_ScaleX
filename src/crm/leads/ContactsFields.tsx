'use client';
// Contacts (people) and their phones, plus office lines. Controlled state;
// validation lives in validateContacts so the form and the editor agree.
import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { normalizePhone, isEmail } from '@/lib/crm/normalize';
import { inputClass } from '../ui/kit';
import { cn } from '@/components/ui/utils';

export interface PhoneDraft { phone: string; label: string; is_primary: boolean }
export interface ContactDraft { name: string; designation: string; email: string; is_primary: boolean; phones: PhoneDraft[] }
export interface ContactsDraft { contacts: ContactDraft[]; office: PhoneDraft[] }

export const emptyContact = (primary = false): ContactDraft => ({
  name: '', designation: '', email: '', is_primary: primary, phones: [{ phone: '', label: 'Mobile', is_primary: true }],
});

export type ContactErrors = Record<string, string>;

export function validateContacts(d: ContactsDraft): ContactErrors {
  const e: ContactErrors = {};
  const seen = new Set<string>();
  d.contacts.forEach((c, i) => {
    const hasAny = c.name.trim() || c.email.trim() || c.phones.some((p) => p.phone.trim());
    if (hasAny && !c.name.trim()) e[`c${i}.name`] = 'Name is required.';
    if (c.name.length > 120) e[`c${i}.name`] = 'Keep it under 120 characters.';
    if (c.email.trim() && !isEmail(c.email)) e[`c${i}.email`] = 'Enter a valid email.';
    c.phones.forEach((p, j) => {
      if (!p.phone.trim()) return;
      const n = normalizePhone(p.phone);
      if (!n) e[`c${i}.p${j}`] = 'Use a 10-digit mobile or +country code.';
      else if (seen.has(n)) e[`c${i}.p${j}`] = 'This number is already listed.';
      else seen.add(n);
    });
  });
  d.office.forEach((p, j) => {
    if (!p.phone.trim()) return;
    const n = normalizePhone(p.phone);
    if (!n) e[`o${j}`] = 'Use a 10-digit number or +country code.';
    else if (seen.has(n)) e[`o${j}`] = 'This number is already listed.';
    else seen.add(n);
  });
  return e;
}

/** Payload shape expected by create_/update_lead_with_contacts. */
export function contactsPayload(d: ContactsDraft) {
  const contacts = d.contacts
    .filter((c) => c.name.trim())
    .map((c, i, arr) => {
      const phones = c.phones.filter((p) => p.phone.trim());
      const primaryIdx = Math.max(0, phones.findIndex((p) => p.is_primary));
      return {
        name: c.name.trim(),
        designation: c.designation.trim() || null,
        email: c.email.trim().toLowerCase() || null,
        is_primary: arr.some((x) => x.is_primary) ? c.is_primary : i === 0,
        sort_order: i,
        phones: phones.map((p, j) => ({
          phone_e164: normalizePhone(p.phone), label: p.label.trim() || null, is_primary: j === primaryIdx, sort_order: j,
        })),
      };
    });
  // exactly one primary contact
  let seenPrimary = false;
  for (const c of contacts) { if (c.is_primary && !seenPrimary) seenPrimary = true; else c.is_primary = false; }
  if (!seenPrimary && contacts[0]) contacts[0].is_primary = true;
  const office = d.office.filter((p) => p.phone.trim());
  return {
    contacts,
    lead_phones: office.map((p, j) => ({ phone_e164: normalizePhone(p.phone), label: p.label.trim() || 'Office', is_primary: j === 0, sort_order: j })),
  };
}

export function ContactsFields({ value, onChange, errors, onPhoneBlur }: {
  value: ContactsDraft; onChange: (d: ContactsDraft) => void; errors: ContactErrors; onPhoneBlur?: (raw: string) => void;
}) {
  const setContact = (i: number, patch: Partial<ContactDraft>) =>
    onChange({ ...value, contacts: value.contacts.map((c, k) => (k === i ? { ...c, ...patch } : patch.is_primary ? { ...c, is_primary: false } : c)) });
  const setPhone = (i: number, j: number, patch: Partial<PhoneDraft>) =>
    setContact(i, { phones: (value.contacts[i] as ContactDraft).phones.map((p, k) => (k === j ? { ...p, ...patch } : patch.is_primary ? { ...p, is_primary: false } : p)) });

  return (
    <div className="space-y-4">
      {value.contacts.map((c, i) => (
        <fieldset key={i} className="rounded-xl border border-border p-3">
          <legend className="px-1 text-xs font-medium text-muted-foreground">Contact {i + 1}</legend>
          <div className="grid gap-3 sm:grid-cols-3">
            <TextInput label="Name" value={c.name} onChange={(v) => setContact(i, { name: v })} error={errors[`c${i}.name`]} maxLength={120} />
            <TextInput label="Role" value={c.designation} onChange={(v) => setContact(i, { designation: v })} placeholder="Owner, Marketing…" maxLength={120} />
            <TextInput label="Email" type="email" value={c.email} onChange={(v) => setContact(i, { email: v })} error={errors[`c${i}.email`]} maxLength={200} />
          </div>
          <div className="mt-3 space-y-2">
            {c.phones.map((p, j) => (
              <div key={j} className="flex flex-wrap items-end gap-2">
                <TextInput className="min-w-40 flex-1" label={j === 0 ? 'Phone' : `Phone ${j + 1}`} type="tel" value={p.phone}
                  onChange={(v) => setPhone(i, j, { phone: v })} onBlur={() => onPhoneBlur?.(p.phone)} error={errors[`c${i}.p${j}`]} placeholder="98765 43210" />
                <TextInput className="w-28" label="Label" value={p.label} onChange={(v) => setPhone(i, j, { label: v })} maxLength={30} />
                {c.phones.length > 1 ? (
                  <button type="button" onClick={() => setContact(i, { phones: c.phones.filter((_, k) => k !== j) })}
                    className="mb-0.5 inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted" aria-label={`Remove phone ${j + 1}`}>
                    <Trash2 className="size-4" aria-hidden="true" />
                  </button>
                ) : null}
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
            <button type="button" onClick={() => setContact(i, { phones: [...c.phones, { phone: '', label: 'Mobile', is_primary: false }] })}
              className="inline-flex items-center gap-1 text-primary hover:underline"><Plus className="size-3.5" aria-hidden="true" /> Add phone</button>
            <label className="inline-flex items-center gap-1.5">
              <input type="radio" name="primary-contact" checked={c.is_primary} onChange={() => setContact(i, { is_primary: true })} className="accent-[var(--primary)]" />
              Main contact
            </label>
            {value.contacts.length > 1 ? (
              <button type="button" onClick={() => onChange({ ...value, contacts: value.contacts.filter((_, k) => k !== i) })}
                className="ml-auto inline-flex items-center gap-1 text-destructive hover:underline"><Trash2 className="size-3.5" aria-hidden="true" /> Remove contact</button>
            ) : null}
          </div>
        </fieldset>
      ))}
      <button type="button" onClick={() => onChange({ ...value, contacts: [...value.contacts, emptyContact(value.contacts.length === 0)] })}
        className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"><Plus className="size-4" aria-hidden="true" /> Add another contact</button>

      <fieldset className="rounded-xl border border-border p-3">
        <legend className="px-1 text-xs font-medium text-muted-foreground">Office / landline numbers</legend>
        <div className="space-y-2">
          {value.office.map((p, j) => (
            <div key={j} className="flex flex-wrap items-end gap-2">
              <TextInput className="min-w-40 flex-1" label="Number" type="tel" value={p.phone} error={errors[`o${j}`]}
                onChange={(v) => onChange({ ...value, office: value.office.map((x, k) => (k === j ? { ...x, phone: v } : x)) })}
                onBlur={() => onPhoneBlur?.(p.phone)} />
              <TextInput className="w-28" label="Label" value={p.label} maxLength={30}
                onChange={(v) => onChange({ ...value, office: value.office.map((x, k) => (k === j ? { ...x, label: v } : x)) })} />
              <button type="button" onClick={() => onChange({ ...value, office: value.office.filter((_, k) => k !== j) })}
                className="mb-0.5 inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted" aria-label={`Remove office number ${j + 1}`}>
                <Trash2 className="size-4" aria-hidden="true" />
              </button>
            </div>
          ))}
          <button type="button" onClick={() => onChange({ ...value, office: [...value.office, { phone: '', label: 'Office', is_primary: false }] })}
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"><Plus className="size-3.5" aria-hidden="true" /> Add office number</button>
        </div>
      </fieldset>
    </div>
  );
}

export function TextInput({ label, value, onChange, error, className, type = 'text', placeholder, maxLength, onBlur, required }: {
  label: string; value: string; onChange: (v: string) => void; error?: string; className?: string; type?: string;
  placeholder?: string; maxLength?: number; onBlur?: () => void; required?: boolean;
}) {
  const id = React.useId();
  return (
    <div className={cn('space-y-1', className)}>
      <label htmlFor={id} className="block text-xs font-medium">{label}{required ? <span className="text-destructive" aria-hidden="true"> *</span> : null}</label>
      <input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} onBlur={onBlur} placeholder={placeholder}
        maxLength={maxLength} aria-invalid={!!error || undefined} aria-describedby={error ? `${id}-e` : undefined} className={inputClass}
        inputMode={type === 'tel' ? 'tel' : undefined} autoComplete="off" />
      {error ? <p id={`${id}-e`} className="text-xs font-medium text-destructive">{error}</p> : null}
    </div>
  );
}
