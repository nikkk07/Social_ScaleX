# Deployment

Everything needed to stand this project up, keep it up, and bring it back if it
falls over. Frontend on **Vercel**, database on **Supabase** (Mumbai,
`ap-south-1`), keepalive on **GitHub Actions**.

---

## 1. Environment variables

Three destinations. Nothing is shared between them by accident — the names
differ on purpose so a browser variable can never be mistaken for a CI one.

| Variable | Vercel | GitHub secrets | local `.env.local` | What it's for |
|---|:--:|:--:|:--:|---|
| `VITE_SUPABASE_URL` | ✅ | — | ✅ | Browser client. Project REST URL. |
| `VITE_SUPABASE_ANON_KEY` | ✅ | — | ✅ | Browser client. Public anon key. |
| `SUPABASE_URL` | — | ✅ | optional | `scripts/keep_alive.py`. |
| `SUPABASE_ANON_KEY` | — | ✅ | optional | `scripts/keep_alive.py`. |
| `RENDER_URL` | — | optional | optional | Only if a Render service ever exists. Absent = skipped. |

**The `VITE_` prefix is load-bearing.** Vite only exposes variables with that
prefix to the bundle. That is also the warning: *everything* with that prefix is
publicly readable in the built JavaScript. Never invent a `VITE_`-prefixed
secret.

### Setting them

- **Vercel** — Project → Settings → Environment Variables. Add both `VITE_`
  variables to Production, Preview, and Development. Vite reads env at **build**
  time, so changing one requires a redeploy, not just a restart.
- **GitHub** — Settings → Secrets and variables → Actions → New repository
  secret. Add `SUPABASE_URL` and `SUPABASE_ANON_KEY`. Add `RENDER_URL` only if
  such a service exists.
- **Local** — `cp .env.example .env.local` and fill in the two `VITE_` values.
  `.env.local` is gitignored. Restart the dev server after editing it.

### The anon key, and the one that must never appear

The **anon key is public by design.** It ships in the JavaScript bundle, and
anyone can read it out of the page. That is safe here because Row Level Security
is the actual gate: anon can `INSERT` into `inbound_enquiries` and `EXECUTE`
`ping_keepalive()`, and has no other rights on anything. See
`supabase/README.md` for the full grant table.

The **`service_role` key bypasses RLS entirely.** It must never appear in this
repository, in Vercel, in GitHub secrets, in a `VITE_` variable, or in a
screenshot. There is no feature in this project that needs it. If you find one
committed, rotate it in the Supabase dashboard immediately — treat it as
compromised the moment it lands anywhere version-controlled.

Verify before every deploy:

```bash
git grep -i service_role          # expect only the .env.example warning
npm run build && grep -rEi 'service_role|eyJ[A-Za-z0-9_-]{20,}' dist/ | grep -v "$VITE_SUPABASE_ANON_KEY"
```

---

## 2. Applying migrations

`supabase/migrations/` is the record of truth. Apply **in ascending filename
order** — later files depend on earlier ones.

| File | What it does |
|---|---|
| `…090001_enums_and_tables.sql` | Enums, tables, base CHECKs |
| `…090002_indexes.sql` | Indexes incl. the trigram search indexes |
| `…090003_functions_and_triggers.sql` | Role helpers, gated signup, status triggers |
| `…090004_rls_policies.sql` | RLS + explicit grants |
| `…090005_create_lead_with_contacts.sql` | Atomic lead-creation RPC |
| `…090006_rls_hardening.sql` | Default-privilege lockdown, keepalive RPC |
| `…090007_keepalive_volume_bound.sql` | Volume-bounds the heartbeat table |
| `…090008_update_lead_with_contacts.sql` | Replace-children update RPC |
| `…090009_normalisation_invariants.sql` | Handle/phone normalisation as DB guarantees |
| `…090010_enquiry_conversion.sql` | Atomic enquiry→lead conversion, dashboard indexes |
| `…090011_enquiry_input_bounds.sql` | Caps what an anonymous visitor can write |

**Option A — SQL editor (what we use).** Open each file in order and run it.
Several carry pre-flight blocks that abort with a readable message if existing
rows would violate a new constraint; read the message rather than forcing past it.

**Option B — Supabase CLI.**

```bash
supabase link --project-ref <ref>
supabase db push
```

### `seed.sql` is DEV-ONLY

`supabase/seed.sql` inserts ten fictional leads, contacts, phones, and
enquiries. **Never run it against production.** It is for a local harness run or
a scratch project only. Nothing in it is real, and the fixed UUIDs would collide
confusingly with real data.

### Proving migrations without a cloud project

```bash
bash supabase/test/verify_local.sh
```

