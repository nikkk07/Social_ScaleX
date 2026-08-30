// ─────────────────────────────────────────────────────────────────────
// JSON-LD builders.
//
// Two rules hold this file together:
//  1. Every node is built from src/lib/content.ts, so structured data can
//     never drift from the text a reader actually sees on the page.
//  2. The organisation and website are declared once, at stable @ids, and
//     every other node REFERENCES those ids rather than restating them.
//     Restating produces one entity per page instead of one entity.
// ─────────────────────────────────────────────────────────────────────
import {
  CONTACTS,
  ORG_ID,
  SITE_NAME,
  SITE_TAGLINE,
  SITE_URL,
  WEBSITE_ID,
  abs,
  sameAs,
} from './site';
import type { Faq, PortfolioItem, Service } from './content';

/** Loose JSON-LD node type — schema.org shapes are open-ended by design. */
export type SchemaNode = Record<string, unknown>;

export function organizationNode(): SchemaNode {
  return {
    '@type': 'ProfessionalService',
    '@id': ORG_ID,
    name: SITE_NAME,
    description: SITE_TAGLINE,
    url: abs('/'),
    telephone: CONTACTS[0].phone,
    priceRange: '₹₹',
    image: `${SITE_URL}/og-image.png`,
    areaServed: [
      { '@type': 'Place', name: 'Delhi NCR' },
      { '@type': 'Country', name: 'India' },
    ],
    address: {
      '@type': 'PostalAddress',
      addressRegion: 'Delhi NCR',
      addressCountry: 'IN',
    },
    // Omitted entirely when no profile URLs are set — an empty sameAs array
    // is worse than none, and a fabricated profile URL is worse than both.
    ...(sameAs.length > 0 ? { sameAs } : {}),
    contactPoint: CONTACTS.map((c) => ({
      '@type': 'ContactPoint',
      contactType: 'sales',
      name: c.name,
      telephone: c.phone,
      areaServed: 'IN',
      availableLanguage: ['en', 'hi'],
    })),
    knowsAbout: [
      'Social media marketing',
      'Instagram growth',
      'YouTube channel management',
      'Facebook advertising',
      'Reels production',
      'Influencer marketing',
      'Content creation',
    ],
  };
}

export function websiteNode(): SchemaNode {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: abs('/'),
    name: SITE_NAME,
    publisher: { '@id': ORG_ID },
    inLanguage: 'en-IN',
  };
}

export interface Crumb {
  name: string;
  path: string;
}

export function breadcrumbNode(crumbs: Crumb[], pagePath: string): SchemaNode {
  return {
    '@type': 'BreadcrumbList',
    '@id': `${abs(pagePath)}#breadcrumb`,
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: abs(c.path),
    })),
  };
}

export function webPageNode(opts: {
  path: string;
  name: string;
  description: string;
  hasBreadcrumb?: boolean;
}): SchemaNode {
  return {
    '@type': 'WebPage',
    '@id': `${abs(opts.path)}#webpage`,
    url: abs(opts.path),
    name: opts.name,
    description: opts.description,
    isPartOf: { '@id': WEBSITE_ID },
    about: { '@id': ORG_ID },
    inLanguage: 'en-IN',
    ...(opts.hasBreadcrumb
      ? { breadcrumb: { '@id': `${abs(opts.path)}#breadcrumb` } }
      : {}),
  };
}

/** One Service node per offering, each provided by the one organisation. */
export function serviceNode(service: Service): SchemaNode {
  return {
    '@type': 'Service',
    '@id': `${abs('/services')}#${service.slug}`,
    name: service.title,
    // Matches the visible 40–60 word answer under the H2 on /services.
    description: service.answer,
    serviceType: service.title,
    provider: { '@id': ORG_ID },
    areaServed: [
      { '@type': 'Place', name: 'Delhi NCR' },
      { '@type': 'Country', name: 'India' },
    ],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: `${service.title} deliverables`,
      itemListElement: service.deliverables.map((d) => ({
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name: d },
      })),
    },
  };
}

export function faqNode(faqs: Faq[], pagePath: string): SchemaNode {
  return {
    '@type': 'FAQPage',
    '@id': `${abs(pagePath)}#faq`,
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

/** Case studies are described as CreativeWork, not Review or AggregateRating:
 *  no review data exists, and inventing it to win a star snippet is exactly
 *  the kind of thing that earns a structured-data manual action. */
export function caseStudyNode(item: PortfolioItem): SchemaNode {
  return {
    '@type': 'CreativeWork',
    '@id': `${abs('/case-studies')}#${item.id}`,
    name: `${item.client} — ${item.category}`,
    description: item.description,
    about: item.category,
    creator: { '@id': ORG_ID },
    // Metrics restated as named values so an extractor reads "336K" as
    // belonging to "IG Followers" rather than as a loose number in prose.
    additionalProperty: item.metrics.map((m) => ({
      '@type': 'PropertyValue',
      name: m.label,
      value: m.value,
    })),
  };
}

/** Wrap nodes in a single @graph. One script tag per page beats five. */
export function graph(nodes: SchemaNode[]): SchemaNode {
  return { '@context': 'https://schema.org', '@graph': nodes };
}
