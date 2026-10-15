# Test report — 15 Oct 2026

Run on a clean clone of `nikkk07/Social_ScaleX` at 5440c02 with the local
changes applied (identical files staged from the owner's folder), plus a
copy on the owner's machine.

| Check | Command | Result |
|---|---|---|
| Type check | `npm run typecheck` | Pass |
| Lint | `npm run lint` (max warnings 0) | Pass |
| Unit tests | `npm run test:unit` (crm, enquiry, areas, results, track) | Pass, all suites |
| Build | `npm run build` (with `NEXT_PUBLIC_GA_ID`) | Pass |
| Browser QA, 39 pages | `npm run test:site` (needs `npm i --no-save @axe-core/playwright`) | ALL OK: 200, one H1, title ≤ 65, description 70–160, canonical, JSON-LD, heading order, axe WCAG 2.2 AA 0 violations, no horizontal scroll at 320/768/1024/1920, no console errors, 39 internal links 200, 404 for unknown path |
| Metadata and schema crawl | Custom parse of 39 rendered pages | Canonical = URL 39/39, og:image 39/39, BreadcrumbList 38/38 non-home, JSON-LD errors 0, duplicate titles 0 |
| Private routes | Local `/login` | noindex, no canonical |
| Events | Playwright with test IDs | `contact_click` + Pixel `Contact` for phone and WhatsApp; none for internal link |
| Lighthouse 12 (lab, local) | 9 pages × mobile/desktop | Desktop: 100/100/100/100 on all 9. Mobile performance: home 83, Meta ads 92, comment-to-DM 89, Reels guide 89, Diwali 91, case studies 90, Noida 91, contact 87, about 94; accessibility, best practices and SEO 100. CLS 0 everywhere |

Not tested: form submission end-to-end (avoids a fake lead), GA4 Realtime/DebugView (no account access), Rich Results Test, PageSpeed field data, live site after these local changes (not deployed).

Lab note: container scores are not comparable with PageSpeed Insights; mobile
LCP is the hero H1 text, and GA4 adds about 240 ms main-thread time.