Spins up a throwaway local Postgres via `initdb` (no Docker, no Supabase CLI),
applies every migration plus the seed, and runs the check suite. **Expect many
`ERROR:` lines** — they are the "expect BLOCKED" assertions, and the script runs
with `ON_ERROR_STOP=0` so a blocked operation prints and continues. Judge it by
whether the reported row counts match the `expect …` note above each one. Never
point this at a real project.

---

## 3. Adding a team member

Signup is gated in the database: `handle_new_user()` raises unless the email is
already allow-listed, so an unlisted person cannot get in even if public signups
were somehow enabled.

1. **Allow-list the email** (owner/admin), in the SQL editor:

   ```sql
   insert into public.allowed_emails (email, role)
   values ('newhire@socialscalex.com', 'member');
   ```

   Roles: `owner`, `admin`, `member`. Only owner/admin may archive leads or
   change roles.

2. **Invite them** — Authentication → Users → *Invite user*. On first sign-in the
   trigger creates their `profiles` row with the allow-listed role.

To remove someone: delete their `auth.users` row and their `allowed_emails` row.
Their leads stay (`owner_id` is `on delete set null`), showing as unassigned.

---

## 4. Manual dashboard settings

These are not in migrations and are lost if the project is recreated. Do all of
them once, and re-check after any restore.

- **Authentication → Providers/Settings: disable public sign-ups.** The trigger
  is the real gate; this is defence in depth.
- **Authentication → URL Configuration:**
  - Site URL → the production domain.
  - Redirect allow-list → production domain, the Vercel preview pattern
    (`https://*-<team>.vercel.app`), and `http://localhost:5173`. Password
    resets and magic links break without these.
- **Authentication → Email:** configure SMTP, or invites and resets never send.
- Seed the first `owner` into `allowed_emails`, then invite yourself.

---

## 5. Keeping Supabase awake

A free-tier project pauses after roughly **7 days of insufficient database
activity**, and the free plan has **no backup retention**.

Traffic to the marketing site does **not** count. The site is static files off
Vercel's CDN and never touches Postgres. Only a real database operation counts,
which is what `public.ping_keepalive()` performs.

`.github/workflows/keepalive.yml` runs `scripts/keep_alive.py` every 3 days. It
calls the RPC with the **anon** key — not a table write, since anon has held no
grant on `public.keepalive` since migration 090006.

### The failure mode to actually worry about

**GitHub disables scheduled workflows after roughly 60 days of no commit
activity in the repository.** It doesn't fail; it stops, with only an easily
missed email. Repo goes quiet → keepalive stops → Supabase pauses days later.

Set up an independent monitor as a second line of defence — cron-job.org or
UptimeRobot, free tier, every 3 days:

```
POST https://<project-ref>.supabase.co/rest/v1/rpc/ping_keepalive
apikey: <anon key>
Authorization: Bearer <anon key>
Content-Type: application/json
Body: {}
```

Handing the anon key to a third-party monitor grants it nothing it could not
already do — the key is in the public bundle, and `ping_keepalive` is the only
function anon may execute.

Run it by hand any time from Actions → Supabase keepalive → Run workflow.

---

## 6. Restoring a paused Supabase project

1. Open the project in the Supabase dashboard. A paused project shows a
   **Restore** button. Restoring takes a few minutes.
2. **Verify the data survived.** On the free plan there are no backups behind a
   restore, so confirm before assuming:

   ```sql
   select count(*) from public.leads;
   select count(*) from public.inbound_enquiries;
   select count(*) from public.profiles;
   ```

3. If the project had to be **recreated** rather than restored, the data is
   gone. Re-apply all migrations in order (§2), redo every manual dashboard
   setting (§4), re-seed `allowed_emails` with the first owner, and re-invite
   the team. The anon key and project URL will be **new** — update them in
   Vercel and in GitHub secrets, then redeploy so the bundle picks them up.
4. Confirm the keepalive works again: Actions → Supabase keepalive → Run
   workflow, and check `select count(*) from public.keepalive;` increased.
5. Fix the reason it paused before walking away, or it will pause again.

---

## 7. Known, accepted gaps

Written down so they're decisions rather than surprises.

- **The contact form's rate limiting is client-side only.** The honeypot and the
  throttle in `src/app/components/sections/submitEnquiry.ts` live in the
  browser, so anyone POSTing the REST endpoint directly walks past both. A
  Postgres `CHECK` cannot express "N per hour", and there is no edge function in
  this stack. What makes the gap survivable is migration 090011: every enquiry
  row is size-capped, so an attacker can create many rows but not large ones,
  and `inbound_enquiries` is the only table anon may write. If enquiry spam ever
  becomes real, the fix is a Supabase Edge Function or Cloudflare Turnstile in
  front of the insert — not loosening the database.
- **No backups on the free plan.** Migrations reconstruct the *schema*; nothing
  reconstructs the *data*. Anything that matters should be exported (the CRM's
  CSV export covers leads).
- **The keepalive depends on repo activity** unless the external monitor in §5
  is configured. It is not configured by this repo.
