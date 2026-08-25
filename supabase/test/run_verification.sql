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

\echo ''
\echo '════════ NORMALISATION invariants (090009) ════════'
\echo '-- These are DB guarantees now, not client-side conventions. Every check'
\echo '-- below writes the way a bulk CSV import would: straight at the table,'
\echo '-- bypassing the form that used to be the only thing normalising values.'
set app.current_user_id='11111111-1111-1111-1111-111111111111'; set role authenticated;

\echo '#N1 handle with UPPERCASE ("CafeX")  → expect BLOCKED by leads_instagram_normalised'
insert into public.leads (brand_name, instagram_username) values ('Case Probe','CafeX');
\echo '#N2 handle pasted as a profile URL  → expect BLOCKED (contains / and :)'
insert into public.leads (brand_name, instagram_username) values ('URL Probe','https://instagram.com/cafex');
\echo '#N3 handle with a leading @  → expect BLOCKED'
insert into public.leads (brand_name, instagram_username) values ('At Probe','@cafex');
\echo '#N4 handle with whitespace  → expect BLOCKED'
insert into public.leads (brand_name, instagram_username) values ('Space Probe','cafe x');
\echo '#N5 already-normalised handle  → expect ALLOWED (1 row)'
insert into public.leads (brand_name, instagram_username) values ('Norm Probe','cafex');
\echo '#N6 the SAME handle again  → expect BLOCKED by leads_instagram_unique'
insert into public.leads (brand_name, instagram_username) values ('Dupe Probe','cafex');

\echo '#N7 phone "98765 43210" (not E.164)  → expect BLOCKED by lead_phones_e164'
insert into public.lead_phones (lead_id, phone_e164)
select id, '98765 43210' from public.leads where instagram_username='cafex';
\echo '#N8 phone with a leading zero country code  → expect BLOCKED'
insert into public.lead_phones (lead_id, phone_e164)
select id, '+0919876543210' from public.leads where instagram_username='cafex';
\echo '#N9 proper E.164  → expect ALLOWED (1 row)'
insert into public.lead_phones (lead_id, phone_e164)
select id, '+919876543210' from public.leads where instagram_username='cafex';
reset role; reset app.current_user_id;

\echo '-- only the two legitimate writes landed (expect probes=1, phones=1):'
select (select count(*) from public.leads where brand_name like '% Probe') as probes,
       (select count(*) from public.lead_phones p
          join public.leads l on l.id=p.lead_id where l.instagram_username='cafex') as phones;

\echo '-- the dedupe index is over lower() — uniqueness holds regardless of case'
\echo '-- even though the CHECK above means a non-lowercase value can never be'
\echo '-- stored to exercise it (expect over_lower = t):'
select indexdef ~* 'lower\(' as over_lower
from pg_indexes where schemaname='public' and indexname='leads_instagram_unique';

\echo ''
\echo '════════ ENQUIRY CONVERSION (090010) — one transaction, or none ════════'
\echo '-- Seeded enquiry …0001 is an unconverted callback; …0003 is already'
\echo '-- converted to the Lumen lead.'
set app.current_user_id='11111111-1111-1111-1111-111111111111'; set role authenticated;

\echo '#E1 convert an unconverted enquiry  → expect a new lead id'
select public.create_lead_with_contacts($json$
{"brand_name":"Converted Brand","instagram_username":"convertedbrand","source":"website_callback",
 "enquiry_id":"e0000000-0000-4000-8000-000000000001"}$json$::jsonb) as converted_lead_id;

\echo '#E2 convert the SAME enquiry again  → expect ERROR enquiry_already_converted'
select public.create_lead_with_contacts($json$
{"brand_name":"Double Convert","instagram_username":"doubleconvert",
 "enquiry_id":"e0000000-0000-4000-8000-000000000001"}$json$::jsonb);

\echo '#E3 convert an enquiry that does not exist  → expect the same ERROR'
select public.create_lead_with_contacts($json$
{"brand_name":"Ghost Convert","instagram_username":"ghostconvert",
 "enquiry_id":"e0000000-0000-4000-8000-0000000000ff"}$json$::jsonb);

\echo '#E4 no enquiry_id in the payload  → expect a lead, enquiries untouched'
select public.create_lead_with_contacts($json$
{"brand_name":"Plain Lead","instagram_username":"plainlead"}$json$::jsonb) as plain_lead_id;
reset role; reset app.current_user_id;

\echo '-- #E1 stamped the enquiry with the lead it created (expect stamped = t):'
select e.converted_lead_id = l.id as stamped
from public.inbound_enquiries e, public.leads l
where e.id='e0000000-0000-4000-8000-000000000001' and l.brand_name='Converted Brand';

