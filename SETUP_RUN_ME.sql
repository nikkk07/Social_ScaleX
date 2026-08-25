-- ===== supabase/migrations/20260805090001_enums_and_tables.sql =====
-- ─────────────────────────────────────────────────────────────────────
-- 20260805090001 — Enums and tables
-- Social ScaleX CRM. See supabase/README.md for how to apply.
-- ─────────────────────────────────────────────────────────────────────

-- ── Enums ────────────────────────────────────────────────────────────
create type public.app_role     as enum ('owner', 'admin', 'member');
create type public.lead_status  as enum ('pending', 'contacted');
create type public.lead_outcome as enum ('interested', 'not_interested');
create type public.lead_source  as enum ('manual', 'website_callback', 'website_query', 'import');

-- ── Profiles (mirrors auth.users) ────────────────────────────────────
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text,
  role        public.app_role not null default 'member',
  created_at  timestamptz not null default now()
);
comment on table public.profiles is 'One row per authenticated staff user; role drives authorization.';

-- ── Invite allowlist: signup is closed unless the email is listed ────
create table public.allowed_emails (
  email       text primary key,
  role        public.app_role not null default 'member',
  invited_by  uuid references public.profiles(id),
  created_at  timestamptz not null default now()
);
comment on table public.allowed_emails is 'Gate for signup. The auth.users trigger rejects any email absent here.';

-- ── Leads (a lead is a BRAND, not a person) ──────────────────────────
create table public.leads (
  id                 uuid primary key default gen_random_uuid(),
  brand_name         text not null check (length(trim(brand_name)) > 0),
  instagram_username text,                    -- normalised: lowercase, no '@', no URL
  address            text,
  lead_found_on      date not null default current_date,
  status             public.lead_status  not null default 'pending',
  outcome            public.lead_outcome,
  source             public.lead_source  not null default 'manual',
  notes              text,
  owner_id           uuid references public.profiles(id) on delete set null,
  created_by         uuid references public.profiles(id) on delete set null,
  contacted_at       timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  deleted_at         timestamptz,

  -- Outcome can only exist once contacted — enforced in the DB, not the UI.
  constraint outcome_requires_contacted
    check (status = 'contacted' or outcome is null),

  -- No future-dating a lead you supposedly already found.
  constraint lead_found_not_future
    check (lead_found_on <= current_date)
);
comment on table public.leads is 'Brand-level leads. Never hard-deleted; soft-delete via deleted_at.';

