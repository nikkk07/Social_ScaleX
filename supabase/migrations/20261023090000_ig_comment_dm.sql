-- ─────────────────────────────────────────────────────────────────────
-- Self-serve Instagram comment-to-DM (₹99 / Instagram account / month).
--
-- Customers are ordinary Supabase Auth users WITHOUT app_metadata.crm_role,
-- so handle_new_user() gives them no CRM profile and every CRM policy treats
-- them as strangers. Customer data below is reached ONLY through /api/app/*
-- routes running with the service role, which check ownership themselves.
-- RLS is enabled with no policies and table grants are revoked, so the anon
-- and authenticated roles can read or write none of it directly.
-- ─────────────────────────────────────────────────────────────────────
begin;

set local search_path = public;

-- ── Customer profile (name, mobile, WhatsApp) ───────────────────────
-- Mobile is unique so customers can sign in with it instead of the email.
-- Numbers are stored as +91XXXXXXXXXX.
create table if not exists public.app_customers (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null check (char_length(full_name) between 2 and 80),
  phone       text not null unique check (phone ~ '^\+91[6-9][0-9]{9}$'),
  whatsapp    text not null check (whatsapp ~ '^\+91[6-9][0-9]{9}$'),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Cache of Instagram username lookups (Business Discovery), so typing the
-- same name twice, or many customers checking one account, costs one call.
create table if not exists public.ig_lookups (
  username    text primary key,
  found       boolean not null,
  data        jsonb,
  fetched_at  timestamptz not null default now()
);

-- ── Connected Instagram professional accounts ────────────────────────
create table if not exists public.ig_accounts (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  -- Instagram professional account ID: webhook entry.id and the API path id.
  ig_user_id         text not null unique,
  -- App-scoped Instagram user ID (token exchange / /me id). Used by
  -- deauthorize and data-deletion callbacks.
  ig_scoped_id       text,
  username           text not null,
  name               text,
  avatar_url         text,
  account_type       text,
  token_enc          text,
  token_expires_at   timestamptz,
  token_refreshed_at timestamptz,
  permissions        text[] not null default '{}',
  status             text not null default 'connected'
                     check (status in ('connected', 'reconnect', 'disconnected')),
  last_error         text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index if not exists ig_accounts_user_idx on public.ig_accounts (user_id);
create index if not exists ig_accounts_scoped_idx on public.ig_accounts (ig_scoped_id);

-- ── Automations (rules) ──────────────────────────────────────────────
create table if not exists public.ig_automations (
  id             uuid primary key default gen_random_uuid(),
  account_id     uuid not null references public.ig_accounts(id) on delete cascade,
  name           text not null check (char_length(name) between 1 and 80),
  media_scope    text not null check (media_scope in ('all', 'selected')),
  media_ids      text[] not null default '{}',
  -- Thumbnails and captions of the selected media, for the dashboard only.
  media_meta     jsonb not null default '[]'::jsonb,
  trigger_mode   text not null check (trigger_mode in ('any', 'keywords')),
  keywords       text[] not null default '{}',
  public_replies text[] not null default '{}',
  dm_text        text not null check (char_length(dm_text) between 1 and 1000),
  is_enabled     boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint ig_automations_media_chk check (media_scope = 'all' or cardinality(media_ids) between 1 and 100),
  constraint ig_automations_kw_chk check (trigger_mode = 'any' or cardinality(keywords) between 1 and 30),
  constraint ig_automations_replies_chk check (cardinality(public_replies) <= 5)
);
create index if not exists ig_automations_account_idx on public.ig_automations (account_id);

-- ── Billing: one row per Instagram account ───────────────────────────
-- An account is live while paid_until > now(). AutoPay renewals and one-time
-- payments both move paid_until forward; nothing else switches it on.
create table if not exists public.ig_billing (
  account_id          uuid primary key references public.ig_accounts(id) on delete cascade,
  user_id             uuid not null references auth.users(id) on delete cascade,
  mode                text check (mode in ('autopay', 'once')),
  rzp_subscription_id text unique,
  rzp_status          text,
  paid_until          timestamptz,
  updated_at          timestamptz not null default now()
);

-- Every Razorpay order / subscription we create, so a payment can only ever
-- credit the account and user it was created for.
create table if not exists public.ig_checkouts (
  rzp_id      text primary key,
  kind        text not null check (kind in ('order', 'subscription')),
  account_id  uuid not null references public.ig_accounts(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now()
);

-- Every credited payment. The unique payment id makes crediting idempotent
-- whether the browser callback or the webhook arrives first (or twice).
create table if not exists public.ig_payments (
  rzp_payment_id      text primary key,
  account_id          uuid references public.ig_accounts(id) on delete set null,
  user_id             uuid references auth.users(id) on delete set null,
  kind                text not null check (kind in ('order', 'subscription')),
  rzp_ref_id          text not null,
  amount_paise        integer not null,
  paid_until          timestamptz,
  created_at          timestamptz not null default now()
);

-- Razorpay webhook event ids already handled (duplicate deliveries).
create table if not exists public.rzp_events (
  event_id    text primary key,
  created_at  timestamptz not null default now()
);

-- One row per comment we saw on a connected account. The unique key is the
-- webhook dedupe: Meta retries for up to 36 hours.
create table if not exists public.ig_events (
  id                 bigint generated always as identity primary key,
  account_id         uuid not null references public.ig_accounts(id) on delete cascade,
  automation_id      uuid references public.ig_automations(id) on delete set null,
  comment_id         text not null,
  media_id           text,
  commenter_id       text,
  commenter_username text,
  comment_text       text,
  status             text not null default 'pending'
                     check (status in ('pending', 'sent', 'skipped', 'failed')),
  detail             text,
  dm_sent            boolean not null default false,
  reply_sent         boolean not null default false,
  created_at         timestamptz not null default now(),
  unique (account_id, comment_id)
);
create index if not exists ig_events_account_time_idx on public.ig_events (account_id, created_at desc);
create index if not exists ig_events_commenter_idx on public.ig_events (account_id, commenter_id, media_id, created_at desc);

-- Small key/value store for server settings (e.g. the Razorpay plan id).
create table if not exists public.app_config (
  key        text primary key,
  value      text not null,
  updated_at timestamptz not null default now()
);

-- updated_at maintenance
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists ig_accounts_touch on public.ig_accounts;
create trigger ig_accounts_touch before update on public.ig_accounts
  for each row execute function public.touch_updated_at();
drop trigger if exists ig_automations_touch on public.ig_automations;
create trigger ig_automations_touch before update on public.ig_automations
  for each row execute function public.touch_updated_at();
drop trigger if exists app_customers_touch on public.app_customers;
create trigger app_customers_touch before update on public.app_customers
  for each row execute function public.touch_updated_at();
drop trigger if exists ig_billing_touch on public.ig_billing;
create trigger ig_billing_touch before update on public.ig_billing
  for each row execute function public.touch_updated_at();

-- Lock everything to the service role.
do $$
declare t text;
begin
  foreach t in array array['app_customers','ig_lookups','ig_accounts','ig_automations','ig_billing',
                           'ig_checkouts','ig_payments','rzp_events','ig_events','app_config'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
  end loop;
end $$;

-- Atomically move paid_until forward for one payment, exactly once.
-- p_until: absolute end (AutoPay cycle end), or null to add p_days to
-- max(now, current paid_until) (one-time payment).
create or replace function public.ig_credit_payment(
  p_payment_id text, p_account uuid, p_user uuid, p_kind text, p_ref text,
  p_amount integer, p_until timestamptz, p_days integer, p_mode text, p_sub text
) returns timestamptz
language plpgsql security definer set search_path = public
as $$
declare
  v_until timestamptz;
  v_current timestamptz;
begin
  -- Serialise credits for one account.
  perform 1 from public.ig_accounts where id = p_account for update;

  insert into public.ig_payments (rzp_payment_id, account_id, user_id, kind, rzp_ref_id, amount_paise)
  values (p_payment_id, p_account, p_user, p_kind, p_ref, p_amount)
  on conflict (rzp_payment_id) do nothing;
  if not found then
    select paid_until into v_until from public.ig_billing where account_id = p_account;
    return v_until; -- already credited
  end if;

  select paid_until into v_current from public.ig_billing where account_id = p_account;
  if p_until is not null then
    v_until := greatest(coalesce(v_current, now()), p_until);
  else
    v_until := greatest(coalesce(v_current, now()), now()) + make_interval(days => p_days);
  end if;

  insert into public.ig_billing (account_id, user_id, mode, rzp_subscription_id, rzp_status, paid_until)
  values (p_account, p_user, p_mode, p_sub, case when p_sub is not null then 'active' end, v_until)
  on conflict (account_id) do update
    set paid_until = excluded.paid_until,
        mode = excluded.mode,
        rzp_subscription_id = coalesce(excluded.rzp_subscription_id, public.ig_billing.rzp_subscription_id),
        rzp_status = coalesce(excluded.rzp_status, public.ig_billing.rzp_status);

  update public.ig_payments set paid_until = v_until where rzp_payment_id = p_payment_id;
  return v_until;
end;
$$;
revoke all on function public.ig_credit_payment(text, uuid, uuid, text, text, integer, timestamptz, integer, text, text) from public, anon, authenticated;

commit;
