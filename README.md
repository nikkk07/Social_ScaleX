# Social ScaleX

Marketing site and internal CRM for Social ScaleX, a social media marketing
agency in Delhi NCR. Next.js 14 (App Router) frontend, Supabase (Postgres)
behind it.

- **Marketing site** — statically generated pages at `/`, `/services`,
  `/case-studies`, `/about`, `/privacy` and `/terms`. The contact form writes
  enquiries straight into the database.
- **CRM** — staff-only, at `/crm`. Today view, Follow-ups (call-backs,
  meetings, retries), Leads (list + pipeline board), lead timeline, the
  call/WhatsApp **outcome pop-up** that drives the whole pipeline, quotations,
  website enquiries, Insights, Team and Settings. Sign-in is email **or** phone
  + password (no OTP); owners/admins create accounts and reset passwords.

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
| `npm run lint` | ESLint at `--max-warnings 0`; non-interactive, and a release gate |
| `npm run test:unit` | Pure-function checks (esbuild + node; no test runner) |
| `npm run test:layout` | Browser geometry assertions against a running server (`BASE_URL` to point elsewhere, `VERBOSE=1` to list every check) |
| `npm run start` | Serve the production build locally |
| `npm run test:db` | 71 end-to-end checks of the database layer (RLS, workflow RPCs) against a **local** Supabase (`npx supabase start`) |

### The four gates

Nothing ships unless all four pass. `lint` is one of them: it runs at
`--max-warnings 0`, so a warning is a failure, and it never prompts.

```
npm run build && npm run typecheck && npm run lint && npm run test:unit
npm run start &          # test:layout drives a real browser
npm run test:layout
```

Vendored code (`src/components/ui/`, `src/components/figma/`, `src/imports/`)
is ignored by ESLint rather than rewritten; those are exports we do not own.


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
│  ├─ crm/CrmRoot.tsx           The one ssr:false boundary (mounted by (crm)/layout.tsx)
│  └─ ui/                       shadcn/ui primitives (CRM only)
├─ crm/                         CRM app: auth, outcome pop-up, today, follow-ups, leads,
│                               enquiries, team, insights, settings (CrmApp.tsx routes)
├─ lib/
│  ├─ site.ts                   THE host + contact details. One place.
│  ├─ content.ts                THE marketing copy. Pages AND schema read it.
│  ├─ schema.ts                 JSON-LD builders
│  ├─ router.tsx                react-router → App Router compatibility layer
│  ├─ supabase.ts               THE browser client — see the bundle note
│  ├─ crm/normalize.ts          Phone / Instagram / password rules (mirrors SQL)
│  └─ server/crmServer.ts       Service-role client + caller auth for /api routes
└─ styles/                      Tailwind v4; crm.css scopes shadcn tokens
supabase/migrations/            Schema record of truth (090012–090014 = CRM v2)
supabase/migrations_archive/    The pre-v2 migrations, kept for history only
supabase/test/                  crm_v2.e2e.mjs (local Supabase only)
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

### Testing the database layer

```bash
npx supabase start          # local stack in Docker
npx supabase db reset       # applies supabase/migrations + seed.sql
SUPABASE_ANON_KEY=… SUPABASE_SERVICE_ROLE_KEY=… npm run test:db
```

The script refuses to run against anything but `127.0.0.1`/`localhost`.

## Deployment

Vercel, from `main`, detected as a Next.js project — `vercel.json` only
declares the framework; routing is Next's own. The marketing pages are
prerendered at build time; the CRM is one client-only app mounted by
`src/app/(crm)/layout.tsx`, and the `/api` routes run on the Node runtime.
The CRM needs `SUPABASE_SERVICE_ROLE_KEY` set in Vercel (server-only).
`.github/workflows/keepalive.yml` pings the database every
3 days so the free-tier Supabase project doesn't pause — including a warning
about how that can die silently.

## Attribution

Third-party assets and licences: [ATTRIBUTIONS.md](ATTRIBUTIONS.md). SEO notes:
[SEO.md](SEO.md).
