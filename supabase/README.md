# Social ScaleX CRM — Supabase

Schema, constraints, triggers and Row Level Security for the internal CRM.
These migration files are the record of truth.

## Apply the migrations

Region: **Mumbai (ap-south-1)**. Two ways to apply:

**A. SQL editor (what we use).** Open each file in `migrations/` in ascending
timestamp order and run it. Then optionally run `seed.sql` for dummy data.

**B. Supabase CLI.**
```bash
supabase link --project-ref <ref>
supabase db push          # applies migrations/
psql "$DATABASE_URL" -f supabase/seed.sql   # optional dev data
```

Order matters: `090001` (tables) → `090002` (indexes) → `090003` (functions/
triggers) → `090004` (RLS/grants) → `090005` (RPC).

## Prove it locally (no cloud project needed)

```bash
bash supabase/test/verify_local.sh
```
Spins up a throwaway local Postgres, replicates the Supabase-provided bits
(`anon`/`authenticated` roles, `auth.uid()`) via `test/00_compat.sql`, applies
every migration + seed, and runs the 8 RLS/constraint checks. `test/` is a test
harness only — **never** run it against real Supabase.

## What the policies do

Security assumes a hostile caller holding the (public) anon key. RLS is the
gate; grants are managed explicitly as a second layer.

| Table | anon | authenticated (staff, has a profile) |
|-------|------|--------------------------------------|
| `profiles` | none | read all; update only own row; **cannot change own role** (trigger) |
| `allowed_emails` | none | owner/admin only, full CRUD |
| `leads` | none | select/insert/update; **no delete** (archive via `deleted_at`, owner/admin only) |
| `lead_contacts`, `lead_phones` | none | select/insert/update; no delete |
| `lead_activities` | none | select/insert; no update/delete (audit log) |
| `inbound_enquiries` | **insert only** | select/update/delete |
| `keepalive` | insert/select/delete | select |

Role checks use `public.current_app_role()` / `is_staff()` / `is_admin()` —
`SECURITY DEFINER` helpers that read `profiles` without tripping a `profiles`
policy (which would recurse). **Named `current_app_role`, not `current_role`:**
`CURRENT_ROLE` is a reserved SQL keyword and can't be a function name.

Key invariants enforced in the DB (not the UI):
- `outcome_requires_contacted` CHECK — an outcome can't exist while `pending`.
- `lead_found_not_future` CHECK.
- Gated signup — `handle_new_user()` on `auth.users` raises unless the email is
  in `allowed_emails`, then creates the profile with the allow-listed role.
- One primary contact per lead; one primary phone per contact (partial unique
  indexes).
- `create_lead_with_contacts(payload jsonb)` writes a lead + contacts + phones
  in one transaction.

## Add a team member

1. **Allowlist the email** (owner/admin), e.g. in the SQL editor:
   ```sql
   insert into public.allowed_emails (email, role) values ('newhire@…', 'member');
   ```
   Roles: `owner`, `admin`, `member`.
2. **Invite from the dashboard:** Authentication → Users → *Invite user* (or send
   a magic link). On their first sign-in the trigger creates their `profiles`
   row with the allow-listed role. An email that isn't allow-listed is rejected
   at signup even if public signups are somehow enabled.

## Manual dashboard steps (do these once)

- **Authentication → Providers/Settings: disable public sign-ups.** The trigger
  is the real gate, but turn this off too (defense in depth).
- **Authentication → URL Configuration:** set Site URL to the production domain
  and add the Vercel preview + `http://localhost:5173` to the redirect allow-list
  (needed for password-reset links in Phase 3).
- **Authentication → Email:** configure SMTP (or use the built-in sender) so
  invites and password resets actually send.
- Seed the first `owner` into `allowed_emails`, then invite yourself.
