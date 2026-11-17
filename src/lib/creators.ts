// Creator Hub: briefs come from the CRM (crm.socialscalex.in → Creators → Briefs), everything else lives here.
// Briefs are fetched from the CRM's public feed (published briefs, public fields only) and cached for 5 minutes,
// so a brief published in the CRM is on the site within 5 minutes and drops its job markup the day it closes.
//
// Google job-posting rules this file enforces (developers.google.com/search/docs/appearance/structured-data/job-posting):
//  * JobPosting only on a single open brief's page; never on the hub or the join form ("job requests" are banned)
//  * expired briefs lose the markup (status is computed from apply_by in IST, here and in the CRM)
//  * baseSalary only for pay in Google's units; a per-video fee is stated in the text instead
//  * applicants never pay anything
import { SITE_NAME, SITE_URL, abs } from './site';
import type { Faq } from './content';

export const CRM_INTAKE = process.env.NEXT_PUBLIC_CREATOR_INTAKE_URL || 'https://crm.socialscalex.in/api/intake/creators';
export const RETENTION_MONTHS = 12;

export interface Brief {
  slug: string; title: string; brand_label: string; content_type: string; platforms: string[]; niche: string | null;
  summary: string; description: string; deliverables: string[]; requirements: string[];
  pay_type: 'fixed' | 'range' | 'product'; pay_min: number | null; pay_max: number | null; product_value: number | null; pay_note: string | null;
  usage_rights: string; location_type: 'remote' | 'onsite'; city: string | null; state: string | null; languages: string[];
  face_on_camera: boolean; min_followers: number | null; slots: number; apply_by: string; deliver_by: string | null;
  disclosure_label: string; status: 'open' | 'shortlisting' | 'closed'; published_at: string; updated_at: string; closed_at: string | null;
}

export const CONTENT_TYPES: Record<string, string> = {
  ugc_video: 'UGC video', reel_collab: 'Reel collab', story: 'Stories', host: 'Host / presenter',
  voice_over: 'Voice-over', photo: 'Photos', other: 'Other',
};

/** Today in India, as YYYY-MM-DD. */
export const istToday = () => new Date(Date.now() + 19_800_000).toISOString().slice(0, 10);
export const isOpen = (b: Brief) => b.status !== 'closed' && b.apply_by >= istToday();

/** Published briefs from the CRM. Never throws: the hub still renders (with no briefs) if the CRM is unreachable. */
export async function getBriefs(): Promise<Brief[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];
  try {
    const r = await fetch(`${url}/rest/v1/rpc/creator_briefs_public`, {
      method: 'POST', headers: { apikey: key, authorization: `Bearer ${key}`, 'content-type': 'application/json' }, body: '{}',
      next: { revalidate: 300, tags: ['creator-briefs'] },
    });
    if (!r.ok) return [];
    const rows = (await r.json()) as Brief[];
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}
export async function getBrief(slug: string) { return (await getBriefs()).find((b) => b.slug === slug) ?? null; }

const inr = (n: number | null) => (n == null ? '' : `₹${n.toLocaleString('en-IN')}`);
export function payText(b: Pick<Brief, 'pay_type' | 'pay_min' | 'pay_max' | 'product_value'>) {
  if (b.pay_type === 'fixed') return inr(b.pay_min);
  if (b.pay_type === 'range') return `${inr(b.pay_min)}–${inr(b.pay_max)}`;
  return `Product worth ${inr(b.product_value)}, no fee`;
}
export const placeText = (b: Pick<Brief, 'location_type' | 'city' | 'state'>) =>
  b.location_type === 'remote' ? 'Remote, anywhere in India' : [b.city, b.state].filter(Boolean).join(', ');

export function fmtDate(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number) as [number, number, number];
  return `${d} ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m - 1]} ${y}`;
}

