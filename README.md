# Social ScaleX

Marketing site and internal CRM for Social ScaleX, a social media marketing
agency in Delhi NCR. Next.js 14 (App Router) frontend, Supabase (Postgres)
behind it.

- **Marketing site** — statically generated pages at `/`, `/services`,
  `/case-studies`, `/about`, `/privacy` and `/terms`. The contact form writes
  enquiries straight into the database.
- **CRM** — staff-only, at `/crm`. Leads list with server-side search, paging and
  filters; lead detail with an activity log; a website-enquiry queue that
  converts an enquiry into a lead in one transaction.

## Getting started

```bash
npm install
cp .env.example .env.local     # fill in the two NEXT_PUBLIC_ values
npm run dev                    # http://localhost:3000
```

Without `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` the
marketing site still renders, but anything touching Supabase — the contact
form, all of `/crm` — fails with an explicit error rather than pretending to
work. Next.js reads env at startup, so restart after editing `.env.local`.

To get a database to point at, see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

| Command | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build into `.next/` (typechecks as it goes) |
| `npm run typecheck` | Types only |
| `npm run test:unit` | Pure-function checks (esbuild + node; no test runner) |
| `npm run test:layout` | Browser geometry assertions against a running server (`BASE_URL` to point elsewhere, `VERBOSE=1` to list every check) |
| `npm run start` | Serve the production build locally |
| `bash supabase/test/verify_local.sh` | Apply every migration to a throwaway Postgres and run the SQL check suite |

## Architecture

```
src/
├─ app/                         Next routes ONLY — nothing else lives here
│  ├─ layout.tsx                Fonts, site metadata, Organization + WebSite JSON-LD
│  ├─ page.tsx                  Homepage
│  ├─ services|case-studies|about|privacy|terms/
│  ├─ (crm)/                    /login and /crm/* — every page noindex
│  ├─ robots.ts, sitemap.ts     Generated from lib/site.ts
│  └─ llms.txt/route.ts         Generated from lib/content.ts
├─ components/
│  ├─ sections/                 Hero, Services, Work, FAQ, Contact, …
│  ├─ seo/JsonLd.tsx            Server-rendered structured data
│  ├─ crm/CrmPage.tsx           The one ssr:false boundary
│  └─ ui/                       shadcn/ui primitives (CRM only)
├─ crm/                         CRM feature code: auth, leads, enquiries
├─ lib/
│  ├─ site.ts                   THE host + contact details. One place.
│  ├─ content.ts                THE marketing copy. Pages AND schema read it.
│  ├─ schema.ts                 JSON-LD builders
│  ├─ router.tsx                react-router → App Router compatibility layer
│  └─ supabase.ts               THE browser client — see the bundle note
└─ styles/                      Tailwind v4; crm.css scopes shadcn tokens
supabase/migrations/            Schema record of truth, applied in order
supabase/test/                  Local proof harness (never point at production)
scripts/                        Keepalive + unit-test runner
```

**The content rule.** `src/lib/content.ts` is the single source for services,
case studies, FAQs and metrics. Page copy, every JSON-LD node and `/llms.txt`
all render from it. Structured data that claims something the visible page does
not say gets the markup discounted, and rendering both from one object is the
only way to keep them identical. Edit copy there, never in a component.

**The rendering rule.** Marketing pages are server components and ship almost
no JavaScript — entrance animations are CSS (`.reveal` / `.rise-in` in
`theme.css`), and the FAQ is `<details>`, not an accordion that unmounts its
own answers. This is not a micro-optimisation: GPTBot, ClaudeBot, PerplexityBot
and CCBot do not execute JavaScript, so anything rendered client-side is
invisible to them. Only `Navbar`, `AnimatedCounter` and the contact form are
client components.

**The bundle rule.** Importing `src/lib/supabase.ts` creates the client and
touches `localStorage`. The marketing homepage must never pull it into its
initial chunk, so every path to it is a dynamic `import()`:

- The CRM tree sits behind one `next/dynamic({ ssr: false })` boundary, so
  `/crm` code never reaches a marketing visitor and never runs during `next
  build` (where the env vars and `localStorage` do not exist).
- `useSession` (marketing nav) checks a `localStorage` key synchronously first;
  an anonymous visitor has no such key, so the client is never fetched.
- The contact form fetches it on **first focus of a form field** — not at module
  scope and not on idle, so someone who scrolls past pays nothing.

Verified by measurement, not by reading the source: see the netlog method in the
Phase 8 notes. An anonymous visitor who touches nothing transfers **no**
`supabase-*.js`.

## Database

Row Level Security is the gate; grants are managed explicitly as a second layer,
and every constraint that matters lives in Postgres rather than in TypeScript.
`anon` may insert into `inbound_enquiries` and execute `ping_keepalive()` —
nothing else, anywhere.

Full grant table, invariants and the rationale for each: **[supabase/README.md](supabase/README.md)**.

Deployment, environment variables, team invites, keepalive and disaster
recovery: **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)**.

### Running the SQL harness

```bash
bash supabase/test/verify_local.sh
```

No Docker and no Supabase CLI needed — it spins up a throwaway Postgres with
`initdb`, replicates the Supabase-provided bits (`anon`/`authenticated` roles,
`auth.uid()`), applies every migration plus `seed.sql`, and runs the checks.

**Expect a lot of `ERROR:` lines.** They are the "expect BLOCKED" assertions:
the script runs with `ON_ERROR_STOP=0` so a blocked operation prints its real
error and the run continues. Read it by checking each reported row count against
the `expect …` note printed above it. Never run it against a real project.

## Deployment

Vercel, from `main`, detected as a Next.js project — `vercel.json` only
declares the framework; routing is Next's own. The marketing pages are
prerendered at build time; `/crm/leads/[id]` and its `/edit` sibling are the
only server-rendered routes, and both render a client-only shell.
`.github/workflows/keepalive.yml` pings the database every
3 days so the free-tier Supabase project doesn't pause — including a warning
about how that can die silently.

## Attribution

Third-party assets and licences: [ATTRIBUTIONS.md](ATTRIBUTIONS.md). SEO notes:
[SEO.md](SEO.md).
