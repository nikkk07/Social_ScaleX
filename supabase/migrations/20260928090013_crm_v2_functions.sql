-- ─────────────────────────────────────────────────────────────────────
-- 20260928090013 — CRM v2: roles, triggers and the sales workflow RPCs
--
-- Every write that changes a lead's pipeline state goes through one of the
-- SECURITY DEFINER functions below. They check the caller's role and lead
-- ownership themselves, then flip the transaction-local flag `crm.internal`
-- so the guard trigger lets the protected columns change. A client talking
-- to PostgREST directly can never set stage / dnc / counters / owner.
-- ─────────────────────────────────────────────────────────────────────
begin;

set local search_path = public;

-- ── Role helpers ─────────────────────────────────────────────────────
create or replace function public.current_app_role()
returns public.app_role
language sql stable security definer set search_path = public
as $$
  select role from public.profiles where id = auth.uid() and is_active;
$$;

create or replace function public.is_staff()
returns boolean
language sql stable security definer set search_path = public
as $$ select public.current_app_role() is not null; $$;

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$ select coalesce(public.current_app_role() in ('owner','admin'), false); $$;

create or replace function public.can_access_lead(p_lead uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select public.is_admin()
      or (public.is_staff() and exists (
            select 1 from public.leads l where l.id = p_lead and l.owner_id = auth.uid()));
$$;

create or replace function public._ist_today()
returns date language sql stable as $$ select (now() at time zone 'Asia/Kolkata')::date; $$;

create or replace function public._require_staff()
returns uuid
language plpgsql stable security definer set search_path = public
as $$
begin
  if not public.is_staff() then
    raise exception 'not_authorized' using errcode = '42501';
  end if;
  return auth.uid();
end;
$$;

create or replace function public._require_admin()
returns uuid
language plpgsql stable security definer set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'not_authorized' using errcode = '42501';
  end if;
  return auth.uid();
end;
$$;

create or replace function public._require_lead(p_lead uuid)
returns public.leads
language plpgsql security definer set search_path = public
as $$
declare
  v public.leads;
begin
  perform public._require_staff();
  select * into v from public.leads where id = p_lead for update;
  if not found or not public.can_access_lead(p_lead) then
    raise exception 'lead_not_found' using errcode = 'P0002';
  end if;
  if v.deleted_at is not null then
    raise exception 'lead_archived' using errcode = 'P0001';
  end if;
  return v;
end;
$$;

create or replace function public._internal_on()
returns void language sql as $$ select set_config('crm.internal', 'on', true); $$;

create or replace function public._stage_rank(s public.lead_stage)
returns integer language sql immutable as $$
  select case s
    when 'new' then 0 when 'attempting' then 1 when 'connected' then 2
    when 'interested' then 3 when 'callback' then 4 when 'meeting' then 5
    when 'quotation' then 6 when 'negotiation' then 7 when 'won' then 8
    else -1 end;
$$;

create or replace function public._audit(p_action text, p_entity text, p_id text, p_detail jsonb)
returns void language sql security definer set search_path = public as $$
  insert into public.audit_log (actor_id, action, entity, entity_id, detail)
  values (auth.uid(), p_action, p_entity, p_id, coalesce(p_detail, '{}'::jsonb));
$$;

create or replace function public._activity(p_lead uuid, p_kind text, p_detail jsonb)
returns void language sql security definer set search_path = public as $$
  insert into public.lead_activities (lead_id, actor_id, kind, detail)
  values (p_lead, auth.uid(), p_kind, coalesce(p_detail, '{}'::jsonb));
$$;

-- ── Profile creation ─────────────────────────────────────────────────
-- Accounts are created only by the server (service role) with
-- app_metadata.crm_role set; app_metadata cannot be written by a client.
-- GoTrue inserts the auth.users row first and writes app_metadata in a
-- follow-up UPDATE, so this fires on both and creates the profile once the
-- role is present. A user WITHOUT crm_role (e.g. a stranger calling
-- auth.signUp while public sign-ups are still enabled in the dashboard)
-- gets no profile, and every RLS check treats a profile-less user as a
-- stranger. Turn "Allow new users to sign up" OFF in Supabase → Auth.
-- This trigger never raises: a failing trigger would break GoTrue itself.
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_role public.app_role;
begin
  if coalesce(new.raw_app_meta_data->>'crm_role', '') not in ('owner','admin','member') then
    return new;
  end if;
  if exists (select 1 from public.profiles where id = new.id) then
    return new;
  end if;
  v_role := (new.raw_app_meta_data->>'crm_role')::public.app_role;
  insert into public.profiles (id, email, full_name, role, phone, daily_lead_quota, is_active)
  values (
    new.id,
    coalesce(new.email, ''),
    nullif(trim(coalesce(new.raw_app_meta_data->>'full_name', new.raw_user_meta_data->>'full_name', '')), ''),
    v_role,
    public.normalize_phone(new.raw_app_meta_data->>'crm_phone'),
    case when v_role = 'member'
         then coalesce(nullif(new.raw_app_meta_data->>'daily_lead_quota','')::int,
                       (select default_daily_quota from public.crm_settings where id = 1))
    end,
    true
  )
  on conflict do nothing;
  return new;
exception when others then
  raise warning 'handle_new_user: %', sqlerrm;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert or update of raw_app_meta_data on auth.users
  for each row execute function public.handle_new_user();

-- Profiles: role/active/quota/phone are changed only by the server or by
-- admin RPCs. Keep updated_at fresh.
-- NOTE: guard triggers are deliberately NOT security definer: they read
-- current_user to tell a PostgREST client ('authenticated') apart from a
-- trusted definer RPC or the service role.
create or replace function public.tg_profiles_guard()
returns trigger
language plpgsql set search_path = public
as $$
begin
  if current_setting('crm.internal', true) is distinct from 'on'
     and current_user in ('authenticated', 'anon') then
    if new.role is distinct from old.role
       or new.is_active is distinct from old.is_active
       or new.daily_lead_quota is distinct from old.daily_lead_quota
       or new.phone is distinct from old.phone
       or new.email is distinct from old.email
       or new.last_top_up_on is distinct from old.last_top_up_on then
      raise exception 'not_authorized' using errcode = '42501';
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$;
create trigger profiles_guard before update on public.profiles
  for each row execute function public.tg_profiles_guard();

-- ── Lead triggers ────────────────────────────────────────────────────
create or replace function public.tg_leads_before()
returns trigger
language plpgsql set search_path = public
as $$
declare
  internal boolean := current_setting('crm.internal', true) = 'on';
  from_client boolean := current_user in ('authenticated', 'anon');
begin
  if tg_op = 'INSERT' then
    if from_client and not internal then
      new.stage := 'new';
      new.lost_reason := null;
      new.dnc := false;
      new.dnc_at := null;
      new.attempt_count := 0;
      new.last_attempt_at := null;
      new.last_connected_at := null;
      new.next_action_at := null;
      new.next_action_type := null;
      new.deleted_at := null;
      new.created_by := auth.uid();
      if not public.is_admin() then
        new.owner_id := auth.uid();
      end if;
    end if;
    new.stage_changed_at := now();
    if new.owner_id is not null then new.assigned_at := coalesce(new.assigned_at, now()); end if;
    new.updated_by := coalesce(auth.uid(), new.updated_by);
    new.instagram_username := public.normalize_instagram(new.instagram_username);
    return new;
  end if;

  -- UPDATE
  if from_client and not internal then
    if new.stage is distinct from old.stage
       or new.lost_reason is distinct from old.lost_reason
       or new.dnc is distinct from old.dnc
       or new.dnc_at is distinct from old.dnc_at
       or new.attempt_count is distinct from old.attempt_count
       or new.last_attempt_at is distinct from old.last_attempt_at
       or new.last_connected_at is distinct from old.last_connected_at
       or new.next_action_at is distinct from old.next_action_at
       or new.next_action_type is distinct from old.next_action_type
       or new.stage_changed_at is distinct from old.stage_changed_at
       or new.assigned_at is distinct from old.assigned_at
       or new.created_by is distinct from old.created_by
       or new.created_at is distinct from old.created_at then
      raise exception 'protected_field' using errcode = '42501';
    end if;
    if not public.is_admin() then
      if new.owner_id is distinct from old.owner_id or new.deleted_at is distinct from old.deleted_at then
        raise exception 'not_authorized' using errcode = '42501';
      end if;
    end if;
    if old.deleted_at is not null and new.deleted_at is not null then
      raise exception 'lead_archived' using errcode = 'P0001';
    end if;
  end if;
  if new.stage is distinct from old.stage then
    new.stage_changed_at := now();
  end if;
  if new.owner_id is distinct from old.owner_id then
    new.assigned_at := case when new.owner_id is null then null else now() end;
  end if;
  new.instagram_username := public.normalize_instagram(new.instagram_username);
  new.updated_at := now();
  new.updated_by := coalesce(auth.uid(), new.updated_by);
  return new;
end;
$$;
create trigger leads_before before insert or update on public.leads
  for each row execute function public.tg_leads_before();

create or replace function public.tg_leads_after()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    perform public._activity(new.id, 'created', jsonb_build_object('source', new.source, 'stage', new.stage));
    return null;
  end if;
  if new.stage is distinct from old.stage then
    perform public._activity(new.id, 'stage_changed', jsonb_build_object(
      'from', old.stage, 'to', new.stage, 'lost_reason', new.lost_reason));
  end if;
  if new.owner_id is distinct from old.owner_id then
    perform public._activity(new.id, 'assigned', jsonb_build_object(
      'from', old.owner_id, 'to', new.owner_id,
      'to_name', (select coalesce(full_name, email) from public.profiles where id = new.owner_id)));
    -- Open tasks follow the lead to its new owner.
    update public.lead_tasks set assignee_id = new.owner_id
     where lead_id = new.id and status = 'open';
  end if;
  if new.deleted_at is distinct from old.deleted_at then
    perform public._activity(new.id, case when new.deleted_at is null then 'restored' else 'archived' end, '{}'::jsonb);
  end if;
  if new.brand_name is distinct from old.brand_name
     or new.instagram_username is distinct from old.instagram_username
     or new.address is distinct from old.address
     or new.source is distinct from old.source
     or new.lead_found_on is distinct from old.lead_found_on
     or new.deal_value_inr is distinct from old.deal_value_inr
     or new.project_start_date is distinct from old.project_start_date
     or new.expected_delivery_date is distinct from old.expected_delivery_date
     or new.project_end_date is distinct from old.project_end_date then
    perform public._activity(new.id, 'edited', '{}'::jsonb);
  end if;
  return null;
end;
$$;
create trigger leads_after after insert or update on public.leads
  for each row execute function public.tg_leads_after();

-- next_action_at / next_action_type mirror the earliest open task.
create or replace function public._refresh_next_action(p_lead uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  t record;
begin
  select due_at, type into t from public.lead_tasks
   where lead_id = p_lead and status = 'open' order by due_at asc limit 1;
  perform set_config('crm.internal', 'on', true);
  update public.leads set next_action_at = t.due_at, next_action_type = t.type
   where id = p_lead
     and (next_action_at is distinct from t.due_at or next_action_type is distinct from t.type);
end;
$$;

create or replace function public.tg_tasks_after()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  perform public._refresh_next_action(coalesce(new.lead_id, old.lead_id));
  return null;
end;
$$;
create trigger lead_tasks_after after insert or update or delete on public.lead_tasks
  for each row execute function public.tg_tasks_after();

-- ── Internal workflow primitives ─────────────────────────────────────
create or replace function public._set_stage(p_lead uuid, p_stage public.lead_stage,
                                             p_reason public.lost_reason default null,
                                             p_note text default null)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  perform public._internal_on();
  update public.leads set
    stage = p_stage,
    lost_reason = case when p_stage = 'lost' then coalesce(p_reason, 'other') end,
    lost_note = case when p_stage = 'lost' then nullif(trim(coalesce(p_note, '')), '') else lost_note end,
    dnc = (p_stage = 'dnc'),
    dnc_at = case when p_stage = 'dnc' then coalesce(dnc_at, now()) end
  where id = p_lead;
end;
$$;

-- Move forward only (never backwards) unless the lead is closed/parked.
create or replace function public._advance_stage(p_lead uuid, p_target public.lead_stage)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  cur public.lead_stage;
begin
  select stage into cur from public.leads where id = p_lead;
  if cur in ('lost','nurture','won') or public._stage_rank(p_target) > public._stage_rank(cur) then
    perform public._set_stage(p_lead, p_target);
  end if;
end;
$$;

create or replace function public._new_task(p_lead uuid, p_type public.task_type, p_due timestamptz,
                                            p_note text default null,
                                            p_mode public.meeting_mode default null,
                                            p_location text default null)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_id uuid;
  v_owner uuid;
begin
  if p_due is null then
    raise exception 'invalid_input:due_at' using errcode = '22023';
  end if;
  select owner_id into v_owner from public.leads where id = p_lead;
  insert into public.lead_tasks (lead_id, assignee_id, type, due_at, note, meeting_mode, location, created_by)
  values (p_lead, coalesce(v_owner, auth.uid()), p_type, p_due,
          nullif(trim(coalesce(p_note, '')), ''),
          case when p_type = 'meeting' then coalesce(p_mode, 'phone') end,
          nullif(trim(coalesce(p_location, '')), ''), auth.uid())
  returning id into v_id;
  perform public._activity(p_lead, 'task_scheduled', jsonb_build_object(
    'task_id', v_id, 'type', p_type, 'due_at', p_due, 'mode', p_mode));
  return v_id;
end;
$$;

create or replace function public._close_tasks(p_lead uuid, p_status public.task_status, p_result text,
                                               p_types public.task_type[] default null,
                                               p_only uuid default null)
returns void
language sql security definer set search_path = public
as $$
  update public.lead_tasks set status = p_status, result = left(p_result, 200),
         completed_at = now(), completed_by = auth.uid()
   where lead_id = p_lead and status = 'open'
     and (p_types is null or type = any (p_types))
     and (p_only is null or id = p_only);
$$;

create or replace function public._create_quote(p_lead uuid, p_amount numeric, p_valid date,
                                                p_services text, p_link text)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_id uuid;
  v_ver int;
  s public.crm_settings;
begin
  if p_amount is null or p_amount <= 0 or p_amount > 9999999999 then
    raise exception 'invalid_input:amount' using errcode = '22023';
  end if;
  if p_valid is not null and p_valid < public._ist_today() then
    raise exception 'invalid_input:valid_until' using errcode = '22023';
  end if;
  if nullif(trim(coalesce(p_link, '')), '') is not null and trim(p_link) !~* '^https://' then
    raise exception 'invalid_input:link' using errcode = '22023';
  end if;
  select * into s from public.crm_settings where id = 1;
  update public.quotations set status = 'revised', decided_at = now()
   where lead_id = p_lead and status = 'sent';
  select coalesce(max(version), 0) + 1 into v_ver from public.quotations where lead_id = p_lead;
  insert into public.quotations (lead_id, version, amount_inr, valid_until, services, link, sent_by)
  values (p_lead, v_ver, round(p_amount, 2), p_valid, nullif(trim(coalesce(p_services, '')), ''),
          nullif(trim(coalesce(p_link, '')), ''), auth.uid())
  returning id into v_id;
  perform public._internal_on();
  update public.leads set deal_value_inr = round(p_amount, 2) where id = p_lead;
  perform public._set_stage(p_lead, case when v_ver = 1 then 'quotation' else 'negotiation' end::public.lead_stage);
  perform public._close_tasks(p_lead, 'done', 'quote sent', array['quote_follow_up']::public.task_type[]);
  perform public._new_task(p_lead, 'quote_follow_up', now() + make_interval(days => s.quote_follow_up_days),
                           format('Follow up on quote v%s (₹%s)', v_ver, to_char(p_amount, 'FM99,99,99,99,990')));
  perform public._activity(p_lead, 'quote_sent', jsonb_build_object('quote_id', v_id, 'version', v_ver, 'amount', p_amount));
  return v_id;
end;
$$;

create or replace function public._mark_lost(p_lead uuid, p_reason public.lost_reason, p_note text,
                                             p_competitor text default null, p_contract_end date default null)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  s public.crm_settings;
  v_due timestamptz;
begin
  if p_reason is null then
    raise exception 'invalid_input:lost_reason' using errcode = '22023';
  end if;
  select * into s from public.crm_settings where id = 1;
  perform public._internal_on();
  update public.leads set
    competitor_name = coalesce(nullif(trim(coalesce(p_competitor, '')), ''), competitor_name),
    competitor_contract_end = coalesce(p_contract_end, competitor_contract_end)
  where id = p_lead;
  perform public._close_tasks(p_lead, 'cancelled', 'lead lost');
  perform public._set_stage(p_lead, 'lost', p_reason, p_note);
  if p_reason <> 'invalid_contact' then
    v_due := case
      when p_contract_end is not null and p_contract_end > public._ist_today()
        then (p_contract_end - 7)::timestamp at time zone 'Asia/Kolkata' + interval '11 hours'
      else now() + make_interval(days => s.re_engage_days)
    end;
    if v_due < now() then v_due := now() + interval '1 day'; end if;
    perform public._new_task(p_lead, 're_engage', v_due,
      case when p_contract_end is not null then 'Their current agency contract ends ' || to_char(p_contract_end, 'DD Mon YYYY')
           else 'Re-engage after ' || s.re_engage_days || ' days' end);
  end if;
end;
$$;

-- ── Public RPCs: call / WhatsApp workflow ────────────────────────────

-- Tap on Call / WhatsApp. Returns the pending attempt id (idempotent for a
-- double tap). Refuses DNC leads, a lead another agent is already on, and
-- more than 3 outcomes left unlogged.
create or replace function public.start_attempt(p_lead uuid, p_phone uuid, p_channel public.contact_channel,
                                                p_task uuid default null)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_lead public.leads;
  v_phone public.lead_phones;
  v_id uuid;
  v_other text;
begin
  v_lead := public._require_lead(p_lead);
  if v_lead.dnc then
    raise exception 'lead_dnc' using errcode = 'P0001';
  end if;
  select * into v_phone from public.lead_phones where id = p_phone and lead_id = p_lead;
  if not found then
    raise exception 'invalid_input:phone' using errcode = '22023';
  end if;
  if p_channel = 'call' and v_phone.is_invalid then
    raise exception 'phone_invalid' using errcode = 'P0001';
  end if;
  if p_task is not null and not exists (select 1 from public.lead_tasks where id = p_task and lead_id = p_lead) then
    raise exception 'invalid_input:task' using errcode = '22023';
  end if;

  select id into v_id from public.call_logs
   where actor_id = auth.uid() and lead_id = p_lead and result is null
     and started_at > now() - interval '30 minutes'
   order by started_at desc limit 1;
  if v_id is not null then
    update public.call_logs set phone_id = p_phone, phone_e164 = v_phone.phone_e164, channel = p_channel,
           task_id = coalesce(p_task, task_id), started_at = now()
     where id = v_id;
    return v_id;
  end if;

  select coalesce(p.full_name, p.email) into v_other
    from public.call_logs c join public.profiles p on p.id = c.actor_id
   where c.lead_id = p_lead and c.result is null and c.actor_id <> auth.uid()
     and c.started_at > now() - interval '20 minutes'
   limit 1;
  if v_other is not null then
    raise exception 'lead_busy:%', v_other using errcode = 'P0001';
  end if;

  if (select count(*) from public.call_logs where actor_id = auth.uid() and result is null) >= 3 then
    raise exception 'too_many_pending' using errcode = 'P0001';
  end if;

  insert into public.call_logs (lead_id, phone_id, phone_e164, task_id, actor_id, channel)
  values (p_lead, p_phone, v_phone.phone_e164, p_task, auth.uid(), p_channel)
  returning id into v_id;
  return v_id;
end;
$$;

-- "I didn't actually call" — removes an unlogged attempt of your own.
create or replace function public.discard_attempt(p_attempt uuid)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  perform public._require_staff();
  delete from public.call_logs where id = p_attempt and actor_id = auth.uid() and result is null;
  if not found then
    raise exception 'attempt_not_found' using errcode = 'P0002';
  end if;
end;
$$;

-- The outcome pop-up. payload keys:
--   result          attempt_result (required)
--   outcome         connect_outcome (required when result is connected / wa_replied)
--   next_step       'callback' | 'meeting' | 'send_details' | 'send_quote' (outcome = interested)
--   due_at          timestamptz (callback, meeting, call_later, still_deciding, send_details)
--   meeting_mode    meeting_mode, location text (meeting)
--   quote           {amount, valid_until, services, link} (send_quote, quote_revision)
--   lost_reason     lost_reason (not_interested, quote_rejected)
--   competitor_name, competitor_contract_end (lost_reason = using_other_agency)
--   new_contact     {name, phone, designation} (wrong_person)
--   note            text
create or replace function public.log_outcome(p_attempt uuid, payload jsonb)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  a public.call_logs;
  l public.leads;
  s public.crm_settings;
  v_result public.attempt_result;
  v_outcome public.connect_outcome;
  v_step text := nullif(payload->>'next_step', '');
  v_due timestamptz := nullif(payload->>'due_at', '')::timestamptz;
  v_note text := nullif(trim(coalesce(payload->>'note', '')), '');
  v_reason public.lost_reason := nullif(payload->>'lost_reason', '')::public.lost_reason;
  v_misses int;
  v_valid_phones int;
  v_contact uuid;
  v_phone text;
  v_task_result text;
begin
  perform public._require_staff();
  select * into a from public.call_logs where id = p_attempt for update;
  if not found or (a.actor_id is distinct from auth.uid() and not public.is_admin()) then
    raise exception 'attempt_not_found' using errcode = 'P0002';
  end if;
  if a.result is not null then
    raise exception 'attempt_already_logged' using errcode = 'P0001';
  end if;
  l := public._require_lead(a.lead_id);
  select * into s from public.crm_settings where id = 1;

  v_result := nullif(payload->>'result', '')::public.attempt_result;
  if v_result is null then
    raise exception 'invalid_input:result' using errcode = '22023';
  end if;
  if a.channel = 'call' and v_result in ('wa_sent','wa_replied','not_on_whatsapp') then
    raise exception 'invalid_input:result' using errcode = '22023';
  end if;
  if a.channel = 'whatsapp' and v_result not in ('wa_sent','wa_replied','not_on_whatsapp') then
    raise exception 'invalid_input:result' using errcode = '22023';
  end if;
  if v_note is not null and length(v_note) > 2000 then
    raise exception 'invalid_input:note' using errcode = '22023';
  end if;
  if v_due is not null and v_due < now() - interval '5 minutes' then
    raise exception 'invalid_input:due_at' using errcode = '22023';
  end if;

  if v_result in ('connected','wa_replied') then
    v_outcome := nullif(payload->>'outcome', '')::public.connect_outcome;
    if v_outcome is null then
      raise exception 'invalid_input:outcome' using errcode = '22023';
    end if;
  end if;

  perform public._internal_on();

  -- Book-keeping for every attempt.
  update public.call_logs set result = v_result, outcome = v_outcome, note = v_note,
         lost_reason = case when v_outcome in ('not_interested','quote_rejected') then v_reason end,
         logged_at = now()
   where id = a.id;
  update public.leads set
    attempt_count = attempt_count + 1,
    last_attempt_at = now(),
    last_connected_at = case when v_result in ('connected','wa_replied') then now() else last_connected_at end
  where id = l.id;

  v_task_result := coalesce(v_outcome::text, v_result::text);
  if a.task_id is not null then
    perform public._close_tasks(l.id, 'done', v_task_result, null, a.task_id);
  end if;

  -- ── Not connected ──
  if v_result in ('no_answer','busy','switched_off','not_reachable','rejected','wrong_number') then
    if v_result = 'wrong_number' and a.phone_id is not null then
      update public.lead_phones set is_invalid = true where id = a.phone_id;
    end if;
    select count(*) into v_valid_phones from public.lead_phones where lead_id = l.id and not is_invalid;
    if v_valid_phones = 0 then
      perform public._mark_lost(l.id, 'invalid_contact', 'No valid phone number left');
      return jsonb_build_object('stage', 'lost');
    end if;

    select count(*) into v_misses from public.call_logs
     where lead_id = l.id and channel = 'call'
       and result in ('no_answer','busy','switched_off','not_reachable','rejected')
       and started_at > coalesce(l.last_connected_at, '-infinity'::timestamptz);

    perform public._close_tasks(l.id, 'cancelled', 'superseded', array['retry_call']::public.task_type[]);

    if v_misses >= s.nurture_after_misses and l.stage in ('new','attempting','connected') then
      perform public._close_tasks(l.id, 'cancelled', 'moved to nurture',
                                  array['retry_call','follow_up']::public.task_type[]);
      perform public._set_stage(l.id, 'nurture');
      perform public._new_task(l.id, 'nurture', now() + make_interval(days => s.nurture_days),
        format('%s missed calls — try WhatsApp or a fresh call', v_misses));
      return jsonb_build_object('stage', 'nurture');
    end if;

    if l.stage = 'new' then perform public._set_stage(l.id, 'attempting'); end if;
    if l.stage = 'nurture' then perform public._set_stage(l.id, 'attempting'); end if;
    perform public._new_task(l.id, 'retry_call', case v_result
        when 'no_answer'     then now() + make_interval(mins => s.retry_no_answer_minutes)
        when 'busy'          then now() + make_interval(mins => s.retry_busy_minutes)
        when 'rejected'      then now() + make_interval(mins => s.retry_rejected_minutes)
        when 'wrong_number'  then now()
        else now() + make_interval(mins => s.retry_unreachable_minutes)
      end,
      case v_result when 'wrong_number' then 'Wrong number flagged — try another number'
                    else 'Retry: ' || replace(v_result::text, '_', ' ') end);
    return jsonb_build_object('stage', (select stage from public.leads where id = l.id));
  end if;

  -- ── WhatsApp without a reply yet ──
  if v_result = 'not_on_whatsapp' then
    if a.phone_id is not null then
      update public.lead_phones set no_whatsapp = true where id = a.phone_id;
    end if;
    if l.stage = 'new' then perform public._set_stage(l.id, 'attempting'); end if;
    return jsonb_build_object('stage', (select stage from public.leads where id = l.id));
  end if;
  if v_result = 'wa_sent' then
    if l.stage = 'new' then perform public._set_stage(l.id, 'attempting'); end if;
    perform public._close_tasks(l.id, 'cancelled', 'superseded', array['follow_up']::public.task_type[]);
    perform public._new_task(l.id, 'follow_up', coalesce(v_due, now() + interval '1 day'), 'Check WhatsApp reply');
    return jsonb_build_object('stage', (select stage from public.leads where id = l.id));
  end if;

  -- ── Connected (call answered or WhatsApp reply) ──
  perform public._close_tasks(l.id, 'cancelled', 'superseded', array['retry_call','nurture']::public.task_type[]);
  if l.stage in ('new','attempting','nurture') then
    perform public._set_stage(l.id, 'connected');
  end if;

  case v_outcome
    when 'interested' then
      if v_step is null or v_step not in ('callback','meeting','send_details','send_quote') then
        raise exception 'invalid_input:next_step' using errcode = '22023';
      end if;
      perform public._advance_stage(l.id, 'interested');
      if v_step = 'callback' then
        if v_due is null then raise exception 'invalid_input:due_at' using errcode = '22023'; end if;
        perform public._close_tasks(l.id, 'cancelled', 'rescheduled', array['callback']::public.task_type[]);
        perform public._new_task(l.id, 'callback', v_due, v_note);
        perform public._advance_stage(l.id, 'callback');
      elsif v_step = 'meeting' then
        if v_due is null then raise exception 'invalid_input:due_at' using errcode = '22023'; end if;
        perform public._new_task(l.id, 'meeting', v_due, v_note,
          coalesce(nullif(payload->>'meeting_mode','')::public.meeting_mode, 'phone'), payload->>'location');
        perform public._advance_stage(l.id, 'meeting');
      elsif v_step = 'send_details' then
        perform public._new_task(l.id, 'follow_up', coalesce(v_due, now() + interval '1 day'),
                                 coalesce(v_note, 'Follow up after sending details'));
      else
        perform public._create_quote(l.id, nullif(payload#>>'{quote,amount}','')::numeric,
          nullif(payload#>>'{quote,valid_until}','')::date, payload#>>'{quote,services}', payload#>>'{quote,link}');
      end if;

    when 'call_later', 'still_deciding' then
      if v_due is null then raise exception 'invalid_input:due_at' using errcode = '22023'; end if;
      perform public._close_tasks(l.id, 'cancelled', 'rescheduled', array['callback','follow_up']::public.task_type[]);
      perform public._new_task(l.id, case when v_outcome = 'call_later' then 'callback' else 'follow_up' end::public.task_type,
                               v_due, v_note);
      if v_outcome = 'call_later' then perform public._advance_stage(l.id, 'callback'); end if;

    when 'not_interested' then
      perform public._mark_lost(l.id, v_reason, v_note, payload->>'competitor_name',
                                nullif(payload->>'competitor_contract_end','')::date);

    when 'do_not_call' then
      perform public._close_tasks(l.id, 'cancelled', 'do not call');
      perform public._set_stage(l.id, 'dnc');

    when 'wrong_person' then
      if nullif(trim(coalesce(payload#>>'{new_contact,name}', '')), '') is not null then
        insert into public.lead_contacts (lead_id, name, designation, is_primary, sort_order)
        values (l.id, left(trim(payload#>>'{new_contact,name}'), 120),
                nullif(left(trim(coalesce(payload#>>'{new_contact,designation}', '')), 120), ''),
                false, (select coalesce(max(sort_order), 0) + 1 from public.lead_contacts where lead_id = l.id))
        returning id into v_contact;
        v_phone := public.normalize_phone(payload#>>'{new_contact,phone}');
        if nullif(trim(coalesce(payload#>>'{new_contact,phone}', '')), '') is not null and v_phone is null then
          raise exception 'invalid_input:new_contact.phone' using errcode = '22023';
        end if;
        if v_phone is not null then
          insert into public.lead_phones (lead_id, contact_id, phone_e164, label, is_primary, sort_order)
          values (l.id, v_contact, v_phone, 'Mobile', true, 0);
        end if;
      end if;
      perform public._new_task(l.id, 'follow_up', coalesce(v_due, now()), coalesce(v_note, 'Reach the right person'));

    when 'language_barrier' then
      perform public._new_task(l.id, 'follow_up', coalesce(v_due, now() + interval '1 day'),
                               coalesce(v_note, 'Arrange a call in the client''s language'));

    when 'call_dropped' then
      perform public._new_task(l.id, 'retry_call', coalesce(v_due, now() + interval '10 minutes'), 'Call dropped — call back');

    when 'quote_accepted' then
      perform public._internal_on();
      update public.quotations set status = 'accepted', decided_at = now()
       where lead_id = l.id and status = 'sent';
      perform public._close_tasks(l.id, 'done', 'won');
      perform public._set_stage(l.id, 'won');

    when 'quote_revision' then
      if payload #>> '{quote,amount}' is not null then
        perform public._create_quote(l.id, nullif(payload#>>'{quote,amount}','')::numeric,
          nullif(payload#>>'{quote,valid_until}','')::date, payload#>>'{quote,services}', payload#>>'{quote,link}');
      else
        perform public._set_stage(l.id, 'negotiation');
        perform public._new_task(l.id, 'follow_up', coalesce(v_due, now() + interval '1 day'),
                                 coalesce(v_note, 'Send revised quote'));
      end if;

    when 'quote_rejected' then
      update public.quotations set status = 'rejected', decided_at = now(), decision_reason = coalesce(v_reason, 'price')
       where lead_id = l.id and status = 'sent';
      perform public._mark_lost(l.id, coalesce(v_reason, 'price'), v_note);
  end case;

  perform public._activity(l.id, 'outcome_logged', jsonb_build_object(
    'attempt_id', a.id, 'channel', a.channel, 'result', v_result, 'outcome', v_outcome, 'next_step', v_step));
  return jsonb_build_object('stage', (select stage from public.leads where id = l.id));
end;
$$;

-- ── Tasks ────────────────────────────────────────────────────────────
create or replace function public.schedule_task(p_lead uuid, p_type public.task_type, p_due timestamptz,
                                                p_note text default null,
                                                p_mode public.meeting_mode default null,
                                                p_location text default null)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  l public.leads;
  v_id uuid;
begin
  l := public._require_lead(p_lead);
  if p_type not in ('callback','meeting','follow_up') then
    raise exception 'invalid_input:type' using errcode = '22023';
  end if;
  if p_due is null or p_due < now() - interval '5 minutes' then
    raise exception 'invalid_input:due_at' using errcode = '22023';
  end if;
  if l.dnc then raise exception 'lead_dnc' using errcode = 'P0001'; end if;
  v_id := public._new_task(p_lead, p_type, p_due, p_note, p_mode, p_location);
  if p_type = 'callback' then perform public._advance_stage(p_lead, 'callback'); end if;
  if p_type = 'meeting' then perform public._advance_stage(p_lead, 'meeting'); end if;
  return v_id;
end;
$$;

create or replace function public.reschedule_task(p_task uuid, p_due timestamptz, p_reason text)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  t public.lead_tasks;
begin
  perform public._require_staff();
  select * into t from public.lead_tasks where id = p_task for update;
  if not found or not public.can_access_lead(t.lead_id) then
    raise exception 'task_not_found' using errcode = 'P0002';
  end if;
  if t.status <> 'open' then raise exception 'task_closed' using errcode = 'P0001'; end if;
  if p_due is null or p_due < now() - interval '5 minutes' then
    raise exception 'invalid_input:due_at' using errcode = '22023';
  end if;
  if nullif(trim(coalesce(p_reason, '')), '') is null or length(p_reason) > 500 then
    raise exception 'invalid_input:reason' using errcode = '22023';
  end if;
  update public.lead_tasks set due_at = p_due, reschedule_count = reschedule_count + 1 where id = p_task;
  perform public._activity(t.lead_id, 'task_rescheduled', jsonb_build_object(
    'task_id', p_task, 'type', t.type, 'from', t.due_at, 'to', p_due, 'reason', trim(p_reason)));
end;
$$;

create or replace function public.cancel_task(p_task uuid, p_reason text)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  t public.lead_tasks;
begin
  perform public._require_staff();
  select * into t from public.lead_tasks where id = p_task for update;
  if not found or not public.can_access_lead(t.lead_id) then
    raise exception 'task_not_found' using errcode = 'P0002';
  end if;
  if t.status <> 'open' then raise exception 'task_closed' using errcode = 'P0001'; end if;
  if nullif(trim(coalesce(p_reason, '')), '') is null or length(p_reason) > 500 then
    raise exception 'invalid_input:reason' using errcode = '22023';
  end if;
  update public.lead_tasks set status = 'cancelled', result = left(trim(p_reason), 200),
         completed_at = now(), completed_by = auth.uid() where id = p_task;
  perform public._activity(t.lead_id, 'task_cancelled', jsonb_build_object('task_id', p_task, 'type', t.type, 'reason', trim(p_reason)));
end;
$$;

-- Meeting finished (or the client did not show up).
--   payload.result: 'held_positive' | 'held_needs_time' | 'no_show' | 'not_interested'
create or replace function public.complete_meeting(p_task uuid, payload jsonb)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  t public.lead_tasks;
  v_res text := payload->>'result';
  v_due timestamptz := nullif(payload->>'due_at', '')::timestamptz;
  v_note text := nullif(trim(coalesce(payload->>'note', '')), '');
  v_noshows int;
  s public.crm_settings;
begin
  perform public._require_staff();
  select * into t from public.lead_tasks where id = p_task for update;
  if not found or t.type <> 'meeting' or not public.can_access_lead(t.lead_id) then
    raise exception 'task_not_found' using errcode = 'P0002';
  end if;
  if t.status <> 'open' then raise exception 'task_closed' using errcode = 'P0001'; end if;
  perform public._require_lead(t.lead_id);
  select * into s from public.crm_settings where id = 1;
  if v_res is null or v_res not in ('held_positive','held_needs_time','no_show','not_interested') then
    raise exception 'invalid_input:result' using errcode = '22023';
  end if;
  if v_due is not null and v_due < now() - interval '5 minutes' then
    raise exception 'invalid_input:due_at' using errcode = '22023';
  end if;

  update public.lead_tasks set status = 'done', result = v_res, completed_at = now(), completed_by = auth.uid(),
         note = coalesce(v_note, note)
   where id = p_task;
  perform public._activity(t.lead_id, 'meeting_outcome', jsonb_build_object('task_id', p_task, 'result', v_res, 'note', v_note));
  perform public._internal_on();
  update public.leads set last_connected_at = case when v_res <> 'no_show' then now() else last_connected_at end
   where id = t.lead_id;

  if v_res = 'held_positive' then
    if payload #>> '{quote,amount}' is not null then
      perform public._create_quote(t.lead_id, nullif(payload#>>'{quote,amount}','')::numeric,
        nullif(payload#>>'{quote,valid_until}','')::date, payload#>>'{quote,services}', payload#>>'{quote,link}');
    else
      if v_due is null then raise exception 'invalid_input:due_at' using errcode = '22023'; end if;
      perform public._new_task(t.lead_id, 'follow_up', v_due, coalesce(v_note, 'Send the quotation'));
    end if;
  elsif v_res = 'held_needs_time' then
    if v_due is null then raise exception 'invalid_input:due_at' using errcode = '22023'; end if;
    perform public._new_task(t.lead_id, 'follow_up', v_due, coalesce(v_note, 'Client needs time after the meeting'));
  elsif v_res = 'no_show' then
    select count(*) into v_noshows from public.lead_tasks
     where lead_id = t.lead_id and type = 'meeting' and result = 'no_show';
    if v_noshows >= 2 then
      perform public._close_tasks(t.lead_id, 'cancelled', 'moved to nurture');
      perform public._set_stage(t.lead_id, 'nurture');
      perform public._new_task(t.lead_id, 'nurture', now() + make_interval(days => s.nurture_days),
                               'Missed two meetings — reconnect later');
    else
      if v_due is null then raise exception 'invalid_input:due_at' using errcode = '22023'; end if;
      perform public._new_task(t.lead_id, 'meeting', v_due, 'Rescheduled after no-show', t.meeting_mode, t.location);
    end if;
  else
    perform public._mark_lost(t.lead_id, coalesce(nullif(payload->>'lost_reason','')::public.lost_reason, 'other'),
                              v_note, payload->>'competitor_name', nullif(payload->>'competitor_contract_end','')::date);
  end if;
  return jsonb_build_object('stage', (select stage from public.leads where id = t.lead_id));
end;
$$;

-- ── Quotations ───────────────────────────────────────────────────────
create or replace function public.create_quotation(p_lead uuid, p_amount numeric, p_valid_until date,
                                                   p_services text default null, p_link text default null)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  l public.leads;
begin
  l := public._require_lead(p_lead);
  if l.dnc then raise exception 'lead_dnc' using errcode = 'P0001'; end if;
  if l.stage in ('won','lost') then raise exception 'lead_closed' using errcode = 'P0001'; end if;
  return public._create_quote(p_lead, p_amount, p_valid_until, p_services, p_link);
end;
$$;

-- decision: 'accepted' | 'rejected'
create or replace function public.decide_quotation(p_quote uuid, p_decision text,
                                                   p_reason public.lost_reason default null,
                                                   p_note text default null)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  q public.quotations;
begin
  perform public._require_staff();
  select * into q from public.quotations where id = p_quote for update;
  if not found or not public.can_access_lead(q.lead_id) then
    raise exception 'quote_not_found' using errcode = 'P0002';
  end if;
  if q.status <> 'sent' then raise exception 'quote_closed' using errcode = 'P0001'; end if;
  perform public._require_lead(q.lead_id);
  if p_decision = 'accepted' then
    update public.quotations set status = 'accepted', decided_at = now(), note = nullif(trim(coalesce(p_note,'')), '')
     where id = p_quote;
    perform public._internal_on();
    update public.leads set deal_value_inr = q.amount_inr where id = q.lead_id;
    perform public._close_tasks(q.lead_id, 'done', 'won');
    perform public._set_stage(q.lead_id, 'won');
  elsif p_decision = 'rejected' then
    if p_reason is null then raise exception 'invalid_input:lost_reason' using errcode = '22023'; end if;
    update public.quotations set status = 'rejected', decided_at = now(), decision_reason = p_reason,
           note = nullif(trim(coalesce(p_note,'')), '')
     where id = p_quote;
    perform public._mark_lost(q.lead_id, p_reason, p_note);
  else
    raise exception 'invalid_input:decision' using errcode = '22023';
  end if;
  perform public._activity(q.lead_id, 'quote_decided', jsonb_build_object('quote_id', p_quote, 'decision', p_decision, 'reason', p_reason));
end;
$$;

-- ── Manual stage changes (close / reopen) ───────────────────────────
--   owners of a lead may mark it won / lost / nurture.
--   Only admins may reopen a closed lead or clear do-not-call.
create or replace function public.set_lead_stage(p_lead uuid, p_stage public.lead_stage,
                                                 p_reason public.lost_reason default null,
                                                 p_note text default null)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  l public.leads;
begin
  l := public._require_lead(p_lead);
  if p_stage = l.stage then return; end if;
  if not public.is_admin() then
    if l.stage in ('won','lost','dnc') or p_stage not in ('won','lost','nurture','dnc') then
      raise exception 'not_authorized' using errcode = '42501';
    end if;
  end if;
  if p_stage = 'lost' then
    perform public._mark_lost(p_lead, p_reason, p_note);
  elsif p_stage in ('won','dnc') then
    perform public._close_tasks(p_lead, case when p_stage = 'won' then 'done' else 'cancelled' end::public.task_status,
                                p_stage::text);
    perform public._set_stage(p_lead, p_stage);
  else
    perform public._set_stage(p_lead, p_stage);
  end if;
  if nullif(trim(coalesce(p_note, '')), '') is not null then
    perform public._activity(p_lead, 'note', jsonb_build_object('text', left(trim(p_note), 2000)));
  end if;
  perform public._audit('lead.stage', 'lead', p_lead::text, jsonb_build_object('from', l.stage, 'to', p_stage, 'reason', p_reason));
end;
$$;

create or replace function public.add_note(p_lead uuid, p_text text)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  perform public._require_lead(p_lead);
  if nullif(trim(coalesce(p_text, '')), '') is null or length(p_text) > 2000 then
    raise exception 'invalid_input:text' using errcode = '22023';
  end if;
  perform public._activity(p_lead, 'note', jsonb_build_object('text', trim(p_text)));
end;
$$;

-- ── Ownership, quotas, daily top-up ─────────────────────────────────
create or replace function public.reassign_leads(p_leads uuid[], p_owner uuid)
returns integer
language plpgsql security definer set search_path = public
as $$
declare
  n int;
begin
  perform public._require_admin();
  if p_owner is not null and not exists (select 1 from public.profiles where id = p_owner and is_active) then
    raise exception 'invalid_input:owner' using errcode = '22023';
  end if;
  if coalesce(array_length(p_leads, 1), 0) = 0 or array_length(p_leads, 1) > 1000 then
    raise exception 'invalid_input:leads' using errcode = '22023';
  end if;
  update public.leads set owner_id = p_owner
   where id = any (p_leads) and deleted_at is null and owner_id is distinct from p_owner;
  get diagnostics n = row_count;
  perform public._audit('lead.reassign', 'lead', null, jsonb_build_object('count', n, 'owner', p_owner, 'leads', to_jsonb(p_leads)));
  return n;
end;
$$;

create or replace function public.set_member_quota(p_member uuid, p_quota integer)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  target public.profiles;
begin
  perform public._require_admin();
  select * into target from public.profiles where id = p_member;
  if not found then raise exception 'user_not_found' using errcode = 'P0002'; end if;
  if target.role = 'owner' and public.current_app_role() <> 'owner' then
    raise exception 'not_authorized' using errcode = '42501';
  end if;
  if p_quota is not null and (p_quota < 0 or p_quota > 500) then
    raise exception 'invalid_input:quota' using errcode = '22023';
  end if;
  perform public._internal_on();
  update public.profiles set daily_lead_quota = p_quota where id = p_member;
  perform public._audit('user.quota', 'profile', p_member::text, jsonb_build_object('from', target.daily_lead_quota, 'to', p_quota));
end;
$$;

-- Tops a member's open pipeline (new + attempting) up to their quota with
-- the oldest unowned leads. SKIP LOCKED keeps two members from grabbing
-- the same lead at the same moment.
create or replace function public._top_up(p_member uuid, p_force boolean)
returns integer
language plpgsql security definer set search_path = public
as $$
declare
  m public.profiles;
  v_open int;
  v_need int;
  v_done int := 0;
begin
  select * into m from public.profiles where id = p_member for update;
  if not found or not m.is_active or m.daily_lead_quota is null or m.daily_lead_quota <= 0 then
    return 0;
  end if;
  if not p_force and m.last_top_up_on is not distinct from public._ist_today() then
    return 0;
  end if;
  select count(*) into v_open from public.leads
   where owner_id = p_member and deleted_at is null and stage in ('new','attempting');
  v_need := m.daily_lead_quota - v_open;
  if v_need > 0 then
    perform public._internal_on();
    with pick as (
      select id from public.leads
       where owner_id is null and deleted_at is null and not dnc and stage in ('new','attempting')
       order by created_at asc, id asc
       limit v_need
       for update skip locked
    )
    update public.leads l set owner_id = p_member from pick where l.id = pick.id;
    get diagnostics v_done = row_count;
  end if;
  perform public._internal_on();
  update public.profiles set last_top_up_on = public._ist_today() where id = p_member;
  return v_done;
end;
$$;

-- Member: once per IST day, on opening the CRM. Admin: any member, any time.
create or replace function public.top_up_leads(p_member uuid default null)
returns integer
language plpgsql security definer set search_path = public
as $$
declare
  n int;
  v_target uuid := coalesce(p_member, auth.uid());
begin
  perform public._require_staff();
  if v_target <> auth.uid() then
    perform public._require_admin();
    n := public._top_up(v_target, true);
    perform public._audit('lead.top_up', 'profile', v_target::text, jsonb_build_object('assigned', n));
    return n;
  end if;
  return public._top_up(v_target, false);
end;
$$;

create or replace function public._top_up_all()
returns integer
language plpgsql security definer set search_path = public
as $$
declare
  r record;
  total int := 0;
begin
  for r in select id from public.profiles
            where is_active and daily_lead_quota > 0 order by created_at loop
    total := total + public._top_up(r.id, false);
  end loop;
  return total;
end;
$$;

-- ── Duplicates (safe across owners: brand + owner name only) ─────────
create or replace function public.find_duplicates(p_handle text, p_phones text[], p_exclude uuid default null)
returns table (lead_id uuid, brand_name text, owner_name text, match text, can_open boolean)
language plpgsql stable security definer set search_path = public
as $$
declare
  v_handle text := public.normalize_instagram(p_handle);
  v_phones text[];
begin
  perform public._require_staff();
  select coalesce(array_agg(distinct x), '{}') into v_phones
    from (select public.normalize_phone(p) x from unnest(coalesce(p_phones, '{}'::text[])) p) q
   where x is not null;
  return query
    select l.id, l.brand_name, coalesce(p.full_name, p.email, 'Unassigned'),
           case when v_handle is not null and l.instagram_username = v_handle then 'instagram' else 'phone' end,
           public.can_access_lead(l.id)
      from public.leads l
      left join public.profiles p on p.id = l.owner_id
     where l.deleted_at is null
       and (p_exclude is null or l.id <> p_exclude)
       and ((v_handle is not null and l.instagram_username = v_handle)
            or exists (select 1 from public.lead_phones ph
                        where ph.lead_id = l.id and ph.phone_e164 = any (v_phones)))
     limit 5;
end;
$$;

-- ── Create / edit lead with contacts (one transaction) ───────────────
create or replace function public.create_lead_with_contacts(payload jsonb)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_lead_id uuid;
  v_contact jsonb;
  v_phone jsonb;
  v_contact_id uuid;
  v_enquiry uuid := nullif(payload->>'enquiry_id', '')::uuid;
  v_owner uuid := nullif(payload->>'owner_id', '')::uuid;
  v_e164 text;
begin
  perform public._require_staff();
  if nullif(trim(coalesce(payload->>'brand_name', '')), '') is null then
    raise exception 'invalid_input:brand_name' using errcode = '22023';
  end if;
  if not public.is_admin() then
    v_owner := auth.uid();
  elsif v_owner is not null and not exists (select 1 from public.profiles where id = v_owner and is_active) then
    raise exception 'invalid_input:owner' using errcode = '22023';
  end if;
  if nullif(trim(coalesce(payload->>'instagram_username', '')), '') is not null
     and public.normalize_instagram(payload->>'instagram_username') is null then
    raise exception 'invalid_input:instagram_username' using errcode = '22023';
  end if;

  perform public._internal_on();
  insert into public.leads (brand_name, instagram_username, address, lead_found_on, source, notes,
                            owner_id, created_by, updated_by)
  values (
    trim(payload->>'brand_name'),
    public.normalize_instagram(payload->>'instagram_username'),
    nullif(trim(coalesce(payload->>'address', '')), ''),
    coalesce(nullif(payload->>'lead_found_on', '')::date, public._ist_today()),
    coalesce(nullif(payload->>'source', '')::public.lead_source,
             case when v_enquiry is null then 'manual'::public.lead_source else 'website_query'::public.lead_source end),
    nullif(trim(coalesce(payload->>'notes', '')), ''),
    v_owner, auth.uid(), auth.uid()
  )
  returning id into v_lead_id;

  for v_contact in select value from jsonb_array_elements(coalesce(payload->'contacts', '[]'::jsonb)) loop
    insert into public.lead_contacts (lead_id, name, designation, email, is_primary, sort_order)
    values (v_lead_id, trim(v_contact->>'name'), nullif(trim(coalesce(v_contact->>'designation', '')), ''),
            nullif(lower(trim(coalesce(v_contact->>'email', ''))), ''),
            coalesce((v_contact->>'is_primary')::boolean, false), coalesce((v_contact->>'sort_order')::int, 0))
    returning id into v_contact_id;
    for v_phone in select value from jsonb_array_elements(coalesce(v_contact->'phones', '[]'::jsonb)) loop
      v_e164 := public.normalize_phone(v_phone->>'phone_e164');
      if v_e164 is null then raise exception 'invalid_input:phone' using errcode = '22023'; end if;
      insert into public.lead_phones (lead_id, contact_id, phone_e164, label, is_primary, sort_order)
      values (v_lead_id, v_contact_id, v_e164, nullif(trim(coalesce(v_phone->>'label', '')), ''),
              coalesce((v_phone->>'is_primary')::boolean, false), coalesce((v_phone->>'sort_order')::int, 0));
    end loop;
  end loop;
  for v_phone in select value from jsonb_array_elements(coalesce(payload->'lead_phones', '[]'::jsonb)) loop
    v_e164 := public.normalize_phone(v_phone->>'phone_e164');
    if v_e164 is null then raise exception 'invalid_input:phone' using errcode = '22023'; end if;
    insert into public.lead_phones (lead_id, contact_id, phone_e164, label, is_primary, sort_order)
    values (v_lead_id, null, v_e164, nullif(trim(coalesce(v_phone->>'label', '')), ''),
            coalesce((v_phone->>'is_primary')::boolean, false), coalesce((v_phone->>'sort_order')::int, 0));
  end loop;

  if v_enquiry is not null then
    update public.inbound_enquiries set converted_lead_id = v_lead_id
     where id = v_enquiry and converted_lead_id is null;
    if not found then
      raise exception 'enquiry_already_converted' using errcode = '23505';
    end if;
  end if;
  return v_lead_id;
end;
$$;

create or replace function public.update_lead_with_contacts(p_lead_id uuid, payload jsonb)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_contact jsonb;
  v_phone jsonb;
  v_contact_id uuid;
  v_e164 text;
begin
  perform public._require_lead(p_lead_id);
  create temporary table if not exists _old_phone_flags (phone_e164 text primary key, is_invalid boolean, no_whatsapp boolean)
    on commit drop;
  delete from _old_phone_flags;
  insert into _old_phone_flags
    select phone_e164, bool_or(is_invalid), bool_or(no_whatsapp) from public.lead_phones
     where lead_id = p_lead_id group by phone_e164;
  delete from public.lead_phones where lead_id = p_lead_id;
  delete from public.lead_contacts where lead_id = p_lead_id;

  for v_contact in select value from jsonb_array_elements(coalesce(payload->'contacts', '[]'::jsonb)) loop
    if nullif(trim(coalesce(v_contact->>'name', '')), '') is null then
      raise exception 'invalid_input:contact.name' using errcode = '22023';
    end if;
    insert into public.lead_contacts (lead_id, name, designation, email, is_primary, sort_order)
    values (p_lead_id, trim(v_contact->>'name'), nullif(trim(coalesce(v_contact->>'designation', '')), ''),
            nullif(lower(trim(coalesce(v_contact->>'email', ''))), ''),
            coalesce((v_contact->>'is_primary')::boolean, false), coalesce((v_contact->>'sort_order')::int, 0))
    returning id into v_contact_id;
    for v_phone in select value from jsonb_array_elements(coalesce(v_contact->'phones', '[]'::jsonb)) loop
      v_e164 := public.normalize_phone(v_phone->>'phone_e164');
      if v_e164 is null then raise exception 'invalid_input:phone' using errcode = '22023'; end if;
      insert into public.lead_phones (lead_id, contact_id, phone_e164, label, is_primary, sort_order, is_invalid, no_whatsapp)
      select p_lead_id, v_contact_id, v_e164, nullif(trim(coalesce(v_phone->>'label', '')), ''),
             coalesce((v_phone->>'is_primary')::boolean, false), coalesce((v_phone->>'sort_order')::int, 0),
             coalesce(f.is_invalid, false), coalesce(f.no_whatsapp, false)
        from (select 1) x left join _old_phone_flags f on f.phone_e164 = v_e164;
    end loop;
  end loop;
  for v_phone in select value from jsonb_array_elements(coalesce(payload->'lead_phones', '[]'::jsonb)) loop
    v_e164 := public.normalize_phone(v_phone->>'phone_e164');
    if v_e164 is null then raise exception 'invalid_input:phone' using errcode = '22023'; end if;
    insert into public.lead_phones (lead_id, contact_id, phone_e164, label, is_primary, sort_order, is_invalid, no_whatsapp)
    select p_lead_id, null, v_e164, nullif(trim(coalesce(v_phone->>'label', '')), ''),
           coalesce((v_phone->>'is_primary')::boolean, false), coalesce((v_phone->>'sort_order')::int, 0),
           coalesce(f.is_invalid, false), coalesce(f.no_whatsapp, false)
      from (select 1) x left join _old_phone_flags f on f.phone_e164 = v_e164;
  end loop;
  perform public._activity(p_lead_id, 'contacts_edited', jsonb_build_object(
    'contacts', jsonb_array_length(coalesce(payload->'contacts', '[]'::jsonb)),
    'office_phones', jsonb_array_length(coalesce(payload->'lead_phones', '[]'::jsonb))));
end;
$$;

-- ── Bulk import (admins) ─────────────────────────────────────────────
-- rows: [{brand_name, instagram, phone, email, contact_name, address, notes}]
create or replace function public.import_leads(p_rows jsonb)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  r jsonb;
  i int := 0;
  v_ok int := 0;
  v_skipped jsonb := '[]'::jsonb;
  v_brand text;
  v_handle text;
  v_phone text;
  v_email text;
  v_lead uuid;
  v_contact uuid;
  v_dup text;
begin
  perform public._require_admin();
  if jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows) = 0 or jsonb_array_length(p_rows) > 2000 then
    raise exception 'invalid_input:rows' using errcode = '22023';
  end if;
  perform public._internal_on();
  for r in select value from jsonb_array_elements(p_rows) loop
    i := i + 1;
    v_brand := left(nullif(trim(coalesce(r->>'brand_name', '')), ''), 200);
    v_handle := public.normalize_instagram(r->>'instagram');
    v_phone := public.normalize_phone(r->>'phone');
    v_email := nullif(lower(trim(coalesce(r->>'email', ''))), '');
    if v_brand is null then
      v_skipped := v_skipped || jsonb_build_object('row', i, 'reason', 'Missing brand name');
      continue;
    end if;
    if nullif(trim(coalesce(r->>'phone', '')), '') is not null and v_phone is null then
      v_skipped := v_skipped || jsonb_build_object('row', i, 'reason', 'Phone number is not valid');
      continue;
    end if;
    if v_email is not null and v_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' then
      v_skipped := v_skipped || jsonb_build_object('row', i, 'reason', 'Email is not valid');
      continue;
    end if;
    select l.brand_name into v_dup from public.leads l
     where l.deleted_at is null
       and ((v_handle is not null and l.instagram_username = v_handle)
            or (v_phone is not null and exists (select 1 from public.lead_phones p where p.lead_id = l.id and p.phone_e164 = v_phone)))
     limit 1;
    if v_dup is not null then
      v_skipped := v_skipped || jsonb_build_object('row', i, 'reason', 'Duplicate of ' || v_dup);
      continue;
    end if;
    insert into public.leads (brand_name, instagram_username, address, notes, source, created_by)
    values (v_brand, v_handle, left(nullif(trim(coalesce(r->>'address', '')), ''), 500),
            left(nullif(trim(coalesce(r->>'notes', '')), ''), 10000), 'import', auth.uid())
    returning id into v_lead;
    if v_phone is not null or v_email is not null or nullif(trim(coalesce(r->>'contact_name', '')), '') is not null then
      insert into public.lead_contacts (lead_id, name, email, is_primary, sort_order)
      values (v_lead, left(coalesce(nullif(trim(coalesce(r->>'contact_name', '')), ''), 'Primary contact'), 120),
              v_email, true, 0)
      returning id into v_contact;
      if v_phone is not null then
        insert into public.lead_phones (lead_id, contact_id, phone_e164, label, is_primary, sort_order)
        values (v_lead, v_contact, v_phone, 'Mobile', true, 0);
      end if;
    end if;
    v_ok := v_ok + 1;
  end loop;
  perform public._audit('lead.import', 'lead', null, jsonb_build_object('rows', i, 'inserted', v_ok,
                        'skipped', jsonb_array_length(v_skipped)));
  return jsonb_build_object('inserted', v_ok, 'skipped', v_skipped);
end;
$$;

create or replace function public.log_export(p_count integer, p_filters jsonb)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  perform public._require_staff();
  perform public._audit('lead.export', 'lead', null, jsonb_build_object('count', p_count, 'filters', p_filters));
end;
$$;

-- ── Dashboard + insights ─────────────────────────────────────────────
create or replace function public.crm_dashboard()
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  me uuid := public._require_staff();
  adm boolean := public.is_admin();
  day_start timestamptz := public._ist_today()::timestamp at time zone 'Asia/Kolkata';
  day_end timestamptz := (public._ist_today() + 1)::timestamp at time zone 'Asia/Kolkata';
begin
  return jsonb_build_object(
    'overdue', (select count(*) from public.lead_tasks t join public.leads l on l.id = t.lead_id
                 where t.status = 'open' and t.due_at < now() and l.deleted_at is null
                   and (adm or t.assignee_id = me)),
    'due_today', (select count(*) from public.lead_tasks t join public.leads l on l.id = t.lead_id
                   where t.status = 'open' and t.due_at >= now() and t.due_at < day_end and l.deleted_at is null
                     and (adm or t.assignee_id = me)),
    'callbacks_today', (select count(*) from public.lead_tasks t join public.leads l on l.id = t.lead_id
                         where t.status = 'open' and t.type = 'callback' and t.due_at < day_end and l.deleted_at is null
                           and (adm or t.assignee_id = me)),
    'meetings_today', (select count(*) from public.lead_tasks t join public.leads l on l.id = t.lead_id
                        where t.status = 'open' and t.type = 'meeting' and t.due_at >= day_start and t.due_at < day_end
                          and l.deleted_at is null and (adm or t.assignee_id = me)),
    'pending_outcomes', (select count(*) from public.call_logs where actor_id = me and result is null),
    'new_leads', (select count(*) from public.leads where deleted_at is null and stage = 'new'
                   and (adm or owner_id = me)),
    'unassigned', case when adm then (select count(*) from public.leads where deleted_at is null and owner_id is null
                                        and not dnc and stage in ('new','attempting')) end,
    'open_enquiries', (select count(*) from public.inbound_enquiries where converted_lead_id is null),
    'won_this_month', (select count(*) from public.leads where deleted_at is null and stage = 'won'
                        and stage_changed_at >= date_trunc('month', now() at time zone 'Asia/Kolkata') at time zone 'Asia/Kolkata'
                        and (adm or owner_id = me)),
    'calls_today', (select count(*) from public.call_logs where result is not null and channel = 'call'
                     and started_at >= day_start and (adm or actor_id = me))
  );
end;
$$;

create or replace function public.crm_insights(p_from date, p_to date, p_member uuid default null)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  me uuid := public._require_staff();
  adm boolean := public.is_admin();
  who uuid := case when adm then p_member else me end;
  t0 timestamptz := p_from::timestamp at time zone 'Asia/Kolkata';
  t1 timestamptz := (p_to + 1)::timestamp at time zone 'Asia/Kolkata';
begin
  if p_from is null or p_to is null or p_to < p_from or p_to - p_from > 366 then
    raise exception 'invalid_input:range' using errcode = '22023';
  end if;
  return (
    with calls as (
      select c.* from public.call_logs c
       where c.result is not null and c.started_at >= t0 and c.started_at < t1
         and (who is null or c.actor_id = who)
    ),
    scope_leads as (
      select l.* from public.leads l where l.deleted_at is null and (who is null or l.owner_id = who)
    ),
    stage_events as (
      select a.lead_id, a.detail->>'to' as to_stage from public.lead_activities a
       where a.kind = 'stage_changed' and a.created_at >= t0 and a.created_at < t1
         and exists (select 1 from scope_leads s where s.id = a.lead_id)
    ),
    meetings as (
      select t.* from public.lead_tasks t
       where t.type = 'meeting' and t.status = 'done' and t.completed_at >= t0 and t.completed_at < t1
         and (who is null or t.assignee_id = who)
    ),
    quotes as (
      select q.* from public.quotations q
       where q.sent_at >= t0 and q.sent_at < t1
         and exists (select 1 from scope_leads s where s.id = q.lead_id)
    )
    select jsonb_build_object(
      'calls', (select count(*) from calls where channel = 'call'),
      'connected', (select count(*) from calls where result in ('connected','wa_replied')),
      'whatsapp', (select count(*) from calls where channel = 'whatsapp'),
      'results', (select coalesce(jsonb_object_agg(result, n), '{}') from
                    (select result::text, count(*) n from calls group by result) x),
      'outcomes', (select coalesce(jsonb_object_agg(outcome, n), '{}') from
                    (select outcome::text, count(*) n from calls where outcome is not null group by outcome) x),
      'funnel', jsonb_build_object(
        'new_leads', (select count(*) from scope_leads where created_at >= t0 and created_at < t1),
        'connected', (select count(distinct lead_id) from calls where result in ('connected','wa_replied')),
        'interested', (select count(distinct lead_id) from stage_events where to_stage in ('interested','callback','meeting')),
        'meetings_held', (select count(*) from meetings where result in ('held_positive','held_needs_time')),
        'quotes_sent', (select count(*) from quotes),
        'won', (select count(distinct lead_id) from stage_events where to_stage = 'won')
      ),
      'meetings', jsonb_build_object(
        'held', (select count(*) from meetings where result in ('held_positive','held_needs_time')),
        'no_show', (select count(*) from meetings where result = 'no_show')),
      'quotes', jsonb_build_object(
        'sent', (select count(*) from quotes),
        'accepted', (select count(*) from quotes where status = 'accepted'),
        'rejected', (select count(*) from quotes where status = 'rejected'),
        'value_won', (select coalesce(sum(amount_inr), 0) from quotes where status = 'accepted')),
      'lost_reasons', (select coalesce(jsonb_object_agg(lost_reason, n), '{}') from
                        (select lost_reason::text, count(*) n from scope_leads
                          where stage = 'lost' and stage_changed_at >= t0 and stage_changed_at < t1
                          group by lost_reason) x),
      'pipeline', (select coalesce(jsonb_object_agg(stage, n), '{}') from
                    (select stage::text, count(*) n from scope_leads group by stage) x),
      'heatmap', (select coalesce(jsonb_agg(jsonb_build_object('dow', dow, 'hour', hr, 'calls', n, 'connected', c)), '[]') from
                   (select extract(isodow from started_at at time zone 'Asia/Kolkata')::int dow,
                           extract(hour from started_at at time zone 'Asia/Kolkata')::int hr,
                           count(*) n,
                           count(*) filter (where result = 'connected') c
                      from calls where channel = 'call' group by 1, 2) x),
      'members', case when adm and p_member is null then
                   (select coalesce(jsonb_agg(jsonb_build_object(
                      'id', p.id, 'name', coalesce(p.full_name, p.email),
                      'calls', (select count(*) from calls c where c.actor_id = p.id and c.channel = 'call'),
                      'connected', (select count(*) from calls c where c.actor_id = p.id and c.result in ('connected','wa_replied')),
                      'interested', (select count(*) from calls c where c.actor_id = p.id and c.outcome = 'interested'),
                      'won', (select count(*) from public.leads l where l.owner_id = p.id and l.stage = 'won'
                                and l.stage_changed_at >= t0 and l.stage_changed_at < t1),
                      'overdue', (select count(*) from public.lead_tasks t where t.assignee_id = p.id and t.status = 'open' and t.due_at < now())
                    ) order by coalesce(p.full_name, p.email)), '[]')
                      from public.profiles p where p.is_active)
                 end
    )
  );
end;
$$;

-- ── Keepalive heartbeat (anon-callable, bounded) ─────────────────────
create or replace function public.ping_keepalive()
returns void
language sql security definer set search_path = public
as $$
  insert into public.keepalive (source) values ('ping_keepalive');
  delete from public.keepalive where id < (select max(id) - 100 from public.keepalive);
$$;

-- ── Optional daily top-up at 09:00 IST (03:30 UTC) via pg_cron ──────
-- The CRM also tops up lazily when a member opens it, so this is a
-- convenience, not a dependency. Skipped silently where pg_cron is absent.
do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron;
    perform cron.schedule('crm-daily-top-up', '30 3 * * *', 'select public._top_up_all()');
  end if;
exception when others then
  raise notice 'pg_cron not scheduled: %', sqlerrm;
end $$;

commit;
