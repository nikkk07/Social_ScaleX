// ─────────────────────────────────────────────────────────────────────
// JSON-LD builders.
//
//  1. Every node is built from content.ts / guides.ts, so structured data
//     never says something the visible page doesn't.
//  2. The organisation, website and founders are declared at stable @ids and
//     referenced everywhere else, so search engines see one entity.
//  3. No AggregateRating or Review: Google ignores self-served reviews for a
//     business's own markup, and none exist yet anyway.
// ─────────────────────────────────────────────────────────────────────
import {
  AREAS_SERVED,
  CONTACTS,
  FOUNDING_YEAR,
  ORG_ID,
  SITE_NAME,
  SITE_TAGLINE,
  SITE_URL,
  WEBSITE_ID,
  abs,
  sameAs,
} from './site';
import type { Faq, PortfolioItem, Service } from './content';
import type { Guide } from './guides';

export type SchemaNode = Record<string, unknown>;

export interface Crumb {
  name: string;
  path: string;
}

const AREA_NODES = [
  ...AREAS_SERVED.map((name) => ({ '@type': 'City', name })),
  { '@type': 'Country', name: 'India' },
];

export const personId = (i: number) => `${SITE_URL}/about#founder-${i + 1}`;

export function organizationNode(): SchemaNode {
  return {
    '@type': 'ProfessionalService',
    '@id': ORG_ID,
    name: SITE_NAME,
    description: SITE_TAGLINE,
    url: abs('/'),
    logo: `${SITE_URL}/logo.png`,
    image: `${SITE_URL}/og-image.png`,
    telephone: CONTACTS[0].phone,
    foundingDate: FOUNDING_YEAR,
    founder: CONTACTS.map((_, i) => ({ '@id': personId(i) })),
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Delhi',
      addressRegion: 'Delhi NCR',
      addressCountry: 'IN',
    },
    areaServed: AREA_NODES,
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
      'Instagram marketing',
      'Instagram Reels production',
      'Facebook and Instagram advertising',
      'Google Ads',
      'YouTube channel management',
      'Influencer marketing',
      'Product photography',
    ],
  };
}

export function personNodes(): SchemaNode[] {
  return CONTACTS.map((c, i) => ({
    '@type': 'Person',
    '@id': personId(i),
    name: c.name,
    jobTitle: `${c.role}, ${SITE_NAME}`,
    telephone: c.phone,
    worksFor: { '@id': ORG_ID },
  }));
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
  type?: 'WebPage' | 'AboutPage' | 'ContactPage' | 'CollectionPage';
  hasBreadcrumb?: boolean;
}): SchemaNode {
  return {
    '@type': opts.type ?? 'WebPage',
    '@id': `${abs(opts.path)}#webpage`,
    url: abs(opts.path),
    name: opts.name,
    description: opts.description,
    isPartOf: { '@id': WEBSITE_ID },
    about: { '@id': ORG_ID },
    inLanguage: 'en-IN',
    ...(opts.hasBreadcrumb ? { breadcrumb: { '@id': `${abs(opts.path)}#breadcrumb` } } : {}),
  };
}

export function serviceNode(s: Service): SchemaNode {
  const path = `/services/${s.slug}`;
  return {
    '@type': 'Service',
    '@id': `${abs(path)}#service`,
    name: s.name,
    serviceType: s.h1,
    description: s.lede,
    url: abs(path),
    provider: { '@id': ORG_ID },
    areaServed: AREA_NODES,
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: `${s.name}: what's included`,
      itemListElement: s.deliverables.map((d) => ({
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

/** Case studies are CreativeWork, never Review: no review data exists. */
export function caseStudyNode(item: PortfolioItem): SchemaNode {
  return {
    '@type': 'CreativeWork',
    '@id': `${abs('/case-studies')}#${item.id}`,
    name: `${item.client}: ${item.category}`,
    description: item.detail,
    about: item.category,
    creator: { '@id': ORG_ID },
    additionalProperty: item.metrics.map((m) => ({
      '@type': 'PropertyValue',
      name: m.label,
      value: m.value,
    })),
  };
}

export function articleNode(g: Guide, wordCount: number): SchemaNode {
  const path = `/guides/${g.slug}`;
  return {
    '@type': 'Article',
    '@id': `${abs(path)}#article`,
    headline: g.title,
    description: g.description,
    url: abs(path),
    mainEntityOfPage: { '@id': `${abs(path)}#webpage` },
    datePublished: g.published,
    dateModified: g.updated,
    author: { '@id': ORG_ID },
    publisher: { '@id': ORG_ID },
    image: `${SITE_URL}/og-image.png`,
    inLanguage: 'en-IN',
    wordCount,
    citation: g.sources.map((s) => s.url),
  };
}

export function itemListNode(id: string, items: { name: string; path: string }[]): SchemaNode {
  return {
    '@type': 'ItemList',
    '@id': id,
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      url: abs(it.path),
    })),
  };
}

export function graph(nodes: SchemaNode[]): SchemaNode {
  return { '@context': 'https://schema.org', '@graph': nodes };
}
