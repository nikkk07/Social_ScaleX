-- ─────────────────────────────────────────────────────────────────────
-- 20260928090012 — CRM v2: one canonical schema
--
-- Brings ANY earlier state of this database to one schema:
--   * the original migrations (090001–090011: status/outcome, deleted_at,
--     owner_id, lead_contacts/lead_phones), or
--   * the schema actually live in production in Sep 2026 (verified from a
--     `supabase db dump`): phone/email on leads, text status
--     (new/called/interested/not_interested/not_reachable/callback/
--     meeting_scheduled/converted/lost), is_deleted, assigned_to,
--     callback_at/meeting_at, costing, text role incl. super_admin,
--     lead_assignments, lead_notes, lead_status_history, audit_logs, uploads.
--
-- Data is never thrown away: every existing CRM table is first copied into
-- the private schema `crm_backup` (not exposed through the API), then
-- mapped into the canonical columns. Only after the mapping are legacy
-- columns dropped.
--
-- Runs in ONE transaction: either everything applies or nothing does.
-- ─────────────────────────────────────────────────────────────────────
begin;

create schema if not exists extensions;
create extension if not exists pg_trgm with schema extensions;
set local search_path = public, extensions;

-- ── Helpers (session-local, gone after this transaction) ────────────
create or replace function pg_temp.has_table(t text) returns boolean
language sql stable as $$
  select exists (select 1 from information_schema.tables
                 where table_schema = 'public' and table_name = t);
$$;

create or replace function pg_temp.has_col(t text, c text) returns boolean
language sql stable as $$
  select exists (select 1 from information_schema.columns
                 where table_schema = 'public' and table_name = t and column_name = c);
$$;

create or replace function pg_temp.col_type(t text, c text) returns text
language sql stable as $$
  select udt_name::text from information_schema.columns
  where table_schema = 'public' and table_name = t and column_name = c;
$$;

-- ── 0. Backup everything that exists ────────────────────────────────
create schema if not exists crm_backup;
revoke all on schema crm_backup from public;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke all on schema crm_backup from anon';
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke all on schema crm_backup from authenticated';
  end if;
end $$;

do $$
declare
  t text;
begin
  foreach t in array array['profiles','allowed_emails','leads','lead_contacts','lead_phones',
                           'lead_activities','inbound_enquiries','lead_assignments','lead_notes',
                           'lead_status_history','audit_logs','uploads']
  loop
    if pg_temp.has_table(t)
       and not exists (select 1 from information_schema.tables
                       where table_schema = 'crm_backup' and table_name = t || '_pre_v2') then
      execute format('create table crm_backup.%I as table public.%I', t || '_pre_v2', t);
    end if;
  end loop;
end $$;


-- ── 0b. Detach: old policies, triggers and views are replaced wholesale ─
-- (090013/090014 recreate the complete set). Dropping them first means no
-- legacy trigger fires while rows are remapped below, and no policy/view
-- blocks a column type change.
drop view if exists public.member_daily_leads cascade;
do $$
declare
  r record;
