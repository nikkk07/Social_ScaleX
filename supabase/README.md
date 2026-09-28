# Social ScaleX CRM — database

Postgres on Supabase (project `hendwoizaxjhpwyaumsh`). `migrations/` is the
record of truth: **090012 schema → 090013 functions → 090014 security**.
`migrations_archive/` holds the pre-v2 files for history only — never apply them.

## Upgrading the live database (one time)

The live database was on an older, simplified schema. 090012 converts it in
place and keeps every row: each old table is first copied to the private
schema `crm_backup` (`*_pre_v2`), then mapped:

| Before | After |
|---|---|
| `leads.status`: new · called · interested · not_interested · not_reachable · callback · meeting_scheduled · converted · lost | `leads.stage`: new · connected · interested · lost · attempting · callback · meeting · won · lost |
| `leads.phone`, `leads.email` | a "Primary contact" in `lead_contacts` + an E.164 number in `lead_phones` (unparseable values go to the lead's notes) |
| `leads.assigned_to`, `lead_assignments` | `leads.owner_id` |
| `leads.is_deleted` | `leads.deleted_at` |
| `leads.callback_at` / `meeting_at` | open tasks in `lead_tasks` |
| `leads.costing` | `leads.deal_value_inr` |
| `lead_notes`, `lead_status_history` | the unified timeline `lead_activities` |
| `audit_logs`, `uploads` | `audit_log` |
| `profiles.role` `super_admin` | `owner` |

It was rehearsed against a copy of the live schema (from `supabase db dump`)
with legacy data, then the full 71-check suite was run on the result.

Steps:

1. **Back up** (Supabase → Database → Backups, or `npx supabase db dump --data-only -f backup.sql`).
2. Apply the three migrations — either
   - `npx supabase db push` (the repo is linked; it applies only 090012–090014), or
   - paste each file into the SQL Editor **in order** and run it. Each file is
     one transaction: it either applies completely or not at all.
3. Supabase → Authentication → Sign In / Providers: turn **off** "Allow new
   users to sign up". Keep the Email provider **on** (staff sign in with it).
4. Vercel → Environment Variables: add `SUPABASE_SERVICE_ROLE_KEY` (server-only).
5. Deploy. Sign in as an owner and check Team, Leads and Today.

When everything looks right, the backup copies can be dropped later with
`drop schema crm_backup cascade;` (only after you are sure).

## Security model

A hostile caller holding the public anon key is assumed.

| Who | Can |
|---|---|
| anon | insert website enquiries (size-bounded), call `ping_keepalive()` — nothing else |
| member | read/edit **only leads they own** (+ their contacts, phones, tasks, calls, quotes, timeline); read all enquiries; no direct writes to stage, owner, counters, tasks, calls or quotes |
| admin | everything on leads; manage members |
| owner | everything; manage admins and owners (the last active owner can't be removed) |
| deactivated staff | nothing, immediately (every policy checks `profiles.is_active`) |

- Pipeline state changes only through `SECURITY DEFINER` functions
  (`log_outcome`, `complete_meeting`, `create_quotation`, `decide_quotation`,
  `set_lead_stage`, `schedule_task`, …). A trigger rejects any direct client
  change to protected columns.
- Accounts are created by the server (`/api/crm/users`, service role) with
  `app_metadata.crm_role`; a self-signup gets no profile and therefore no data.
- Sign-in goes through `/api/auth/sign-in`: email or phone + password, generic
  errors, and a 15-minute lock after 5 failures per identifier (`login_throttle`).
- Every function starts with no `EXECUTE` grant; only the listed RPCs are
  granted to `authenticated`, and `ping_keepalive` to `anon`.
- `audit_log` records sign-ins, account changes, imports, exports,
  reassignments and manual stage changes (admins can read it in Settings).

## Automation

Retry timings, nurture thresholds, re-engage delay, quote follow-up delay,
default quota and idle sign-out live in `crm_settings` (editable in the CRM's
Settings page). Members get their daily top-up of fresh leads when they first
open the CRM each day (IST); where `pg_cron` is available the migration also
schedules it for 09:00 IST.

## Local development

```bash
npx supabase start
npx supabase db reset              # migrations + seed.sql
npm run test:db                    # with SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY from `supabase status`
```

After changing the schema, regenerate the types:

```bash
npx supabase gen types typescript --linked --schema public > src/lib/database.types.ts
```

(then re-append the alias block at the bottom of that file).
