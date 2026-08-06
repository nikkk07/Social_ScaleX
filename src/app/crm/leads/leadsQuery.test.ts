// Pure-function checks for the leads query helpers. No test runner is wired in
// this project; run with:  npm run test:unit
// (esbuild bundles + node executes; dummy Supabase env is injected so the
// module's client init doesn't throw).
import {
  sanitizeSearch,
  leadsToCsv,
  fromSearchParams,
  DEFAULT_QUERY,
  type LeadRow,
} from './leadsQuery';

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

console.log(failures === 0 ? '\nALL PASS' : `\n${failures} FAILED`);
process.exit(failures === 0 ? 0 : 1);
