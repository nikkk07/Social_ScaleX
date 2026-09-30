# Social ScaleX: search, AI-answer and lead playbook

The code side is done and tested (see the bottom). What moves rankings from
here is mostly off-site and owner work. Ordered by impact.

## Before or at launch

1. **Connect socialscalex.in.** Steps in `docs/DEPLOYMENT.md` ("Moving to
   socialscalex.in"). One env var; the 301s from vercel.app are automatic.
2. **Google Business Profile** (support.google.com/business/answer/3038177).
   Create it as a service-area business: hide the street address, set the
   service area to Delhi, Noida, Gurugram. Business name exactly "Social
   ScaleX" (no keywords in the name). Category: "Social media agency" or
   "Marketing agency". Add the website, both phone numbers and real photos.
3. **Ask every current client for a Google review** once the profile is live.
   Reviews on the profile are what can show stars; the website must never mark
   up its own ratings (Google ignores self-served review markup).
4. **Social profile URLs.** Fill `SOCIAL_PROFILES` in `src/lib/site.ts`. The
   footer links and the Organization `sameAs` update together.
5. **Search Console + Bing Webmaster Tools.** Verify the domain, submit
   `/sitemap.xml`, request indexing for `/` and the 8 service pages.
6. **Verify the numbers.** `content.ts` carries `TODO(verify-metrics)`. Re-pull
   the figures before launch and whenever you add the two new clients.

## Where the business comes from (keyword map)

Directory and listicle sites (Clutch, Semrush Agency Partners, Sortlist,
Justdial, Sulekha) hold the top of "social media marketing agency in Delhi".
Get listed on all five: that is how you appear for the head term early.

| Search intent | Page that answers it | Realistic? |
|---|---|---|
| Instagram marketing / page management Delhi | /services/instagram-marketing | Yes |
| Instagram Reels agency, reels production Delhi NCR | /services/reels-production | Yes |
| Meta ads / Facebook ads agency Delhi | /services/meta-ads | Yes |
| Google Ads management Delhi NCR | /services/google-ads | Medium |
| Influencer marketing agency Delhi | /services/influencer-marketing | Medium |
| Product photoshoot / event shoot Delhi NCR | /services/product-shoots | Yes |
| YouTube channel management services | /services/youtube-management | Medium |
| Social media audit / strategy | /services/social-media-strategy | Medium |
| Instagram algorithm / Reels reach 2026 | /guides/instagram-reels-reach | Yes (AI answers too) |
| Meta ads vs Google Ads | /guides/meta-ads-vs-google-ads | Yes |
| How to choose a social media agency | /guides/choose-social-media-agency | Yes |
| Social media marketing agency Delhi NCR | / (homepage) + directories | Slow |
| Comment to DM, Instagram auto DM, comment DM automation | /automation/instagram-comment-to-dm (₹99) | Yes |
| Free comment to DM automation, how to set up auto DM | /guides/free-instagram-comment-to-dm-automation | Yes |
| Instagram DM auto reply, auto replier, keyword reply | /automation/instagram-dm-auto-reply | Yes |
| WhatsApp auto reply, WhatsApp Business automation | /automation/whatsapp-automation | Medium |
| Facebook comment auto reply, Messenger automation | /automation/facebook-auto-reply | Yes |
| YouTube comment management / spam | /automation/youtube-comment-management | Medium |
| Increase Instagram followers / likes / views / comments | /guides/increase-instagram-followers | Medium (big term) |
| Increase sales, lead generation, sales from social | /solutions/increase-sales | Medium |
| Brand awareness, brand growth | /solutions/brand-awareness | Medium |
| Product launch, product promotion / boost | /solutions/product-launch | Medium |
| Instagram marketing near me, social media agency near me | Homepage + Google Business Profile | Only via GBP |

"Near me" searches are ranked mainly from the Google Business Profile
(distance, relevance, reviews), not from pages that repeat "near me". The site
supports it with clear Delhi, Noida and Gurugram signals; the profile does the
ranking.

## Rules that keep the site safe (Google spam policies)

- **No city doorway pages.** Don't clone service pages per city
  ("…agency in Noida", "…in Gurugram") with swapped names. Google's spam
  policy names this exactly. Add a city page only when you have a real client
  and real work from that city to show on it.
- **No scaled content.** A new guide ships only when it answers a real buyer
  question with sources or first-hand numbers. One good guide a month beats ten.
- **No invented numbers, reviews, logos or testimonials.** Testimonials may be
  added only with the client's words and permission.
- **Titles and descriptions stay unique.** The QA script checks this.

## Monthly habits

- Add every new client result to `PORTFOLIO` (with permission and a date).
- Post the best Reel from a client account on your own Instagram too; link it
  to the matching service page.
- Update a guide when a platform changes a rule, and bump its `updated` date.
- Check Search Console → Performance for queries where you rank 8 to 20 and
  improve that page's answer to that question.

## Measuring AI-answer visibility

Once a month, ask ChatGPT, Perplexity, Gemini and Google AI Mode: "best social
media agency in Delhi NCR for small businesses", "who can manage my Instagram
in Noida", "how does the Instagram Reels algorithm work in 2026". Note whether
Social ScaleX or a guide is cited. Directories, reviews and your GBP feed these
answers as much as the site does.

## Already in the code (verified 30 Sep 2026)

- 19 static pages, each with one H1, unique title (≤ 63 chars) and description
  (≤ 160), canonical, Open Graph and a 1200×630 OG image.
- JSON-LD: ProfessionalService (founders, area served, contact points),
  WebSite, Person ×2, WebPage/AboutPage/ContactPage/CollectionPage,
  BreadcrumbList, Service per service page, FAQPage, CreativeWork per case
  study, Article per guide with its citations. No rating markup.
- sitemap.xml, robots.txt (CRM and API disallowed; AI crawlers allowed),
  llms.txt, real 404, preview deployments noindexed.
- Lighthouse (lab): Accessibility, Best Practices and SEO 100 on every page;
  Performance 100 desktop, 95 to 98 mobile under simulated slow 4G (observed
  LCP about 0.25 s). axe WCAG 2.2 AA: 0 violations. No horizontal scroll
  from 320 px to 1920 px. 36 external source links return 200.
