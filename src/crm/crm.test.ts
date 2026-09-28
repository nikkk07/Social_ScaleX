// Pure-function checks for the CRM (run by scripts/test-unit.sh).
import { normalizeInstagram, normalizePhone, passwordProblem, phoneOnlyEmail, isPhoneOnlyEmail, formatPhone } from '@/lib/crm/normalize';
import { csvCell, parseLeadsQuery, leadsQueryToParams, sanitizeSearch, phoneDigits, DEFAULT_LEADS_QUERY } from './leads/leadsQuery';
import { fromIstLocalInput, toIstLocalInput, istDateKey, addDaysKey } from './lib/time';
import { scoreLead } from './lib/score';
import { friendlyError } from './lib/errors';

let failed = 0;
function eq(name: string, got: unknown, want: unknown) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : ` — got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`}`);
}

// Phones (must match public.normalize_phone)
eq('10-digit mobile → +91', normalizePhone('98765 43210'), '+919876543210');
eq('leading 0', normalizePhone('09876543210'), '+919876543210');
eq('91 prefix without plus', normalizePhone('919876543210'), '+919876543210');
eq('+91 with spaces/dashes', normalizePhone('+91-98765-43210'), '+919876543210');
eq('00 international prefix', normalizePhone('0044 20 7946 0958'), '+442079460958');
eq('foreign E.164 kept', normalizePhone('+442079460958'), '+442079460958');
eq('landline without code rejected', normalizePhone('23456789'), null);
eq('too short', normalizePhone('12345'), null);
eq('letters rejected', normalizePhone('98765abcde'), null);
eq('empty', normalizePhone('  '), null);
eq('10-digit starting 5 rejected', normalizePhone('5876543210'), null);
eq('brackets', normalizePhone('(987) 654-3217'), '+919876543217');

// Instagram
eq('@handle', normalizeInstagram('@Nimbus.Coffee'), 'nimbus.coffee');
eq('profile URL', normalizeInstagram('https://www.instagram.com/nimbuscoffee/?hl=en'), 'nimbuscoffee');
eq('bare', normalizeInstagram('nimbus_coffee'), 'nimbus_coffee');
eq('invalid chars', normalizeInstagram('nimbus-coffee!'), null);
eq('too long', normalizeInstagram('a'.repeat(31)), null);

// Passwords
eq('short password', passwordProblem('abc123'), 'Use at least 8 characters.');
eq('no digit', passwordProblem('abcdefgh'), 'Use at least one letter and one number.');
eq('ok password', passwordProblem('Sales2026'), null);
eq('synthetic email', phoneOnlyEmail('+919876543210'), 'p919876543210@phone.socialscalex.invalid');
eq('synthetic detect', isPhoneOnlyEmail('p1@phone.socialscalex.invalid'), true);
eq('format IN phone', formatPhone('+919876543210'), '+91 98765 43210');

// Leads query
eq('default query', parseLeadsQuery(new URLSearchParams('')), DEFAULT_LEADS_QUERY);
eq('bad stage → default', parseLeadsQuery(new URLSearchParams('stage=zzz')).stage, 'open');
eq('valid stage', parseLeadsQuery(new URLSearchParams('stage=won')).stage, 'won');
eq('bad owner → any', parseLeadsQuery(new URLSearchParams('owner=1;drop')).owner, '');
eq('negative page → 1', parseLeadsQuery(new URLSearchParams('page=-3')).page, 1);
eq('round trip', leadsQueryToParams(parseLeadsQuery(new URLSearchParams('stage=lost&owner=none&page=2'))).toString(), 'stage=lost&owner=none&page=2');
eq('search sanitised', sanitizeSearch('a,b(c)%d"e'), 'a b c d e');
eq('phone search digits', phoneDigits('98765 43210'), '9876543210');
eq('text is not a phone', phoneDigits('nimbus 123'), null);

// CSV formula injection
eq('csv =cmd', csvCell('=HYPERLINK("x")'), '"\'=HYPERLINK(""x"")"');
eq('csv +', csvCell('+91 98'), "'+91 98");
eq('csv plain', csvCell('Nimbus'), 'Nimbus');
eq('csv comma', csvCell('a,b'), '"a,b"');

// IST time helpers
eq('IST input → UTC', fromIstLocalInput('2026-09-28T11:00'), '2026-09-28T05:30:00.000Z');
eq('UTC → IST input', toIstLocalInput('2026-09-28T05:30:00.000Z'), '2026-09-28T11:00');
eq('IST date key crosses midnight', istDateKey('2026-09-28T19:00:00Z'), '2026-09-29');
eq('add days', addDaysKey('2026-12-31', 1), '2027-01-01');
eq('bad input', fromIstLocalInput('nope'), null);

// Score
const base = {
  stage: 'interested' as const, attempt_count: 1, last_connected_at: new Date().toISOString(), last_attempt_at: new Date().toISOString(),
  stage_changed_at: new Date().toISOString(), created_at: new Date().toISOString(), deal_value_inr: null, next_action_at: null,
};
eq('closed lead has no score', scoreLead({ ...base, stage: 'won' }), null);
eq('fresh interested is hot', scoreLead(base)?.band, 'hot');
eq('many misses lowers score', (scoreLead({ ...base, stage: 'attempting', last_connected_at: null, attempt_count: 6 })?.value ?? 99) < 10, true);

// Errors
eq('busy lead message', friendlyError(new Error('lead_busy:Amit')), 'Amit is on this lead right now. Try again in a few minutes.');
eq('field error', friendlyError({ message: 'invalid_input:due_at' }), 'Pick a date and time that isn’t in the past.');
eq('unknown → generic', friendlyError(new Error('xyz_internal {oops}')), 'Something went wrong. Please try again.');
eq('api sentence passes', friendlyError(new Error('That email already has an account.')), 'That email already has an account.');

if (failed) { console.log(`\n${failed} FAILED`); process.exit(1); }
console.log('\nALL PASS');
