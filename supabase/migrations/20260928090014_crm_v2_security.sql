-- ─────────────────────────────────────────────────────────────────────
-- 20260928090014 — CRM v2: grants, Row Level Security, realtime
--
-- Model (a hostile caller holding the public anon key is assumed):
--   anon           → may only INSERT website enquiries and ping keepalive.
--   member         → sees and edits ONLY leads they own (+ their children,
--                    tasks, calls, quotes); sees all website enquiries.
--   admin / owner  → everything. Protected columns (stage, owner, counters)
--                    change only through the definer RPCs in 090013.
--   inactive staff → nothing (is_active = false fails every check at once,
--                    even while their last access token is still valid).
-- ─────────────────────────────────────────────────────────────────────
begin;

set local search_path = public;

-- ── Table grants: start from zero ────────────────────────────────────
revoke all on public.profiles, public.leads, public.lead_contacts, public.lead_phones,
              public.lead_activities, public.inbound_enquiries, public.lead_tasks,
              public.call_logs, public.quotations, public.audit_log, public.crm_settings,
              public.login_throttle, public.keepalive
  from anon, authenticated;
revoke all on sequence public.keepalive_id_seq from anon, authenticated;
revoke all on sequence public.audit_log_id_seq from anon, authenticated;

alter table public.profiles          enable row level security;
alter table public.leads             enable row level security;
alter table public.lead_contacts     enable row level security;
alter table public.lead_phones       enable row level security;
alter table public.lead_activities   enable row level security;
alter table public.inbound_enquiries enable row level security;
alter table public.lead_tasks        enable row level security;
alter table public.call_logs         enable row level security;
alter table public.quotations        enable row level security;
alter table public.audit_log         enable row level security;
alter table public.crm_settings      enable row level security;
alter table public.login_throttle    enable row level security;   -- no policies: service role only
alter table public.keepalive         enable row level security;   -- no policies: RPC only

-- Drop every existing policy on these tables; the complete set follows.
do $$
declare
  r record;
