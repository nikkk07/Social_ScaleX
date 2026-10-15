# Claims and conversion tracking register — 15 Oct 2026

Quantitative claims: `../client-metrics-and-permissions-register.csv` (12 claims;
Saini figures are an owner assertion; permission records are missing for all
clients).

| CTA / form | Location | Event | Counts as | Verified |
|---|---|---|---|---|
| Enquiry form submit (stored) | /contact, lead sections on most pages | GA4 `generate_lead`, Pixel `Lead` | Lead (key event) | Code + controlled browser test; GA account side blocked |
| Phone link | header, footer, about, lead section, mobile bar | `contact_click {method: phone}`, Pixel `Contact` | Intent only | Browser test |
| WhatsApp link | hero, service/automation pages, footer, success state | `contact_click {method: whatsapp}` | Intent only | Browser test |
| Email link | where present | `contact_click {method: email}` | Intent only | Unit test |
| Invalid / failed form | — | none | — | Browser test |

No PII in any event (checked). Qualified-lead and meeting tracking require the
CRM (Supabase `inbound_enquiries`) to be reviewed by hand; that isn't automated.
