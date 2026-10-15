# Remediation and release readiness — 15 Oct 2026 (17:00 IST)

One report covering all 11 requested topics. Data files:
`client-metrics-and-permissions-register.csv`, `city-page-decision-matrix.csv`.
Status labels: Verified / Owner assertion / Not verified / Blocked.

## 1. Production vs local state

| Item | Finding | Status |
|---|---|---|
| Local | Branch `main`, HEAD `ff1acb6`, working tree clean before this pass | Verified (`git status --short --branch`) |
| Remote | `origin/main` = `ff1acb6`; local/remote divergence 0/0 | Verified (`git fetch`, `rev-list --left-right --count`) |
| Production | Live pages carry ff1acb6-only text: "13.1K", "32.7×" on /case-studies, LinkedIn link on /about, "We edit Reels for watch time", "The form collects nothing else" on /privacy, GA4 paragraph shown | Verified by content fingerprints |
| Deployed commit SHA | Vercel metadata not accessible from this session | Blocked (needs Vercel dashboard) |
| Mismatch explanation | The owner pushed `ff1acb6` after it was committed; the "not pushed" note was out of date | Verified: ff1acb6 is on origin/main |

Safest next action: review the new local diff (section 10), then push it as one commit when approved.

## 2. Privacy policy and data inventory

| Mechanism | What it collects | Policy says | Status |
|---|---|---|---|
| Enquiry form (visible) | name, mobile, service (select), Instagram handle or website (optional), details (optional) | Listed | Matches |
| Stored with each enquiry | page path, truncated user agent | Listed | Matches |
| Honeypot `company` field | Hidden from people; a filled value blocks sending (`LeadForm.tsx`), nothing is sent | Explained since ff1acb6 | Matches |
| Storage | Supabase table `inbound_enquiries` (insert-only via anon key) | Not named as a processor | Owner/legal to decide whether to name hosting/processors |
| GA4 (live) | page views, enhanced-measurement events, `contact_click`, `generate_lead`; cookies | Described when the ID is set; mentions click counting | Matches |
| Meta Pixel | Not loaded (no ID) | Paragraph appears only when the ID is set | Matches |
| tel:/wa.me/mailto: links | Opens external apps; only the click is counted | Covered by analytics text | Matches |
| Vercel hosting logs | Not inspectable here | Not mentioned | Owner/legal question |

Not claimed: retention period, legal basis, DPDP/GDPR compliance. These are on the owner list.

## 3. Automation claims

A repository-wide search (every/never/guarantee/24-7/instant/no spam/100%) found three more absolute phrases this pass. All are fixed locally:

| File | Before | After |
|---|---|---|
| `src/app/page.tsx` | "auto-replies for every comment and DM" | "auto-replies for comments and DMs" |
| `src/lib/automation.ts` (YouTube) | "so spam never reaches your audience" | "so most spam is held back before your audience sees it" |
| `src/lib/content.ts` FAQ | "Every follower … arrived because of the content" | "We never buy followers, likes or comments for the accounts we manage" |

Remaining matches are deliberate: no-guarantee statements, "every rupee spent" (billing transparency), DIY advice in guides, and "No spam and no sharing" (a commitment about the form). YouTube is described as manual on both the hub and the YouTube page.

## 4. Client metrics

See the CSV. Key points:
- Saini 13.1K / 5M+ are an owner assertion, not independently verified.
- 32.7× is final follower count ÷ starting count (13,100 / 400 = 32.75, floored). The label now reads "Saini Telecom’s followers vs June (400 → 13.1K)", so it can't be read as net growth.
- The 10M+ aggregate mixes two 30-day windows (to 30 Sep and to 15 Oct). The label now says "each over its latest 30 days".
- Each case-study card now shows its own "Figures as of …" date (15 Oct for Saini, 30 Sep for the others), or "Figures at hand-over" for past clients.
- Permission records are not in the repo for any client. Owner confirmation is needed.

## 5. GA4 `generate_lead`

Controlled browser test (Supabase intercepted, no real lead sent, test GA/Pixel IDs):

| Case | Supabase POSTs | Events | PII in events |
|---|---|---|---|
| Valid form, 201 response | 1 | `generate_lead {method: website_form, page_path: /contact}` + Pixel `Lead`, once despite a second click | None |
| Empty form | 0 | none | None |
| Valid form, 500 response | 2 (button re-enables after failure; user retry) | none | None |

GA4 loads once (one `gtag config`). Client-side navigation page views come from Enhanced measurement, so the code sends none manually.

Account side: Blocked. The owner marks `generate_lead` as a key event (Admin → Data display → Events, or Key events → New key event). Taxonomy: `generate_lead` = lead; `contact_click` (phone/WhatsApp/email) = intent signal only.

## 6. Meta Pixel readiness

The code exists (`Analytics.tsx`) and is inactive without `NEXT_PUBLIC_META_PIXEL_ID`. No placeholder ID. Events once enabled: PageView, Contact, Lead. No Conversions API (no server path; dedup not needed). No consent banner exists. Whether one is needed for the target markets is an owner/legal decision. Status: Blocked pending ID and decision.

## 7. City pages

Matrix in the CSV. Recommendation: keep all five for now. They are not near-duplicates and are not yet crawled, so there is no traffic evidence. Consolidate the four non-Delhi pages into `/areas` if no real local case work exists by 15 Dec 2026. No URL changes were made.

## 8. Table of contents

Guides render the TOC twice: a desktop `<nav class="hidden lg:block">` and a mobile `<details class="lg:hidden">`. `display:none` removes the hidden copy from the accessibility tree. Neither copy has `id` attributes; headings carry the IDs once. No CLS (CLS 0 in Lighthouse). axe finds 0 violations. Not a defect; no change.

## 9. Full-site validation

Run on the build that includes this pass's changes:
- `test:site`: ALL OK on 39 URLs (status, H1, title/description, canonical, JSON-LD, heading order, axe WCAG 2.2 AA, overflow at 4 widths, console, internal links, 404).
- typecheck, lint, unit: pass.
- Sitemap: 39 URLs, now with accurate per-page `lastmod` (12 URLs dated 15 Oct).
- `docs/audit` is not served by the site (outside `public/`). The GitHub repo is public, so the reports are readable there. Nothing secret in them; the owner may still prefer a private repo.

## 10. Release readiness

Local diff vs `ff1acb6` (uncommitted):

| File | Change |
|---|---|
| `src/app/page.tsx` | Automation heading no longer absolute |
| `src/lib/automation.ts` | YouTube spam wording |
| `src/lib/content.ts` | FAQ wording; 10M+ and 32.7× labels |
| `src/components/site/Results.tsx` | Per-card "Figures as of" date |
| `src/app/sitemap.ts` | Per-page `lastmod` |
| `src/lib/guides.ts` | Followers guide `updated` date → 15 Oct (its figures changed) |
| `docs/audit/2026-10-15/…` | This report, CSVs, SEO deliverables |

Impact on deploy: visible copy changes on home, automation/YouTube, case-study cards and the followers guide; no tracking or privacy behaviour change.

Rollback: `git revert <new commit>` and push, or promote the previous deployment in Vercel.

Release command after approval: commit, then `git push origin main`.

## 11. Owner decisions required

1. Confirm the Saini figures and written permission for every client's published numbers.
2. City pages: accept "keep until 15 Dec" or decide now.
3. GA4: mark `generate_lead` as a key event; check Realtime.
4. Meta Pixel ID, and a consent decision for marketing tags.
5. Privacy: retention period and whether to name Supabase/Vercel/Google as processors (legal review).
6. Approve the release of this pass.
