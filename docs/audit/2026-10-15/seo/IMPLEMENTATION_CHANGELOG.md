# Implementation changelog — pass 3, 15 Oct 2026 (local, not deployed)

| File | Previous issue | Change | Test |
|---|---|---|---|
| `src/app/sitemap.ts` | Every `lastmod` fixed at 30 Sep, now inaccurate | `UPDATED` map: 9 pages dated 15 Oct; guides use their own `updated` | Local sitemap: 12 URLs dated 15 Oct, 27 dated 30 Sep |
| `src/lib/guides.ts` | Followers guide figures changed but `updated` was still 30 Sep | `updated: 2026-10-15` | Render |
| `src/components/site/Results.tsx` | One "Figures updated" date implied every client shared the same capture date | Per-card "Figures as of {date}" / "Figures at hand-over" | Render: 15 Oct ×1, 30 Sep ×4, hand-over ×1 |
| `src/lib/content.ts` | 32.7× label ambiguous; 10M+ mixed windows unlabelled; "Every follower … arrived because of the content" | Clear labels; FAQ reworded | Unit tests pass |
| `src/lib/automation.ts` | "spam never reaches your audience" | "most spam is held back…" | Render |
| `src/app/page.tsx` | "auto-replies for every comment and DM" | "for comments and DMs" | Render |
| `docs/audit/2026-10-15/…` | — | Remediation + SEO reports, CSV/XLSX | — |

Earlier passes: commits `5440c02`, `ff1acb6` (both live).