-- ── Contact people (a brand has many contacts) ───────────────────────
create table public.lead_contacts (
  id          uuid primary key default gen_random_uuid(),
  lead_id     uuid not null references public.leads(id) on delete cascade,
  name        text not null check (length(trim(name)) > 0),
  designation text,
  email       text,
  is_primary  boolean not null default false,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

-- ── Phone numbers (hang off a contact; nullable contact = office line) ─
create table public.lead_phones (
  id          uuid primary key default gen_random_uuid(),
  lead_id     uuid not null references public.leads(id) on delete cascade,
  contact_id  uuid references public.lead_contacts(id) on delete cascade,
  phone_e164  text not null,          -- always E.164, e.g. +918077727669
  label       text,                   -- 'WhatsApp', 'Office', 'Personal'
  is_primary  boolean not null default false,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

-- ── Activity log / timeline ──────────────────────────────────────────
create table public.lead_activities (
  id          uuid primary key default gen_random_uuid(),
  lead_id     uuid not null references public.leads(id) on delete cascade,
  actor_id    uuid references public.profiles(id) on delete set null,
  kind        text not null,          -- 'created' | 'status_changed' | 'note' | 'edited'
  detail      jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

-- ── Website enquiries (Contact.tsx submissions land here) ────────────
create table public.inbound_enquiries (
  id                uuid primary key default gen_random_uuid(),
  kind              text not null check (kind in ('callback', 'query')),
  name              text not null,
  phone             text,
  email             text,
  best_time         text,
  message           text,
  user_agent        text,
  converted_lead_id uuid references public.leads(id) on delete set null,
  created_at        timestamptz not null default now()
);
comment on table public.inbound_enquiries is 'Public website writes here (anon insert only). Staff read.';

-- ── Keepalive heartbeat (Supabase free-tier pause guard) ─────────────
create table public.keepalive (
  id         bigserial primary key,
  pinged_at  timestamptz not null default now(),
  source     text
);

-- ===== supabase/migrations/20260805090002_indexes.sql =====
-- ─────────────────────────────────────────────────────────────────────
-- 20260805090002 — Indexes (incl. dedupe guard and fuzzy search)
-- ─────────────────────────────────────────────────────────────────────

-- Dedupe guard: one active lead per Instagram handle.
create unique index leads_instagram_unique
  on public.leads (instagram_username)
  where deleted_at is null and instagram_username is not null;

create index leads_status_idx         on public.leads (status, outcome) where deleted_at is null;
create index leads_found_on_idx       on public.leads (lead_found_on desc) where deleted_at is null;
create index leads_owner_idx          on public.leads (owner_id) where deleted_at is null;
create index lead_contacts_lead_idx   on public.lead_contacts (lead_id);
create index lead_phones_lead_idx     on public.lead_phones (lead_id);
create index lead_phones_e164_idx     on public.lead_phones (phone_e164);
create index lead_activities_lead_idx on public.lead_activities (lead_id, created_at desc);
create index inbound_enquiries_created_idx on public.inbound_enquiries (created_at desc);

-- ── Single-primary invariants (partial unique indexes, not triggers) ──
-- At most one primary contact per lead.
create unique index lead_contacts_one_primary
  on public.lead_contacts (lead_id) where is_primary;
-- At most one primary phone per contact.
create unique index lead_phones_one_primary_per_contact
  on public.lead_phones (contact_id) where is_primary and contact_id is not null;
-- At most one primary lead-level (office) phone per lead.
create unique index lead_phones_one_primary_lead_level
  on public.lead_phones (lead_id) where is_primary and contact_id is null;

-- ── Fuzzy search across brand name + handle ──────────────────────────
create extension if not exists pg_trgm;
create index leads_brand_trgm_idx on public.leads using gin (brand_name gin_trgm_ops);
create index leads_ig_trgm_idx    on public.leads using gin (instagram_username gin_trgm_ops);

-- ===== supabase/migrations/20260805090003_functions_and_triggers.sql =====
-- ─────────────────────────────────────────────────────────────────────
-- 20260805090003 — Functions and triggers
-- ─────────────────────────────────────────────────────────────────────

-- ── Role helper (SECURITY DEFINER → no RLS recursion on profiles) ─────
-- NOTE: named current_app_role, NOT current_role — CURRENT_ROLE is a
-- reserved SQL keyword and cannot be a function name without quoting.
-- SECURITY DEFINER runs as the owner (superuser), which bypasses RLS, so
-- reading profiles here does not re-trigger a profiles policy.
create or replace function public.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_staff()
returns boolean
language sql stable security definer set search_path = public
as $$ select public.current_app_role() is not null; $$;

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$ select coalesce(public.current_app_role() in ('owner','admin'), false); $$;

-- ── updated_at auto-touch ────────────────────────────────────────────
create or replace function public.tg_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger leads_touch_updated_at
  before update on public.leads
  for each row execute function public.tg_touch_updated_at();

-- ── Status / outcome coherence ───────────────────────────────────────
-- On contact, stamp contacted_at. On a revert to pending, clear outcome +
-- contacted_at. INSERTs are NOT coerced — an explicit pending+interested
-- insert is left for the CHECK constraint to reject.
create or replace function public.tg_leads_status_coherence()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    if new.status = 'contacted' and new.contacted_at is null then
      new.contacted_at := now();
    end if;
  elsif tg_op = 'UPDATE' then
    if new.status = 'contacted' and new.contacted_at is null then
      new.contacted_at := now();
    elsif new.status = 'pending' and old.status is distinct from 'pending' then
      new.outcome := null;
      new.contacted_at := null;
    end if;
  end if;
  return new;
end;
$$;

create trigger leads_status_coherence
  before insert or update on public.leads
  for each row execute function public.tg_leads_status_coherence();

-- ── Activity logging (server-side, never trust the client) ───────────
create or replace function public.tg_leads_log_activity()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into public.lead_activities (lead_id, actor_id, kind, detail)
    values (new.id, auth.uid(), 'created',
            jsonb_build_object('status', new.status, 'source', new.source));
  elsif tg_op = 'UPDATE' then
    if new.status is distinct from old.status
       or new.outcome is distinct from old.outcome then
      insert into public.lead_activities (lead_id, actor_id, kind, detail)
      values (new.id, auth.uid(), 'status_changed',
              jsonb_build_object('from_status', old.status, 'to_status', new.status,
                                 'from_outcome', old.outcome, 'to_outcome', new.outcome));
    end if;
    if new.deleted_at is not null and old.deleted_at is null then
      insert into public.lead_activities (lead_id, actor_id, kind, detail)
      values (new.id, auth.uid(), 'archived', '{}'::jsonb);
    end if;
  end if;
  return null;  -- AFTER trigger
end;
$$;

create trigger leads_log_activity
  after insert or update on public.leads
  for each row execute function public.tg_leads_log_activity();

-- ── A user may not change their own role ─────────────────────────────
create or replace function public.tg_profiles_guard_role()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'Only owner/admin may change a role';
  end if;
  return new;
end;
$$;

create trigger profiles_guard_role
  before update on public.profiles
  for each row execute function public.tg_profiles_guard_role();

-- ── Gated signup: reject any email absent from allowed_emails ─────────
-- SECURITY DEFINER + on auth.users. Raising here rolls back the signup,
-- so a stranger with the anon key cannot create an account at all — this
-- does not rely on the dashboard "disable signups" switch.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_role public.app_role;
begin
  select role into v_role
  from public.allowed_emails
  where lower(email) = lower(new.email);

  if v_role is null then
    raise exception 'Signup blocked: % is not on the invite allowlist', new.email
      using errcode = 'insufficient_privilege';
  end if;

  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', v_role);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ===== supabase/migrations/20260805090004_rls_policies.sql =====
-- ─────────────────────────────────────────────────────────────────────
-- 20260805090004 — Row Level Security + grants
--
-- Security rests on RLS, assuming a hostile caller holding the anon key.
-- Grants are managed explicitly (belt-and-suspenders): even if a policy
-- were mis-set, anon has no table privilege on the sensitive tables.
--
-- Delete policy (per the original brief's detailed RLS section):
--   leads / lead_contacts / lead_phones / lead_activities  -> NO delete
--     (leads soft-delete via deleted_at, admin only; children mutated via
--      the SECURITY DEFINER RPC in Phase 7; activities are immutable).
--   inbound_enquiries -> staff may delete (spam / after conversion).
--   allowed_emails    -> owner/admin may delete (revoke an invite).
--   keepalive         -> (superseded by 090006: anon no longer touches the
--                          table at all; heartbeat runs through an RPC).
-- ─────────────────────────────────────────────────────────────────────

-- Revoke Supabase's grants on the tables that EXIST right now, then grant
-- precisely below. NOTE: this does NOT touch ALTER DEFAULT PRIVILEGES, so it
-- says nothing about tables created by later migrations — those defaults are
-- locked in 090006 (ALTER DEFAULT PRIVILEGES ... REVOKE ALL). Adding a new
-- table before 090006 ran would inherit Supabase's GRANT ALL to anon.
revoke all on all tables in schema public from anon, authenticated;
grant usage on schema public to anon, authenticated;

alter table public.profiles          enable row level security;
alter table public.allowed_emails    enable row level security;
alter table public.leads             enable row level security;
alter table public.lead_contacts     enable row level security;
alter table public.lead_phones       enable row level security;
alter table public.lead_activities   enable row level security;
alter table public.inbound_enquiries enable row level security;
alter table public.keepalive         enable row level security;

-- ── profiles ─────────────────────────────────────────────────────────
grant select, update on public.profiles to authenticated;
-- Read all (small team; needed for owner dropdowns).
create policy profiles_select on public.profiles
  for select to authenticated using (true);
-- Update only your own row (role change is blocked by tg_profiles_guard_role).
create policy profiles_update_own on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
-- No insert policy: profiles are created only by the signup trigger.
-- No delete policy: cascades from auth.users only.

-- ── allowed_emails (owner/admin only) ────────────────────────────────
grant select, insert, update, delete on public.allowed_emails to authenticated;
create policy allowed_emails_admin_all on public.allowed_emails
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ── leads ────────────────────────────────────────────────────────────
grant select, insert, update on public.leads to authenticated;  -- no delete
create policy leads_select on public.leads
  for select to authenticated using (public.is_staff());
create policy leads_insert on public.leads
  for insert to authenticated with check (public.is_staff());
create policy leads_update on public.leads
  for update to authenticated using (public.is_staff()) with check (public.is_staff());
-- Archive (set deleted_at) restricted to owner/admin.
create or replace function public.tg_leads_guard_soft_delete()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (new.deleted_at is distinct from old.deleted_at) and not public.is_admin() then
    raise exception 'Only owner/admin may archive or restore a lead';
  end if;
  return new;
end;
$$;
create trigger leads_guard_soft_delete
  before update on public.leads
  for each row execute function public.tg_leads_guard_soft_delete();

-- ── lead_contacts ────────────────────────────────────────────────────
grant select, insert, update on public.lead_contacts to authenticated;  -- no delete
create policy lead_contacts_select on public.lead_contacts
  for select to authenticated using (public.is_staff());
create policy lead_contacts_insert on public.lead_contacts
  for insert to authenticated with check (public.is_staff());
create policy lead_contacts_update on public.lead_contacts
  for update to authenticated using (public.is_staff()) with check (public.is_staff());

-- ── lead_phones ──────────────────────────────────────────────────────
grant select, insert, update on public.lead_phones to authenticated;  -- no delete
create policy lead_phones_select on public.lead_phones
  for select to authenticated using (public.is_staff());
create policy lead_phones_insert on public.lead_phones
  for insert to authenticated with check (public.is_staff());
create policy lead_phones_update on public.lead_phones
  for update to authenticated using (public.is_staff()) with check (public.is_staff());

-- ── lead_activities (append-only audit log) ──────────────────────────
grant select, insert on public.lead_activities to authenticated;  -- no update/delete
create policy lead_activities_select on public.lead_activities
  for select to authenticated using (public.is_staff());
create policy lead_activities_insert on public.lead_activities
  for insert to authenticated with check (public.is_staff());

-- ── inbound_enquiries (anon insert only; staff read/manage) ──────────
grant insert on public.inbound_enquiries to anon;
grant select, update, delete on public.inbound_enquiries to authenticated;
create policy inbound_insert_anon on public.inbound_enquiries
  for insert to anon
  with check (
    char_length(trim(name)) > 0
    and char_length(coalesce(message, '')) <= 5000
    and kind in ('callback', 'query')
  );
create policy inbound_staff_manage on public.inbound_enquiries
  for all to authenticated using (public.is_staff()) with check (public.is_staff());
-- anon has NO select/update/delete grant, so enquiries are never public.

-- ── keepalive (anon heartbeat; staff read) ───────────────────────────
-- NOTE: the anon grants + keepalive_anon policy below are SUPERSEDED by
-- 090006, which revokes all anon access and routes the heartbeat through the
-- SECURITY DEFINER ping_keepalive() RPC. Kept here only as the historical
-- record; do not re-grant anon on this table.
grant insert, select, delete on public.keepalive to anon;
grant usage, select on sequence public.keepalive_id_seq to anon;
grant select on public.keepalive to authenticated;
create policy keepalive_anon on public.keepalive
  for all to anon using (true) with check (true);
create policy keepalive_staff_read on public.keepalive
  for select to authenticated using (true);

-- ===== supabase/migrations/20260805090005_create_lead_with_contacts.sql =====
-- ─────────────────────────────────────────────────────────────────────
-- 20260805090005 — create_lead_with_contacts(payload jsonb)
--
-- One transaction for a lead + its contacts + their phones, so a partial
-- failure never orphans rows. SECURITY INVOKER: RLS still applies, so only
-- a staff user (profile present) can call it successfully. Returns the new
-- lead id. Called from the client via supabase.rpc('create_lead_with_contacts').
-- ─────────────────────────────────────────────────────────────────────

create or replace function public.create_lead_with_contacts(payload jsonb)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_lead_id    uuid;
  v_contact    jsonb;
  v_phone      jsonb;
  v_contact_id uuid;
begin
  insert into public.leads (
    brand_name, instagram_username, address, lead_found_on,
    status, outcome, source, notes, owner_id, created_by
  )
  values (
    payload->>'brand_name',
    nullif(payload->>'instagram_username', ''),
    nullif(payload->>'address', ''),
    coalesce((payload->>'lead_found_on')::date, current_date),
    coalesce((payload->>'status')::public.lead_status, 'pending'),
    (payload->>'outcome')::public.lead_outcome,
    coalesce((payload->>'source')::public.lead_source, 'manual'),
    nullif(payload->>'notes', ''),
    coalesce((payload->>'owner_id')::uuid, auth.uid()),
    auth.uid()
  )
  returning id into v_lead_id;

  -- Contacts, each with nested phones.
  for v_contact in
    select value from jsonb_array_elements(coalesce(payload->'contacts', '[]'::jsonb))
  loop
    insert into public.lead_contacts (lead_id, name, designation, email, is_primary, sort_order)
    values (
      v_lead_id,
      v_contact->>'name',
      nullif(v_contact->>'designation', ''),
      nullif(v_contact->>'email', ''),
      coalesce((v_contact->>'is_primary')::boolean, false),
      coalesce((v_contact->>'sort_order')::int, 0)
    )
    returning id into v_contact_id;

    for v_phone in
      select value from jsonb_array_elements(coalesce(v_contact->'phones', '[]'::jsonb))
    loop
      insert into public.lead_phones (lead_id, contact_id, phone_e164, label, is_primary, sort_order)
      values (
        v_lead_id, v_contact_id,
        v_phone->>'phone_e164',
        nullif(v_phone->>'label', ''),
        coalesce((v_phone->>'is_primary')::boolean, false),
        coalesce((v_phone->>'sort_order')::int, 0)
      );
    end loop;
  end loop;

  -- Lead-level phones (office lines not tied to a person).
  for v_phone in
    select value from jsonb_array_elements(coalesce(payload->'lead_phones', '[]'::jsonb))
  loop
    insert into public.lead_phones (lead_id, contact_id, phone_e164, label, is_primary, sort_order)
    values (
      v_lead_id, null,
      v_phone->>'phone_e164',
      nullif(v_phone->>'label', ''),
      coalesce((v_phone->>'is_primary')::boolean, false),
      coalesce((v_phone->>'sort_order')::int, 0)
    );
  end loop;

  return v_lead_id;
end;
$$;

grant execute on function public.create_lead_with_contacts(jsonb) to authenticated;

-- ===== supabase/migrations/20260805090006_rls_hardening.sql =====
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
-- anon table grant we just removed and RLS. It inserts one heartbeat row and
-- prunes rows older than 14 days.
-- WARNING: this prune is TIME-based and does NOT bound table size — anon can
-- call the RPC at any rate and every row survives 14 days (~10M rows fills the
-- 500MB free tier). 090007 replaces this with a volume bound. See that file.
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

-- ===== supabase/migrations/20260805090007_keepalive_volume_bound.sql =====
-- ─────────────────────────────────────────────────────────────────────
-- 20260805090007 — keepalive: volume bound instead of time bound
--
-- 090006 moved anon off the table and behind ping_keepalive(), which fixed
-- arbitrary writes and heartbeat deletion — but its prune was TIME-based
-- (older than 14 days), so it never bounded table SIZE. anon can call the RPC
-- as fast as it likes and every row survives 14 days; at ~50 bytes/row that is
-- ~10M rows to fill the 500MB free tier, and the anon key is public by design
-- (it ships in the JS bundle). The storage vector survived the table→RPC move.
--
-- Replace the prune with a VOLUME bound: keep only the ~100 most recent rows.
-- Now the table can never grow without limit regardless of call rate, while
-- still retaining recent history for debugging.
-- ─────────────────────────────────────────────────────────────────────

create or replace function public.ping_keepalive()
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.keepalive (source) values ('ping_keepalive');
  -- Volume bound: after inserting, delete everything but the ~100 newest rows
  -- (id is a monotonic bigserial). Bounded forever, independent of call rate.
  delete from public.keepalive
  where id < (select max(id) - 100 from public.keepalive);
$$;

-- create-or-replace preserves the existing ACL, but re-assert it so this
-- migration is self-contained: EXECUTE for anon only, never PUBLIC.
revoke all on function public.ping_keepalive() from public;
grant execute on function public.ping_keepalive() to anon;

-- ===== supabase/migrations/20260805090008_update_lead_with_contacts.sql =====
-- ─────────────────────────────────────────────────────────────────────
-- 20260805090008 — update_lead_with_contacts(p_lead_id uuid, payload jsonb)
--
-- Replace-children edit for a lead's contacts + phones, in ONE transaction
-- (delete the existing set, insert the new set) so a half-applied edit is
-- impossible. Mirrors create_lead_with_contacts.
--
-- SECURITY DEFINER — and therein the single most important line: DEFINER
-- BYPASSES RLS, so we MUST re-check the caller's staff status explicitly with
-- is_staff(). Without that recheck this function is a hole straight through the
-- Phase 2 policy layer. auth.uid() is request-scoped (not changed by the
-- definer role switch), so is_staff() still evaluates the *caller*.
-- ─────────────────────────────────────────────────────────────────────

create or replace function public.update_lead_with_contacts(
  p_lead_id uuid,
  payload   jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_contact    jsonb;
  v_phone      jsonb;
  v_contact_id uuid;
begin
  -- AUTHORISATION: definer bypasses RLS, so verify the caller is staff.
  if not public.is_staff() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  -- The lead must exist and be live (a member archiving is a separate path).
  if not exists (
    select 1 from public.leads where id = p_lead_id and deleted_at is null
  ) then
    raise exception 'Lead not found or archived';
  end if;

  -- Replace children. Delete phones first (office lines have contact_id null
  -- and would NOT cascade from contacts), then contacts.
  delete from public.lead_phones    where lead_id = p_lead_id;
  delete from public.lead_contacts  where lead_id = p_lead_id;

  -- Re-insert contacts with nested phones. Single-primary is honoured by
  -- inserting the already-demoted set (partial unique indexes backstop it).
  for v_contact in
    select value from jsonb_array_elements(coalesce(payload->'contacts', '[]'::jsonb))
  loop
    insert into public.lead_contacts (lead_id, name, designation, email, is_primary, sort_order)
    values (
      p_lead_id,
      v_contact->>'name',
      nullif(v_contact->>'designation', ''),
      nullif(v_contact->>'email', ''),
      coalesce((v_contact->>'is_primary')::boolean, false),
      coalesce((v_contact->>'sort_order')::int, 0)
    )
    returning id into v_contact_id;

    for v_phone in
      select value from jsonb_array_elements(coalesce(v_contact->'phones', '[]'::jsonb))
    loop
      insert into public.lead_phones (lead_id, contact_id, phone_e164, label, is_primary, sort_order)
      values (
        p_lead_id, v_contact_id,
        v_phone->>'phone_e164',
        nullif(v_phone->>'label', ''),
        coalesce((v_phone->>'is_primary')::boolean, false),
        coalesce((v_phone->>'sort_order')::int, 0)
      );
    end loop;
  end loop;

  -- Lead-level (office) phones.
  for v_phone in
    select value from jsonb_array_elements(coalesce(payload->'lead_phones', '[]'::jsonb))
  loop
    insert into public.lead_phones (lead_id, contact_id, phone_e164, label, is_primary, sort_order)
    values (
      p_lead_id, null,
      v_phone->>'phone_e164',
      nullif(v_phone->>'label', ''),
      coalesce((v_phone->>'is_primary')::boolean, false),
      coalesce((v_phone->>'sort_order')::int, 0)
    );
  end loop;

  -- Timeline entry so the edit is visible (Phase 2 triggers only log the
  -- lead row itself, not its children).
  insert into public.lead_activities (lead_id, actor_id, kind, detail)
  values (
    p_lead_id, auth.uid(), 'edited',
    jsonb_build_object(
      'contacts', jsonb_array_length(coalesce(payload->'contacts', '[]'::jsonb)),
      'office_phones', jsonb_array_length(coalesce(payload->'lead_phones', '[]'::jsonb))
    )
  );
end;
$$;

revoke all on function public.update_lead_with_contacts(uuid, jsonb) from public;
grant execute on function public.update_lead_with_contacts(uuid, jsonb) to authenticated;

-- ===== supabase/migrations/20260805090009_normalisation_invariants.sql =====
-- ─────────────────────────────────────────────────────────────────────
-- 20260805090009 — Normalisation as a DATABASE guarantee
--
-- Two invariants lived only in TypeScript while database guarantees depended
-- on them. Both are closed here.
--
-- 1. INSTAGRAM HANDLE. leads_instagram_unique (090002) was a plain unique
--    index on the raw column, so it was CASE-SENSITIVE: 'CafeX' and 'cafex'
--    are two distinct keys and both save. The client lowercases and strips
--    '@'/URL prefixes, but neither RPC validates it and no CHECK enforced it,
--    so the dedupe guarantee held only for values entered through the form.
--    Bulk CSV import — the path most likely to carry handles pasted straight
--    out of a browser — would have walked through it.
--
--    Belt and braces: the index over lower() guarantees UNIQUENESS regardless
--    of case; the CHECK guarantees the value actually STORED is the normalised
--    one. Either alone leaves a gap — the index alone would happily store
--    'CafeX' (and every reader would then have to remember to lower() it);
--    the CHECK alone would not stop two rows differing only by case if the
--    index stayed raw.
--
-- 2. PHONE NUMBERS. lead_phones.phone_e164 had no CHECK; both RPCs pass the
--    value straight through and client zod was the only guard. This compounds:
--    phone-based duplicate detection is the ONLY protection against two people
--    adding the same brand under different handles (there is deliberately no
--    unique constraint on phone numbers, and that decision stands). A
--    malformed value — '98765 43210' instead of '+919876543210' — makes that
--    lookup silently miss, and nothing surfaces the failure.
--
-- PRE-FLIGHT: both constraints are validated against existing rows FIRST, in
-- a DO block that names the offending rows. Without it, a violation surfaces
-- as a bare "check constraint is violated by some row" with no row to look at.
-- ─────────────────────────────────────────────────────────────────────

-- ── Pre-flight scan: handles that would violate the new CHECK ─────────
do $$
declare
  v_n   int;
  v_bad text;
begin
  select count(*), string_agg(format('%s → %L', id, instagram_username), E'\n  ')
    into v_n, v_bad
  from public.leads
  where instagram_username is not null
    and (instagram_username <> lower(instagram_username)
         or instagram_username ~ '[@/[:space:]]'
         or instagram_username = '');

  if v_n > 0 then
    raise exception E'090009 pre-flight: % lead(s) hold a non-normalised instagram_username:\n  %\n'
      'Normalise them first, e.g.\n'
      '  update public.leads set instagram_username = nullif(lower(regexp_replace(\n'
      '    regexp_replace(instagram_username, ''^(https?://)?(www\.)?instagram\.com/'', '''', ''i''),\n'
      '    ''[@/[:space:]]'', '''', ''g'')), '''');', v_n, v_bad;
  end if;

  raise notice '090009 pre-flight: 0 non-normalised instagram_username values.';
end;
$$;

-- ── Pre-flight scan: handles that collide once compared case-insensitively ──
-- The rebuilt unique index would fail on these, and its error names only one
-- of the pair.
do $$
declare
  v_n   int;
  v_bad text;
begin
  select count(*), string_agg(g.handles, E'\n  ') into v_n, v_bad
  from (
    select string_agg(format('%s → %L', id, instagram_username), ', ') as handles
    from public.leads
    where deleted_at is null and instagram_username is not null
    group by lower(instagram_username)
    having count(*) > 1
  ) g;

  if v_n > 0 then
    raise exception E'090009 pre-flight: % handle group(s) collide case-insensitively:\n  %', v_n, v_bad;
  end if;

  raise notice '090009 pre-flight: 0 case-insensitive handle collisions.';
end;
$$;

-- ── Pre-flight scan: phones that would violate the new CHECK ─────────
do $$
declare
  v_n   int;
  v_bad text;
begin
  select count(*), string_agg(format('%s (lead %s) → %L', id, lead_id, phone_e164), E'\n  ')
    into v_n, v_bad
  from public.lead_phones
  where phone_e164 !~ '^\+[1-9]\d{6,14}$';

  if v_n > 0 then
    raise exception E'090009 pre-flight: % phone(s) are not E.164:\n  %\n'
      'These are exactly the rows duplicate detection has been silently '
      'missing. Fix them before re-running.', v_n, v_bad;
  end if;

  raise notice '090009 pre-flight: 0 non-E.164 phone numbers.';
end;
$$;

-- ── 1a. Rebuild the dedupe index case-insensitively ──────────────────
-- Same NAME as 090002's index on purpose: the client maps that name to the
-- friendly "A lead with that Instagram handle already exists." message.
drop index if exists public.leads_instagram_unique;
create unique index leads_instagram_unique
  on public.leads (lower(instagram_username))
  where deleted_at is null and instagram_username is not null;

-- ── 1b. …and require the stored value to BE the normalised form ──────
-- No '@', no '/' (so a pasted profile URL can never land here), no
-- whitespace, no uppercase, and not the empty string (both RPCs nullif('')
-- already — this stops anything that doesn't go through them).
alter table public.leads
  add constraint leads_instagram_normalised
  check (
    instagram_username is null
    or (
      instagram_username = lower(instagram_username)
      and instagram_username !~ '[@/[:space:]]'
      and instagram_username <> ''
    )
  );

comment on constraint leads_instagram_normalised on public.leads is
  'instagram_username must already be normalised: lowercase, no @, no /, no whitespace.';

-- ── 2. Phone numbers must be E.164 ───────────────────────────────────
-- '+' then a non-zero country digit then 6–14 more: the same regex the client
-- zod schema uses, now enforced where it actually counts.
alter table public.lead_phones
  add constraint lead_phones_e164
  check (phone_e164 ~ '^\+[1-9]\d{6,14}$');

comment on constraint lead_phones_e164 on public.lead_phones is
  'E.164 only. Duplicate detection matches on this column literally, so a '
  'malformed value would make the lookup silently miss.';

-- ===== supabase/migrations/20260805090010_enquiry_conversion.sql =====
-- ─────────────────────────────────────────────────────────────────────
-- 20260805090010 — Convert an enquiry to a lead, atomically (+ dashboard indexes)
--
-- Converting an inbound enquiry is two writes: create the lead, then stamp
-- inbound_enquiries.converted_lead_id. Done from the client that is two round
-- trips, and the failure mode of the second one is the bad one — the lead
-- exists, the enquiry still looks unconverted, and the next person converts it
-- again. Fold the stamp INTO the existing RPC so both land in one transaction
-- or neither does.
--
-- No signature change: the enquiry id rides in the jsonb payload as
-- 'enquiry_id'. Callers that don't set it are completely unaffected.
--
-- Still SECURITY INVOKER, so the update on inbound_enquiries is subject to
-- inbound_staff_manage (is_staff()) exactly like a direct write would be — no
-- new privilege is created by routing through this function.
--
-- Double-conversion is an ERROR, not a silent overwrite: the guard is
-- `where converted_lead_id is null`, and a zero-row update aborts the whole
-- transaction (so the lead is rolled back too). Losing a duplicate lead and
-- being told why beats two leads for one enquiry.
-- ─────────────────────────────────────────────────────────────────────

create or replace function public.create_lead_with_contacts(payload jsonb)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_lead_id    uuid;
  v_contact    jsonb;
  v_phone      jsonb;
  v_contact_id uuid;
  v_enquiry_id uuid;
begin
  insert into public.leads (
    brand_name, instagram_username, address, lead_found_on,
    status, outcome, source, notes, owner_id, created_by
  )
  values (
    payload->>'brand_name',
    nullif(payload->>'instagram_username', ''),
    nullif(payload->>'address', ''),
    coalesce((payload->>'lead_found_on')::date, current_date),
    coalesce((payload->>'status')::public.lead_status, 'pending'),
    (payload->>'outcome')::public.lead_outcome,
    coalesce((payload->>'source')::public.lead_source, 'manual'),
    nullif(payload->>'notes', ''),
    coalesce((payload->>'owner_id')::uuid, auth.uid()),
    auth.uid()
  )
  returning id into v_lead_id;

  -- Contacts, each with nested phones.
  for v_contact in
    select value from jsonb_array_elements(coalesce(payload->'contacts', '[]'::jsonb))
  loop
    insert into public.lead_contacts (lead_id, name, designation, email, is_primary, sort_order)
    values (
      v_lead_id,
      v_contact->>'name',
      nullif(v_contact->>'designation', ''),
      nullif(v_contact->>'email', ''),
      coalesce((v_contact->>'is_primary')::boolean, false),
      coalesce((v_contact->>'sort_order')::int, 0)
    )
    returning id into v_contact_id;

    for v_phone in
      select value from jsonb_array_elements(coalesce(v_contact->'phones', '[]'::jsonb))
    loop
      insert into public.lead_phones (lead_id, contact_id, phone_e164, label, is_primary, sort_order)
      values (
        v_lead_id, v_contact_id,
        v_phone->>'phone_e164',
        nullif(v_phone->>'label', ''),
        coalesce((v_phone->>'is_primary')::boolean, false),
        coalesce((v_phone->>'sort_order')::int, 0)
      );
    end loop;
  end loop;

  -- Lead-level phones (office lines not tied to a person).
  for v_phone in
    select value from jsonb_array_elements(coalesce(payload->'lead_phones', '[]'::jsonb))
  loop
    insert into public.lead_phones (lead_id, contact_id, phone_e164, label, is_primary, sort_order)
    values (
      v_lead_id, null,
      v_phone->>'phone_e164',
      nullif(v_phone->>'label', ''),
      coalesce((v_phone->>'is_primary')::boolean, false),
      coalesce((v_phone->>'sort_order')::int, 0)
    );
  end loop;

  -- ── Enquiry conversion (optional) ──────────────────────────────────
  v_enquiry_id := nullif(payload->>'enquiry_id', '')::uuid;
  if v_enquiry_id is not null then
    update public.inbound_enquiries
       set converted_lead_id = v_lead_id
     where id = v_enquiry_id
       and converted_lead_id is null;

    -- Zero rows means: no such enquiry, it is not visible to this caller, or
    -- somebody converted it first. Any of those makes the lead we just built
    -- wrong, so roll the whole thing back and say so.
    if not found then
      raise exception 'enquiry_already_converted: enquiry % is missing or already converted', v_enquiry_id
        using errcode = '23505';
    end if;
  end if;

  return v_lead_id;
end;
$$;

grant execute on function public.create_lead_with_contacts(jsonb) to authenticated;

-- ── Indexes for the /crm dashboard ───────────────────────────────────
-- "Needs follow-up": contacted, no outcome yet, contacted_at older than 7
-- days. The partial predicate matches the query exactly, so the index holds
-- only the rows that can ever be in the answer.
create index leads_followup_idx
  on public.leads (contacted_at)
  where deleted_at is null and status = 'contacted' and outcome is null;

-- "Added in the last 7 days" tile + created_at sorting.
create index leads_created_at_idx
  on public.leads (created_at desc)
  where deleted_at is null;

-- Unconverted-enquiry count + the default /crm/enquiries view.
create index inbound_enquiries_unconverted_idx
  on public.inbound_enquiries (created_at desc)
  where converted_lead_id is null;

-- ===== supabase/migrations/20260805090011_enquiry_input_bounds.sql =====
-- ─────────────────────────────────────────────────────────────────────
-- 20260805090011 — Bound what an anonymous visitor can write
--
-- inbound_enquiries is the ONLY table anon can insert into (090004), and the
-- anon key is public by design — it ships in the JS bundle.
--
-- WHAT ALREADY EXISTED: the inbound_insert_anon policy's WITH CHECK (090004)
-- guards three things — non-empty name, message <= 5000, kind in the pair.
-- This migration does NOT claim credit for those.
--
-- WHAT WAS STILL UNBOUNDED, and is closed here:
--   - user_agent. Fully attacker-controlled, and the one field with no cap at
--     all — message was capped, the header next to it was not. One POST could
--     carry a megabyte there.
--   - name / phone / email / best_time. Non-empty was checked; LENGTH never
--     was, so a 1 MB name walked straight through the policy.
--   - A row with neither phone nor email: accepted, and unreachable — useless
--     to us, free filler to an abuser.
-- Same storage-exhaustion class 090007 closed for keepalive, still open on the
-- one table strangers can write to.
--
-- THE OVERLAP IS DELIBERATE. Re-stating non-empty-name and message length as a
-- CHECK is belt-and-braces in the idiom of 090009: a policy applies only to the
-- role it names, so inbound_insert_anon protects nothing on an authenticated
-- path, a future service-side writer, or a psql session. A CHECK binds every
-- writer. The policy stays as the first line; this is the floor under it.
--
-- 090007's fix was a volume bound; that does not translate here, because
-- pruning old enquiries would delete real leads. What DOES translate is a SIZE
-- bound per row, so no single submission can be arbitrarily large.
--
-- What this deliberately does NOT do:
--   - RATE limiting. Postgres CHECKs can't express "N per hour per visitor",
--     and there is no edge function in this stack. The honeypot + client-side
--     throttle in Contact.tsx are the rate guard, and they are bypassable by
--     anyone driving the REST endpoint directly. That is a known, accepted gap
--     — documented in docs/DEPLOYMENT.md — not an oversight. The row cap here
--     is what makes the gap survivable: an attacker can still make many rows,
--     but each one is small and bounded.
--   - Widen anon's grants in any way. anon still has INSERT and nothing else.
--
-- Caps are generous versus the real form (zod: name 2+, best_time <= 80,
-- message 10+) so a legitimate visitor can never hit one.
-- ─────────────────────────────────────────────────────────────────────

-- ── Pre-flight: name any existing row the new CHECKs would reject ─────
do $$
declare
  v_n   int;
  v_bad text;
begin
  select count(*), string_agg(format('%s (kind %s, name %L)', id, kind, name), E'\n  ')
    into v_n, v_bad
  from public.inbound_enquiries
  where length(trim(name)) = 0
     or length(name) > 120
     or length(coalesce(phone, '')) > 32
     or length(coalesce(email, '')) > 200
     or length(coalesce(best_time, '')) > 80
     or length(coalesce(message, '')) > 5000
     or length(coalesce(user_agent, '')) > 400;

  if v_n > 0 then
    raise exception E'090011 pre-flight: % enquiry row(s) exceed the new bounds:\n  %', v_n, v_bad;
  end if;

  raise notice '090011 pre-flight: 0 out-of-bounds enquiry rows.';
end;
$$;

alter table public.inbound_enquiries
  add constraint inbound_enquiries_bounds
  check (
    length(trim(name)) > 0
    and length(name) <= 120
    and length(coalesce(phone, '')) <= 32
    and length(coalesce(email, '')) <= 200
    and length(coalesce(best_time, '')) <= 80
    and length(coalesce(message, '')) <= 5000
    and length(coalesce(user_agent, '')) <= 400
  );

comment on constraint inbound_enquiries_bounds on public.inbound_enquiries is
  'Caps the size of a row an anonymous visitor can write. The anon key is '
  'public, so this table is writable by anyone; without a bound one POST could '
  'carry an arbitrarily large body. Rate limiting is NOT enforced here — see '
  'the migration header and docs/DEPLOYMENT.md.';

-- A visitor with no contact detail at all is unreachable, so the row is
-- useless to us and pure filler to an abuser. Require at least one route back.
alter table public.inbound_enquiries
  add constraint inbound_enquiries_contactable
  check (phone is not null or email is not null);

comment on constraint inbound_enquiries_contactable on public.inbound_enquiries is
  'Every enquiry must carry at least one way to reply — callback gives phone, '
  'query gives email. A row with neither cannot be actioned.';

-- ===== Allow-list the owner account =====
insert into public.allowed_emails (email, role)
values ('nikhil.bisht@socialscalex.com', 'owner')
on conflict (email) do update set role = 'owner';
