// Pure-function checks for the Creator Hub: Google job markup only while a brief is open, the right location
// fields for remote and on-site briefs, and pay text. Run with: npm run test:unit
import { isOpen, jobPostingNode, payText, type Brief } from './creators';

declare const process: { exit(code: number): never };

let failures = 0;
function check(name: string, cond: boolean): void {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}`);
  if (!cond) failures++;
}

const base: Brief = {
  slug: 'ugc-face-wash', title: 'UGC video for a Delhi skincare brand', brand_label: 'a Delhi skincare brand', content_type: 'ugc_video',
  platforms: ['instagram'], niche: 'Beauty', summary: 'Two short UGC videos of a face wash.', description: 'Film two videos at home.',
  deliverables: ['2 videos, 30 s, 9:16'], requirements: [], pay_type: 'fixed', pay_min: 4000, pay_max: null, product_value: null, pay_note: null,
  usage_rights: 'Organic and paid ads for 3 months', location_type: 'remote', city: null, state: null, languages: ['Hindi'],
  face_on_camera: true, min_followers: null, slots: 2, apply_by: '2099-12-31', deliver_by: null, disclosure_label: 'Paid partnership',
  status: 'open', published_at: '2026-11-17T10:00:00Z', updated_at: '2026-11-17T10:00:00Z', closed_at: null,
};

const job = jobPostingNode(base) as Record<string, unknown> | null;
check('open brief → JobPosting', job?.['@type'] === 'JobPosting');
check('remote → TELECOMMUTE + India', job?.jobLocationType === 'TELECOMMUTE' && (job?.applicantLocationRequirements as { name: string }).name === 'India');
check('remote → no jobLocation', job !== null && !('jobLocation' in job));
check('validThrough = end of apply-by day IST', job?.validThrough === '2099-12-31T23:59:59+05:30');
check('contractor, direct apply', job?.employmentType === 'CONTRACTOR' && job?.directApply === true);
check('no baseSalary for a per-video fee', job !== null && !('baseSalary' in job));
check('description says 100% remote and no fees', String(job?.description).includes('100% remote') && String(job?.description).includes('never charges'));
const onsite = jobPostingNode({ ...base, location_type: 'onsite', city: 'New Delhi', state: 'Delhi' }) as Record<string, unknown>;
check('on-site → jobLocation with IN', (onsite.jobLocation as { address: { addressCountry: string; addressLocality: string } }).address.addressCountry === 'IN');
check('expired → no markup', jobPostingNode({ ...base, apply_by: '2020-01-01' }) === null);
check('closed → no markup', jobPostingNode({ ...base, status: 'closed' }) === null);
check('shortlisting still open', isOpen({ ...base, status: 'shortlisting' }));
check('fixed pay text', payText(base) === '₹4,000');
check('range pay text', payText({ ...base, pay_type: 'range', pay_min: 3000, pay_max: 6000 }) === '₹3,000–₹6,000');
check('product pay text', payText({ ...base, pay_type: 'product', pay_min: null, product_value: 2500 }) === 'Product worth ₹2,500, no fee');

if (failures) {
  console.log(`\n${failures} creators check(s) failed`);
  process.exit(1);
}
console.log('\nall creators checks pass');
