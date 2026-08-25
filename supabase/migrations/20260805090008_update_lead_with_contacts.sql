-- ─────────────────────────────────────────────────────────────────────
-- 20260805090008 — update_lead_with_contacts(p_lead_id uuid, payload jsonb)
--
-- Replace-children edit for a lead's contacts + phones, in ONE transaction
-- (delete the existing set, insert the new set) so a half-applied edit is
-- impossible. Mirrors create_lead_with_contacts.
--
-- SECURITY DEFINER — and therein the single most important line: DEFINER
-- BYPASSES RLS, so we MUST re-check the caller's staff status explicitly with
-- is_staff(). Without that recheck this function is a hole straight through the
-- Phase 2 policy layer. auth.uid() is request-scoped (not changed by the
-- definer role switch), so is_staff() still evaluates the *caller*.
-- ─────────────────────────────────────────────────────────────────────

create or replace function public.update_lead_with_contacts(
  p_lead_id uuid,
  payload   jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_contact    jsonb;
  v_phone      jsonb;
  v_contact_id uuid;
begin
  -- AUTHORISATION: definer bypasses RLS, so verify the caller is staff.
  if not public.is_staff() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  -- The lead must exist and be live (a member archiving is a separate path).
  if not exists (
    select 1 from public.leads where id = p_lead_id and deleted_at is null
  ) then
    raise exception 'Lead not found or archived';
  end if;

  -- Replace children. Delete phones first (office lines have contact_id null
  -- and would NOT cascade from contacts), then contacts.
  delete from public.lead_phones    where lead_id = p_lead_id;
  delete from public.lead_contacts  where lead_id = p_lead_id;

  -- Re-insert contacts with nested phones. Single-primary is honoured by
  -- inserting the already-demoted set (partial unique indexes backstop it).
  for v_contact in
    select value from jsonb_array_elements(coalesce(payload->'contacts', '[]'::jsonb))
  loop
    insert into public.lead_contacts (lead_id, name, designation, email, is_primary, sort_order)
    values (
      p_lead_id,
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
        p_lead_id, v_contact_id,
        v_phone->>'phone_e164',
        nullif(v_phone->>'label', ''),
        coalesce((v_phone->>'is_primary')::boolean, false),
        coalesce((v_phone->>'sort_order')::int, 0)
      );
    end loop;
  end loop;

  -- Lead-level (office) phones.
  for v_phone in
    select value from jsonb_array_elements(coalesce(payload->'lead_phones', '[]'::jsonb))
  loop
    insert into public.lead_phones (lead_id, contact_id, phone_e164, label, is_primary, sort_order)
    values (
      p_lead_id, null,
      v_phone->>'phone_e164',
      nullif(v_phone->>'label', ''),
      coalesce((v_phone->>'is_primary')::boolean, false),
      coalesce((v_phone->>'sort_order')::int, 0)
    );
  end loop;

  -- Timeline entry so the edit is visible (Phase 2 triggers only log the
  -- lead row itself, not its children).
  insert into public.lead_activities (lead_id, actor_id, kind, detail)
  values (
    p_lead_id, auth.uid(), 'edited',
    jsonb_build_object(
      'contacts', jsonb_array_length(coalesce(payload->'contacts', '[]'::jsonb)),
      'office_phones', jsonb_array_length(coalesce(payload->'lead_phones', '[]'::jsonb))
    )
  );
end;
$$;

revoke all on function public.update_lead_with_contacts(uuid, jsonb) from public;
grant execute on function public.update_lead_with_contacts(uuid, jsonb) to authenticated;