begin
  for r in select schemaname, tablename, policyname from pg_policies
           where schemaname = 'public'
             and tablename in ('profiles','allowed_emails','leads','lead_contacts','lead_phones',
                               'lead_activities','inbound_enquiries','lead_assignments','lead_tasks',
                               'call_logs','quotations','audit_log','crm_settings','login_throttle',
                               'lead_notes','lead_status_history','audit_logs','uploads')
  loop
    execute format('drop policy %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;

  for r in select c.relname as tablename, t.tgname
             from pg_trigger t
             join pg_class c on c.oid = t.tgrelid
             join pg_namespace n on n.oid = c.relnamespace
            where n.nspname = 'public' and not t.tgisinternal
              and c.relname in ('profiles','allowed_emails','leads','lead_contacts','lead_phones',
                                'lead_activities','inbound_enquiries','lead_assignments','lead_notes',
                                'lead_status_history','audit_logs','uploads')
  loop
    execute format('drop trigger %I on public.%I', r.tgname, r.tablename);
  end loop;
end $$;

-- CHECK constraints on text columns that are about to become enums (or be
-- dropped) would not survive the type change.
do $$
declare
  r record;
begin
  for r in select c.conname, t.relname
             from pg_constraint c join pg_class t on t.oid = c.conrelid
             join pg_namespace n on n.oid = t.relnamespace
            where n.nspname = 'public' and c.contype = 'c'
              and ((t.relname = 'profiles' and pg_get_constraintdef(c.oid) ~ '\mrole\M')
                or (t.relname = 'leads' and pg_get_constraintdef(c.oid) ~ '\m(status|source)\M'))
  loop
    execute format('alter table public.%I drop constraint %I', r.relname, r.conname);
  end loop;
end $$;

drop function if exists public.get_my_role() cascade;

create or replace function pg_temp.map_stage(v text) returns text
language sql immutable as $$
  select case lower(coalesce(v, ''))
    when 'pending' then 'new'           when 'new' then 'new'
    when 'called' then 'connected'      when 'contacted' then 'connected'
    when 'not_reachable' then 'attempting'
    when 'interested' then 'interested' when 'not_interested' then 'lost'
    when 'callback' then 'callback'     when 'call_back' then 'callback'
    when 'meeting' then 'meeting'       when 'meeting_scheduled' then 'meeting'
    when 'quotation' then 'quotation'   when 'negotiation' then 'negotiation'
    when 'won' then 'won'               when 'converted' then 'won'
    when 'closed_won' then 'won'
    when 'lost' then 'lost'             when 'rejected' then 'lost'
    when 'closed_lost' then 'lost'
    else null end;
$$;

-- Re-point a foreign key so deleting a staff account never fails on history.
create or replace function pg_temp.reset_fk(t text, c text, ref text) returns void
language plpgsql as $$
declare
  r record;
begin
  for r in select k.conname from pg_constraint k
             join pg_class rel on rel.oid = k.conrelid
             join pg_namespace n on n.oid = rel.relnamespace
             join pg_attribute a on a.attrelid = rel.oid and a.attnum = any (k.conkey)
            where k.contype = 'f' and n.nspname = 'public' and rel.relname = t and a.attname = c
  loop
    execute format('alter table public.%I drop constraint %I', t, r.conname);
  end loop;
  execute format('alter table public.%I add constraint %I foreign key (%I) references public.%I(id) on delete set null',
                 t, t || '_' || c || '_fkey', c, ref);
end;
$$;

create or replace function pg_temp.has_fk(t text, c text) returns boolean
language sql stable as $$
  select exists (
    select 1 from pg_constraint k
      join pg_class r on r.oid = k.conrelid
      join pg_namespace n on n.oid = r.relnamespace
      join pg_attribute a on a.attrelid = r.oid and a.attnum = any (k.conkey)
     where k.contype = 'f' and n.nspname = 'public' and r.relname = t and a.attname = c);
$$;

create or replace function public.normalize_instagram(raw text)
returns text
language plpgsql immutable
set search_path = public
as $$
declare
  h text := trim(coalesce(raw, ''));
begin
  h := regexp_replace(h, '^(https?://)?(www\.)?instagram\.com/', '', 'i');
  h := regexp_replace(h, '^@+', '');
  h := split_part(split_part(split_part(h, '/', 1), '?', 1), ' ', 1);
  h := lower(h);
  if h ~ '^[a-z0-9._]{1,30}$' then return h; end if;
  return null;
end;
$$;

-- ── 1. Enums ─────────────────────────────────────────────────────────
do $$ begin create type public.app_role as enum ('owner','admin','member');
exception when duplicate_object then null; end $$;
do $$ begin create type public.lead_source as enum ('manual','website_callback','website_query','import');
exception when duplicate_object then null; end $$;
do $$ begin create type public.lead_stage as enum
  ('new','attempting','connected','interested','callback','meeting','quotation',
   'negotiation','won','lost','nurture','dnc');
exception when duplicate_object then null; end $$;
do $$ begin create type public.lost_reason as enum
  ('using_other_agency','budget','no_need_now','not_decision_maker','bad_past_experience',
   'price','scope','chose_competitor','no_response','invalid_contact','other');
exception when duplicate_object then null; end $$;
do $$ begin create type public.task_type as enum
  ('callback','meeting','follow_up','quote_follow_up','retry_call','re_engage','nurture');
exception when duplicate_object then null; end $$;
do $$ begin create type public.task_status as enum ('open','done','cancelled');
exception when duplicate_object then null; end $$;
do $$ begin create type public.meeting_mode as enum ('phone','video','in_person');
exception when duplicate_object then null; end $$;
do $$ begin create type public.quote_status as enum ('sent','accepted','rejected','revised');
exception when duplicate_object then null; end $$;
do $$ begin create type public.contact_channel as enum ('call','whatsapp');
exception when duplicate_object then null; end $$;
do $$ begin create type public.attempt_result as enum
  ('no_answer','busy','switched_off','not_reachable','rejected','wrong_number','connected',
   'wa_sent','wa_replied','not_on_whatsapp');
exception when duplicate_object then null; end $$;
do $$ begin create type public.connect_outcome as enum
  ('interested','call_later','not_interested','do_not_call','wrong_person','language_barrier',
   'call_dropped','still_deciding','quote_accepted','quote_revision','quote_rejected');
exception when duplicate_object then null; end $$;

-- ── 2. profiles ──────────────────────────────────────────────────────
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null default '',
  full_name   text,
  role        public.app_role not null default 'member',
  created_at  timestamptz not null default now()
);

