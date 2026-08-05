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
