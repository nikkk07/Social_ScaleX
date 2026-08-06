-- Runs the 8 required RLS/constraint checks. Autocommit + ON_ERROR_STOP off
-- so a blocked operation prints its raw error and the script keeps going.
\pset pager off

\echo '════════ SETUP (superuser) — allowlist + gated signup of an owner ════════'
insert into public.allowed_emails (email, role) values ('owner@socialscalex.test','owner') on conflict do nothing;
insert into auth.users (id, email) values ('11111111-1111-1111-1111-111111111111','owner@socialscalex.test');
\echo '-- profile auto-created by the gated-signup trigger (expect 1 row, role owner):'
select id, email, role from public.profiles where id='11111111-1111-1111-1111-111111111111';

\echo ''
\echo '════════ ANON (anon key, no session) ════════'
set role anon;
\echo '#1 anon SELECT leads  → expect BLOCKED'
select count(*) from public.leads;
\echo '#2 anon SELECT profiles  → expect BLOCKED'
select count(*) from public.profiles;
\echo '#3 anon SELECT inbound_enquiries  → expect BLOCKED'
select count(*) from public.inbound_enquiries;
\echo '#4 anon INSERT leads  → expect BLOCKED'
insert into public.leads (brand_name) values ('anon hack attempt');
\echo '#5 anon INSERT inbound_enquiries  → expect ALLOWED'
insert into public.inbound_enquiries (kind, name, message) values ('query','Anon Prospect','Hi, I would like a callback about growth.');
reset role;
\echo '-- (superuser) confirm the enquiry actually landed:'
select kind, name from public.inbound_enquiries where name='Anon Prospect';

\echo ''
\echo '════════ AUTHENTICATED owner (has profile) ════════'
set app.current_user_id = '11111111-1111-1111-1111-111111111111';
set role authenticated;
\echo '#6 authed INSERT leads pending+interested  → expect BLOCKED by CHECK'
insert into public.leads (brand_name, status, outcome) values ('Bad State','pending','interested');
\echo '#8 authed DELETE leads  → expect BLOCKED'
delete from public.leads;
\echo '-- sanity: authenticated staff CAN read leads (expect a count):'
select count(*) from public.leads;
reset role;
reset app.current_user_id;

\echo ''
\echo '════════ SIGNUP GATE ════════'
\echo '#7 signup NON-allowlisted email  → expect BLOCKED by trigger'
insert into auth.users (email) values ('stranger@example.com');
\echo '-- confirm nothing persisted for the stranger (expect 0):'
select count(*) from auth.users where email='stranger@example.com';

\echo ''
\echo '════════ BONUS — create_lead_with_contacts atomic RPC ════════'
set app.current_user_id = '11111111-1111-1111-1111-111111111111';
set role authenticated;
select public.create_lead_with_contacts($json$
{"brand_name":"RPC Test Brand","instagram_username":"rpctestbrand","status":"contacted","outcome":"interested",
 "contacts":[{"name":"Test Person","is_primary":true,"phones":[{"phone_e164":"+919000000001","label":"WhatsApp","is_primary":true}]}],
 "lead_phones":[{"phone_e164":"+911100000002","label":"Office","is_primary":true}]}
$json$::jsonb) as new_lead_id;
reset role;
reset app.current_user_id;
\echo '-- lead + contact + 2 phones committed atomically (expect 1 contact, 2 phones):'
select l.brand_name, l.status, l.outcome,
       (select count(*) from public.lead_contacts c where c.lead_id=l.id) as contacts,
       (select count(*) from public.lead_phones p where p.lead_id=l.id) as phones
from public.leads l where l.brand_name='RPC Test Brand';

\echo ''
\echo '════════ POLICY-LAYER TESTS (9–14) — reach the policy, not just the grant ════════'
\echo '-- These pass the grant check and exercise the USING / WITH CHECK / trigger'
\echo '-- layer. Report ROW COUNTS: "0 rows" (policy ran) ≠ "error" (grant blocked).'

\echo '-- SETUP: a member (non-admin) staff user via the gated-signup trigger:'
insert into public.allowed_emails (email, role) values ('member@socialscalex.test','member') on conflict do nothing;
insert into auth.users (id, email) values ('22222222-2222-2222-2222-222222222222','member@socialscalex.test') on conflict do nothing;
select id, email, role from public.profiles where id='22222222-2222-2222-2222-222222222222';

\echo ''
\echo '════════ PROFILE-LESS authenticated (valid session, no profiles row) ════════'
set app.current_user_id = '99999999-9999-9999-9999-999999999999';
set role authenticated;
\echo '#9  profile-less SELECT leads  → expect 0 ROWS (is_staff()=false, policy ran), NOT an error'
select count(*) as leads_visible from public.leads;
\echo '#10 profile-less INSERT leads  → expect BLOCKED by WITH CHECK (0 inserted)'
insert into public.leads (brand_name) values ('ghost insert');
reset role;
reset app.current_user_id;
\echo '-- confirm #10 inserted nothing (expect 0):'
select count(*) as ghost_rows from public.leads where brand_name='ghost insert';

