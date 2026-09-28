'use client';
import React from 'react';
import { Field, inputClass } from './kit';
import { addDaysKey, todayKey } from '../lib/time';

export interface QuoteDraft {
  amount: string;
  valid_until: string; // YYYY-MM-DD or ''
  services: string;
  link: string;
}

export const emptyQuote = (): QuoteDraft => ({ amount: '', valid_until: addDaysKey(todayKey(), 7), services: '', link: '' });

/** Returns field errors; empty object when valid. */
export function quoteErrors(q: QuoteDraft, amountRequired = true): Partial<Record<keyof QuoteDraft, string>> {
  const e: Partial<Record<keyof QuoteDraft, string>> = {};
  const n = Number(q.amount.replace(/[,\s₹]/g, ''));
  if (!q.amount.trim()) {
    if (amountRequired) e.amount = 'Enter the amount in rupees.';
  } else if (!Number.isFinite(n) || n <= 0 || n > 9_999_999_999) e.amount = 'Enter a valid amount.';
  if (q.valid_until && q.valid_until < todayKey()) e.valid_until = 'Validity can’t be in the past.';
  if (q.link.trim() && !/^https:\/\//i.test(q.link.trim())) e.link = 'Use a link that starts with https://';
  if (q.services.length > 2000) e.services = 'Keep it under 2,000 characters.';
  return e;
}

export function quotePayload(q: QuoteDraft) {
  return {
    amount: Number(q.amount.replace(/[,\s₹]/g, '')),
    valid_until: q.valid_until || null,
    services: q.services.trim() || null,
    link: q.link.trim() || null,
  };
}

export function QuoteFields({ value, onChange, errors, amountRequired = true }: {
  value: QuoteDraft;
  onChange: (q: QuoteDraft) => void;
  errors: Partial<Record<keyof QuoteDraft, string>>;
  amountRequired?: boolean;
}) {
  const set = (k: keyof QuoteDraft) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    onChange({ ...value, [k]: e.target.value });
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Amount (₹)" required={amountRequired} error={errors.amount}>
        {({ id, describedBy, invalid }) => (
          <input id={id} inputMode="decimal" placeholder="45,000" value={value.amount} onChange={set('amount')}
            aria-describedby={describedBy} aria-invalid={invalid || undefined} className={inputClass} />
        )}
      </Field>
      <Field label="Valid until" error={errors.valid_until}>
        {({ id, describedBy, invalid }) => (
          <input id={id} type="date" min={todayKey()} value={value.valid_until} onChange={set('valid_until')}
            aria-describedby={describedBy} aria-invalid={invalid || undefined} className={inputClass} />
        )}
      </Field>
      <Field label="Services included" error={errors.services} className="sm:col-span-2">
        {({ id, describedBy, invalid }) => (
          <textarea id={id} rows={2} placeholder="e.g. 12 Reels/month + Meta Ads management" value={value.services}
            onChange={set('services')} aria-describedby={describedBy} aria-invalid={invalid || undefined} className={inputClass} />
        )}
      </Field>
      <Field label="Link to the quote (optional)" error={errors.link} hint="Google Drive / PDF link — must start with https://" className="sm:col-span-2">
        {({ id, describedBy, invalid }) => (
          <input id={id} type="url" placeholder="https://" value={value.link} onChange={set('link')}
            aria-describedby={describedBy} aria-invalid={invalid || undefined} className={inputClass} />
        )}
      </Field>
    </div>
  );
}
