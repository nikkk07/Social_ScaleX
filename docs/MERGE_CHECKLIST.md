# Merge checklist — `redesign/minimal-glass` → `main`

One-time cutover. This branch is not a visual refresh: it replaces the landing page,
adds an internal CRM at `/login` and `/crm`, and makes the contact form actually
write somewhere. `main` has never touched Postgres; after this merge, production does.

Read §1 **before** you press merge — two of those steps are irreversible in the sense
that getting them wrong ships a broken production build, not a rolled-back one.
Ongoing operational detail (restoring a paused project, adding a team member, the
full env-var table) lives in [`DEPLOYMENT.md`](./DEPLOYMENT.md); this file is only
the cutover.

---

## 1. Before you merge

### 1.1 Vercel environment variables — do this first

Project → Settings → Environment Variables. Add both to **Production** (and Preview
and Development while you're there):

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<project-ref>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | the `eyJ…` anon key |

**Order matters and it is not recoverable by waiting.** Next.js inlines `NEXT_PUBLIC_`
variables at **build** time. Merging triggers a production build immediately; if the
variables aren't there when that build runs, the bundle ships with them undefined and
stays broken until you set them *and* redeploy. Nothing self-heals on the next page
load. Set them, confirm they're saved, then merge.

The `service_role` key goes in none of these. It has no use in this project — see
DEPLOYMENT.md §1.

### 1.2 The build command changed

`package.json` on this branch runs `next build`, where `main` ran `vite build`.
`next build` typechecks as part of the build, so a type error that `main` would
have deployed now **fails the Vercel build**. That's intended, but it means the
first production build on this branch is the first one that can fail for a
reason the old one couldn't. Confirm locally before merging:

```bash
npm run typecheck
npm run test:unit
npm run build
```

### 1.3 Confirm no secret is in the bundle

```bash
git grep -i service_role          # expect only the .env.example warning
npm run build && grep -rEi 'service_role|eyJ[A-Za-z0-9_-]{20,}' .next/static/ | grep -v "$NEXT_PUBLIC_SUPABASE_ANON_KEY"
```

The anon key appearing in `.next/static/` is correct and expected. Anything else is not.

### 1.4 GitHub secrets for the keepalive

Settings → Secrets and variables → Actions → New repository secret:

| Secret | Value |
|---|---|
| `SUPABASE_URL` | same URL as above, **no** `NEXT_PUBLIC_` prefix |
| `SUPABASE_ANON_KEY` | same anon key, **no** `NEXT_PUBLIC_` prefix |

Leave `RENDER_URL` unset — the script skips it when absent.

The names deliberately differ from the Vercel pair so a browser variable can never be
mistaken for a CI one. The anon key is the right key here: `ping_keepalive()` is
`SECURITY DEFINER` with `EXECUTE` granted to anon.

**Why this belongs in the pre-merge list:** GitHub only runs `schedule:` triggers from
the **default branch**. `.github/workflows/keepalive.yml` exists on
`redesign/minimal-glass`, so its 3-day cron does not fire at all until the merge puts
it on `main`. Until then nothing is keeping the project awake, and a free-tier project
pauses after ~7 days of insufficient database activity.

---

## 2. Merge

Merge to `main` however you normally do. Prefer a **merge commit** over a squash —
§4's rollback depends on there being a single merge SHA to revert.

Watch the Vercel build. If it fails on types, fix forward on a branch; don't push
directly to `main`.

---

## 3. What changes for visitors

Worth knowing before someone asks why the site "lost" content.

**Three sections are gone from the landing page.** `<main>` goes from 11 rendered
sections to 8. Removed: `Marquee`, `Platforms`, `Results`. What remains, in order:
Hero → StatsBand → Work → Services → Process → WhyUs → FAQ → Contact, with Navbar and
Footer around it.

**No more WebGL.** `three`, `@react-three/fiber`, `@react-three/drei` and the
`LiquidScene` component are deleted; the background is CSS now. `lenis` is gone too,
so scrolling is the browser's own — no hijacked momentum, no scroll-position weirdness
on mobile, and the back button behaves. Also dropped: MUI + emotion, `react-slick`,
`react-dnd`, `react-icons`, `canvas-confetti`, masonry, popper. The homepage is
dramatically lighter; the CRM and the Supabase client are lazy-loaded and never enter
the marketing bundle.

**The contact form now works.** On `main` it is
`onSubmit={(e) => e.preventDefault()}` — every enquiry ever typed into the live site
was silently discarded. On this branch it writes to `public.inbound_enquiries`, which
is the one table an anonymous visitor may insert into. Enquiries appear in the CRM at
`/crm/enquiries`. Tell whoever answers enquiries that this is now a real inbox.

**Two new public routes.** `/login` and `/crm/*` become reachable on the production
domain. They're gated — signup is closed and `handle_new_user()` rejects any email not
in `allowed_emails` — but they are *visible*. `public/robots.txt` now carries
`Disallow: /crm` and `Disallow: /login`, so the login page stays out of search results
instead of surfacing on a search for the brand name. That is an indexing decision, not
a security one; auth is what keeps people out.

**The canonical host changed.** Every SEO reference pointed at `socialscalex.com`, a
domain nobody owns — canonical, `og:url`, `og:image`, `twitter:image`, five JSON-LD
`@id`/`url`/`publisher` fields, the `Sitemap:` line and all three `<loc>` entries. 13
references, all now `https://social-scalex.vercel.app`. This was live on `main` and
was actively harmful: a canonical pointing at a host that doesn't serve the site tells
Google to index *that* host, so the site ends up indexed nowhere. If you later buy a
domain, see §7 — they must all move together.

---

## 4. Rollback

`main` at `708ff44` is a clean revert point: it is the last commit before any of this
existed, it has no Supabase dependency, and it builds without the env vars.

**Fastest (no git):** Vercel → Deployments → the last pre-merge production deployment
→ *Promote to Production*. Seconds, and it doesn't touch the repo.

**In git:**

```bash
git revert -m 1 <merge-sha>     # -m 1 keeps main's side
```

**The asymmetry to understand before you rely on this:** rolling back the frontend
does **not** roll back the database. Applied migrations stay applied. That's harmless
— the `main` bundle never contacts Postgres, so the schema just sits there unused, and
re-merging later needs no database work.

What you do lose is the form. Enquiries submitted while the new site was live are safe
in `inbound_enquiries` and still visible in the SQL editor, but the reverted site goes
back to silently discarding new ones, with no error shown to the person submitting.
Don't leave a rollback in place longer than you have to, and check
`inbound_enquiries` for anything that arrived in the window.

---

## 5. Delete the seed rows

**Do this before anyone real sees the CRM.** `supabase/seed.sql` inserts ten fictional
leads (Nimbus Coffee Roasters, Peak & Pine Outdoors, …), their contacts and phones,
and three enquiries. Fake, but indistinguishable from real data at a glance in a
dashboard tile.

Every seed row uses a fixed UUID prefix, so cleanup is exact — no guessing by name:

```sql
-- Enquiries first: converted_lead_id is ON DELETE SET NULL, so deleting leads
-- first would quietly orphan the seed enquiry instead of removing it.
delete from public.inbound_enquiries where id::text like 'e0000000-%';

-- Leads cascade to lead_contacts, lead_phones and lead_activities.
delete from public.leads where id::text like 'a0000000-%';
```

Verify:

```sql
select
  (select count(*) from public.leads)              as leads,
  (select count(*) from public.lead_contacts)      as contacts,
  (select count(*) from public.lead_phones)        as phones,
  (select count(*) from public.lead_activities)    as activities,
  (select count(*) from public.inbound_enquiries)  as enquiries;
```

All five should be `0` on a project that has only ever held seed data.

Run these in the **SQL editor**, not from the app: RLS grants no `delete` on `leads`
to `authenticated` at all. Archiving via `deleted_at` is the app's only removal path,
and it's owner/admin-only. Deletion is deliberately a database-console action.

---

## 6. Post-merge smoke test

Against the **production URL**, not a preview. Roughly five minutes.

**Public site**
1. Homepage loads; background renders; no console errors.
2. Scroll the whole page — 8 sections, in the order in §3.
3. DevTools → Network, hard reload: no `three`/`@react-three` chunk, no Supabase
   chunk on first paint.
4. `/services`, `/case-studies`, `/about`, `/privacy` and `/terms` all load. A
   nonsense path like `/asdf` returns a real **404 status**, not the homepage —
   the old SPA answered 200 at every URL, which is a soft 404.
5. `/robots.txt`, `/sitemap.xml` and `/llms.txt` all serve with the right
   content type. All three are generated by route handlers now (`src/app/`),
   not static files in `public/`:
   ```bash
   curl -s https://social-scalex.vercel.app/robots.txt
   curl -s https://social-scalex.vercel.app/sitemap.xml | head -5
   curl -s https://social-scalex.vercel.app/llms.txt | head -5
   curl -so /dev/null -w '%{http_code}\n' https://social-scalex.vercel.app/asdf  # expect 404
   ```
   Expect the `Disallow: /crm` and `Disallow: /login` lines, and every URL on
   `social-scalex.vercel.app`. If you get HTML back, the rewrite is winning and
   crawlers see no directives at all.
6. View source on the homepage: `<link rel="canonical">` and the JSON-LD `@id`s all
   read `social-scalex.vercel.app`. No occurrence of `socialscalex.com` anywhere.

**Contact form — the one that actually proves the merge**
7. Submit a **callback** enquiry with an obviously test name.
8. Submit a **query** enquiry.
9. Confirm both landed:
   ```sql
   select id, kind, name, created_at from public.inbound_enquiries
   order by created_at desc limit 5;
   ```
   If these rows don't appear, it is almost always §1.1 — the build went out without
   the env vars. Set them and **redeploy**; saving them alone does nothing.

**CRM**
10. `/login` in a private window. Sign in with the owner account from setup step 7.
11. `/crm` dashboard renders; the tiles count your two test enquiries.
12. `/crm/enquiries` lists them. Convert one to a lead — the lead appears and the
    enquiry shows as converted.
13. Open the lead, edit a contact, save, reload — the change persisted.
14. Sign out. Hit `/crm` directly: you're bounced to `/login`.

**Security**
15. Private window, signed out, `/crm` → redirected, no data visible.
16. View source / search the bundle for `service_role` → nothing.

**Keepalive**
17. Actions → *Supabase keepalive* → **Run workflow** (the `workflow_dispatch`
    trigger exists for exactly this). Run it once by hand now rather than waiting up
    to 3 days to discover a bad secret.
18. Confirm it wrote:
    ```sql
    select count(*), max(created_at) from public.keepalive;
    ```
    `max(created_at)` should be seconds old. A green workflow with no new row means
    the secrets are set but wrong — check for a trailing newline in the pasted key.

**Cleanup**
19. Delete the test enquiries and any lead you converted from them, using the same
    SQL-editor deletes as §5.

---

## 7. After the cutover

Not blocking, but don't lose track of them:

- **Set up the external keepalive monitor** (DEPLOYMENT.md §5). GitHub disables
  scheduled workflows after ~60 days of repo inactivity — silently, with one easy-to-
  miss email. The workflow in this repo cannot protect against its own repo going
  quiet.
- ~~**Convert the social preview image.**~~ **DONE.** `public/og-image.png` is
  committed at exactly 1200×630. Regenerate after editing the SVG with `npm run og`,
  which renders in headless Chromium and asserts the dimensions.

  Note for anyone tempted by the obvious macOS one-liner: `qlmanage -t` pads its
  thumbnail to a square and emits 1200×1200 without warning. It was in this
  checklist and it was wrong.
- **When a real domain is bought, set one environment variable.** This used to be a
  13-reference find-and-replace across `index.html`, `robots.txt` and `sitemap.xml`,
  with a warning about doing them in one commit. It is now
  `NEXT_PUBLIC_SITE_URL=https://newdomain.com` (no trailing slash) in Vercel →
  Settings → Environment Variables, applied to Production, Preview and Development.

  Everything absolute derives from it through `src/lib/site.ts`: canonical tags, OG
  and Twitter URLs, every JSON-LD `@id`, `sitemap.xml`, `robots.txt` and `llms.txt`.
  They cannot drift apart any more, because there is only one of them. Next.js
  inlines it at build time, so **redeploy** after setting it — changing the variable
  alone does nothing.

  Still manual, and still in this order: add the domain in Vercel and confirm it
  resolves *before* the redeploy; redirect `www` to non-`www` (or the reverse — pick
  one); resubmit the sitemap in Search Console. The Supabase Site URL and redirect
  allow-list need the new host too, or password resets break.
- **Export something.** The free plan has no backups. Migrations rebuild the schema;
  nothing rebuilds the data. The CRM's CSV export covers leads.
- **The contact form's rate limiting is client-side only** — a known, accepted gap,
  bounded by the size caps in migration `090011`. See DEPLOYMENT.md §7 before deciding
  it's a bug.
