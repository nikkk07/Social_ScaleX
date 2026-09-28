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
