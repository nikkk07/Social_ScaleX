// Turns database / API errors into sentences a salesperson can act on.
// The RPCs raise short machine codes (e.g. `lead_busy:Amit`); constraint
// names come through from Postgres. Anything unknown gets a safe generic.

const FIELD: Record<string, string> = {
  due_at: 'Pick a date and time that isn’t in the past.',
  outcome: 'Choose what happened on the call.',
  next_step: 'Choose the next step.',
  result: 'Choose what happened.',
  lost_reason: 'Choose a reason.',
  amount: 'Enter the quote amount in rupees.',
  valid_until: 'The validity date can’t be in the past.',
  link: 'The quote link must start with https://',
  phone: 'A phone number isn’t valid. Use a 10-digit mobile or +country code.',
  'new_contact.phone': 'The new contact’s phone number isn’t valid.',
  'contact.name': 'Every contact needs a name.',
  brand_name: 'Enter the brand name.',
  instagram_username: 'That Instagram handle isn’t valid — use the bare handle, e.g. nimbuscoffee.',
  owner: 'Pick an active team member.',
  reason: 'Add a short reason.',
  quota: 'Quota must be between 0 and 500.',
  range: 'Pick a valid date range (up to a year).',
  rows: 'The file has no rows, or more than 2,000.',
  type: 'Choose a valid type.',
  task: 'That follow-up doesn’t belong to this lead.',
  text: 'Write a note (up to 2,000 characters).',
  note: 'Notes can be up to 2,000 characters.',
  decision: 'Choose accept or reject.',
  leads: 'Select between 1 and 1,000 leads.',
};

const CODES: Record<string, string> = {
  not_authorized: 'You don’t have permission to do that.',
  protected_field: 'That change has to go through the call outcome or stage controls.',
  lead_not_found: 'This lead doesn’t exist or isn’t assigned to you.',
  lead_archived: 'This lead is archived. Restore it first.',
  lead_dnc: 'This lead asked not to be contacted.',
  lead_closed: 'This lead is closed. Ask an admin to reopen it.',
  phone_invalid: 'This number was marked as wrong. Try another number.',
  too_many_pending: 'Log the outcome of your last calls before starting another (3 are waiting).',
  attempt_not_found: 'That call was already logged or removed.',
  attempt_already_logged: 'That call was already logged.',
  task_not_found: 'That follow-up no longer exists.',
  task_closed: 'That follow-up is already closed.',
  quote_not_found: 'That quotation no longer exists.',
  quote_closed: 'That quotation was already decided.',
  enquiry_already_converted: 'Someone already converted this enquiry. Nothing was saved.',
  user_not_found: 'That team member no longer exists.',
};

export function friendlyError(e: unknown): string {
  const raw = errorText(e);
  if (!raw) return 'Something went wrong. Please try again.';
  if (raw.startsWith('lead_busy:')) {
    return `${raw.slice('lead_busy:'.length).trim() || 'A teammate'} is on this lead right now. Try again in a few minutes.`;
  }
  if (raw.startsWith('invalid_input:')) {
    return FIELD[raw.slice('invalid_input:'.length)] ?? 'Please check the highlighted fields.';
  }
  const code = raw.split(/[\s:]/)[0] ?? '';
  if (CODES[code]) return CODES[code];
  if (/leads_instagram_unique/i.test(raw)) return 'A lead with that Instagram handle already exists.';
  if (/lead_phones_e164/i.test(raw)) return FIELD.phone as string;
  if (/violates row-level security|permission denied/i.test(raw)) return CODES.not_authorized as string;
  if (/Failed to fetch|NetworkError|network/i.test(raw)) return 'You seem to be offline. Check your connection and try again.';
  if (/JWT|token.*expired|invalid claim/i.test(raw)) return 'Your session expired. Sign in again.';
  if (/invalid input value for enum/i.test(raw)) return 'Please pick one of the listed options.';
  // API routes already send human sentences.
  if (/^[A-Z].{8,}[.!?]$/.test(raw) && !/[_{}]/.test(raw)) return raw;
  return 'Something went wrong. Please try again.';
}

function errorText(e: unknown): string {
  if (!e) return '';
  if (typeof e === 'string') return e;
  if (e instanceof Error) return e.message;
  const o = e as { message?: unknown; error?: unknown };
  if (typeof o.message === 'string') return o.message;
  if (typeof o.error === 'string') return o.error;
  return '';
}
