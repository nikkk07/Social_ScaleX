import { FAQS, PORTFOLIO, PORTFOLIO_NOTE, SERVICES } from '@/lib/content';
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
export const dynamic = 'force-static';

function build(): string {
  const services = SERVICES.map(
    (s) => `- [${s.name}](${abs(`/services/${s.slug}`)}): ${s.lede}`,
  ).join('\n');

  const clients = PORTFOLIO.map(
    (p) => `- **${p.client}** (${p.category}, ${p.platform}): ${p.metrics.map((m) => `${m.value} ${m.label.toLowerCase()}`).join(', ')}.`,
  ).join('\n');

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

## Frequently asked questions

${faqs}

## Key pages

- [Home](${abs('/')})
- [Services](${abs('/services')})
- [Automation](${abs('/automation')})
- [Areas we serve](${abs('/areas')})
- [Client results](${abs('/case-studies')})
- [About](${abs('/about')})
- [Contact](${abs('/contact')})

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

export function GET(): Response {
  return new Response(build(), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
