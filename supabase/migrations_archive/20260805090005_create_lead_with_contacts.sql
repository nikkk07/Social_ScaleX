-- ─────────────────────────────────────────────────────────────────────
-- 20260805090005 — create_lead_with_contacts(payload jsonb)
--
-- One transaction for a lead + its contacts + their phones, so a partial
-- failure never orphans rows. SECURITY INVOKER: RLS still applies, so only
-- a staff user (profile present) can call it successfully. Returns the new
-- lead id. Called from the client via supabase.rpc('create_lead_with_contacts').
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

  return v_lead_id;
end;
$$;

grant execute on function public.create_lead_with_contacts(jsonb) to authenticated;