-- role may be text in the simplified variant ('super_admin' included).
do $$
begin
  if pg_temp.col_type('profiles','role') is distinct from 'app_role' then
    alter table public.profiles alter column role drop default;
    alter table public.profiles alter column role type public.app_role using (
      case lower(coalesce(role::text, ''))
        when 'owner' then 'owner'
        when 'super_admin' then 'owner'
        when 'superadmin' then 'owner'
        when 'admin' then 'admin'
        else 'member'
      end
    )::public.app_role;
    alter table public.profiles alter column role set default 'member';
    update public.profiles set role = 'member' where role is null;
    alter table public.profiles alter column role set not null;
  end if;
end $$;

alter table public.profiles add column if not exists email text;
update public.profiles p set email = coalesce(nullif(p.email, ''), u.email, '')
  from auth.users u where u.id = p.id and coalesce(p.email, '') = '';
update public.profiles set email = '' where email is null;
alter table public.profiles alter column email set default '';
alter table public.profiles alter column email set not null;
alter table public.profiles add column if not exists full_name text;
alter table public.profiles alter column full_name drop not null;
do $$ begin
  if pg_temp.has_col('profiles','phone') then
    alter table public.profiles alter column phone drop not null;
  end if;
end $$;
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists daily_lead_quota integer;
alter table public.profiles add column if not exists is_active boolean not null default true;
alter table public.profiles add column if not exists last_top_up_on date;
alter table public.profiles add column if not exists updated_at timestamptz not null default now();
alter table public.profiles add column if not exists address text;
alter table public.profiles add column if not exists created_by uuid;

-- Normalise staff phones to E.164 (+91 for bare 10-digit Indian mobiles).
create or replace function public.normalize_phone(raw text)
returns text
language plpgsql immutable
set search_path = public
as $$
declare
  s text := coalesce(raw, '');
  d text;
begin
  s := regexp_replace(s, '[\s\-\.\(\)]', '', 'g');
  if s = '' then return null; end if;
  if left(s, 2) = '00' then s := '+' || substr(s, 3); end if;
  if left(s, 1) = '+' then
    d := substr(s, 2);
    if d ~ '^[1-9][0-9]{6,14}$' then return '+' || d; end if;
    return null;
  end if;
  d := regexp_replace(s, '^0+', '');
  if d !~ '^[0-9]+$' then return null; end if;
  if length(d) = 10 and d ~ '^[6-9]' then return '+91' || d; end if;
  if length(d) = 12 and left(d, 2) = '91' and substr(d, 3, 1) ~ '[6-9]' then return '+' || d; end if;
  return null;
end;
$$;

-- Two legacy spellings of one number (e.g. 098… and 98…) normalise to the
-- same E.164 value; the older account keeps it (backup has the original).
update public.profiles p set phone = null
 where p.phone is not null
   and (public.normalize_phone(p.phone) is null
        or exists (select 1 from public.profiles q
                    where q.phone is not null
                      and public.normalize_phone(q.phone) = public.normalize_phone(p.phone)
                      and (q.created_at, q.id) < (p.created_at, p.id)));
update public.profiles set phone = public.normalize_phone(phone)
 where phone is not null and phone is distinct from public.normalize_phone(phone);
update public.profiles set daily_lead_quota = null where daily_lead_quota < 0;

do $$ begin
  alter table public.profiles add constraint profiles_phone_e164
    check (phone is null or phone ~ '^\+[1-9][0-9]{6,14}$');
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.profiles add constraint profiles_quota_range
    check (daily_lead_quota is null or daily_lead_quota between 0 and 500);
exception when duplicate_object then null; end $$;
create unique index if not exists profiles_phone_unique on public.profiles (phone) where phone is not null;

