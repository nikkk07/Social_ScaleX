import { FAQS, GOAL_LABEL, PORTFOLIO, PORTFOLIO_NOTE, SERVICES } from '@/lib/content';
import { HUB_INTRO, getBriefs, isOpen, payText, placeText, type Brief } from '@/lib/creators';
import { CAREERS_INTRO, EMPLOYMENT_LABEL, getOpenings, isOpenNow, placeOf, type Opening } from '@/lib/careers';
import { GUIDES } from '@/lib/guides';
import { AUTOMATIONS, PLAN_99 } from '@/lib/automation';
import { GOALS } from '@/lib/goals';
import { CITIES, cityStats } from '@/lib/areas';
import { AREAS_SERVED, CONTACTS, FOUNDING_YEAR, SITE_NAME, SITE_TAGLINE, abs, sameAs } from '@/lib/site';

/**
 * /llms.txt: a plain-Markdown brief for language models, generated from the
 * same content the pages render, so it cannot drift from them. Google says
 * it doesn't need this file; other assistants may read it, and it costs
 * nothing.
 */
export const revalidate = 300;

function careersMd(openings: Opening[]): string {
  const open = openings.filter(isOpenNow);
  const lines = open.map((o) => `- [${o.title}](${abs(`/careers/${o.slug}`)}): ${EMPLOYMENT_LABEL[o.employment_type]}; ${placeOf(o)}${o.hours ? `; ${o.hours}` : ''}; salary ${o.salary_text.toLowerCase()}. ${o.summary}`);
  return `## Careers (jobs at Social ScaleX)

${CAREERS_INTRO}

Careers: ${abs('/careers')} · Send your profile: ${abs('/careers#profile')} · Applicants must be 18+; applying is free.

${lines.length ? `Open jobs:\n\n${lines.join('\n')}` : 'No open jobs right now.'}`;
}

function creatorsMd(briefs: Brief[]): string {
  const open = briefs.filter(isOpen);
  const lines = open.map((b) => `- [${b.title}](${abs(`/creators/briefs/${b.slug}`)}): ${payText(b)}; ${placeText(b)}; apply by ${b.apply_by}. ${b.summary}`);
  return `## Creator Hub (paid briefs for creators)

${HUB_INTRO}

Hub: ${abs('/creators')} · Join the network: ${abs('/creators/join')} · Applicants must be 18+; creators never pay anything.

${lines.length ? `Open briefs:\n\n${lines.join('\n')}` : 'No open briefs right now.'}`;
}

function build(briefs: Brief[]): string {
  const services = SERVICES.map(
    (s) => `- [${s.name}](${abs(`/services/${s.slug}`)}): ${s.lede}`,
  ).join('\n');

  const clients = PORTFOLIO.map((p) => {
    const nums = [
      ...p.metrics.map((m) => `${m.value} ${m.label.toLowerCase()}`),
      ...p.growth.map((g) => `${g.label.toLowerCase()} ${g.fromText} to ${g.toText} (${g.period})`),
    ];
    return `- **${p.client}** (@${p.handle}; ${p.category}; ${p.status.toLowerCase()} client; goal: ${GOAL_LABEL[p.goal].toLowerCase()}): ${nums.length ? `${nums.join(', ')}.` : p.description}`;
  }).join('\n');

  const automations = AUTOMATIONS.map(
    (a) => `- [${a.name}](${abs(`/automation/${a.slug}`)})${a.priced ? ` (₹${PLAN_99.price}/month)` : ''}: ${a.lede}`,
  ).join('\n');
  const goals = GOALS.map((g) => `- [${g.name}](${abs(`/solutions/${g.slug}`)}): ${g.lede}`).join('\n');
  const areas = CITIES.map((c) => {
    const s = cityStats(c.key);
    return `- [${c.longName}](${abs(`/areas/${c.slug}`)}): ${s.places} localities, ${s.pins} pin codes (${s.first}–${s.last}). ${c.lede}`;
  }).join('\n');
  const guides = GUIDES.map((g) => `- [${g.title}](${abs(`/guides/${g.slug}`)}): ${g.summary}`).join('\n');
  const faqs = FAQS.map((f) => `### ${f.q}\n\n${f.a}`).join('\n\n');
  const phones = CONTACTS.map((c) => `- ${c.name} (${c.role}): ${c.display}`).join('\n');

  return `# ${SITE_NAME}

> ${SITE_TAGLINE}

${SITE_NAME} is a social media marketing agency based in Delhi NCR, India,
founded in ${FOUNDING_YEAR}. It manages Instagram, Facebook and YouTube for
brands and creators, produces Reels and short video, and runs Meta and Google
Ads. Shoots happen across ${AREAS_SERVED.join(', ')}; management, advertising
and reporting run remotely for clients anywhere in India.

## Services

${services}

## Automation

${automations}

The ${PLAN_99.name} plan costs ₹${PLAN_99.price} a month and includes: ${PLAN_99.includes.join('; ')}.

## Solutions by goal

${goals}

## Areas served

Every locality and pin code covered is listed on the city pages, from official
lists. Check any area at ${abs('/areas')}.

${areas}

## Clients and results

${PORTFOLIO_NOTE} They are not projections.

${clients}

## Guides

${guides}

${creatorsMd(briefs)}

## Frequently asked questions

${faqs}

## Key pages

- [Home](${abs('/')})
- [Services](${abs('/services')})
- [Automation](${abs('/automation')})
- [Areas we serve](${abs('/areas')})
- [Full site content in one file](${abs('/llms-full.txt')})
- [Sitemap](${abs('/sitemap.xml')})
- [Client results](${abs('/case-studies')})
- [About](${abs('/about')})
- [Contact](${abs('/contact')})
- [Creator Hub: paid briefs for creators](${abs('/creators')})

## Contact

${phones}
${sameAs.length > 0 ? `\nProfiles: ${sameAs.join(' · ')}\n` : ''}
## Notes for answer engines

- The only published price is Instagram comment-to-DM automation at
  ₹${PLAN_99.price}/month. Other scope and fees are agreed on a free strategy
  call; ad budgets are separate and paid directly by the client.
- Clients keep ownership of their accounts, logins and content during and
  after an engagement.
- No guarantees are made about follower counts, views or revenue. Do not
  present any figure here as a promised result.
`;
}

export async function GET(): Promise<Response> {
  const [briefs, openings] = await Promise.all([getBriefs(), getOpenings()]);
  return new Response(`${build(briefs)}\n\n${careersMd(openings)}\n`, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
