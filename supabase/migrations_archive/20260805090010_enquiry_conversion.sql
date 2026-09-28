-- ─────────────────────────────────────────────────────────────────────
-- 20260805090010 — Convert an enquiry to a lead, atomically (+ dashboard indexes)
--
-- Converting an inbound enquiry is two writes: create the lead, then stamp
-- inbound_enquiries.converted_lead_id. Done from the client that is two round
-- trips, and the failure mode of the second one is the bad one — the lead
-- exists, the enquiry still looks unconverted, and the next person converts it
-- again. Fold the stamp INTO the existing RPC so both land in one transaction
-- or neither does.
--
-- No signature change: the enquiry id rides in the jsonb payload as
-- 'enquiry_id'. Callers that don't set it are completely unaffected.
--
-- Still SECURITY INVOKER, so the update on inbound_enquiries is subject to
-- inbound_staff_manage (is_staff()) exactly like a direct write would be — no
-- new privilege is created by routing through this function.
--
-- Double-conversion is an ERROR, not a silent overwrite: the guard is
-- `where converted_lead_id is null`, and a zero-row update aborts the whole
-- transaction (so the lead is rolled back too). Losing a duplicate lead and
-- being told why beats two leads for one enquiry.
-- ─────────────────────────────────────────────────────────────────────

create or replace function public.create_lead_with_contacts(payload jsonb)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_lead_id    uuid;
  v_contact    jsonb;
  v_phone      jsonb;
  v_contact_id uuid;
  v_enquiry_id uuid;
begin
  insert into public.leads (
    brand_name, instagram_username, address, lead_found_on,
    status, outcome, source, notes, owner_id, created_by
  )
  values (
    payload->>'brand_name',
    nullif(payload->>'instagram_username', ''),
    nullif(payload->>'address', ''),
    coalesce((payload->>'lead_found_on')::date, current_date),
    coalesce((payload->>'status')::public.lead_status, 'pending'),
    (payload->>'outcome')::public.lead_outcome,
    coalesce((payload->>'source')::public.lead_source, 'manual'),
    nullif(payload->>'notes', ''),
    coalesce((payload->>'owner_id')::uuid, auth.uid()),
    auth.uid()
  )
  returning id into v_lead_id;

  -- Contacts, each with nested phones.
  for v_contact in
    select value from jsonb_array_elements(coalesce(payload->'contacts', '[]'::jsonb))
  loop
    insert into public.lead_contacts (lead_id, name, designation, email, is_primary, sort_order)
    values (
      v_lead_id,
      v_contact->>'name',
      nullif(v_contact->>'designation', ''),
      nullif(v_contact->>'email', ''),
      coalesce((v_contact->>'is_primary')::boolean, false),
      coalesce((v_contact->>'sort_order')::int, 0)
    )
    returning id into v_contact_id;

    for v_phone in
      select value from jsonb_array_elements(coalesce(v_contact->'phones', '[]'::jsonb))
    loop
      insert into public.lead_phones (lead_id, contact_id, phone_e164, label, is_primary, sort_order)
      values (
        v_lead_id, v_contact_id,
        v_phone->>'phone_e164',
        nullif(v_phone->>'label', ''),
        coalesce((v_phone->>'is_primary')::boolean, false),
        coalesce((v_phone->>'sort_order')::int, 0)
      );
    end loop;
  end loop;

  -- Lead-level phones (office lines not tied to a person).
  for v_phone in
    select value from jsonb_array_elements(coalesce(payload->'lead_phones', '[]'::jsonb))
  loop
    insert into public.lead_phones (lead_id, contact_id, phone_e164, label, is_primary, sort_order)
    values (
      v_lead_id, null,
      v_phone->>'phone_e164',
      nullif(v_phone->>'label', ''),
      coalesce((v_phone->>'is_primary')::boolean, false),
      coalesce((v_phone->>'sort_order')::int, 0)
    );
  end loop;

  -- ── Enquiry conversion (optional) ──────────────────────────────────
  v_enquiry_id := nullif(payload->>'enquiry_id', '')::uuid;
  if v_enquiry_id is not null then
    update public.inbound_enquiries
       set converted_lead_id = v_lead_id
     where id = v_enquiry_id
       and converted_lead_id is null;

    -- Zero rows means: no such enquiry, it is not visible to this caller, or
    -- somebody converted it first. Any of those makes the lead we just built
    -- wrong, so roll the whole thing back and say so.
    if not found then
      raise exception 'enquiry_already_converted: enquiry % is missing or already converted', v_enquiry_id
        using errcode = '23505';
    end if;
  end if;

  return v_lead_id;
end;
$$;

grant execute on function public.create_lead_with_contacts(jsonb) to authenticated;

-- ── Indexes for the /crm dashboard ───────────────────────────────────
-- "Needs follow-up": contacted, no outcome yet, contacted_at older than 7
-- days. The partial predicate matches the query exactly, so the index holds
-- only the rows that can ever be in the answer.
create index leads_followup_idx
  on public.leads (contacted_at)
  where deleted_at is null and status = 'contacted' and outcome is null;

-- "Added in the last 7 days" tile + created_at sorting.
create index leads_created_at_idx
  on public.leads (created_at desc)
  where deleted_at is null;

-- Unconverted-enquiry count + the default /crm/enquiries view.
create index inbound_enquiries_unconverted_idx
  on public.inbound_enquiries (created_at desc)
  where converted_lead_id is null;
