# Social ScaleX

Marketing site and internal CRM for Social ScaleX, a social media marketing
agency in Delhi NCR. React + Vite frontend, Supabase (Postgres) behind it.

- **Marketing site** — public homepage at `/`, plus `/privacy` and `/terms`. The
  contact form writes enquiries straight into the database.
- **CRM** — staff-only, at `/crm`. Leads list with server-side search, paging and
  filters; lead detail with an activity log; a website-enquiry queue that
  converts an enquiry into a lead in one transaction.

## Getting started

```bash
npm install
cp .env.example .env.local     # fill in the two VITE_ values
npm run dev                    # http://localhost:5173
```

Without `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` the marketing site
still renders, but anything touching Supabase — the contact form, all of `/crm`
— fails with an explicit error rather than pretending to work. Vite reads env at
startup, so restart after editing `.env.local`.

To get a database to point at, see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

| Command | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | `tsc --noEmit` then a production build into `dist/` |
| `npm run typecheck` | Types only |
| `npm run test:unit` | Pure-function checks (esbuild + node; no test runner) |
| `npm run preview` | Build, then serve `dist/` locally |
| `bash supabase/test/verify_local.sh` | Apply every migration to a throwaway Postgres and run the SQL check suite |

## Architecture

```
src/
├─ main.tsx, app/routes.tsx     Router. The whole CRM tree is React.lazy.
├─ app/Root.tsx                 Marketing homepage; sections below it
│  └─ components/sections/      Hero, Services, Work, Contact, …
├─ app/crm/                     CRM: auth, leads, enquiries, dashboard
├─ app/components/ui/           shadcn/ui primitives (CRM only)
├─ lib/supabase.ts              THE browser client — see the bundle note
└─ styles/                      Tailwind v4; crm.css scopes shadcn tokens
supabase/migrations/            Schema record of truth, applied in order
supabase/test/                  Local proof harness (never point at production)
scripts/                        Keepalive + unit-test runner
```

**The bundle rule.** Importing `src/lib/supabase.ts` creates the client and
touches `localStorage`. The marketing homepage must never pull it into its
initial chunk, so every path to it is a dynamic `import()`:

- The CRM tree is `React.lazy`, so `/crm` code never reaches a visitor.
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

Vercel, from `main`. `vercel.json` rewrites all paths to `index.html` for
client-side routing. `.github/workflows/keepalive.yml` pings the database every
3 days so the free-tier Supabase project doesn't pause — including a warning
about how that can die silently.

## Attribution

Third-party assets and licences: [ATTRIBUTIONS.md](ATTRIBUTIONS.md). SEO notes:
[SEO.md](SEO.md).