\echo ''
\echo '════════ MEMBER (non-admin staff) ════════'
set app.current_user_id = '22222222-2222-2222-2222-222222222222';
set role authenticated;
\echo '#11 member sets deleted_at on leads  → expect BLOCKED by tg_leads_guard_soft_delete'
update public.leads set deleted_at = now() where deleted_at is null;
\echo '#12 member updates ANOTHER user''s profiles row (owner''s)  → expect UPDATE 0 (USING filters it out)'
update public.profiles set full_name = 'hijacked' where id='11111111-1111-1111-1111-111111111111';
\echo '#13 member changes OWN profiles.role → admin  → expect BLOCKED by tg_profiles_guard_role'
update public.profiles set role='admin' where id='22222222-2222-2222-2222-222222222222';
\echo '#14 member SELECT inbound_enquiries  → expect ALLOWED (is_staff()=true), report count'
select count(*) as enquiries_visible from public.inbound_enquiries;
reset role;
reset app.current_user_id;
\echo '-- confirm #11 archived nothing (leads with deleted_at set, expect 0):'
select count(*) as archived_leads from public.leads where deleted_at is not null;
\echo '-- confirm #12 changed nothing (owner full_name must NOT be "hijacked"):'
select coalesce(full_name,'(null)') as owner_full_name from public.profiles where id='11111111-1111-1111-1111-111111111111';
\echo '-- confirm #13 changed nothing (member role still "member"):'
select role as member_role from public.profiles where id='22222222-2222-2222-2222-222222222222';

\echo ''
\echo '════════ KEEPALIVE lockdown (fix #3) ════════'
set role anon;
\echo '#K1 anon INSERT keepalive directly  → expect BLOCKED (grant revoked)'
insert into public.keepalive (source) values ('anon direct write');
\echo '#K2 anon DELETE keepalive directly  → expect BLOCKED (grant revoked)'
delete from public.keepalive;
\echo '#K3 anon calls ping_keepalive() RPC  → expect ALLOWED (SECURITY DEFINER, execute granted)'
select public.ping_keepalive();
reset role;
\echo '-- confirm the RPC wrote exactly one heartbeat and no anon direct write landed:'
select count(*) as heartbeats,
       count(*) filter (where source='ping_keepalive') as via_rpc,
       count(*) filter (where source='anon direct write') as via_anon
from public.keepalive;

\echo '#K4 VOLUME bound (090007): hammer the RPC 150× as anon → table stays ~100 rows'
set role anon;
do $$ begin for i in 1..150 loop perform public.ping_keepalive(); end loop; end $$;
reset role;
\echo '-- expect rows <= 101 and bounded = t (time-based prune would show ~151):'
select count(*) as rows_after_150_calls,
       (count(*) <= 101) as bounded
from public.keepalive;

\echo ''
\echo '════════ DEFAULT PRIVILEGES lockdown (fix #1) ════════'
\echo '-- Create a table the way Phase 3+ will (as postgres, after 090006 ran).'
\echo '-- It must inherit NO anon/authenticated grant. Pre-090006 this would'
\echo '-- have silently been GRANT ALL to both roles.'
create table public.phase3_probe (id bigserial primary key, x text);
\echo '#D1 anon privilege on the new table  → expect all f (false):'
select has_table_privilege('anon','public.phase3_probe','select') as anon_select,
       has_table_privilege('anon','public.phase3_probe','insert') as anon_insert,
       has_table_privilege('authenticated','public.phase3_probe','select') as auth_select,
       has_table_privilege('authenticated','public.phase3_probe','insert') as auth_insert;
\echo '#D2 anon privilege on the new table''s sequence  → expect all f (false):'
select has_sequence_privilege('anon','public.phase3_probe_id_seq','usage') as anon_usage,
       has_sequence_privilege('authenticated','public.phase3_probe_id_seq','select') as auth_select;
drop table public.phase3_probe;

\echo ''
\echo '════════ update_lead_with_contacts (090008) — replace-children + auth ════════'
set app.current_user_id='11111111-1111-1111-1111-111111111111'; set role authenticated;
select public.create_lead_with_contacts($json$
{"brand_name":"Edit Target","contacts":[{"name":"Before","is_primary":true}]}$json$::jsonb) as edit_lead_id \gset
reset role; reset app.current_user_id;

\echo '#U1 profile-less caller → REJECTED by internal is_staff() (definer bypasses RLS)'
set app.current_user_id='99999999-9999-9999-9999-999999999999'; set role authenticated;
select public.update_lead_with_contacts(:'edit_lead_id', $json$
{"contacts":[{"name":"Hijack","is_primary":true}]}$json$::jsonb);
reset role; reset app.current_user_id;
\echo '-- unchanged (expect Before):'
select name from public.lead_contacts where lead_id=:'edit_lead_id';

\echo '#U2 staff replace-children (expect After, exactly 1 contact)'
set app.current_user_id='11111111-1111-1111-1111-111111111111'; set role authenticated;
select public.update_lead_with_contacts(:'edit_lead_id', $json$
{"contacts":[{"name":"After","is_primary":true,"sort_order":0,"phones":[{"phone_e164":"+919000000000","is_primary":true}]}]}$json$::jsonb);
reset role; reset app.current_user_id;
select (select name from public.lead_contacts where lead_id=:'edit_lead_id') as contact,
       (select count(*) from public.lead_contacts where lead_id=:'edit_lead_id') as n_contacts,
       (select kind from public.lead_activities where lead_id=:'edit_lead_id' and kind='edited' limit 1) as logged;
