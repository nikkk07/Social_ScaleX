# Technical SEO and indexing audit — 15 Oct 2026

Per-URL data: `../url-inventory.csv` (39 URLs: status, canonical, robots, title,
description, H1, schema, breadcrumb, og:image, inbound links).

| Check | Result | Evidence | Status |
|---|---|---|---|
| Canonical host | `https://www.socialscalex.in`; apex, http and `social-scalex.vercel.app` 308 → www | curl, 15 Oct | Pass |
| robots.txt | Allows all public paths; blocks `/crm`, `/login`, `/api/`; sitemap declared | Live | Pass |
| Sitemap | 39 canonical 200 URLs; no private routes; `lastmod` now per page (local) | Live + local build | Pass (fix pending deploy) |
| Indexability | 39/39 `index, follow`, self-canonical | Live | Pass |
| Private routes | noindex (meta + header); canonical removed locally in ff1acb6 (now live) | Live | Pass |
| Rendering | Titles, H1, body and links are server-rendered HTML (Next.js SSG) | Raw HTML fetch | Pass |
| Internal links | Every page links to the other 38 (footer); guides link to services; case studies link to services | Crawl | Pass; no orphans |
| Structured data | Valid on 39/39; BreadcrumbList on 38/38 non-home pages; no review/rating markup | Parse | Pass |
| Share metadata | og:image + X card on 39/39 | Live | Pass |
| Performance (lab, local) | Desktop 100; mobile 83–94; CLS 0 | Lighthouse 12 | Pass/monitor |
| Accessibility | axe WCAG 2.2 AA: 0 violations | `test:site` | Pass |
| Indexing | 34/38 discovered but not crawled as of 15 Oct | Coverage export | Open: external steps |
| Search Console URL Inspection | Not accessible | — | Blocked |

Source on `lastmod`: Google uses `<lastmod>` if it is "consistently and
verifiably accurate"
(https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap).
