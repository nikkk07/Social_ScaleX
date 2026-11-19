// Careers: job openings come from the CRM (crm.socialscalex.in → Applications → Job openings); copy lives here.
// Openings are fetched from the CRM's public feed (published openings, public fields only) and cached for 5 minutes.
//
// Google job-posting rules this file enforces (developers.google.com/search/docs/appearance/structured-data/job-posting):
//  * JobPosting only on one open opening's own page; never on /careers or the open-profile form ("resume collection")
//  * a location is required: an office or hybrid job without a city gets no markup (the page still shows)
//  * expired or closed openings lose the markup; baseSalary only when the CRM has real monthly numbers
//  * jobs we recruit for on behalf of a client name that client, or "confidential" when the client stays anonymous
//    (Google's rule for anonymous hiring through an agency); our own jobs name Social ScaleX
//  * applicants never pay anything
import { SITE_NAME, SITE_URL, abs } from './site';
import type { Faq } from './content';

export const CAREERS_INTAKE = process.env.NEXT_PUBLIC_CAREERS_INTAKE_URL || 'https://crm.socialscalex.in/api/intake/careers';
export const CV_MAX_MB = 4;

export interface Opening {
  slug: string; title: string; department: string | null; employment_type: 'full_time' | 'part_time' | 'internship' | 'contract';
  work_mode: 'onsite' | 'remote' | 'hybrid'; street_address: string | null; locality: string | null; city: string | null; state: string | null;
  postal_code: string | null; summary: string; description: string; responsibilities: string[]; requirements: string[]; hours: string | null;
  salary_text: string; salary_min: number | null; salary_max: number | null; age_min: number | null; age_max: number | null; positions: number;
  apply_by: string | null; published_at: string; updated_at: string; closed_at: string | null; status: 'open' | 'closed';
  /** Recruiting for a client. `employer` is what may be shown: the client's name when `employer_named`, else a description. */
  for_client?: boolean; employer?: string; employer_named?: boolean;
}

export const EMPLOYMENT_LABEL: Record<Opening['employment_type'], string> = { full_time: 'Full-time', part_time: 'Part-time', internship: 'Internship', contract: 'Contract' };
const GOOGLE_TYPE: Record<Opening['employment_type'], string> = { full_time: 'FULL_TIME', part_time: 'PART_TIME', internship: 'INTERN', contract: 'CONTRACTOR' };

const istToday = () => new Date(Date.now() + 19_800_000).toISOString().slice(0, 10);
export const isOpenNow = (o: Opening) => o.status === 'open' && (!o.apply_by || o.apply_by >= istToday());
export const placeOf = (o: Pick<Opening, 'work_mode' | 'locality' | 'city' | 'state'>) =>
  o.work_mode === 'remote' ? 'Remote, anywhere in India' : [o.locality, o.city].filter(Boolean).join(', ') || 'Delhi NCR';
export const ageText = (o: Pick<Opening, 'age_min' | 'age_max'>) =>
  o.age_min && o.age_max ? `${o.age_min} to ${o.age_max} years` : o.age_max ? `Up to ${o.age_max} years` : o.age_min ? `${o.age_min}+ years` : '18+';

/** Published openings from the CRM. Never throws: the page still renders (with none) if the CRM is unreachable. */
export async function getOpenings(): Promise<Opening[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];
  try {
    const r = await fetch(`${url}/rest/v1/rpc/job_openings_public`, {
      method: 'POST', headers: { apikey: key, authorization: `Bearer ${key}`, 'content-type': 'application/json' }, body: '{}',
      next: { revalidate: 300, tags: ['job-openings'] },
    });
    if (!r.ok) return [];
    const rows = (await r.json()) as Opening[];
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}
export async function getOpening(slug: string) { return (await getOpenings()).find((o) => o.slug === slug) ?? null; }

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Google JobPosting for one open opening, or null (closed, expired, or no location for an office job). */
export function openingJobNode(o: Opening) {
  if (!isOpenNow(o)) return null;
  if (o.work_mode !== 'remote' && !o.city) return null;
  const paras = [
    o.description,
    o.responsibilities.length ? `What you’ll do: ${o.responsibilities.join('; ')}.` : '',
    o.requirements.length ? `Who can apply: ${o.requirements.join('; ')}.` : '',
    o.hours ? `Hours: ${o.hours}.` : '',
    o.for_client ? `${SITE_NAME} is recruiting for this job on behalf of ${o.employer_named ? o.employer : 'a client'}.` : '',
    `Salary: ${o.salary_text}. ${SITE_NAME} never charges anything for a job.`,
  ].filter(Boolean);
  const salary = o.salary_min ? {
    baseSalary: { '@type': 'MonetaryAmount', currency: 'INR', value: { '@type': 'QuantitativeValue', unitText: 'MONTH', ...(o.salary_max ? { minValue: o.salary_min, maxValue: o.salary_max } : { value: o.salary_min }) } },
  } : {};
  const address = { '@type': 'PostalAddress', ...(o.street_address ? { streetAddress: o.street_address } : {}), addressLocality: o.locality ? `${o.locality}, ${o.city}` : o.city,
    ...(o.state ? { addressRegion: o.state } : {}), ...(o.postal_code ? { postalCode: o.postal_code } : {}), addressCountry: 'IN' };
  return {
    '@type': 'JobPosting',
    '@id': `${abs(`/careers/${o.slug}`)}#job`,
    title: o.title,
    description: paras.map((p) => `<p>${esc(p)}</p>`).join(''),
    identifier: { '@type': 'PropertyValue', name: SITE_NAME, value: o.slug },
    datePosted: o.published_at.slice(0, 10),
    ...(o.apply_by ? { validThrough: `${o.apply_by}T23:59:59+05:30` } : {}),
    employmentType: GOOGLE_TYPE[o.employment_type],
    hiringOrganization: o.for_client
      ? { '@type': 'Organization', name: o.employer_named && o.employer ? o.employer : 'confidential' }
      : { '@type': 'Organization', name: SITE_NAME, sameAs: SITE_URL, logo: abs('/logo.png') },
    directApply: true,
    ...(o.work_mode === 'remote'
      ? { jobLocationType: 'TELECOMMUTE', applicantLocationRequirements: { '@type': 'Country', name: 'India' } }
      : { jobLocation: { '@type': 'Place', address } }),
    ...salary,
    ...(o.positions > 1 ? { totalJobOpenings: o.positions } : {}),
  };
}

