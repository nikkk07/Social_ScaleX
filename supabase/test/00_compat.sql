-- ─────────────────────────────────────────────────────────────────────
-- LOCAL TEST HARNESS ONLY — NOT a migration. Never run on real Supabase.
--
-- Replicates the Supabase-provided objects a bare Postgres lacks, so the
-- migrations apply unchanged and RLS can be exercised via SET ROLE (which
-- is exactly how PostgREST maps the anon / authenticated keys to SQL).
-- ─────────────────────────────────────────────────────────────────────

create extension if not exists pgcrypto;   -- gen_random_uuid on older PGs

-- Supabase roles.
do $$
begin
  if not exists (select from pg_roles where rolname = 'anon') then
    create role anon nologin noinherit;
  end if;
  if not exists (select from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin noinherit;
  end if;
end $$;

-- Supabase bootstraps PERMISSIVE default privileges: every table/sequence the
-- `postgres` role creates in `public` is auto-GRANTed ALL to anon and
-- authenticated. A bare Postgres has no such default, which would make the
-- lockdown in migration 090004 (revoke existing) and 090006 (ALTER DEFAULT
-- PRIVILEGES) silent no-ops here. Replicate Supabase's default so the harness
-- actually exercises the revokes — without this, the "permission denied"
-- results below would pass trivially.
alter default privileges for role postgres in schema public
  grant all on tables to anon, authenticated;
alter default privileges for role postgres in schema public
  grant all on sequences to anon, authenticated;

create schema if not exists auth;
grant usage on schema auth to anon, authenticated;

-- Minimal auth.users (Supabase's has many more columns; these are enough).
create table if not exists auth.users (
  id                 uuid primary key default gen_random_uuid(),
  email              text unique,
  raw_user_meta_data jsonb default '{}'::jsonb,
  created_at         timestamptz default now()
);

-- auth.uid(): Supabase reads the JWT 'sub'. Locally we read a GUC the test
-- sets, so SET ROLE authenticated + this GUC simulates a logged-in user.
create or replace function auth.uid()
returns uuid language sql stable as $$
  select nullif(current_setting('app.current_user_id', true), '')::uuid;
$$;
