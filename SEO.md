# Social ScaleX — SEO / GEO / AEO Playbook

The code side is done (see "Already implemented"). What's left is mostly
one-time account setup and a few habits — plus two items that still need a
human: the OG image conversion and the real social profile URLs.

"GEO/AEO" here means visibility in answer engines — ChatGPT, Perplexity,
Claude, Gemini and Google AI Overviews — as distinct from blue-link ranking.
The two overlap more than the acronyms suggest, and nothing below trades one
for the other.

---

## 🔴 Do these BEFORE going live

1. ~~**Convert the social preview image.**~~ **DONE** — `public/og-image.png`
   exists at exactly 1200×630 (299 KB), rendered from `public/og-image.svg`.

   To regenerate after editing the SVG, use `scripts/render-og.mjs`:

   ```bash
   npm run og
   ```

   **Do not use `qlmanage`** for this, despite it being the obvious macOS
   one-liner. It pads thumbnails to a square and silently produces a
   1200×1200 file, which fails the 1200×630 contract every OG consumer
   expects. The script renders in headless Chromium at the SVG's real
   viewBox and asserts the output dimensions.

2. **Fill in the real social profile URLs** in `src/lib/site.ts`
   (`SOCIAL_PROFILES`). One edit does two things: the footer icons appear, and
   the URLs join the `ProfessionalService` JSON-LD as `sameAs`. `sameAs` is how
   an answer engine confirms that the Instagram account, the LinkedIn page and
   this website are one business rather than three — it is the single highest-
   value structured-data field still empty.

3. **Verify the metrics.** `src/lib/content.ts` carries two
   `TODO(verify-metrics)` markers. The figures are point-in-time snapshots
   recorded in-repo before 2026-08-05 and their currency is unconfirmed. They
   now appear in more places than before — homepage, `/case-studies`,
   `/llms.txt` and the `CreativeWork` schema — so re-pull them from the client
   dashboards before launch. Publishing a stale number is worse than
   publishing a smaller true one.

4. **Buy a real domain**, then set `NEXT_PUBLIC_SITE_URL` in Vercel and
   redeploy. Everything absolute follows from it. Full procedure in
   `docs/MERGE_CHECKLIST.md` §7.

5. **Host on HTTPS** (Vercel does) and make sure `www` and non-`www` redirect
   to one canonical version.

## 🟠 Week one after launch

6. **Google Search Console** — verify the domain, submit `sitemap.xml`, request
   indexing of `/`, `/services` and `/case-studies`.
7. **Bing Webmaster Tools** — import from GSC. Two clicks, and it feeds
   Copilot.
8. **Google Business Profile** — "Social ScaleX", category *Marketing Agency*,
   Delhi NCR service area, both phone numbers, link to the site. Still the
   single highest-impact step for "social media marketing agency near me".
9. **Consistent NAP** (Name, Address, Phone) everywhere — GBP, Instagram bio,
   LinkedIn, directories. Entity resolution depends on the strings matching.

## 🟡 Ongoing (off-page authority)

10. **Backlinks from real places, not link farms.** Indian agency directories:
    Clutch, GoodFirms, DesignRush, Sortlist, JustDial, Sulekha. Ask clients
    (acdelhivlogs, prago.outdoors) to link from their link-in-bio pages —
    client links are natural and relevant. Publish case-study posts on LinkedIn
    linking to `/case-studies`.
11. **Reviews** on the Google Business Profile from real clients. Reviews plus
    response activity move local rankings more than anything else.

    Note: there is deliberately **no `AggregateRating` schema** on this site.
    Adding one without real reviews behind it is what earns a structured-data
    manual action. Add it once GBP reviews exist, and only with the true count.
12. **Content flywheel.** `/services` and `/case-studies` are the pillar pages;
    a `/blog` is the obvious next surface. One genuinely useful post a month
    ("What 4.2M monthly views actually took") beats daily filler.

## 🔵 Measuring answer-engine visibility

Traditional rank tracking will not show any of this. Check it directly:

- Ask ChatGPT, Perplexity, Claude and Gemini a handful of high-intent prompts —
  "social media marketing agency in Delhi NCR", "who manages Instagram for
  brands in Delhi", "agency that does Reels production India" — and record
  whether Social ScaleX is named and whether the details are right.
- Re-run monthly. The metric is *accurate citations on high-intent prompts*,
  not position.
- In GSC, watch `/services` and `/case-studies` impressions separately from
  `/` — fan-out coverage is the point of those pages existing.

## ✅ Already implemented in the code

**Rendering and crawler access** — the item that mattered most:

- Every marketing page is **statically generated with its content in the HTML**.
  The previous Vite SPA served an empty `<div id="root">`: `grep` for any body
  text in the old `dist/index.html` returned nothing. GPTBot, ClaudeBot,
  PerplexityBot and CCBot do not execute JavaScript, so the entire site was
  invisible to them. It is now server-rendered.
- Marketing pages ship almost no JavaScript. Entrance animations are CSS, so
  nothing is `opacity: 0` waiting on hydration.
- **All FAQ answers are in the DOM.** The old Radix accordion unmounted closed
  panels, so five of six answers existed only after a click. It is `<details>`
  now — collapsed, but present and quotable.
- `robots.txt` explicitly allows GPTBot, OAI-SearchBot, ChatGPT-User,
  ClaudeBot, Claude-Web, anthropic-ai, PerplexityBot, Perplexity-User,
  Google-Extended, CCBot, Applebot-Extended, cohere-ai and meta-externalagent.
- **`/llms.txt`** — a plain-Markdown brief of the business, generated from
  `src/lib/content.ts` so it cannot drift from the pages.
- A real **404** with a 404 status. The SPA served the homepage at every
  unknown URL with a 200, which is a soft 404.

**Structured data** — all of it server-rendered, all built from
`src/lib/content.ts` so schema and visible text are the same sentences:

- `ProfessionalService` + `WebSite` declared once at stable `@id`s in the root
  layout; every page graph references those ids rather than restating them, so
  the business is one entity instead of one per page.
- `WebPage` + `BreadcrumbList` per page, with matching visible breadcrumbs.
- `Service` × 8 on `/services`, each with an `OfferCatalog` of deliverables.
- `CreativeWork` × 4 on `/case-studies`, metrics as named `PropertyValue`s.
- `FAQPage` on `/`, `/services` and `/about`.
- `ContactPoint` for both numbers.

**Content architecture:**

- Answer-first openings: each page leads with a self-contained 40–60 word
  paragraph, and every `/services` section is a question-form H2 followed
  immediately by a standalone answer.
- Pages beyond the homepage: `/services`, `/case-studies`, `/about` — the
  sitemap went from 3 URLs to 6, with internal links using descriptive anchors.
- One brand definition (`SITE_TAGLINE`) reused verbatim in JSON-LD, `/llms.txt`
  and `/about`.

**Traditional SEO:** per-page titles and descriptions via the Next Metadata
API, canonicals, Open Graph, Twitter cards, `en-IN` locale, generated
`sitemap.xml`, semantic landmarks, one `h1` per page, skip link, self-hosted
fonts, `/crm` and `/login` both `noindex` and `Disallow`ed.