-- ── 3. leads: make sure the table and every canonical column exist ──
create table if not exists public.leads (
  id          uuid primary key default gen_random_uuid(),
  brand_name  text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.leads add column if not exists instagram_username text;
alter table public.leads add column if not exists address text;
alter table public.leads add column if not exists lead_found_on date;
alter table public.leads add column if not exists notes text;
alter table public.leads add column if not exists owner_id uuid;
alter table public.leads add column if not exists created_by uuid;
alter table public.leads add column if not exists updated_by uuid;
alter table public.leads add column if not exists deleted_at timestamptz;
alter table public.leads add column if not exists stage public.lead_stage;
alter table public.leads add column if not exists lost_reason public.lost_reason;
alter table public.leads add column if not exists lost_note text;
alter table public.leads add column if not exists dnc boolean not null default false;
alter table public.leads add column if not exists dnc_at timestamptz;
alter table public.leads add column if not exists attempt_count integer not null default 0;
alter table public.leads add column if not exists last_attempt_at timestamptz;
alter table public.leads add column if not exists last_connected_at timestamptz;
alter table public.leads add column if not exists next_action_at timestamptz;
alter table public.leads add column if not exists next_action_type public.task_type;
alter table public.leads add column if not exists deal_value_inr numeric(12,2);
alter table public.leads add column if not exists competitor_name text;
alter table public.leads add column if not exists competitor_contract_end date;
alter table public.leads add column if not exists project_start_date date;
alter table public.leads add column if not exists expected_delivery_date date;
alter table public.leads add column if not exists project_end_date date;
alter table public.leads add column if not exists stage_changed_at timestamptz not null default now();
alter table public.leads add column if not exists assigned_at timestamptz;

-- source: enum in the original schema, free text in the simplified one.
do $$
begin
  if not pg_temp.has_col('leads','source') then
    alter table public.leads add column source public.lead_source not null default 'manual';
  elsif pg_temp.col_type('leads','source') <> 'lead_source' then
    update public.leads set notes = concat_ws(E'\n', notes, 'Legacy source: ' || source::text)
     where coalesce(source::text, '') <> ''
       and lower(source::text) not in ('manual','website_callback','callback','website_query','query',
                                       'website','import','csv');
    alter table public.leads alter column source drop default;
    alter table public.leads alter column source type public.lead_source using (
      case lower(coalesce(source::text, ''))
        when 'website_callback' then 'website_callback'
        when 'callback' then 'website_callback'
        when 'website_query' then 'website_query'
        when 'query' then 'website_query'
        when 'website' then 'website_query'
        when 'import' then 'import'
        when 'csv' then 'import'
        else 'manual'
      end
    )::public.lead_source;
    update public.leads set source = 'manual' where source is null;
    alter table public.leads alter column source set default 'manual';
    alter table public.leads alter column source set not null;
  end if;
end $$;

-- owner: simplified variant used assigned_to, then lead_assignments.
do $$
begin
  if pg_temp.has_col('leads','assigned_to') then
    execute 'update public.leads set owner_id = coalesce(owner_id, assigned_to)';
  end if;
  if pg_temp.has_table('lead_assignments') then
    execute $q$
      update public.leads l set owner_id = a.member_id
        from (select distinct on (lead_id) lead_id, member_id, assigned_at
                from public.lead_assignments order by lead_id, assigned_at asc nulls last) a
       where a.lead_id = l.id and l.owner_id is null
    $q$;
  end if;
  -- An owner that is not a profile (deleted user) cannot be kept as an FK.
  update public.leads l set owner_id = null
   where owner_id is not null and not exists (select 1 from public.profiles p where p.id = l.owner_id);
  update public.leads l set created_by = null
   where created_by is not null and not exists (select 1 from public.profiles p where p.id = l.created_by);
  update public.leads l set updated_by = null
   where updated_by is not null and not exists (select 1 from public.profiles p where p.id = l.updated_by);
  update public.leads set assigned_at = coalesce(assigned_at, updated_at, created_at) where owner_id is not null;
end $$;

-- soft delete
do $$
begin
  if pg_temp.has_col('leads','is_deleted') then
    execute 'update public.leads set deleted_at = coalesce(deleted_at, updated_at, now()) where is_deleted is true';
  end if;
end $$;

-- stage from status/outcome (every variant seen so far)
do $$
declare
  has_outcome boolean := pg_temp.has_col('leads','outcome');
begin
  if pg_temp.has_col('leads','status') then
    execute format($q$
      update public.leads set
        stage = coalesce(
          case when lower(status::text) = 'contacted' then %s end,
          pg_temp.map_stage(status::text), 'new')::public.lead_stage,
        notes = case when pg_temp.map_stage(status::text) is null and coalesce(status::text, '') <> ''
                     then concat_ws(E'\n', notes, 'Legacy status: ' || status::text) else notes end
      where stage is null
    $q$,
    case when has_outcome then
      $c$(case outcome::text when 'interested' then 'interested'
                              when 'not_interested' then 'lost'
                              else 'connected' end)$c$
    else 'null' end);
  end if;
  update public.leads set stage = 'new' where stage is null;
  update public.leads set lost_reason = 'other' where stage = 'lost' and lost_reason is null;
end $$;

alter table public.leads alter column stage set default 'new';
alter table public.leads alter column stage set not null;

do $$
begin
  if pg_temp.has_col('leads','contacted_at') then
    execute 'update public.leads set last_connected_at = coalesce(last_connected_at, contacted_at)';
  end if;
  if pg_temp.has_col('leads','costing') then
    execute 'update public.leads set deal_value_inr = coalesce(deal_value_inr, nullif(costing,0)::numeric(12,2))';
  end if;
  update public.leads set lead_found_on = coalesce(lead_found_on, created_at::date, current_date);
  update public.leads set stage_changed_at = coalesce(updated_at, created_at, now());
end $$;
alter table public.leads alter column lead_found_on set default current_date;
alter table public.leads alter column lead_found_on set not null;

-- Instagram handles must be normalised; anything unparseable moves into notes.
update public.leads set
  notes = concat_ws(E'\n', notes, 'Legacy Instagram: ' || instagram_username),
  instagram_username = null
where instagram_username is not null and public.normalize_instagram(instagram_username) is null;
update public.leads set instagram_username = public.normalize_instagram(instagram_username)
where instagram_username is not null
  and instagram_username is distinct from public.normalize_instagram(instagram_username);
-- Case-insensitive duplicates among active leads: keep the oldest handle.
update public.leads l set
  notes = concat_ws(E'\n', l.notes, 'Duplicate Instagram handle removed: ' || l.instagram_username),
  instagram_username = null
where l.instagram_username is not null and l.deleted_at is null
  and exists (select 1 from public.leads o
              where o.deleted_at is null and o.instagram_username = l.instagram_username
                and (o.created_at, o.id) < (l.created_at, l.id));

-- ── 4. Children tables (create when missing) ─────────────────────────
create table if not exists public.lead_contacts (
  id          uuid primary key default gen_random_uuid(),
  lead_id     uuid not null references public.leads(id) on delete cascade,
  name        text not null check (length(trim(name)) > 0),
  designation text,
  email       text,
  is_primary  boolean not null default false,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);
create table if not exists public.lead_phones (
  id          uuid primary key default gen_random_uuid(),
  lead_id     uuid not null references public.leads(id) on delete cascade,
  contact_id  uuid references public.lead_contacts(id) on delete cascade,
  phone_e164  text not null,
  label       text,
  is_primary  boolean not null default false,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);
alter table public.lead_phones add column if not exists is_invalid boolean not null default false;
alter table public.lead_phones add column if not exists no_whatsapp boolean not null default false;

create table if not exists public.lead_activities (
  id          uuid primary key default gen_random_uuid(),
  lead_id     uuid not null references public.leads(id) on delete cascade,
  actor_id    uuid,
  kind        text not null,
  detail      jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create table if not exists public.inbound_enquiries (
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

-- Simplified variant: phone/email lived on the lead row → contact + phone.
do $$
declare
  has_phone boolean := pg_temp.has_col('leads','phone');
  has_email boolean := pg_temp.has_col('leads','email');
  r record;
  v_contact uuid;
  v_e164 text;
  v_phone_raw text;
  v_email_raw text;
begin
  if not (has_phone or has_email) then return; end if;
  for r in execute format(
    'select id, brand_name, %s as phone_raw, %s as email_raw from public.leads',
    case when has_phone then 'phone::text' else 'null::text' end,
    case when has_email then 'email::text' else 'null::text' end)
  loop
    v_phone_raw := nullif(trim(coalesce(r.phone_raw, '')), '');
    v_email_raw := nullif(trim(coalesce(r.email_raw, '')), '');
    continue when v_phone_raw is null and v_email_raw is null;
    continue when exists (select 1 from public.lead_contacts c where c.lead_id = r.id);

    insert into public.lead_contacts (lead_id, name, email, is_primary, sort_order)
    values (r.id, 'Primary contact',
            case when v_email_raw ~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' then lower(v_email_raw) end,
            true, 0)
    returning id into v_contact;

    if v_email_raw is not null and v_email_raw !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' then
      update public.leads set notes = concat_ws(E'\n', notes, 'Legacy email: ' || v_email_raw) where id = r.id;
    end if;

    if v_phone_raw is not null then
      v_e164 := public.normalize_phone(v_phone_raw);
      if v_e164 is not null then
        insert into public.lead_phones (lead_id, contact_id, phone_e164, label, is_primary, sort_order)
        values (r.id, v_contact, v_e164, 'Mobile', true, 0);
      else
        update public.leads set notes = concat_ws(E'\n', notes, 'Legacy phone: ' || v_phone_raw) where id = r.id;
      end if;
    end if;
  end loop;
end $$;

-- Phones that are not E.164 cannot be dialled reliably: normalise or park.
update public.lead_phones set phone_e164 = public.normalize_phone(phone_e164)
 where phone_e164 !~ '^\+[1-9][0-9]{6,14}$' and public.normalize_phone(phone_e164) is not null;
update public.leads l set notes = concat_ws(E'\n', l.notes,
         'Legacy phone: ' || (select string_agg(p.phone_e164, ', ') from public.lead_phones p
                              where p.lead_id = l.id and p.phone_e164 !~ '^\+[1-9][0-9]{6,14}$'))
 where exists (select 1 from public.lead_phones p where p.lead_id = l.id
               and p.phone_e164 !~ '^\+[1-9][0-9]{6,14}$');
delete from public.lead_phones where phone_e164 !~ '^\+[1-9][0-9]{6,14}$';

do $$ begin
  alter table public.inbound_enquiries add constraint inbound_enquiries_bounds check (
    length(trim(name)) > 0 and length(name) <= 120
    and length(coalesce(phone, '')) <= 32 and length(coalesce(email, '')) <= 200
    and length(coalesce(best_time, '')) <= 80 and length(coalesce(message, '')) <= 5000
    and length(coalesce(user_agent, '')) <= 400);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.inbound_enquiries add constraint inbound_enquiries_contactable
    check (phone is not null or email is not null);
exception when duplicate_object then null; end $$;

-- Keepalive heartbeat for the free tier (GitHub Action → ping_keepalive()).
create table if not exists public.keepalive (
  id         bigserial primary key,
  pinged_at  timestamptz not null default now(),
  source     text
);
alter table public.keepalive enable row level security;

-- ── 5. New tables ────────────────────────────────────────────────────
create table if not exists public.lead_tasks (
  id               uuid primary key default gen_random_uuid(),
  lead_id          uuid not null references public.leads(id) on delete cascade,
  assignee_id      uuid references public.profiles(id) on delete set null,
  type             public.task_type not null,
  status           public.task_status not null default 'open',
  due_at           timestamptz not null,
  meeting_mode     public.meeting_mode,
  location         text check (location is null or length(location) <= 500),
  note             text check (note is null or length(note) <= 2000),
  result           text check (result is null or length(result) <= 200),
  reschedule_count integer not null default 0,
  created_by       uuid references public.profiles(id) on delete set null,
  created_at       timestamptz not null default now(),
  completed_at     timestamptz,
  completed_by     uuid references public.profiles(id) on delete set null,
  constraint lead_tasks_meeting_mode check (type = 'meeting' or meeting_mode is null),
  constraint lead_tasks_closed_stamp check (status = 'open' or completed_at is not null)
);

create table if not exists public.call_logs (
  id          uuid primary key default gen_random_uuid(),
  lead_id     uuid not null references public.leads(id) on delete cascade,
  phone_id    uuid references public.lead_phones(id) on delete set null,
  phone_e164  text,
  task_id     uuid references public.lead_tasks(id) on delete set null,
  actor_id    uuid references public.profiles(id) on delete set null,
  channel     public.contact_channel not null,
  started_at  timestamptz not null default now(),
  logged_at   timestamptz,
  result      public.attempt_result,
  outcome     public.connect_outcome,
  lost_reason public.lost_reason,
  note        text check (note is null or length(note) <= 2000),
  created_at  timestamptz not null default now(),
  constraint call_logs_logged check ((result is null) = (logged_at is null))
);

create table if not exists public.quotations (
  id             uuid primary key default gen_random_uuid(),
  lead_id        uuid not null references public.leads(id) on delete cascade,
  version        integer not null,
  amount_inr     numeric(12,2) not null check (amount_inr > 0),
  valid_until    date,
  services       text check (services is null or length(services) <= 2000),
  link           text check (link is null or (length(link) <= 1000 and link ~* '^https://')),
  status         public.quote_status not null default 'sent',
  sent_by        uuid references public.profiles(id) on delete set null,
  sent_at        timestamptz not null default now(),
  decided_at     timestamptz,
  decision_reason public.lost_reason,
  note           text check (note is null or length(note) <= 2000),
  unique (lead_id, version)
);

create table if not exists public.audit_log (
  id         bigserial primary key,
  actor_id   uuid references public.profiles(id) on delete set null,
  action     text not null,
  entity     text not null,
  entity_id  text,
  detail     jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.crm_settings (
  id                        smallint primary key default 1 check (id = 1),
  retry_no_answer_minutes   integer not null default 120 check (retry_no_answer_minutes between 5 and 10080),
  retry_busy_minutes        integer not null default 30  check (retry_busy_minutes between 5 and 10080),
  retry_unreachable_minutes integer not null default 1440 check (retry_unreachable_minutes between 5 and 10080),
  retry_rejected_minutes    integer not null default 1440 check (retry_rejected_minutes between 5 and 10080),
  nurture_after_misses      integer not null default 6   check (nurture_after_misses between 2 and 50),
  nurture_days              integer not null default 30  check (nurture_days between 1 and 365),
  re_engage_days            integer not null default 90  check (re_engage_days between 1 and 730),
  quote_follow_up_days      integer not null default 2   check (quote_follow_up_days between 1 and 60),
  default_daily_quota       integer not null default 10  check (default_daily_quota between 0 and 500),
  idle_timeout_minutes      integer not null default 60  check (idle_timeout_minutes between 5 and 1440),
  updated_at                timestamptz not null default now()
);
insert into public.crm_settings (id) values (1) on conflict (id) do nothing;

do $$
begin
  if pg_temp.has_table('audit_logs') then
    execute $q$
      insert into public.audit_log (actor_id, action, entity, entity_id, detail, created_at)
      select case when exists (select 1 from public.profiles p where p.id = a.user_id) then a.user_id end,
             a.action, coalesce(a.table_name, 'legacy'), a.record_id::text,
             coalesce(a.details, '{}'::jsonb) || jsonb_strip_nulls(jsonb_build_object('ip', a.ip_address, 'legacy', true)),
             a.created_at
        from public.audit_logs a
    $q$;
  end if;
  if pg_temp.has_table('uploads') then
    execute $q$
      insert into public.audit_log (actor_id, action, entity, entity_id, detail, created_at)
      select case when exists (select 1 from public.profiles p where p.id = u.uploaded_by) then u.uploaded_by end,
             'lead.import', 'upload', u.id::text,
             jsonb_strip_nulls(jsonb_build_object('filename', u.filename, 'storage_path', u.storage_path,
                                                  'rows', u.row_count, 'legacy', true)),
             u.created_at
        from public.uploads u
    $q$;
  end if;
end $$;

create table if not exists public.login_throttle (
  key          text primary key,
  fail_count   integer not null default 0,
  first_fail_at timestamptz not null default now(),
  locked_until timestamptz
);

-- Simplified variant: callback_at / meeting_at become real tasks.
do $$
begin
  if pg_temp.has_col('leads','callback_at') then
    execute $q$
      insert into public.lead_tasks (lead_id, assignee_id, type, due_at, note, created_at)
      select id, owner_id, 'callback', callback_at, 'Migrated from the previous CRM', now()
        from public.leads
       where callback_at is not null and deleted_at is null
         and stage not in ('won','lost','dnc')
    $q$;
  end if;
  if pg_temp.has_col('leads','meeting_at') then
    execute $q$
      insert into public.lead_tasks (lead_id, assignee_id, type, due_at, meeting_mode, note, created_at)
      select id, owner_id, 'meeting', meeting_at, 'phone', 'Migrated from the previous CRM', now()
        from public.leads
       where meeting_at is not null and deleted_at is null
         and stage not in ('won','lost','dnc')
    $q$;
  end if;
end $$;

-- Legacy history → the unified timeline / audit log.
do $$
begin
  if pg_temp.has_table('lead_notes') then
    execute $q$
      insert into public.lead_activities (lead_id, actor_id, kind, detail, created_at)
      select n.lead_id, case when exists (select 1 from public.profiles p where p.id = n.user_id) then n.user_id end,
             'note', jsonb_build_object('text', n.note, 'legacy', true), n.created_at
        from public.lead_notes n
       where exists (select 1 from public.leads l where l.id = n.lead_id)
    $q$;
  end if;
  if pg_temp.has_table('lead_status_history') then
    execute $q$
      insert into public.lead_activities (lead_id, actor_id, kind, detail, created_at)
      select h.lead_id, case when exists (select 1 from public.profiles p where p.id = h.changed_by) then h.changed_by end,
             'stage_changed',
             jsonb_strip_nulls(jsonb_build_object(
               'from', pg_temp.map_stage(h.old_status), 'to', coalesce(pg_temp.map_stage(h.new_status), 'new'),
               'legacy_from', h.old_status, 'legacy_to', h.new_status, 'note', h.note)),
             h.changed_at
        from public.lead_status_history h
       where exists (select 1 from public.leads l where l.id = h.lead_id)
    $q$;
  end if;
end $$;

-- ── 6. Drop legacy objects (data already mapped + backed up) ─────────
drop function if exists public.get_member_accessible_leads(uuid, integer) cascade;
drop function if exists public.assign_leads_to_member(uuid, integer, uuid) cascade;
drop table if exists public.lead_assignments cascade;
drop table if exists public.allowed_emails cascade;
drop table if exists public.lead_notes cascade;
drop table if exists public.lead_status_history cascade;
drop table if exists public.audit_logs cascade;
drop table if exists public.uploads cascade;

drop trigger if exists leads_status_coherence on public.leads;
drop function if exists public.tg_leads_status_coherence() cascade;

alter table public.leads drop column if exists status cascade;
alter table public.leads drop column if exists outcome cascade;
alter table public.leads drop column if exists contacted_at cascade;
alter table public.leads drop column if exists phone cascade;
alter table public.leads drop column if exists email cascade;
alter table public.leads drop column if exists is_deleted cascade;
alter table public.leads drop column if exists assigned_to cascade;
alter table public.leads drop column if exists callback_at cascade;
alter table public.leads drop column if exists meeting_at cascade;
alter table public.leads drop column if exists costing cascade;

-- lead_status / lead_outcome types are kept: the crm_backup copies use them.

-- ── 7. Constraints and FKs on leads ──────────────────────────────────
do $$ begin perform pg_temp.reset_fk('leads', 'owner_id', 'profiles'); end $$;
do $$ begin
  if pg_temp.has_col('profiles','created_by') then
    perform pg_temp.reset_fk('profiles', 'created_by', 'profiles');
  end if;
end $$;
do $$ begin perform pg_temp.reset_fk('leads', 'created_by', 'profiles'); end $$;
do $$ begin perform pg_temp.reset_fk('leads', 'updated_by', 'profiles'); end $$;
do $$ begin
  alter table public.leads add constraint leads_brand_nonempty check (length(trim(brand_name)) > 0);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.leads add constraint leads_lost_reason_only_when_lost
    check (stage = 'lost' or lost_reason is null);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.leads add constraint leads_dnc_consistent check (dnc = (stage = 'dnc'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.leads add constraint leads_deal_value_positive check (deal_value_inr is null or deal_value_inr >= 0);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.leads add constraint leads_text_bounds check (
    length(brand_name) <= 200 and length(coalesce(address,'')) <= 500
    and length(coalesce(notes,'')) <= 10000 and length(coalesce(lost_note,'')) <= 2000
    and length(coalesce(competitor_name,'')) <= 200);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.leads add constraint leads_instagram_normalised check (
    instagram_username is null or (instagram_username = lower(instagram_username)
      and instagram_username !~ '[@/[:space:]]' and instagram_username <> ''));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.lead_phones add constraint lead_phones_e164 check (phone_e164 ~ '^\+[1-9][0-9]{6,14}$');
exception when duplicate_object then null; end $$;
do $$ begin perform pg_temp.reset_fk('lead_activities', 'actor_id', 'profiles'); end $$;

-- ── 8. Indexes ───────────────────────────────────────────────────────
drop index if exists public.leads_status_idx;
drop index if exists public.leads_followup_idx;
drop index if exists public.leads_instagram_unique;
create unique index if not exists leads_instagram_unique_ci
  on public.leads (lower(instagram_username))
  where deleted_at is null and instagram_username is not null;
create index if not exists leads_stage_idx      on public.leads (stage) where deleted_at is null;
create index if not exists leads_owner_idx2     on public.leads (owner_id, stage) where deleted_at is null;
create index if not exists leads_next_action_idx on public.leads (next_action_at) where deleted_at is null;
create index if not exists leads_created_at_idx2 on public.leads (created_at desc) where deleted_at is null;
create index if not exists leads_pool_idx       on public.leads (created_at)
  where deleted_at is null and owner_id is null and dnc = false;
create index if not exists leads_brand_trgm_idx on public.leads using gin (brand_name gin_trgm_ops);
create index if not exists lead_contacts_lead_idx on public.lead_contacts (lead_id);
-- Primary flags: fix any duplicates first (keep the lowest sort_order), then enforce.
update public.lead_contacts c set is_primary = false
 where is_primary and exists (select 1 from public.lead_contacts o where o.lead_id = c.lead_id and o.is_primary
                               and (o.sort_order, o.created_at, o.id) < (c.sort_order, c.created_at, c.id));
update public.lead_phones p set is_primary = false
 where is_primary and exists (select 1 from public.lead_phones o where o.is_primary
                               and o.lead_id = p.lead_id and o.contact_id is not distinct from p.contact_id
                               and (o.sort_order, o.created_at, o.id) < (p.sort_order, p.created_at, p.id));
create unique index if not exists lead_contacts_one_primary on public.lead_contacts (lead_id) where is_primary;
create unique index if not exists lead_phones_one_primary_per_contact
  on public.lead_phones (contact_id) where is_primary and contact_id is not null;
create unique index if not exists lead_phones_one_primary_lead_level
  on public.lead_phones (lead_id) where is_primary and contact_id is null;
create index if not exists lead_phones_lead_idx   on public.lead_phones (lead_id);
create index if not exists lead_phones_e164_idx   on public.lead_phones (phone_e164);
create index if not exists lead_activities_lead_idx on public.lead_activities (lead_id, created_at desc);
create index if not exists lead_tasks_assignee_idx on public.lead_tasks (assignee_id, status, due_at);
create index if not exists lead_tasks_lead_idx     on public.lead_tasks (lead_id, status);
create index if not exists lead_tasks_open_due_idx on public.lead_tasks (due_at) where status = 'open';
create index if not exists call_logs_lead_idx      on public.call_logs (lead_id, started_at desc);
create index if not exists call_logs_pending_idx   on public.call_logs (actor_id) where result is null;
create index if not exists call_logs_started_idx   on public.call_logs (started_at);
create index if not exists quotations_lead_idx     on public.quotations (lead_id, version desc);
create index if not exists audit_log_created_idx   on public.audit_log (created_at desc);
create index if not exists inbound_enquiries_created_idx on public.inbound_enquiries (created_at desc);

commit;
