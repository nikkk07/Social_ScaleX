// Pure-function checks for Careers: Google job markup only for an open job with a location, the right fields for
// office and remote jobs, salary only when real numbers exist, and the mobile-number clean-up the forms use.
// Run with: npm run test:unit
import { ageText, isOpenNow, openingJobNode, placeOf, type Opening } from './careers';
import { cleanMobile } from '../components/site/apply/fields';

declare const process: { exit(code: number): never };

let failures = 0;
function check(name: string, cond: boolean): void {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}`);
  if (!cond) failures++;
}

const base: Opening = {
  slug: 'front-desk-receptionist-computer-operator', title: 'Front-Desk Receptionist (Computer Operator)', department: 'Office',
  employment_type: 'full_time', work_mode: 'onsite', street_address: null, locality: 'Shalimar Bagh', city: 'Delhi', state: 'Delhi', postal_code: null,
  summary: 'Welcome guests, handle calls and keep records.', description: 'We are hiring a front-desk receptionist.', responsibilities: ['Answer calls'],
  requirements: ['Age 18 to 30'], hours: '11 am to 7 pm (flexible)', salary_text: 'Not disclosed', salary_min: null, salary_max: null,
  age_min: 18, age_max: 30, positions: 1, apply_by: null, published_at: '2026-11-19T10:00:00Z', updated_at: '2026-11-19T10:00:00Z', closed_at: null, status: 'open',
};

const job = openingJobNode(base) as Record<string, unknown> | null;
const addr = (job?.jobLocation as { address: Record<string, string> } | undefined)?.address;
check('open office job → JobPosting', job?.['@type'] === 'JobPosting');
check('full-time maps to FULL_TIME', job?.employmentType === 'FULL_TIME');
check('address: Shalimar Bagh, Delhi, IN', addr?.addressLocality === 'Shalimar Bagh, Delhi' && addr?.addressRegion === 'Delhi' && addr?.addressCountry === 'IN');
check('no street address invented', addr !== undefined && !('streetAddress' in addr));
check('no apply-by → no validThrough', job !== null && !('validThrough' in job));
check('salary not disclosed → no baseSalary', job !== null && !('baseSalary' in job));
check('description escapes HTML', String((openingJobNode({ ...base, description: 'a <script>x</script> b' }) as Record<string, unknown>).description).includes('&lt;script&gt;'));
const paid = openingJobNode({ ...base, salary_min: 15000, salary_max: 18000 }) as { baseSalary: { currency: string; value: { minValue: number; maxValue: number; unitText: string } } };
check('real salary → monthly INR range', paid.baseSalary.currency === 'INR' && paid.baseSalary.value.minValue === 15000 && paid.baseSalary.value.maxValue === 18000 && paid.baseSalary.value.unitText === 'MONTH');
check('office job without a city → no markup', openingJobNode({ ...base, city: null }) === null);
const remote = openingJobNode({ ...base, work_mode: 'remote', city: null }) as Record<string, unknown>;
check('remote job → TELECOMMUTE + India, no city needed', remote?.jobLocationType === 'TELECOMMUTE' && !('jobLocation' in remote));
check('closed → no markup', openingJobNode({ ...base, status: 'closed' }) === null);
check('apply-by in the past → closed', !isOpenNow({ ...base, apply_by: '2020-01-01' }) && openingJobNode({ ...base, apply_by: '2020-01-01' }) === null);
check('apply-by in the future → validThrough end of day IST', (openingJobNode({ ...base, apply_by: '2099-12-31' }) as Record<string, unknown>).validThrough === '2099-12-31T23:59:59+05:30');
check('internship → INTERN', (openingJobNode({ ...base, employment_type: 'internship' }) as Record<string, unknown>).employmentType === 'INTERN');
check('place text', placeOf(base) === 'Shalimar Bagh, Delhi' && placeOf({ ...base, work_mode: 'remote' }) === 'Remote, anywhere in India');
check('age text', ageText(base) === '18 to 30 years' && ageText({ age_min: null, age_max: null }) === '18+');

for (const [input, want] of [['+91 98765-43210', '9876543210'], ['09876543210', '9876543210'], ['919876543210', '9876543210'], ['98765432101234', '9876543210'], ['abc98', '98'], ['', '']] as const) {
  check(`cleanMobile(${JSON.stringify(input)}) → ${want}`, cleanMobile(input) === want);
}

const client = openingJobNode({ ...base, for_client: true, employer: 'A retail store in Shalimar Bagh, Delhi', employer_named: false }) as { hiringOrganization: { name: string }; description: string };
check('confidential client → hiringOrganization "confidential"', client.hiringOrganization.name === 'confidential');
check('confidential client name never in markup', !JSON.stringify(client).includes('PraGo') && client.description.includes('on behalf of a client'));
const named = openingJobNode({ ...base, for_client: true, employer: 'Saini Telecom', employer_named: true }) as { hiringOrganization: { name: string } };
check('named client → its name', named.hiringOrganization.name === 'Saini Telecom');
check('own job → Social ScaleX', (job?.hiringOrganization as { name: string }).name === 'Social ScaleX');

if (failures) { console.log(`\n${failures} check(s) failed`); process.exit(1); }
