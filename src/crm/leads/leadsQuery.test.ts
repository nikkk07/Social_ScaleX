// Pure-function checks for the leads query helpers. No test runner is wired in
// this project; run with:  npm run test:unit
// (esbuild bundles + node executes; dummy Supabase env is injected so the
// module's client init doesn't throw).
import {
  sanitizeSearch,
  leadsToCsv,
  fromSearchParams,
  toSearchParams,
  hasActiveFilters,
  DEFAULT_QUERY,
  type LeadRow,
} from './leadsQuery';
import { normalizeHandle, toRpcPayload, emptyLeadForm } from './leadFormSchema';
import {
  DEFAULT_ENQUIRIES_QUERY,
  fromSearchParams as enqFromParams,
  toSearchParams as enqToParams,
  hasActiveFilters as enqHasFilters,
  type EnquiryRow,
} from '../enquiries/enquiriesQuery';
import { cleanPhone, enquiryToLeadForm } from '../enquiries/enquiryPrefill';

// Node global at runtime; declared here so tsc doesn't need @types/node.
declare const process: { exit(code: number): never };

let failures = 0;
function check(name: string, cond: boolean, detail = ''): void {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${!cond && detail ? `  — ${detail}` : ''}`);
  if (!cond) failures++;
}

// ── 1. sanitizeSearch keeps '_' and '*'; strips structural chars ────────
check(
  "underscored handle survives (the_subh_journey)",
  sanitizeSearch('the_subh_journey') === 'the_subh_journey',
  sanitizeSearch('the_subh_journey'),
);
check('asterisk kept', sanitizeSearch('a*b') === 'a*b', sanitizeSearch('a*b'));
check(
  'structural chars stripped ( , ( ) % \\ )',
  sanitizeSearch('a,b(c)%\\d') === 'a b c d',
  sanitizeSearch('a,b(c)%\\d'),
);
check('lone % → empty (no filter, not a broken query)', sanitizeSearch('%') === '');

// ── 2. CSV formula injection neutralised ────────────────────────────────
function mk(brand: string): LeadRow {
  return {
    id: 'x',
    brand_name: brand,
    instagram_username: null,
    status: 'pending',
    outcome: null,
    source: 'manual',
    lead_found_on: '2026-01-01',
    created_at: '2026-01-01T00:00:00Z',
    owner_id: null,
    lead_contacts: [],
  };
}
const csv = leadsToCsv([
  mk('=1+1'),
  mk('@SUM(A1)'),
  mk('+cmd'),
  mk('-2'),
  mk('=SUM(A1,A2)'), // formula AND comma → neutralised AND quoted
  mk('normal'),
]);
const firstCells = csv.split('\r\n').slice(1).map((l) => l.split(',')[0]);
check('=1+1 defused', firstCells.includes("'=1+1"), csv);
check('@SUM(A1) defused', firstCells.includes("'@SUM(A1)"));
check('+cmd defused', firstCells.includes("'+cmd"));
check('-2 defused', firstCells.includes("'-2"));
check('formula with comma is defused AND quoted', csv.includes(`"'=SUM(A1,A2)"`));
check('plain value untouched', firstCells.includes('normal'));

// ── 3/minor. fromSearchParams validates against allowed sets ────────────
const bad = fromSearchParams(
  new URLSearchParams(
    'sort=drop&dir=sideways&status=deleted&outcome=maybe&owner=notauuid&from=nope&page=-5',
  ),
);
check('bad sort → default', bad.sort === DEFAULT_QUERY.sort, bad.sort);
check('bad dir → default', bad.dir === DEFAULT_QUERY.dir, bad.dir);
check('bad status → empty', bad.status === '', bad.status);
check('bad outcome → empty', bad.outcome === '', bad.outcome);
check('non-uuid owner → empty', bad.owner === '', bad.owner);
check('bad date → empty', bad.foundFrom === '', bad.foundFrom);
check('negative page → 1', bad.page === 1, String(bad.page));

const good = fromSearchParams(
  new URLSearchParams('sort=brand_name&dir=asc&status=pending&page=3'),
);
check('valid sort kept', good.sort === 'brand_name');
check('valid dir kept', good.dir === 'asc');
check('valid status kept', good.status === 'pending');
check('valid page kept', good.page === 3);

// ── 4. Lead form: handle normalization + outcome coherence in payload ──
check(
  'handle from full URL → bare lowercase (underscore kept)',
  normalizeHandle('https://www.instagram.com/The_Subh_Journey/?hl=en') === 'the_subh_journey',
  normalizeHandle('https://www.instagram.com/The_Subh_Journey/?hl=en'),
);
check('handle strips @ + lowercases', normalizeHandle('@Nimbus') === 'nimbus');
const pendingPayload = toRpcPayload({ ...emptyLeadForm(), status: 'pending', outcome: 'interested' });
check('pending clears outcome in payload', pendingPayload.outcome === null);
const contactedPayload = toRpcPayload({ ...emptyLeadForm(), status: 'contacted', outcome: 'interested' });
check('contacted keeps outcome', contactedPayload.outcome === 'interested');
check(
  'blank instagram → null in payload',
  toRpcPayload(emptyLeadForm()).instagram_username === null,
);

// ── 5. Dashboard-tile filters round-trip through the URL ────────────────
// A tile links to /crm?followup=1; if the parse drops it, the tile silently
// opens an unfiltered list that disagrees with the number on the tile.
const tile = fromSearchParams(new URLSearchParams('followup=1'));
check('followup=1 parses', tile.followup === true);
check('recent absent → false', tile.recent === false);
check(
  'followup survives a toSearchParams round-trip',
  fromSearchParams(toSearchParams({ ...DEFAULT_QUERY, followup: true })).followup === true,
);
check(
  'recent survives a toSearchParams round-trip',
  fromSearchParams(toSearchParams({ ...DEFAULT_QUERY, recent: true })).recent === true,
);
check(
  'followup=yes (not "1") → false, not truthy-string',
  fromSearchParams(new URLSearchParams('followup=yes')).followup === false,
);
check('followup counts as an active filter', hasActiveFilters(tile));
check('DEFAULT_QUERY has no active filters', !hasActiveFilters(DEFAULT_QUERY));

// ── 6. Enquiries list query ─────────────────────────────────────────────
check('default enquiry state is the open queue', DEFAULT_ENQUIRIES_QUERY.state === 'open');
const eBad = enqFromParams(new URLSearchParams('state=deleted&kind=smoke&page=0'));
check('bad enquiry state → default', eBad.state === 'open', eBad.state);
check('bad kind → empty', eBad.kind === '', eBad.kind);
check('page 0 → 1', eBad.page === 1, String(eBad.page));
const eGood = enqFromParams(new URLSearchParams('state=converted&kind=callback&page=2'));
check('valid enquiry state kept', eGood.state === 'converted');
check('valid kind kept', eGood.kind === 'callback');
check(
  'default state omitted from the URL',
  !enqToParams(DEFAULT_ENQUIRIES_QUERY).has('state'),
);
check('default enquiry query is unfiltered', !enqHasFilters(DEFAULT_ENQUIRIES_QUERY));
check('converted state counts as a filter', enqHasFilters(eGood));

// ── 7. Enquiry → lead prefill ───────────────────────────────────────────
check('phone separators stripped', cleanPhone(' +91 98765-43210 ') === '+919876543210');
check('parens and dots stripped', cleanPhone('(98765).43210') === '9876543210');
check(
  'no country code is invented for a bare 10-digit number',
  cleanPhone('9876543210') === '9876543210',
);

function mkEnquiry(over: Partial<EnquiryRow> = {}): EnquiryRow {
  return {
    id: 'e1',
    kind: 'callback',
    name: 'Ananya Rao',
    phone: '+91 98765 43210',
    email: null,
    best_time: 'Tomorrow afternoon',
    message: 'Need help with Reels.',
    converted_lead_id: null,
    created_at: '2026-08-01T09:30:00Z',
    converted_lead: null,
    ...over,
  };
}

const prefill = enquiryToLeadForm(mkEnquiry());
check('brand_name is left blank for a human to fill', prefill.brand_name === '');
check('callback → website_callback source', prefill.source === 'website_callback');
check(
  'query → website_query source',
  enquiryToLeadForm(mkEnquiry({ kind: 'query' })).source === 'website_query',
);
check(
  'found-on is when the enquiry arrived',
  prefill.lead_found_on === '2026-08-01',
  prefill.lead_found_on,
);
check('enquirer becomes the primary contact', prefill.contacts[0]?.name === 'Ananya Rao');
check('contact is flagged primary', prefill.contacts[0]?.is_primary === true);
check(
  'phone is carried over, normalised',
  prefill.contacts[0]?.phones[0]?.phone_e164 === '+919876543210',
);
check('message lands in notes', prefill.notes?.includes('Need help with Reels.') === true);
check('best_time lands in notes', prefill.notes?.includes('Preferred time: Tomorrow afternoon') === true);
const noPhone = enquiryToLeadForm(mkEnquiry({ phone: null, message: null, best_time: null }));
check('no phone → no empty phone row', noPhone.contacts[0]?.phones.length === 0);
check('no message/best_time → empty notes, not "undefined"', noPhone.notes === '');

// ── 8. enquiry_id rides in the RPC payload only when converting ─────────
check(
  'enquiry_id omitted entirely when not converting',
  !('enquiry_id' in toRpcPayload(emptyLeadForm())),
);
check(
  'enquiry_id included when converting',
  toRpcPayload(emptyLeadForm(), 'e-123').enquiry_id === 'e-123',
);

console.log(failures === 0 ? '\nALL PASS' : `\n${failures} FAILED`);
process.exit(failures === 0 ? 0 : 1);
