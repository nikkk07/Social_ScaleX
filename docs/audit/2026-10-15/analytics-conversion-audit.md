# Analytics and conversion audit — 15 Oct 2026

| Item | State | Evidence |
|---|---|---|
| GA4 tag | Live, ID `G-NHKELQXBY6`, one tag | Live HTML contains the ID; `src/components/seo/Analytics.tsx` renders gtag once (`lazyOnload`) |
| Page views | GA4 `config` sends the first page_view; Enhanced measurement "page changes based on browser history" covers client-side navigation | No manual page_view in code, so no duplicates |
| Meta Pixel | Not live (no ID yet); PageView on load + on route change when set | Code |
| `contact_click` | `{ method: phone, whatsapp or email, page_path }` on tel:, wa.me, mailto: clicks | Browser test with test IDs: fired for phone and WhatsApp, not for an internal link |
| `generate_lead` | `{ method: website_form, page_path }` only after the enquiry is stored | Code path after `result.ok`; not browser-tested to avoid a fake lead |
| Pixel events | `Contact` (clicks), `Lead` (form) | Same tests |
| PII | None sent: no name, phone or message in events or URLs | `src/lib/track.ts` |
| Internal traffic | `/crm` and `/login` never tracked | `Analytics.tsx` |
| Privacy text | Describes GA4/Pixel only when their IDs are set; mentions click counting | `src/app/privacy/page.tsx` |

Conversion definitions: `generate_lead` = lead (mark as key event).
`contact_click` = intent signal, not a lead; keep it out of key events.

Owner steps, not done here (no GA access): GA4 Admin → Events → mark
`generate_lead` as key event; check Realtime after visiting the site; optional
internal-traffic filter for your own IP. Pixel: add `NEXT_PUBLIC_META_PIXEL_ID`
in Vercel and redeploy.

Note: Enhanced measurement "Outbound clicks" also logs WhatsApp clicks as
`click`; that is a separate event, not a duplicate of `contact_click`.
