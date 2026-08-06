-- ─────────────────────────────────────────────────────────────────────
-- 20260805090006 — RLS hardening (review fixes on top of 090004)
--
-- Three defects surfaced reviewing Phase 2. This migration is deliberately
-- separate from 090004 so the fix is reviewable on its own.
--
--   1. 090004 revoked privileges only on tables that ALREADY existed. It
--      never touched ALTER DEFAULT PRIVILEGES, so Supabase's built-in
--      default of GRANT ALL to anon/authenticated would silently re-apply
--      to every table created from Phase 3 onward. Lock the defaults here.
--   2. keepalive granted INSERT/SELECT/DELETE to anon — anyone holding the
--      public anon key could flood the table (free tier is 500 MB) or wipe
--      the heartbeat. Replaced with a SECURITY DEFINER RPC.
--   3. profiles_select used using(true): a profile-less authenticated user
--      could read the whole team's names + emails. Gate on is_staff().
-- ─────────────────────────────────────────────────────────────────────

-- ── 1. Lock Supabase's default privileges for FUTURE tables/sequences ──
-- ALTER DEFAULT PRIVILEGES only affects objects created by ONE role; with
-- no FOR ROLE it targets whoever happens to run this statement. In Supabase
-- every public object is created by (and owned by) the `postgres` role, and
-- the permissive built-in defaults that grant anon/authenticated are the
-- ones attached to `postgres`. We pin FOR ROLE postgres so the revoke lines
-- up with the exact defaults that would otherwise fire — independent of
-- which superuser context executes the migration (SQL editor, CLI, or the
-- local harness all create tables as postgres). Without FOR ROLE the revoke
-- would touch the executing role's own (empty) defaults and change nothing.
alter default privileges for role postgres in schema public
  revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke all on sequences from anon, authenticated;

-- ── 2. keepalive: no direct anon access; heartbeat via RPC only ───────
-- anon loses every table/sequence right and its policy; the only way in is
-- the RPC below.
drop policy if exists keepalive_anon on public.keepalive;
revoke all on public.keepalive from anon;
revoke all on sequence public.keepalive_id_seq from anon;

-- SECURITY DEFINER: runs as the owner (postgres), so it bypasses both the
-- anon table grant we just removed and RLS. It inserts exactly one heartbeat
-- row and prunes anything older than 14 days, bounding the table's size no
-- matter how often anon calls it.
create or replace function public.ping_keepalive()
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.keepalive (source) values ('ping_keepalive');
  delete from public.keepalive where pinged_at < now() - interval '14 days';
$$;

-- Functions grant EXECUTE to PUBLIC by default; strip that, then grant to
-- anon only (Phase 9's keep_alive.py calls this RPC with the anon key
-- instead of writing the table directly).
revoke all on function public.ping_keepalive() from public;
grant execute on function public.ping_keepalive() to anon;

-- ── 3. profiles_select: staff only (was using(true)) ─────────────────
-- A profile-less authenticated session (is_staff() = false) now sees zero
-- rows instead of the whole team roster.
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated using (public.is_staff());