\echo '-- THE atomicity proof: #E2/#E3 raised AFTER their lead row was inserted,'
\echo '-- so if the rollback did not reach it we would be left with an orphan'
\echo '-- lead and an enquiry still reading "unconverted" (expect both 0):'
select (select count(*) from public.leads where brand_name='Double Convert') as orphan_double,
       (select count(*) from public.leads where brand_name='Ghost Convert')  as orphan_ghost;

\echo '-- #E4 committed and left every enquiry stamp alone (expect plain=1, converted=2):'
select (select count(*) from public.leads where brand_name='Plain Lead') as plain,
       (select count(*) from public.inbound_enquiries where converted_lead_id is not null) as converted;

\echo '-- dashboard indexes from 090010 exist (expect all t):'
select
  bool_or(indexname='leads_followup_idx')               as followup_idx,
  bool_or(indexname='leads_created_at_idx')             as created_at_idx,
  bool_or(indexname='inbound_enquiries_unconverted_idx') as unconverted_idx
from pg_indexes where schemaname='public';

\echo '-- The enquiries list embeds the converted lead as converted_lead:leads(...)'
\echo '-- with no !fkey hint, which PostgREST only resolves when exactly ONE'
\echo '-- foreign key joins the two tables. A second one would make every request'
\echo '-- to /crm/enquiries a 300 (expect fks_to_leads = 1):'
select count(*) as fks_to_leads
from pg_constraint
where contype = 'f'
  and conrelid = 'public.inbound_enquiries'::regclass
  and confrelid = 'public.leads'::regclass;

\echo ''
\echo '════════ ANON ENQUIRY WRITES (090011) — the one table strangers can write ════════'
\echo '-- Every check below runs as ANON with no session, i.e. anyone holding the'
\echo '-- public key. This is the real threat model for this table.'
set role anon;

\echo '#A1 anon INSERT a normal callback enquiry  → expect ALLOWED (INSERT 0 1)'
insert into public.inbound_enquiries (kind, name, phone, best_time, user_agent)
values ('callback', 'Anon Visitor', '+919812345678', 'Tomorrow afternoon', 'Mozilla/5.0 (probe)');

\echo '#A2 anon INSERT a normal query enquiry  → expect ALLOWED (INSERT 0 1)'
insert into public.inbound_enquiries (kind, name, email, message, user_agent)
values ('query', 'Anon Asker', 'anon@example.test', 'I would like help with Reels.', 'Mozilla/5.0 (probe)');

\echo '#A3 anon SELECT the table back  → expect BLOCKED (grant), NOT a row'
select count(*) from public.inbound_enquiries;
\echo '#A4 anon UPDATE  → expect BLOCKED'
update public.inbound_enquiries set name = 'hijacked';
\echo '#A5 anon DELETE  → expect BLOCKED'
delete from public.inbound_enquiries;

\echo '#A6 blank name  → expect BLOCKED (policy WITH CHECK fires first; the 090011'
\echo '--    CHECK is the floor under it, binding writers the policy never sees)'
insert into public.inbound_enquiries (kind, name, phone) values ('callback', '   ', '+919812345678');
\echo '#A7 1 MB message  → expect BLOCKED (policy first, CHECK underneath it)'
insert into public.inbound_enquiries (kind, name, email, message)
values ('query', 'Flooder', 'f@e.test', repeat('x', 1048576));
\echo '#A8 oversized user_agent  → expect BLOCKED by inbound_enquiries_bounds.'
\echo '--    THIS is the field the policy never covered: attacker-controlled, uncapped.'
insert into public.inbound_enquiries (kind, name, phone, user_agent)
values ('callback', 'UA Flooder', '+919812345678', repeat('u', 401));
\echo '#A9 no phone AND no email  → expect BLOCKED by inbound_enquiries_contactable'
insert into public.inbound_enquiries (kind, name, message) values ('query', 'Ghost', 'unreachable');
\echo '#A10 invalid kind  → expect BLOCKED by the policy WITH CHECK'
insert into public.inbound_enquiries (kind, name, phone) values ('spam', 'Bad Kind', '+919812345678');

\echo '#A11 anon calls the staff conversion RPC  → expect BLOCKED (execute not granted)'
select public.create_lead_with_contacts('{"brand_name":"anon lead"}'::jsonb);
reset role;

\echo '-- Only the two legitimate anon inserts landed (expect probes = 2):'
select count(*) as probes from public.inbound_enquiries where user_agent = 'Mozilla/5.0 (probe)';
\echo '-- …with the kind and user_agent the client sent (expect one row each):'
select kind, name, coalesce(phone, email) as contact, user_agent
from public.inbound_enquiries where user_agent = 'Mozilla/5.0 (probe)' order by kind;
\echo '-- …and nothing was hijacked or deleted (expect hijacked = 0, total >= 5):'
select (select count(*) from public.inbound_enquiries where name = 'hijacked') as hijacked,
       (select count(*) from public.inbound_enquiries) as total;
