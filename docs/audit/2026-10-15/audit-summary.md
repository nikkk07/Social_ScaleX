# Social ScaleX audit summary — 15 Oct 2026

Scope: live https://www.socialscalex.in (39 sitemap URLs) and the local
Next.js 16 App Router project (TypeScript, Tailwind v4, Supabase, Vercel).
Live site = commit 5440c02 (deployed 15 Oct). Local folder = 5440c02 plus the
changes in `change-log.md`, not yet committed or deployed.

## Status

| Area | Status |
|---|---|
| Crawl/index basics | 39/39 URLs 200, self-canonical, `index, follow`, in sitemap, linked from every page |
| Sitemap | Generated from `src/lib/*` content; 39 canonical public URLs; no private routes |
| Private routes | `/crm`, `/login` noindex (meta + X-Robots-Tag) and disallowed in robots.txt. Their canonical pointed at `/`; fixed locally |
| Structured data | Valid JSON-LD on 39/39; BreadcrumbList on all 38 non-home pages; no rating/review markup |
| Share previews | Fixed and live: og:image + per-page X card on 39/39 |
| Content accuracy | 2 fragments, 2 unsupported growth-timeline claims, 3 absolute automation claims, 1 hub/YouTube contradiction, 1 privacy wording issue: all fixed locally |
| Client results | Saini Telecom updated to 13.1K followers / 5M+ views (owner-reported 15 Oct); founder LinkedIn added |
| Analytics | GA4 `G-NHKELQXBY6` loads on live; click/lead events live; Realtime and key-event setup need owner access |
| Accessibility | axe WCAG 2.2 AA: 0 violations on 39 pages (local build) |
| Performance (lab) | Desktop 100 on 9 tested pages; mobile 83–94 in this container. GA4 now adds about 240 ms main-thread time on mobile |
| Search Console | Not connected here; 34 "Discovered – not indexed" count is from the 15 Oct export only |

## Priority counts (this pass)

- P0: 0
- P1: 4: misleading absolute claims (automation), unsupported growth timeline,
  privacy wording, client figures out of date. All fixed locally.
- P2: 3: private-route canonical, `@axe-core/playwright` missing from
  `package.json`, GA4 cost on mobile (accepted trade-off, monitor field data).
- P3: 2: city pages without local work (owner decision), Diwali guide expiry
  after 8 Nov 2026.

## Honest outcome

Implemented and validated for the listed checks. Indexing, rankings, AI
citations and lead volume are not verified and cannot be promised; they need
post-deployment measurement in Search Console and GA4.
