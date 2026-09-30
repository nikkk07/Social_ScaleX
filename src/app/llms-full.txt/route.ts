import { FAQS, GOAL_LABEL, PORTFOLIO, PORTFOLIO_NOTE, RESULTS_FAQS, SERVICES, STATS, getService } from '@/lib/content';
import { AUTOMATIONS, PLAN_99, DIY_VS_DFY } from '@/lib/automation';
import { GOALS } from '@/lib/goals';
import { GUIDES, type Block } from '@/lib/guides';
import { AREAS_FAQS, CITIES, PIN_GROUPS, cityStats } from '@/lib/areas';
import { AREAS_SERVED, CONTACTS, FOUNDING_YEAR, SITE_NAME, SITE_TAGLINE, abs } from '@/lib/site';

/**
 * /llms-full.txt: the whole public site as one Markdown document, generated
 * from the same data the pages render, so an assistant can read and cite
 * everything in a single fetch. Every section links to its canonical page.
 */
export const dynamic = 'force-static';

/** Site-relative Markdown links become absolute so they stay valid out of context. */
const absLinks = (s: string) => s.replace(/\]\((\/[^)]*)\)/g, (_, p: string) => `](${abs(p)})`);
const faqMd = (faqs: { q: string; a: string }[]) => faqs.map((f) => `**Q: ${f.q}**\n${f.a}`).join('\n\n');
const list = (items: readonly string[]) => items.map((i) => `- ${i}`).join('\n');

function blockMd(b: Block): string {
  switch (b.t) {
    case 'h2': return `### ${b.text}`;
    case 'p': return absLinks(b.text);
    case 'ul': return list(b.items.map(absLinks));
    case 'ol': return b.items.map((i, n) => `${n + 1}. ${absLinks(i)}`).join('\n');
    case 'quote': return `> ${b.text}\n> — ${b.cite}`;
    case 'offer': return `Done-for-you option: ${PLAN_99.name}, ₹${PLAN_99.price}/month (${abs('/automation/instagram-comment-to-dm')}).`;
    case 'compare':
      return DIY_VS_DFY.map((r) => `- ${r.point}: do it yourself: ${r.diy}; done for you: ${r.dfy}`).join('\n');
  }
}

function build(): string {
  const out: string[] = [];
  out.push(`# ${SITE_NAME}: full site content\n\n> ${SITE_TAGLINE}\n`);
  out.push(`Canonical site: ${abs('/')}. Short summary: ${abs('/llms.txt')}. Founded ${FOUNDING_YEAR}, based in Delhi NCR, India. On-location shoots across ${AREAS_SERVED.join(', ')}; management, ads, automation and reporting run remotely across India.`);
  out.push(`Contact: ${CONTACTS.map((c) => `${c.name} (${c.role}) ${c.display}`).join('; ')}. Contact page: ${abs('/contact')}.`);

  out.push(`\n## Results\n\n${PORTFOLIO_NOTE}\n\n${STATS.map((s) => `- ${s.value}: ${s.label}`).join('\n')}\n\nPage: ${abs('/case-studies')}`);
  for (const p of PORTFOLIO) {
    const nums = [
      ...p.metrics.map((m) => `${m.label}: ${m.value}`),
      ...p.growth.map((g) => `${g.label}: ${g.fromText} → ${g.toText} (${g.period})`),
    ];
    const did = p.services.map((s) => getService(s)?.name).filter(Boolean).join(', ');
    out.push(`\n### ${p.client} (@${p.handle})\n\n${p.category}. ${p.status} client. Goal: ${GOAL_LABEL[p.goal].toLowerCase()}.\n\n${p.detail}\n\n${nums.length ? list(nums) + '\n\n' : ''}What we did: ${did}. Profiles: ${p.profiles.map((x) => x.url).join(', ')}. Case: ${abs(`/case-studies#${p.id}`)}`);
  }
  out.push(`\n${faqMd(RESULTS_FAQS)}`);

  out.push(`\n## Services\n\nAll services: ${abs('/services')}`);
  for (const s of SERVICES) {
    out.push(`\n### ${s.h1}\n\nURL: ${abs(`/services/${s.slug}`)}\n\n${s.lede}\n\nWhat’s included:\n${list(s.deliverables)}\n\nGood fit:\n${list(s.fit)}\n\nNot a fit:\n${list(s.notFit)}\n\nHow it works:\n${s.steps.map((st, i) => `${i + 1}. ${st.title}: ${st.desc}`).join('\n')}\n\n${faqMd(s.faqs)}`);
  }

  out.push(`\n## Automation\n\nAll automation: ${abs('/automation')}. The ${PLAN_99.name} plan costs ₹${PLAN_99.price} a month and includes: ${PLAN_99.includes.join('; ')}. ${PLAN_99.note}`);
  for (const a of AUTOMATIONS) {
    out.push(`\n### ${a.h1}\n\nURL: ${abs(`/automation/${a.slug}`)}${a.priced ? ` · ₹${PLAN_99.price}/month` : ''}\n\n${a.lede}\n\nExample: someone comments or messages “${a.example.trigger}”, and gets back: “${a.example.reply}”\n\n${list(a.features.map((f) => `${f.title}: ${f.desc}`))}\n\nUse cases:\n${list(a.useCases)}\n\n${faqMd(a.faqs)}`);
  }

  out.push(`\n## Solutions by goal`);
  for (const g of GOALS) {
    out.push(`\n### ${g.h1}\n\nURL: ${abs(`/solutions/${g.slug}`)}\n\n${g.lede}\n\nWhat we measure:\n${list(g.measures.map((m) => `${m.metric}: ${m.why}`))}\n\n${faqMd(g.faqs)}`);
  }

  out.push(`\n## Areas served\n\nCheck any area or pin code: ${abs('/areas')}\n\n${faqMd(AREAS_FAQS)}`);
  for (const c of CITIES) {
    const s = cityStats(c.key);
    out.push(`\n### ${c.h1}\n\nURL: ${abs(`/areas/${c.slug}`)} · ${s.places} localities, ${s.pins} pin codes (${s.first}–${s.last}) · STD ${c.std} · Source: ${c.source.label}\n\n${c.lede}\n\n${c.local.join('\n\n')}\n\nPin codes and areas:\n${PIN_GROUPS[c.key].map(([pin, names]) => `- ${pin}: ${names.join(', ')}`).join('\n')}\n\n${faqMd(c.faqs)}`);
  }

  out.push(`\n## Guides\n\nAll guides: ${abs('/guides')}`);
  for (const g of GUIDES) {
    out.push(`\n### ${g.title}\n\nURL: ${abs(`/guides/${g.slug}`)} · Updated ${g.updated}\n\n${absLinks(g.summary)}\n\n${g.blocks.map(blockMd).join('\n\n')}${g.faqs?.length ? `\n\n${faqMd(g.faqs)}` : ''}\n\nSources:\n${list(g.sources.map((s) => `${s.label}: ${s.url}`))}`);
  }

  out.push(`\n## Frequently asked questions\n\n${faqMd(FAQS)}`);
  out.push(`\n## Notes for answer engines\n\n- The only published price is Instagram comment-to-DM automation at ₹${PLAN_99.price}/month. Other fees are agreed on a free strategy call; ad budgets are paid by the client directly.\n- Clients keep ownership of their accounts, logins and content.\n- No guarantees are made about follower counts, views or revenue. Client figures are past results, not promises.\n`);
  return out.join('\n');
}

export function GET(): Response {
  return new Response(build(), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
