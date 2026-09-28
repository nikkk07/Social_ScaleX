// Human labels and badge tones for every enum the CRM shows. One place, so
// the list, the detail page, the pop-up and Insights always agree.
import type {
  AttemptResult, ConnectOutcome, LeadSource, LeadStage, LostReason, MeetingMode, QuoteStatus, TaskType,
} from '@/lib/database.types';

export type Tone = 'neutral' | 'info' | 'violet' | 'amber' | 'green' | 'red' | 'slate';

export const STAGES: readonly LeadStage[] = [
  'new', 'attempting', 'connected', 'interested', 'callback', 'meeting',
  'quotation', 'negotiation', 'won', 'lost', 'nurture', 'dnc',
];

export const STAGE_LABEL: Record<LeadStage, string> = {
  new: 'New',
  attempting: 'Trying to reach',
  connected: 'Connected',
  interested: 'Interested',
  callback: 'Call-back',
  meeting: 'Meeting',
  quotation: 'Quotation sent',
  negotiation: 'Negotiation',
  won: 'Won',
  lost: 'Lost',
  nurture: 'Nurture',
  dnc: 'Do not contact',
};

export const STAGE_TONE: Record<LeadStage, Tone> = {
  new: 'info',
  attempting: 'slate',
  connected: 'info',
  interested: 'violet',
  callback: 'violet',
  meeting: 'violet',
  quotation: 'amber',
  negotiation: 'amber',
  won: 'green',
  lost: 'red',
  nurture: 'slate',
  dnc: 'red',
};

/** Open pipeline, in funnel order — used by filters and Insights. */
export const OPEN_STAGES: readonly LeadStage[] = [
  'new', 'attempting', 'connected', 'interested', 'callback', 'meeting', 'quotation', 'negotiation', 'nurture',
];

export const SOURCE_LABEL: Record<LeadSource, string> = {
  manual: 'Added manually',
  website_callback: 'Website call-back',
  website_query: 'Website enquiry',
  import: 'Imported',
};

export const TASK_LABEL: Record<TaskType, string> = {
  callback: 'Call-back',
  meeting: 'Meeting',
  follow_up: 'Follow-up',
  quote_follow_up: 'Quote follow-up',
  retry_call: 'Retry call',
  re_engage: 'Re-engage',
  nurture: 'Nurture',
};

export const TASK_TONE: Record<TaskType, Tone> = {
  callback: 'violet',
  meeting: 'green',
  follow_up: 'info',
  quote_follow_up: 'amber',
  retry_call: 'slate',
  re_engage: 'neutral',
  nurture: 'neutral',
};

export const MEETING_MODE_LABEL: Record<MeetingMode, string> = {
  phone: 'Phone call',
  video: 'Video call',
  in_person: 'In person',
};

export const LOST_REASON_LABEL: Record<LostReason, string> = {
  using_other_agency: 'Already with another agency',
  budget: 'Budget',
  no_need_now: 'No need right now',
  not_decision_maker: 'Not the decision maker',
  bad_past_experience: 'Bad past experience',
  price: 'Price too high',
  scope: 'Scope didn’t fit',
  chose_competitor: 'Chose a competitor',
  no_response: 'Stopped responding',
  invalid_contact: 'No valid contact',
  other: 'Other',
};

/** Reasons offered when a connected client says no (quote-specific ones excluded). */
export const NOT_INTERESTED_REASONS: readonly LostReason[] = [
  'using_other_agency', 'budget', 'no_need_now', 'not_decision_maker', 'bad_past_experience', 'other',
];
export const QUOTE_REJECT_REASONS: readonly LostReason[] = [
  'price', 'scope', 'chose_competitor', 'budget', 'no_response', 'other',
];

export const RESULT_LABEL: Record<AttemptResult, string> = {
  no_answer: 'No answer',
  busy: 'Busy',
  switched_off: 'Switched off',
  not_reachable: 'Not reachable',
  rejected: 'Call cut / rejected',
  wrong_number: 'Wrong number',
  connected: 'Connected',
  wa_sent: 'Message sent',
  wa_replied: 'Client replied',
  not_on_whatsapp: 'Not on WhatsApp',
};

export const OUTCOME_LABEL: Record<ConnectOutcome, string> = {
  interested: 'Interested',
  call_later: 'Call me later',
  not_interested: 'Not interested',
  do_not_call: 'Do not contact again',
  wrong_person: 'Wrong person',
  language_barrier: 'Language barrier',
  call_dropped: 'Call dropped',
  still_deciding: 'Still deciding',
  quote_accepted: 'Accepted the quote',
  quote_revision: 'Wants a revised quote',
  quote_rejected: 'Rejected the quote',
};

export const QUOTE_STATUS_LABEL: Record<QuoteStatus, string> = {
  sent: 'Awaiting decision',
  accepted: 'Accepted',
  rejected: 'Rejected',
  revised: 'Superseded',
};

export const ROLE_LABEL = { owner: 'Owner', admin: 'Admin', member: 'Member' } as const;

export function toneClasses(tone: Tone): string {
  switch (tone) {
    case 'info':
      return 'bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200';
    case 'violet':
      return 'bg-violet-100 text-violet-900 dark:bg-violet-950 dark:text-violet-200';
    case 'amber':
      return 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200';
    case 'green':
      return 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200';
    case 'red':
      return 'bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200';
    case 'slate':
      return 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200';
    default:
      return 'bg-muted text-foreground';
  }
}
