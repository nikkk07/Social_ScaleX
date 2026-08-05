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
--   keepalive         -> anon may delete (the heartbeat prunes old rows).
-- ─────────────────────────────────────────────────────────────────────

-- Reset any Supabase default privileges, then grant precisely.
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
grant insert, select, delete on public.keepalive to anon;
grant usage, select on sequence public.keepalive_id_seq to anon;
grant select on public.keepalive to authenticated;
create policy keepalive_anon on public.keepalive
  for all to anon using (true) with check (true);
create policy keepalive_staff_read on public.keepalive
  for select to authenticated using (true);
