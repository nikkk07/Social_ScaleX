# Change log

## Commit 5440c02 (deployed 15 Oct 2026)

Share previews (`socialMeta()`), Reels algorithm 2026 guide refresh, Diwali
2026 guide, CTA/lead tracking (`src/lib/track.ts`), docs sync, research log.
See the commit message.

## Local, not yet committed (15 Oct 2026)

| File | Finding | Edit | Test |
|---|---|---|---|
| `src/lib/content.ts` | Saini Telecom figures out of date (owner update) | 5M+ views, 13.1K followers, growth 400→13.1K (Jun→Oct), headline 32.7×, per-client `asOf: 2026-10-15`, notes and FAQs updated | Unit: results suite incl. 2 new checks |
| `src/lib/content.ts` | Homepage fragments ("Reels edited for…", "Tracking fixed first…") | Rewritten as full sentences, no implied guarantee | Rendered home checked |
| `src/lib/content.ts` | "Most accounts… by day 60 / day 90": no evidence | Removed; replaced with a qualified statement | grep: none left |
| `src/lib/automation.ts` | "Every comment becomes a conversation", "Every WhatsApp enquiry gets an answer", hub says everything is automatic while YouTube is manual | Precise wording; hub says YouTube is handled by hand | Rendered pages checked |
| `src/lib/goals.ts` | "The signal Instagram weighs most" overstated Mosseri | Reworded to what he said | — |
| `src/lib/guides.ts` | Saini figures in followers guide | 5M+ / 13.1K (15 Oct 2026) | — |
| `src/app/case-studies/page.tsx` | Meta description said 12K | 13.1K | QA: description 70–160 |
| `src/lib/schema.ts` | Person had no profile link; CreativeWork date global | Person `sameAs` LinkedIn when set; `dateModified` per client | JSON-LD parse 39/39 |
| `src/lib/site.ts` | Founder LinkedIn missing | `linkedin` field on CONTACTS (Nikhil set, Abhishek empty) | Typecheck |
| `src/app/about/page.tsx` | Same | LinkedIn button beside phone, new tab, accessible name | axe 0 violations |
| `src/app/privacy/page.tsx` | "Nothing else is collected" vs hidden honeypot field | Explains the spam-trap field; cross-references analytics | Rendered check |
| `src/lib/results.test.ts` | Tests named "30×" | Renamed; added asOf and Saini checks | Pass |
| `src/app/(crm)/layout.tsx` | Private pages' canonical → `/` | `alternates: { canonical: null }` | Local `/login`: no canonical, still noindex |
| `docs/audit/2026-10-15/*` | Requested deliverables | New, not served publicly (outside `public/`) | — |

Remaining uncertainty: Saini figures and the LinkedIn URL are owner-supplied.