// ── Copy (pages, FAQ schema, llms.txt) ─────────────────────────────────────────────────────────────────────────────
export const CAREERS_TITLE = 'Jobs in Delhi: Careers with Social ScaleX and Our Clients';
export const CAREERS_DESCRIPTION =
  'Jobs in Delhi with Social ScaleX and the businesses we recruit for. See open roles, or send your profile in 2 minutes. Freshers welcome; we never charge a fee.';
export const CAREERS_INTRO =
  'Social ScaleX is a social media marketing agency in Delhi. We hire for our own team and recruit for the businesses we work with. Every open role is listed below with the hours, the place and who can apply. No suitable role yet? Send your profile once and we’ll call you when one fits. Applying is free, and we never ask for money.';

export const CAREER_STEPS = [
  { title: 'Apply in 2 minutes', text: 'Your details, education and a CV (PDF or a link). No account, no fee.' },
  { title: 'We call you', text: 'A person on our team reads every application and replies by phone, WhatsApp or e-mail.' },
  { title: 'Interview', text: 'A short interview with the employer. We confirm the day, time and address on WhatsApp.' },
  { title: 'Offer in writing', text: 'If it’s a fit, you get the offer with the joining date and terms in writing.' },
] as const;

export const CAREERS_CONSENT =
  'I’m 18 or older. Social ScaleX may use these details to consider me for this and future roles, with Social ScaleX or a business it recruits for, share them with the employer for a role I apply to, and contact me by phone, WhatsApp or e-mail. They’re kept for up to 12 months after my last application, and I can ask for them to be deleted at any time.';

export const CAREER_FAQS: Faq[] = [
  { q: 'Do I have to pay anything to apply for a job?', a: 'No. Social ScaleX never charges anything to apply, for an interview, for training or for joining. If anyone asks you for money in our name, it isn’t us; please tell us on WhatsApp.' },
  { q: 'Can freshers apply?', a: 'Yes. Unless a job says it needs experience, freshers are welcome. Choose “Fresher” in the form and tell us what you’re good at.' },
  { q: 'Do I need a CV?', a: `A CV helps but isn’t required. You can upload a PDF (up to ${CV_MAX_MB} MB) or paste a link to it, for example from Google Drive.` },
  { q: 'There’s no job for me right now. Can I still apply?', a: 'Yes. Send your profile with the role you want. We keep it for 12 months and contact you when a matching role opens.' },
  { q: 'Who will I work for?', a: 'Each job says who is hiring. Some roles are with Social ScaleX; others are with businesses we recruit for, and some of those keep their name private until the interview. You never pay anything, to us or to the employer.' },
  { q: 'Where will I work?', a: 'Each job shows the area and city, and whether it’s on site, remote or hybrid. We share the full address when we fix your interview.' },
  { q: 'What happens to my details?', a: 'A person on our team uses them to consider you for roles and to contact you. We don’t sell or share them. They’re deleted 12 months after your last application, or sooner if you ask on WhatsApp or by e-mail.' },
];

export const QUALIFICATIONS: [string, string][] = [['10th', '10th pass'], ['12th', '12th pass'], ['diploma', 'Diploma / ITI'], ['graduate', 'Graduate'], ['postgraduate', 'Post-graduate'], ['below_10th', 'Below 10th'], ['other', 'Other']];
export const EXPERIENCE: [string, string][] = [['fresher', 'Fresher'], ['lt_1', 'Under 1 year'], ['1_3', '1–3 years'], ['3_5', '3–5 years'], ['5_plus', '5+ years']];
export const AVAILABLE: [string, string][] = [['immediately', 'Immediately'], ['15_days', 'Within 15 days'], ['30_days', 'Within 30 days'], ['later', 'Later']];
export const JOB_LANGUAGES = ['Hindi', 'English', 'Punjabi', 'Other'];
