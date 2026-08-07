-- ─────────────────────────────────────────────────────────────────────
-- seed.sql — development dummy data. FAKE brands only; no real client data
-- ever belongs in a seed file that lives in a (potentially public) repo.
-- Safe to run repeatedly after a reset. owner_id / created_by are left NULL
-- (no auth user needed for local dev).
-- ─────────────────────────────────────────────────────────────────────

-- contacted_at is given EXPLICITLY for contacted leads: tg_leads_status_coherence
-- only stamps it when it arrives null, so without this every seeded lead would
-- read "contacted just now" and the dashboard's "needs follow-up" list (older
-- than 7 days) would come back empty on fresh data.
insert into public.leads (id, brand_name, instagram_username, address, lead_found_on, status, outcome, source, contacted_at, notes)
values
  ('a0000000-0000-4000-8000-000000000001', 'Nimbus Coffee Roasters', 'nimbuscoffee',   'Indiranagar, Bengaluru', current_date - 3,  'pending',   null,             'manual',           null,                        'Saw their Reels — decent volume, weak captions.'),
  ('a0000000-0000-4000-8000-000000000002', 'Peak & Pine Outdoors',   'peakandpine',    'Rishikesh, Uttarakhand', current_date - 12, 'contacted', null,             'manual',           now() - interval '10 days',  'DM sent, awaiting reply. Follow up soon.'),
  ('a0000000-0000-4000-8000-000000000003', 'Lumen Skincare Co',      'lumenskin',      'Bandra, Mumbai',         current_date - 20, 'contacted', 'interested',     'website_callback', now() - interval '18 days',  'Wants a strategy call next week.'),
  ('a0000000-0000-4000-8000-000000000004', 'Bytebloom Studios',      'bytebloom',      'Koramangala, Bengaluru', current_date - 30, 'contacted', 'not_interested', 'website_query',    now() - interval '28 days',  'Handles social in-house for now.'),
  -- Contacted 2 days ago, no outcome: the NEGATIVE control for "needs
  -- follow-up" — recent enough that chasing it would be nagging, not rescuing.
  ('a0000000-0000-4000-8000-000000000005', 'Harbor & Co Interiors',  'harborandco',    'Kalkaji, New Delhi',     current_date - 4,  'contacted', null,             'manual',           now() - interval '2 days',   'Called Tuesday, they are thinking it over.'),
  ('a0000000-0000-4000-8000-000000000006', 'Saffron Street Kitchen', 'saffronstreet',  'Sector 29, Gurugram',    current_date - 45, 'contacted', null,             'manual',           now() - interval '40 days',  'Contacted 45 days ago, went cold — needs follow-up.'),
  ('a0000000-0000-4000-8000-000000000007', 'Vellum Stationery',      'vellumpaper',    'Jaipur, Rajasthan',      current_date - 7,  'pending',   null,             'import',           null,                        null),
  ('a0000000-0000-4000-8000-000000000008', 'Nova Fitness Collective','novafitness',    'Powai, Mumbai',          current_date - 5,  'contacted', 'interested',     'manual',           now() - interval '4 days',   'Owner keen on Reels + ads bundle.'),
  ('a0000000-0000-4000-8000-000000000009', 'Tidewater Surf School',  'tidewatersurf',  'Varkala, Kerala',        current_date - 15, 'pending',   null,             'website_query',    null,                        'Seasonal business, revisit before season.'),
  ('a0000000-0000-4000-8000-00000000000a', 'Amber Lane Boutique',    'amberlane',      'Hauz Khas, New Delhi',   current_date - 60, 'contacted', null,             'manual',           now() - interval '55 days',  'Very old contact — stale, needs follow-up.');

-- Two leads with contacts + phones to exercise those tables.
insert into public.lead_contacts (id, lead_id, name, designation, email, is_primary, sort_order)
values
  ('c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000003', 'Riya Malhotra', 'Founder',           'riya@lumenskin.test', true,  0),
  ('c0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000003', 'Dev Sharma',    'Marketing Manager', 'dev@lumenskin.test',  false, 1),
  ('c0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000008', 'Karan Bose',    'Owner',             null,                  true,  0);

insert into public.lead_phones (lead_id, contact_id, phone_e164, label, is_primary, sort_order)
values
  ('a0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000001', '+919812345670', 'WhatsApp', true,  0),
  ('a0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000002', '+919812345671', 'Office',   false, 0),
  ('a0000000-0000-4000-8000-000000000003',  null,                                  '+911140001234', 'Office',   true,  0),
  ('a0000000-0000-4000-8000-000000000008', 'c0000000-0000-4000-8000-000000000003', '+919898989898', 'Personal', true,  0);

-- ── Website enquiries (what the public contact form writes) ──────────
-- One of each kind still unconverted, plus one already converted to the Lumen
-- lead, so /crm/enquiries has both states and the dashboard's unconverted
-- count is not simply "all of them".
insert into public.inbound_enquiries (id, kind, name, phone, email, best_time, message, user_agent, converted_lead_id, created_at)
values
  ('e0000000-0000-4000-8000-000000000001', 'callback', 'Ananya Rao',  '+919812345699', null,                    'Tomorrow afternoon', null,
   'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X)', null, now() - interval '2 hours'),
  ('e0000000-0000-4000-8000-000000000002', 'query',    'Farhan Q',    null,            'farhan@brandmail.test', null,
   'We run a cloud kitchen in Pune and want help with Reels + paid ads. What do your retainers look like?',
   'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', null, now() - interval '1 day'),
  -- Same phone as Riya Malhotra on the Lumen lead: a repeat enquiry from an
  -- existing lead, which is what conversion's duplicate check exists to catch.
  ('e0000000-0000-4000-8000-000000000003', 'callback', 'Riya Malhotra','+919812345670', null,                   'Weekday mornings', null,
   'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'a0000000-0000-4000-8000-000000000003', now() - interval '20 days');
