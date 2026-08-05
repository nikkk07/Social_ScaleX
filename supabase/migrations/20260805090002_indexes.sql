-- ─────────────────────────────────────────────────────────────────────
-- 20260805090002 — Indexes (incl. dedupe guard and fuzzy search)
-- ─────────────────────────────────────────────────────────────────────

-- Dedupe guard: one active lead per Instagram handle.
create unique index leads_instagram_unique
  on public.leads (instagram_username)
  where deleted_at is null and instagram_username is not null;

create index leads_status_idx         on public.leads (status, outcome) where deleted_at is null;
create index leads_found_on_idx       on public.leads (lead_found_on desc) where deleted_at is null;
create index leads_owner_idx          on public.leads (owner_id) where deleted_at is null;
create index lead_contacts_lead_idx   on public.lead_contacts (lead_id);
create index lead_phones_lead_idx     on public.lead_phones (lead_id);
create index lead_phones_e164_idx     on public.lead_phones (phone_e164);
create index lead_activities_lead_idx on public.lead_activities (lead_id, created_at desc);
create index inbound_enquiries_created_idx on public.inbound_enquiries (created_at desc);

-- ── Single-primary invariants (partial unique indexes, not triggers) ──
-- At most one primary contact per lead.
create unique index lead_contacts_one_primary
  on public.lead_contacts (lead_id) where is_primary;
-- At most one primary phone per contact.
create unique index lead_phones_one_primary_per_contact
  on public.lead_phones (contact_id) where is_primary and contact_id is not null;
-- At most one primary lead-level (office) phone per lead.
create unique index lead_phones_one_primary_lead_level
  on public.lead_phones (lead_id) where is_primary and contact_id is null;

-- ── Fuzzy search across brand name + handle ──────────────────────────
create extension if not exists pg_trgm;
create index leads_brand_trgm_idx on public.leads using gin (brand_name gin_trgm_ops);
create index leads_ig_trgm_idx    on public.leads using gin (instagram_username gin_trgm_ops);
