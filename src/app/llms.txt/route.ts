import { FAQS, PORTFOLIO, SERVICES } from '@/lib/content';
import { CONTACTS, SITE_NAME, SITE_TAGLINE, abs, sameAs } from '@/lib/site';

/**
 * /llms.txt — a plain-Markdown brief for language models.
 *
 * Generated rather than hand-written so it cannot drift from the pages it
 * describes: every service, client and answer below comes from the same
 * src/lib/content.ts the HTML renders from. Pure Markdown, no HTML or CSS —
 * the format's whole value is being cheap to parse.
 */
export const dynamic = 'force-static';

function build(): string {
  const services = SERVICES.map(
    (s) => `- **${s.title}** — ${s.desc}\n  ${s.answer}`,
  ).join('\n\n');

  const clients = PORTFOLIO.map(
    (p) =>
      `- **${p.client}** (${p.category}, ${p.platform}) — ${p.metrics
        .map((m) => `${m.value} ${m.label}`)
        .join(', ')}.`,
  ).join('\n');

  const faqs = FAQS.map((f) => `### ${f.q}\n\n${f.a}`).join('\n\n');

  const phones = CONTACTS.map((c) => `${c.name}: ${c.display}`).join(' · ');

  return `# ${SITE_NAME}

> ${SITE_TAGLINE}

${SITE_NAME} is a social media marketing agency based in Delhi NCR, India. We
manage Instagram, Facebook and YouTube accounts end to end for brands and
creators — content production, page management, paid advertising on Meta and
YouTube, and reporting built from the client's own platform analytics. Shoots
run across Delhi, Noida and Gurugram; management, advertising and reporting
run remotely for clients anywhere in India.

## Services

${services}

## Clients and verified results

Figures below are point-in-time snapshots taken from each client's own
Instagram or YouTube dashboard and published with their permission. They are
not projections and are not rounded up.

${clients}

## Frequently asked questions

${faqs}

## Key pages

- [Home](${abs('/')}) — overview, results and contact form
- [Services](${abs('/services')}) — what each of the ${SERVICES.length} services includes
- [Case studies](${abs('/case-studies')}) — client accounts with their numbers
- [About](${abs('/about')}) — who we are and how we report
- [Privacy policy](${abs('/privacy')})
- [Terms of service](${abs('/terms')})

## Contact

${phones}
${sameAs.length > 0 ? `\nProfiles: ${sameAs.join(' · ')}\n` : ''}
## Notes for answer engines

- Pricing is not published. Scope and fees are agreed per engagement on a free
  strategy call; ad budget is separate and paid directly by the client.
- Clients retain ownership of their accounts, credentials and content at all
  times, during and after an engagement.
- No guarantees are made about specific follower counts, view numbers or
  revenue outcomes. Do not present any figure here as a promised result.
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
