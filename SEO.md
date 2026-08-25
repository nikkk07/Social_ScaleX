# Social ScaleX — SEO Playbook

The code side of SEO is done (see "Already implemented" below). Ranking on
Google now depends on the steps in this file — most of them are one-time
setup, the rest are habits.

---

## 🔴 Do these BEFORE going live

1. **Replace the deployment host with a real domain.** The unowned placeholder
   `socialscalex.com` is gone — every reference now points at the Vercel
   deployment URL, `social-scalex.vercel.app`, which actually serves the site.
   That is correct and indexable as-is; a canonical pointing at a host nobody
   serves is what gets a site indexed nowhere.

   When a real domain is bought, `git grep -n 'social-scalex\.vercel\.app'`
   finds all 13 references — replace them **in one commit**:
   - `index.html` — canonical, `og:url`, `og:image`, `twitter:image`, and the
     five JSON-LD `@id` / `url` / `publisher` fields (9)
   - `public/robots.txt` — the `Sitemap:` line (1)
   - `public/sitemap.xml` — every `<loc>` (3)

   Splitting them leaves the JSON-LD entity `@id`s on a different host from the
   canonical, which describes two entities instead of one. Supabase's Site URL
   and redirect allow-list need the new host too, or password resets break.
   Full procedure in `docs/MERGE_CHECKLIST.md` §7.
2. **Add the social preview image.** Create a 1200×630 image (logo + tagline
   over the dark glass look) and save it as `public/og-image.png`. This is
   what shows when the site is shared on WhatsApp/LinkedIn/X.
3. **Fill in real social profile URLs** in
   `src/app/components/sections/Footer.tsx` (`SOCIAL_LINKS`) — icons stay
   hidden until a URL is set. Then add the same URLs to the JSON-LD in
   `index.html` as a `"sameAs": [...]` array on the ProfessionalService node.
4. **Host on HTTPS** (Vercel/Netlify/Cloudflare Pages all do this free) and
   make sure `www` and non-`www` redirect to one canonical version.
5. **SPA caveat:** this is a client-rendered React site. Google renders JS
   fine, but if you want maximum crawl reliability later, enable prerendering
   on your host (Netlify prerendering, or `vite-plugin-ssr`/prerender plugin).
   Not a blocker — the meta tags and structured data are already in the
   static HTML, which is what matters most.

## 🟠 Week one after launch

6. **Google Search Console** (search.google.com/search-console): verify the
   domain, submit `sitemap.xml`, and request indexing of the homepage.
7. **Bing Webmaster Tools**: import from GSC (2 clicks, free extra traffic).
8. **Google Business Profile** (business.google.com): create a listing —
   "Social ScaleX", category *Marketing Agency*, Delhi NCR service area, both
   phone numbers, link to the site. This is the single highest-impact step
   for ranking on "social media marketing agency near me / in Delhi" searches.
9. **Consistent NAP** (Name, Address, Phone): use the exact same business
   name and numbers everywhere — GBP, Instagram bio, LinkedIn, directories.

## 🟡 Ongoing (off-page authority)

10. **Backlinks from real places, not link farms:**
    - Get listed on Indian agency directories: Clutch, GoodFirms, DesignRush,
      Sortlist, JustDial, Sulekha.
    - Ask clients (acdelhivlogs, prago.outdoors, etc.) to link to the site
      from their link-in-bio pages — client links are natural and relevant.
    - Publish case-study posts on LinkedIn linking back to `/#results`.
11. **Social signals:** keep the agency's own Instagram/LinkedIn active and
    link them to the site; Google cross-references entity mentions.
12. **Reviews:** collect Google Business Profile reviews from real clients —
    reviews + response activity move local rankings more than anything else.
13. **Content flywheel (when ready):** add a `/blog` with genuinely useful
    posts ("What 4.2M monthly views actually took", "Reels strategy that grew
    a gear store"). One good post a month beats daily filler.

## ✅ Already implemented in the code

- `index, follow` robots meta (the site previously shipped with **noindex** —
  it was invisible to Google by instruction)
- Title tag + meta description tuned to "social media marketing agency in
  Delhi NCR" intent, under length limits
- Canonical URL, Open Graph, Twitter cards, `og:locale: en_IN`
- JSON-LD structured data: `ProfessionalService` (with areaServed, phone,
  knowsAbout) + `WebSite` + `FAQPage` (mirrors the visible FAQ section)
- `robots.txt` + `sitemap.xml` (homepage, /privacy, /terms)
- Semantic HTML: single `h1`, ordered `h2/h3`, `<nav>/<main>/<footer>/<address>`
  landmarks, aria-labels, skip-to-content link
- FAQ section written for featured-snippet queries; Privacy & Terms trust pages
- SVG favicon; font preconnect; lazy-loaded 3D (fast LCP); Core-Web-Vitals-
  friendly rendering (no layout shift, transform/opacity-only animations)
