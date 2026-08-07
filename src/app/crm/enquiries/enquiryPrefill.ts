// Turn an inbound enquiry into starting values for the add-lead form.
import { emptyLeadForm, type LeadFormValues } from '../leads/leadFormSchema';
import type { EnquiryRow } from './enquiriesQuery';

// The public form takes a free-text phone, so what arrives is whatever the
// visitor typed: '+91 98765 43210', '(98765) 43210', '98765-43210'. Strip the
// punctuation people use as separators and keep a single leading '+'.
//
// Deliberately NOT guessing a country code for a bare 10-digit number: every
// number in this CRM happens to be +91 today, but silently stamping +91 on a
// number that isn't Indian produces a plausible-looking, permanently
// unreachable contact. A value that still isn't E.164 is prefilled as-is, and
// the form's own validation asks the human to fix it — which is the right
// person to decide.
export function cleanPhone(raw: string): string {
  const trimmed = raw.trim();
  const rest = trimmed.replace(/^\+/, '').replace(/[\s().\-–—]/g, '');
  return trimmed.startsWith('+') ? `+${rest}` : rest;
}

const SOURCE_BY_KIND = {
  callback: 'website_callback',
  query: 'website_query',
} as const;

export function enquiryToLeadForm(e: EnquiryRow): LeadFormValues {
  const phone = cleanPhone(e.phone ?? '');

  // The enquiry's message and preferred callback time are the whole reason
  // someone will pick this lead up — they belong in notes, not lost on a
  // screen the person converting has already navigated away from.
  const notes = [
    e.message?.trim(),
    e.best_time?.trim() ? `Preferred time: ${e.best_time.trim()}` : '',
  ]
    .filter(Boolean)
    .join('\n\n');

  return {
    ...emptyLeadForm(),
    // brand_name is left EMPTY on purpose. An enquiry carries a person's name,
    // not a business's, and "Ananya Rao" as a brand is bad data that outlives
    // the five seconds it saved. Required + empty points the person converting
    // at the one field only they can fill.
    brand_name: '',
    // When the enquiry arrived, not when the conversion happens.
    lead_found_on: e.created_at.slice(0, 10),
    source: SOURCE_BY_KIND[e.kind as keyof typeof SOURCE_BY_KIND] ?? 'manual',
    notes,
    contacts: [
      {
        name: e.name.trim(),
        designation: '',
        email: e.email?.trim() ?? '',
        is_primary: true,
        phones: phone
          ? [{ phone_e164: phone, label: '', is_primary: true }]
          : [],
      },
    ],
  };
}
