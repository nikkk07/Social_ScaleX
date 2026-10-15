# Schema audit — 15 Oct 2026

Checked on all 39 rendered pages of the local build (JSON-LD parsed and walked).
Rich Results Test and Schema Markup Validator were not reachable from this
session; run them on 3–4 live URLs after deploy.

| Template | Types | Notes |
|---|---|---|
| All pages (layout) | ProfessionalService (Organization), WebSite, Person ×2 | One `@id` per entity across the site. Person 1 now has `sameAs` = LinkedIn |
| Home | WebPage, ItemList, FAQPage | No BreadcrumbList on home (correct) |
| Services `/services/[slug]` | WebPage, BreadcrumbList, Service + OfferCatalog, FAQPage | No prices except the ₹99 automation |
| Automation `/automation/[slug]` | WebPage, BreadcrumbList, Service, FAQPage; Offer + UnitPriceSpecification on comment-to-DM only | Price matches visible ₹99/month |
| Solutions, Areas | WebPage/CollectionPage, BreadcrumbList, FAQPage (+ Service on city pages) | — |
| Case studies | CollectionPage, BreadcrumbList, CreativeWork per client, FAQPage | `dateModified` now per client (Saini 2026-10-15, others 2026-09-30) |
| Guides | WebPage, BreadcrumbList, Article, FAQPage (if FAQs), HowTo (comment-to-DM guide) | Article dates match visible "Updated" |
| About, Contact, Privacy, Terms | AboutPage/ContactPage/WebPage, BreadcrumbList | — |

- BreadcrumbList: present on 38/38 non-home pages (not just the 3 in the old export).
- Parse errors: 0. No rating, review or AggregateRating markup.
- FAQPage/HowTo rich results are restricted by Google since Aug 2023; markup kept because it mirrors visible content, with no rich-result expectation.
