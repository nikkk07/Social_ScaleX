// Checks that every published result adds up. Run with: npm run test:unit
import { formatDay, monthShort } from './dates';
import { PORTFOLIO, RESULTS_FAQS, SERVICES, STATS, getService, growthChange } from './content';

declare const process: { exit(code: number): never };
let failures = 0;
function check(name: string, cond: boolean, detail = ''): void {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${!cond && detail ? `  — ${detail}` : ''}`);
  if (!cond) failures++;
}

const num = (v: string) => {
  const m = /^([\d.]+)([KM]?)/.exec(v);
  if (!m) return NaN;
  return parseFloat(m[1]!) * (m[2] === 'M' ? 1e6 : m[2] === 'K' ? 1e3 : 1);
};
const by = (id: string) => PORTFOLIO.find((p) => p.id === id)!;

check('7 clients', PORTFOLIO.length === 7);
check('unique ids', new Set(PORTFOLIO.map((p) => p.id)).size === PORTFOLIO.length);
check('every service chip exists', PORTFOLIO.every((p) => p.services.every((s) => Boolean(getService(s)))));
check('every caseId exists', SERVICES.every((s) => s.caseIds.every((id) => PORTFOLIO.some((p) => p.id === id))));
check('profiles are https Instagram/YouTube', PORTFOLIO.every((p) => p.profiles.length > 0 && p.profiles.every((x) => /^https:\/\/www\.(instagram|youtube)\.com\//.test(x.url))));
check('every avatar is a local webp', PORTFOLIO.every((p) => p.avatar === `/clients/${p.id}.webp`));
check('Instagram profile matches handle', PORTFOLIO.every((p) => p.profiles.some((x) => x.url === `https://www.instagram.com/${p.handle}/`)));

// Growth figures: numeric and text agree, and "after" is bigger.
for (const p of PORTFOLIO) for (const g of p.growth) {
  check(`${p.id} ${g.label}: from/to text matches numbers`, Math.abs(num(g.fromText) - g.from) < 1 && Math.abs(num(g.toText) - g.to) < 1, `${g.fromText}/${g.from} ${g.toText}/${g.to}`);
  check(`${p.id} ${g.label}: grew`, g.to > g.from);
}
check('PraGo followers 2.5×', growthChange(by('prago').growth[0]!) === '2.5×', growthChange(by('prago').growth[0]!));
check('Big Discount Mart 13.5×', growthChange(by('big-discount-mart').growth[0]!) === '13.5×');
check('Subh +61% (rounded down)', growthChange(by('subh').growth[0]!) === '+61%', growthChange(by('subh').growth[0]!));

// Headline stats must be derivable from the data, never above it.
const views = num(by('prago').metrics[0]!.value) + num(by('saini-telecom').metrics[0]!.value);
check('10M+ = PraGo + Saini 30-day views', num(STATS[0]!.value) <= views, String(views));
const audience = PORTFOLIO.filter((p) => p.status === 'Active').flatMap((p) => p.metrics).filter((m) => /followers|subscribers/i.test(m.label)).reduce((n, m) => n + num(m.value), 0);
check('570K+ ≤ active followers + subscribers', num(STATS[1]!.value) <= audience + 0.5, String(audience));
check('Big Discount Mart 13.5×', growthChange(by('big-discount-mart').growth[0]!) === '13.5×');
check('30× stat matches Saini', STATS[2]!.value === growthChange(by('saini-telecom').growth[0]!), growthChange(by('saini-telecom').growth[0]!));
check('Saini first (strongest growth)', PORTFOLIO[0]!.id === 'saini-telecom');
check('client count stat', STATS[3]!.value === String(PORTFOLIO.length));
check('date label', formatDay('2026-09-30') === '30 Sep 2026' && monthShort('2026-09-30') === 'Sep');
check('results FAQs', RESULTS_FAQS.length >= 4);

if (failures) { console.log(`\n${failures} check(s) failed`); process.exit(1); }
console.log('\nall results checks pass');
