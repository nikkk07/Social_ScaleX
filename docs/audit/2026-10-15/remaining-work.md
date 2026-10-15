# Remaining work

| Task | Why open | Needs | Next action |
|---|---|---|---|
| Deploy today's local changes | Not committed or pushed | Owner approval | Approve; then `git push origin main` |
| Mark `generate_lead` as key event; check Realtime | No GA access here | Owner, GA4 Admin | Admin → Events → toggle key event |
| Meta Pixel | ID not created | Owner | Add `NEXT_PUBLIC_META_PIXEL_ID` in Vercel, redeploy |
| Search Console: resubmit sitemap, request indexing, re-export | No access here | Owner | Sitemaps → `sitemap.xml`; URL Inspection for priority URLs; re-export 29 Oct |
| City pages decision | No local client work shown | Owner | Keep, or noindex 4 and drop from sitemap |
| Client permission records | Not in repo | Owner | Confirm written permission for all published figures |
| Saini figures, LinkedIn URL | Owner-supplied | Owner | Keep screenshots of Insights as evidence |
| Add `@axe-core/playwright` to devDependencies | `test:site` fails on a clean install | Approval | `npm i -D @axe-core/playwright` |
| Diwali guide after 8 Nov 2026 | Seasonal | Calendar | Refresh for next year, or mark it as the 2026 edition |
| Rich Results Test / Schema validator | Not reachable here | Owner | Test home, a service, a guide, case studies after deploy |
| Bing Webmaster Tools + AI Performance | Not connected | Owner | Verify site, submit sitemap |
| Field Core Web Vitals | No CrUX data yet | Traffic over time | Check PageSpeed field data monthly |