begin
  for r in select tablename, policyname from pg_policies
            where schemaname = 'public'
              and tablename in ('profiles','leads','lead_contacts','lead_phones','lead_activities',
                                'inbound_enquiries','lead_tasks','call_logs','quotations','audit_log',
                                'crm_settings','login_throttle')
  loop
    execute format('drop policy %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

-- profiles: names for dropdowns and timelines. Writes go through the server.
grant select on public.profiles to authenticated;
create policy profiles_read on public.profiles
  for select to authenticated using (public.is_staff());

-- leads
grant select, insert on public.leads to authenticated;
grant update (brand_name, instagram_username, address, lead_found_on, source, notes, owner_id,
              deleted_at, deal_value_inr, competitor_name, competitor_contract_end,
              project_start_date, expected_delivery_date, project_end_date)
  on public.leads to authenticated;
create policy leads_read on public.leads
  for select to authenticated using (public.is_admin() or (public.is_staff() and owner_id = auth.uid()));
create policy leads_insert on public.leads
  for insert to authenticated with check (public.is_staff());
create policy leads_update on public.leads
  for update to authenticated
  using (public.is_admin() or (public.is_staff() and owner_id = auth.uid()))
  with check (public.is_admin() or (public.is_staff() and owner_id = auth.uid()));

-- contacts / phones: read via lead access; writes via the RPCs.
grant select on public.lead_contacts, public.lead_phones to authenticated;
create policy lead_contacts_read on public.lead_contacts
  for select to authenticated using (public.can_access_lead(lead_id));
create policy lead_phones_read on public.lead_phones
  for select to authenticated using (public.can_access_lead(lead_id));

-- timeline, tasks, calls, quotes: read-only for clients.
grant select on public.lead_activities, public.lead_tasks, public.call_logs, public.quotations to authenticated;
create policy lead_activities_read on public.lead_activities
  for select to authenticated using (public.can_access_lead(lead_id));
create policy lead_tasks_read on public.lead_tasks
  for select to authenticated
  using (public.is_admin() or (public.is_staff() and (assignee_id = auth.uid() or public.can_access_lead(lead_id))));
create policy call_logs_read on public.call_logs
  for select to authenticated
  using (public.is_admin() or (public.is_staff() and (actor_id = auth.uid() or public.can_access_lead(lead_id))));
create policy quotations_read on public.quotations
  for select to authenticated using (public.can_access_lead(lead_id));

-- website enquiries: anyone may submit (bounded by CHECKs from 090011);
-- all staff read; conversion happens in create_lead_with_contacts; admins delete spam.
grant insert on public.inbound_enquiries to anon;
grant select, delete on public.inbound_enquiries to authenticated;
create policy inbound_insert_anon on public.inbound_enquiries
  for insert to anon
  with check (char_length(trim(name)) > 0 and kind in ('callback','query') and converted_lead_id is null);
create policy inbound_staff_read on public.inbound_enquiries
  for select to authenticated using (public.is_staff());
create policy inbound_admin_delete on public.inbound_enquiries
  for delete to authenticated using (public.is_admin());

-- audit log: admins read.
grant select on public.audit_log to authenticated;
create policy audit_admin_read on public.audit_log
  for select to authenticated using (public.is_admin());

-- settings: staff read (retry timings, idle timeout); admins edit.
grant select on public.crm_settings to authenticated;
grant update (retry_no_answer_minutes, retry_busy_minutes, retry_unreachable_minutes, retry_rejected_minutes,
              nurture_after_misses, nurture_days, re_engage_days, quote_follow_up_days,
              default_daily_quota, idle_timeout_minutes, updated_at)
  on public.crm_settings to authenticated;
create policy settings_read on public.crm_settings
  for select to authenticated using (public.is_staff());
create policy settings_admin_update on public.crm_settings
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- ── Function EXECUTE: nothing by default, then an explicit allow-list ─
do $$
declare
  f record;
begin
  for f in select p.oid::regprocedure as sig
             from pg_proc p join pg_namespace n on n.oid = p.pronamespace
            where n.nspname = 'public' and p.prokind = 'f'
              and p.proname not like 'gtrgm%' and p.proname not like 'gin_%'
              and p.proname not in ('similarity','similarity_op','similarity_dist','word_similarity',
                                    'word_similarity_op','word_similarity_commutator_op',
                                    'word_similarity_dist_op','word_similarity_dist_commutator_op',
                                    'strict_word_similarity','strict_word_similarity_op',
                                    'strict_word_similarity_commutator_op','strict_word_similarity_dist_op',
                                    'strict_word_similarity_dist_commutator_op','show_limit','show_trgm','set_limit')
              and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e')
  loop
    execute format('revoke all on function %s from public', f.sig);
    execute format('revoke all on function %s from anon', f.sig);
    execute format('revoke all on function %s from authenticated', f.sig);
  end loop;
end $$;

-- Used inside RLS policies, so the querying role must be able to call them.
grant execute on function public.current_app_role(), public.is_staff(), public.is_admin(),
                          public.can_access_lead(uuid)
  to authenticated;

-- Client-callable RPCs.
grant execute on function
  public.start_attempt(uuid, uuid, public.contact_channel, uuid),
  public.discard_attempt(uuid),
  public.log_outcome(uuid, jsonb),
  public.schedule_task(uuid, public.task_type, timestamptz, text, public.meeting_mode, text),
  public.reschedule_task(uuid, timestamptz, text),
  public.cancel_task(uuid, text),
  public.complete_meeting(uuid, jsonb),
  public.create_quotation(uuid, numeric, date, text, text),
  public.decide_quotation(uuid, text, public.lost_reason, text),
  public.set_lead_stage(uuid, public.lead_stage, public.lost_reason, text),
  public.add_note(uuid, text),
  public.reassign_leads(uuid[], uuid),
  public.set_member_quota(uuid, integer),
  public.top_up_leads(uuid),
  public.find_duplicates(text, text[], uuid),
  public.create_lead_with_contacts(jsonb),
  public.update_lead_with_contacts(uuid, jsonb),
  public.import_leads(jsonb),
  public.log_export(integer, jsonb),
  public.crm_dashboard(),
  public.crm_insights(date, date, uuid),
  public.normalize_phone(text),
  public.normalize_instagram(text)
  to authenticated;

-- The keepalive heartbeat (GitHub Action) stays anon-callable.
grant execute on function public.ping_keepalive() to anon;

-- Future functions start closed too.
alter default privileges for role postgres in schema public revoke execute on functions from public;
alter default privileges for role postgres in schema public revoke execute on functions from anon, authenticated;

-- ── Realtime: live follow-ups, "someone is on this lead" ─────────────
do $$
declare
  t text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach t in array array['lead_tasks','call_logs','leads'] loop
      if not exists (select 1 from pg_publication_tables
                      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
        execute format('alter publication supabase_realtime add table public.%I', t);
      end if;
    end loop;
  end if;
end $$;

commit;
