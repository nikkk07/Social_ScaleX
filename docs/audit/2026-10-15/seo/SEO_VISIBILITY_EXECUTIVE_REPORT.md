# SEO visibility executive report — 15 Oct 2026

Ranking first on Google is not guaranteed by anything below.

## Why Social ScaleX doesn't appear for the two Delhi searches

| # | Cause | Evidence | Label | Priority |
|---|---|---|---|---|
| 1 | Most target pages had never been crawled | Coverage export (15 Oct): 34 of 38 sitemap URLs "Discovered – currently not indexed", last crawl 1970-01-01. This included `/services/instagram-marketing` and every service page. A page outside the index can't rank | Verified (export) | P0 (external: crawl/index requests, links) |
| 2 | The property is about two weeks old in Google | Performance data starts 1 Oct 2026: 9 clicks, 376 impressions in 12 days; canonical host moved to www in late Sep | Verified | — (time + signals) |
| 3 | Few or no external authority signals | No directory, press or review profiles found; a branded search on a secondary engine (15 Oct) returned other "ScaleX"/"Scale Socials" brands, not this site | Likely | P1 |
| 4 | The head terms are held by directories and long-established agencies | Secondary engine, 15 Oct, observed once: Clutch, DesignRush, Semrush Agency Partners, The Manifest, GoodFirms, plus agencies such as Wildnet (claims 20+ years and shows Google 4.2 from 259 reviews) | Observed once (not Google) | P1 |
| 5 | Local intent is decided largely by Google Business Profile, proximity and reviews | Profile status unknown; no reviews visible on the site | Hypothesis (no GBP access) | P1 |

Not the cause (Verified): robots, noindex, canonicals, sitemap, rendering, page speed and on-page targeting. The homepage title and H1 already target "Social Media Marketing Agency in Delhi NCR". `/services/instagram-marketing` targets "Instagram Marketing Agency in Delhi NCR".

Not measured: actual Google positions. Google SERPs, Search Console, Keyword Planner and Trends were not accessible from this session.

## Top five opportunities

1. Get the service pages indexed: resubmit the sitemap and request indexing for the 10 service pages plus the ₹99 automation page.
2. Google Business Profile as a service-area business, plus honest reviews from current clients. This is the main route into local and map results.
3. Profiles on the directories that rank (Clutch, GoodFirms, DesignRush, Semrush Agency Partners, Justdial, Sulekha), each linking to the site.
4. Win the narrower queries first: comment-to-DM automation, Reels production Delhi NCR, WhatsApp Business automation, Instagram Reels algorithm. Search Console already shows visibility on the guides.
5. Client proof with permission: case-study pages linked from service pages (already in place), plus client mentions or links back where clients agree.

## Query-to-page map (summary; full map in `query_to_page_map.csv`)

| Cluster | Page | Action |
|---|---|---|
| Social media marketing agency Delhi / NCR | `/` | Index + authority; copy fine |
| Instagram marketing / management agency Delhi | `/services/instagram-marketing` | Newly indexed; add external links |
| Reels / content production | `/services/reels-production` | Index |
| Meta / Facebook / Instagram ads, performance marketing | `/services/meta-ads` | Index |
| Google Ads | `/services/google-ads` | Index |
| Comment-to-DM (commercial) | `/automation/instagram-comment-to-dm` | Index; link from Instagram bio |
| Comment-to-DM (free/how-to) | `/guides/free-instagram-comment-to-dm-automation` | Keep separate (different intent) |
| WhatsApp automation | `/automation/whatsapp-automation` | Deepen (app vs Platform) |
| Reels algorithm | `/guides/instagram-reels-reach` | Refreshed; monitor CTR |
| Noida / Gurugram / Ghaziabad / Faridabad modifiers | `/areas/<city>` | Keep; decision gate 15 Dec |
| Pricing / cost queries | none | Owner decision (only ₹99 is public) |

No cannibalisation found: one URL per cluster.

## Implemented locally this pass

Accurate sitemap `lastmod`, per-card result dates, claim-label fixes. See `IMPLEMENTATION_CHANGELOG.md`. Not deployed.

## Measured at 30/60/90 days

Indexed priority pages (Pages report), non-branded impressions and clicks, impressions for priority clusters, `generate_lead` count, and Business Profile actions. See the roadmap.
