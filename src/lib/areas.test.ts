// Data checks for the areas pages. Run with: npm run test:unit
import { AREAS_FAQS, CITIES, PIN_GROUPS, allEntries, cityStats } from './areas';
import { getService } from './content';
import { getAutomation } from './automation';

declare const process: { exit(code: number): never };

let failures = 0;
function check(name: string, cond: boolean, detail = ''): void {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${!cond && detail ? `  — ${detail}` : ''}`);
  if (!cond) failures++;
}

// Delhi is the District Magistrate's list as published: 410 rows, 77 pin codes.
const delhi = cityStats('delhi');
check('Delhi keeps all 410 official rows', delhi.places === 410, String(delhi.places));
check('Delhi has 77 pin codes 110001–110096', delhi.pins === 77 && delhi.first === '110001' && delhi.last === '110096', JSON.stringify(delhi));
check('Kamla Nagar is 110007', PIN_GROUPS.delhi.some(([p, n]) => p === '110007' && n.includes('Kamla Nagar')));

// Pin codes stay inside each city's range and never repeat.
const PREFIX: Record<string, RegExp> = { delhi: /^110/, noida: /^20(13|1008|3)/, gurugram: /^122/, ghaziabad: /^201[0-2]/, faridabad: /^121/ };
for (const c of CITIES) {
  const pins = PIN_GROUPS[c.key].map(([p]) => p);
  check(`${c.slug}: pins are 6 digits and sorted`, pins.every((p) => /^\d{6}$/.test(p)) && pins.join() === [...pins].sort().join());
  check(`${c.slug}: no duplicate pin groups`, new Set(pins).size === pins.length);
  check(`${c.slug}: pins match the city`, pins.every((p) => PREFIX[c.key]!.test(p)), pins.filter((p) => !PREFIX[c.key]!.test(p)).join());
  check(`${c.slug}: no empty names`, PIN_GROUPS[c.key].every(([, n]) => n.length > 0 && n.every((x) => x.trim() === x && x.length > 0)));
  // Every hub must be a real entry at the pin we print beside it.
  for (const h of c.hubs) {
    check(`${c.slug}: hub "${h.name}" is listed under ${h.pin}`, PIN_GROUPS[c.key].some(([p, n]) => p === h.pin && n.includes(h.name)));
  }
  for (const p of c.picks) {
    check(`${c.slug}: pick ${p.slug} exists`, Boolean(p.kind === 'service' ? getService(p.slug) : getAutomation(p.slug)));
  }
  check(`${c.slug}: meta title ≤ 44 chars (fits with brand suffix)`, c.metaTitle.length <= 44, `${c.metaTitle.length}`);
  check(`${c.slug}: meta description 120–160 chars`, c.metaDescription.length >= 120 && c.metaDescription.length <= 160, `${c.metaDescription.length}`);
  check(`${c.slug}: has its own FAQs`, c.faqs.length >= 2);
}

// Nuh and Palwal pin codes, filed by India Post under Gurgaon and Faridabad, are left out.
const excluded = ['122104', '122105', '122107', '122108', '122508', '121102', '121103', '121105', '121106', '121107'];
check('Nuh and Palwal pins excluded', excluded.every((x) => !CITIES.some((c) => PIN_GROUPS[c.key].some(([p]) => p === x))));

// City pages must not be near-duplicates: local notes and FAQs are unique text.
const texts = CITIES.flatMap((c) => [...c.local, ...c.faqs.map((f) => f.a), c.lede]);
check('local copy is unique per city', new Set(texts).size === texts.length);
const titles = CITIES.map((c) => c.metaTitle);
check('unique meta titles', new Set(titles).size === titles.length);

const all = allEntries();
check('checker gets every listed place', all.length === CITIES.reduce((n, c) => n + cityStats(c.key).places, 0), String(all.length));
check('hub FAQs present', AREAS_FAQS.length >= 3);

if (failures) {
  console.log(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log('\nall area checks pass');
