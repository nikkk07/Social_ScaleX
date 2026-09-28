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
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | — | ✅ | Browser client. Project REST URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | — | ✅ | Browser client. Public anon key. |
| `SUPABASE_URL` | — | ✅ | optional | `scripts/keep_alive.py`. |
| `SUPABASE_ANON_KEY` | — | ✅ | optional | `scripts/keep_alive.py`. |
| `RENDER_URL` | — | optional | optional | Only if a Render service ever exists. Absent = skipped. |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ (server-only) | — | ✅ | `/api/auth/sign-in` and `/api/crm/*`: staff accounts, passwords, sign-in by phone. |

**The `NEXT_PUBLIC_` prefix is load-bearing.** Next.js only exposes variables
with that prefix to the browser bundle, and it does it by literal text
substitution at build time — so they must be read as full expressions
(`process.env.NEXT_PUBLIC_SUPABASE_URL`), never destructured. That is also the
warning: *everything* with that prefix is publicly readable in the built
JavaScript. Never invent a `NEXT_PUBLIC_`-prefixed secret.

There is one more optional browser variable, `NEXT_PUBLIC_SITE_URL`. It sets
the canonical origin for every absolute URL the site emits — canonical tags, OG
URLs, JSON-LD `@id`s, `sitemap.xml`, `robots.txt` and `llms.txt`. Leave it
unset to fall back to the Vercel deployment URL. Setting it is the entire
domain cutover; see §7.

### Setting them

- **Vercel** — Project → Settings → Environment Variables. Add both `NEXT_PUBLIC_`
  variables to Production, Preview, and Development. Next.js reads env at **build**
  time, so changing one requires a redeploy, not just a restart.
- **GitHub** — Settings → Secrets and variables → Actions → New repository
  secret. Add `SUPABASE_URL` and `SUPABASE_ANON_KEY`. Add `RENDER_URL` only if
  such a service exists.
- **Local** — `cp .env.example .env.local` and fill in the two `NEXT_PUBLIC_` values.
  `.env.local` is gitignored. Restart the dev server after editing it.

### The anon key, and the service-role key

The **anon key is public by design.** It ships in the JavaScript bundle, and
anyone can read it out of the page. That is safe here because Row Level Security
is the actual gate — see `supabase/README.md` for the full model.

The **`service_role` key bypasses RLS.** Since CRM v2 it is needed, **server-side
only**, by the `/api` routes that create staff accounts, reset passwords and
resolve phone sign-in — each of which first verifies the caller's session and
role. Put it in Vercel as `SUPABASE_SERVICE_ROLE_KEY` (never `NEXT_PUBLIC_`),
never in GitHub secrets, never in the repo or a screenshot. If it leaks, rotate
it in the Supabase dashboard immediately.

Verify before every deploy (the bundle must not contain it):

```bash
git grep -n "eyJ" -- ':!*.md' ':!supabase/test'     # expect nothing
npm run build && grep -rEl 'service_role' .next/static/ # expect nothing
```

---

## 2. Applying migrations

See **[supabase/README.md](../supabase/README.md)** — `supabase/migrations/`
holds 090012 (schema), 090013 (functions) and 090014 (security). The one-time
upgrade of the live database, the backup step and the rollback copy
(`crm_backup` schema) are described there. The pre-v2 files live in
`supabase/migrations_archive/` for history only.

`supabase/seed.sql` is **dev-only** fictional data — never run it against
production.

---

## 3. Adding a team member

In the CRM: **Team → Add member** (owners can add any role, admins add
members). Enter name, email and/or mobile number, role, daily lead quota and a
password (or press Generate), then share the password with them privately. They
sign in with their email **or** mobile number — no OTP, no email needed.

- Forgotten password: an owner/admin opens **Team → ⋯ → Edit / reset password**.
- Someone leaves: **Deactivate** (instant; keeps history; their open leads go
  back to the pool). Owners can also **Delete permanently**.
- People can change their own password under **My account**.

---

## 4. Manual dashboard settings

These are not in migrations and are lost if the project is recreated. Do all of
them once, and re-check after any restore.

- **Authentication → Sign In / Providers: turn off "Allow new users to sign up".**
  Keep the Email provider enabled — staff sign in with it. A self-signup would
  get no profile and therefore no data, so this is defence in depth.
- **Authentication → URL Configuration:**
  - Site URL → the production domain.
  - Redirect allow-list → production domain, the Vercel preview pattern
    (`https://*-<team>.vercel.app`), and `http://localhost:3000`.
- No SMTP is required: accounts and passwords are managed inside the CRM.

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
   setting (§4), and create the first owner: Authentication → Users → Add
   user (email + password, auto-confirm), then in the SQL editor
   `update auth.users set raw_app_meta_data = raw_app_meta_data || '{"crm_role":"owner","full_name":"Your Name"}' where email = 'you@…';`
   — that creates their CRM profile. Add everyone else from Team in the CRM. The anon key and project URL will be **new** — update them in
   Vercel and in GitHub secrets, then redeploy so the bundle picks them up.
4. Confirm the keepalive works again: Actions → Supabase keepalive → Run
   workflow, and check `select count(*) from public.keepalive;` increased.
5. Fix the reason it paused before walking away, or it will pause again.

---

## 7. Known, accepted gaps

Written down so they're decisions rather than surprises.

- **The contact form's rate limiting is client-side only.** The honeypot and the
  throttle in `src/components/sections/submitEnquiry.ts` live in the
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
