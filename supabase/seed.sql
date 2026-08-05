-- ─────────────────────────────────────────────────────────────────────
-- seed.sql — development dummy data. FAKE brands only; no real client data
-- ever belongs in a seed file that lives in a (potentially public) repo.
-- Safe to run repeatedly after a reset. owner_id / created_by are left NULL
-- (no auth user needed for local dev).
-- ─────────────────────────────────────────────────────────────────────

insert into public.leads (id, brand_name, instagram_username, address, lead_found_on, status, outcome, source, notes)
values
  ('a0000000-0000-4000-8000-000000000001', 'Nimbus Coffee Roasters', 'nimbuscoffee',   'Indiranagar, Bengaluru', current_date - 3,  'pending',   null,             'manual',           'Saw their Reels — decent volume, weak captions.'),
  ('a0000000-0000-4000-8000-000000000002', 'Peak & Pine Outdoors',   'peakandpine',    'Rishikesh, Uttarakhand', current_date - 12, 'contacted', null,             'manual',           'DM sent, awaiting reply. Follow up soon.'),
  ('a0000000-0000-4000-8000-000000000003', 'Lumen Skincare Co',      'lumenskin',      'Bandra, Mumbai',         current_date - 20, 'contacted', 'interested',     'website_callback', 'Wants a strategy call next week.'),
  ('a0000000-0000-4000-8000-000000000004', 'Bytebloom Studios',      'bytebloom',      'Koramangala, Bengaluru', current_date - 30, 'contacted', 'not_interested', 'website_query',    'Handles social in-house for now.'),
  ('a0000000-0000-4000-8000-000000000005', 'Harbor & Co Interiors',  'harborandco',    'Kalkaji, New Delhi',     current_date - 1,  'pending',   null,             'manual',           null),
  ('a0000000-0000-4000-8000-000000000006', 'Saffron Street Kitchen', 'saffronstreet',  'Sector 29, Gurugram',    current_date - 45, 'contacted', null,             'manual',           'Contacted 45 days ago, went cold — needs follow-up.'),
  ('a0000000-0000-4000-8000-000000000007', 'Vellum Stationery',      'vellumpaper',    'Jaipur, Rajasthan',      current_date - 7,  'pending',   null,             'import',           null),
  ('a0000000-0000-4000-8000-000000000008', 'Nova Fitness Collective','novafitness',    'Powai, Mumbai',          current_date - 5,  'contacted', 'interested',     'manual',           'Owner keen on Reels + ads bundle.'),
  ('a0000000-0000-4000-8000-000000000009', 'Tidewater Surf School',  'tidewatersurf',  'Varkala, Kerala',        current_date - 15, 'pending',   null,             'website_query',    'Seasonal business, revisit before season.'),
  ('a0000000-0000-4000-8000-00000000000a', 'Amber Lane Boutique',    'amberlane',      'Hauz Khas, New Delhi',   current_date - 60, 'contacted', null,             'manual',           'Very old contact — stale, needs follow-up.');

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
