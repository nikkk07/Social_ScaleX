// Validation + payload shaping for the add/edit lead form. Mirrors the DB
// invariants so the user gets inline errors instead of a round-trip rejection:
//   - brand_name required (leads CHECK length>0)
//   - outcome only when contacted (outcome_requires_contacted CHECK +
//     tg_leads_status_coherence)
//   - lead_found_on <= today (lead_found_not_future CHECK)
//   - at most one primary contact / primary phone (partial unique indexes)
//   - phones in E.164 (how lead_phones stores them)
// The DB still enforces all of this — this is a friendlier first line only.
import { z } from 'zod';

const E164 = /^\+[1-9]\d{6,14}$/;

// Instagram handle: accept a URL or @handle, store the bare lowercase handle
// (matches the "normalised: lowercase, no '@', no URL" note in the schema).
export function normalizeHandle(raw: string): string {
  let h = raw.trim();
  if (!h) return '';
  h = h.replace(/^https?:\/\//i, '').replace(/^(www\.)?instagram\.com\//i, '');
  h = h.replace(/[/?#].*$/, ''); // drop any path/query after the handle
  h = h.replace(/^@+/, '');
  return h.toLowerCase();
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

const optionalTrimmed = (max: number) =>
  z.string().trim().max(max).optional().or(z.literal(''));

const phoneSchema = z.object({
  phone_e164: z
    .string()
    .trim()
    .regex(E164, 'Use E.164 format, e.g. +918077727669'),
  label: optionalTrimmed(40),
  is_primary: z.boolean(),
});

const contactSchema = z.object({
  name: z.string().trim().min(1, 'Contact name is required').max(120),
  designation: optionalTrimmed(80),
  email: z
    .string()
    .trim()
    .email('Enter a valid email')
    .optional()
    .or(z.literal('')),
  is_primary: z.boolean(),
  phones: z.array(phoneSchema),
});

export const leadFormSchema = z
  .object({
    brand_name: z.string().trim().min(1, 'Brand name is required').max(200),
    instagram_username: z.string().trim().max(200).optional().or(z.literal('')),
    address: optionalTrimmed(300),
    lead_found_on: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Pick a date')
      .refine((d) => d <= todayISO(), 'Found date can’t be in the future'),
    status: z.enum(['pending', 'contacted']),
    outcome: z.enum(['', 'interested', 'not_interested']),
    source: z.enum(['manual', 'website_callback', 'website_query', 'import']),
    notes: optionalTrimmed(5000),
    owner_id: z.string().optional().or(z.literal('')),
    contacts: z.array(contactSchema),
    lead_phones: z.array(phoneSchema),
  })
  .superRefine((val, ctx) => {
    if (val.status === 'pending' && val.outcome !== '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['outcome'],
        message: 'An outcome only applies once the lead is contacted',
      });
    }
    if (val.contacts.filter((c) => c.is_primary).length > 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['contacts'],
        message: 'Only one contact can be primary',
      });
    }
    if (val.lead_phones.filter((p) => p.is_primary).length > 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['lead_phones'],
        message: 'Only one office phone can be primary',
      });
    }
    val.contacts.forEach((c, i) => {
      if (c.phones.filter((p) => p.is_primary).length > 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['contacts', i, 'phones'],
          message: 'Only one phone per contact can be primary',
        });
      }
    });
  });

export type LeadFormValues = z.infer<typeof leadFormSchema>;

export function emptyLeadForm(): LeadFormValues {
  return {
    brand_name: '',
    instagram_username: '',
    address: '',
    lead_found_on: todayISO(),
    status: 'pending',
    outcome: '',
    source: 'manual',
    notes: '',
    owner_id: '',
    contacts: [],
    lead_phones: [],
  };
}

const clean = (s: string | undefined) => {
  const t = (s ?? '').trim();
  return t === '' ? null : t;
};

// Payload for create_lead_with_contacts(payload jsonb). owner_id omitted when
// blank so the RPC defaults it to auth.uid().
export function toRpcPayload(v: LeadFormValues): Record<string, unknown> {
  return {
    brand_name: v.brand_name.trim(),
    instagram_username: normalizeHandle(v.instagram_username ?? '') || null,
    address: clean(v.address),
    lead_found_on: v.lead_found_on,
    status: v.status,
    outcome: v.status === 'contacted' && v.outcome !== '' ? v.outcome : null,
    source: v.source,
    notes: clean(v.notes),
    owner_id: v.owner_id || null,
    contacts: v.contacts.map((c, i) => ({
      name: c.name.trim(),
      designation: clean(c.designation),
      email: clean(c.email),
      is_primary: c.is_primary,
      sort_order: i,
      phones: c.phones.map((p, j) => ({
        phone_e164: p.phone_e164.trim(),
        label: clean(p.label),
        is_primary: p.is_primary,
        sort_order: j,
      })),
    })),
    lead_phones: v.lead_phones.map((p, j) => ({
      phone_e164: p.phone_e164.trim(),
      label: clean(p.label),
      is_primary: p.is_primary,
      sort_order: j,
    })),
  };
}

// Lead-level fields only (edit updates the leads row; contacts/phones editing
// lands with the lead detail view).
export function toUpdatePayload(v: LeadFormValues) {
  return {
    brand_name: v.brand_name.trim(),
    instagram_username: normalizeHandle(v.instagram_username ?? '') || null,
    address: clean(v.address),
    lead_found_on: v.lead_found_on,
    status: v.status,
    outcome: (v.status === 'contacted' && v.outcome !== ''
      ? v.outcome
      : null) as 'interested' | 'not_interested' | null,
    source: v.source,
    notes: clean(v.notes),
    owner_id: v.owner_id || null,
  };
}