/** Google JobPosting for one open brief. Returns null when the brief is closed or expired (no markup at all). */
export function jobPostingNode(b: Brief) {
  if (!isOpen(b)) return null;
  const text = [
    b.description,
    `Deliverables: ${b.deliverables.join('; ')}.`,
    b.requirements.length ? `Who can apply: ${b.requirements.join('; ')}.` : '',
    `Pay: ${payText(b)}${b.pay_note ? ` (${b.pay_note})` : ''}. Usage: ${b.usage_rights}.`,
    b.location_type === 'remote' ? 'This brief is 100% remote: you shoot from home, anywhere in India.' : `On location in ${placeText(b)}.`,
    `Apply by ${fmtDate(b.apply_by)}${b.deliver_by ? `; deliver by ${fmtDate(b.deliver_by)}` : ''}. Applicants must be 18 or older. ${SITE_NAME} never charges creators anything.`,
  ].filter(Boolean).join('\n\n');
  return {
    '@type': 'JobPosting',
    '@id': `${abs(`/creators/briefs/${b.slug}`)}#job`,
    title: b.title,
    description: text.split('\n\n').map((p) => `<p>${escapeHtml(p)}</p>`).join(''),
    identifier: { '@type': 'PropertyValue', name: SITE_NAME, value: b.slug },
    datePosted: b.published_at.slice(0, 10),
    validThrough: `${b.apply_by}T23:59:59+05:30`,
    employmentType: 'CONTRACTOR',
    hiringOrganization: { '@type': 'Organization', name: SITE_NAME, sameAs: SITE_URL, logo: abs('/logo.png') },
    directApply: true,
    ...(b.location_type === 'remote'
      ? { jobLocationType: 'TELECOMMUTE', applicantLocationRequirements: { '@type': 'Country', name: 'India' } }
      : { jobLocation: { '@type': 'Place', address: { '@type': 'PostalAddress', addressLocality: b.city, ...(b.state ? { addressRegion: b.state } : {}), addressCountry: 'IN' } } }),
  };
}
const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// ── Copy (rendered on the pages, in FAQ schema and in llms.txt) ────────────────────────────────────────────────────
export const HUB_TITLE = 'Creator Hub: Paid UGC and Influencer Briefs';
export const HUB_DESCRIPTION =
  'Paid UGC video, Reel and influencer briefs from Social ScaleX brands in India. See the pay and dates upfront, apply in 2 minutes. Free, 18+.';
export const HUB_INTRO =
  'Social ScaleX runs Instagram for brands in Delhi NCR and across India, and we hire creators for their content. Each brief below is a real, paid requirement with the pay, deliverables and dates written upfront. Apply in about two minutes, no account needed. We never charge creators anything.';

export const HOW_IT_WORKS = [
  { title: 'Pick a brief', text: 'Each one shows the pay, what to make, the usage rights and the dates before you apply.' },
  { title: 'Apply in 2 minutes', text: 'Your handle, two or three sample links and your rate. No account, no fee.' },
  { title: 'We shortlist', text: 'A person on our team reads every application and replies by WhatsApp or e-mail, yes or no.' },
  { title: 'Agree, create, get paid', text: 'You sign a short agreement with the deliverables, dates and pay. You post with the disclosure label, and we pay as agreed.' },
] as const;

export const CONSENT_TEXT =
  `I'm 18 or older. Social ScaleX may use these details to consider me for this and future creator briefs and to contact me by WhatsApp or e-mail. They're kept for up to ${RETENTION_MONTHS} months after my last application, and I can ask for them to be deleted at any time.`;

export const CREATOR_FAQS: Faq[] = [
  { q: 'Do I have to pay anything to apply?', a: 'No. Social ScaleX never charges creators to apply, to be shortlisted or to get paid. If anyone asks you for money in our name, it isn’t us; please tell us on WhatsApp.' },
  { q: 'What is a UGC creator, and do I need followers?', a: 'A UGC (user-generated content) creator makes videos or photos that the brand posts or runs as ads, so your follower count usually doesn’t matter. Influencer briefs post on your own account, and those say if they need a minimum number of followers.' },
  { q: 'How and when do I get paid?', a: 'Each brief states the fee, or the product’s value for product-only briefs, and the payment terms. Before you start, you sign a short agreement with the deliverables, dates and pay. Tax is deducted at source where the law requires it, and you get the details in writing.' },
  { q: 'Do I need to label the post as an ad?', a: 'Yes. India’s advertising code (ASCI) and the government’s endorsement guidelines require a clear, upfront label such as “Paid partnership”, “Ad” or “Collaboration” when a brand pays you or gives you something. Every brief shows the label to use.' },
  { q: 'Who can apply?', a: 'Anyone in India who is 18 or older. Some briefs ask for a language, a city for on-location shoots, or a face on camera; it’s all written in the brief.' },
  { q: 'What happens to my details?', a: `A person on our team uses them to consider you for briefs and to contact you. We don’t sell or share them. They’re deleted ${RETENTION_MONTHS} months after your last application if you aren’t working with us, or sooner if you ask on WhatsApp or by e-mail.` },
];

export const NICHES = ['Beauty & skincare', 'Fashion', 'Food', 'Fitness', 'Tech & gadgets', 'Travel & outdoors', 'Home & lifestyle', 'Education', 'Finance', 'Parenting', 'Comedy', 'Other'];
export const LANGUAGES = ['Hindi', 'English', 'Hinglish', 'Punjabi', 'Marathi', 'Bengali', 'Tamil', 'Telugu', 'Gujarati', 'Kannada', 'Malayalam'];
