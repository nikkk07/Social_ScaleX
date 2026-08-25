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
