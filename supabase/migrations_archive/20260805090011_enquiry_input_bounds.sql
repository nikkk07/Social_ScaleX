-- ─────────────────────────────────────────────────────────────────────
-- 20260805090011 — Bound what an anonymous visitor can write
--
-- inbound_enquiries is the ONLY table anon can insert into (090004), and the
-- anon key is public by design — it ships in the JS bundle.
--
-- WHAT ALREADY EXISTED: the inbound_insert_anon policy's WITH CHECK (090004)
-- guards three things — non-empty name, message <= 5000, kind in the pair.
-- This migration does NOT claim credit for those.
--
-- WHAT WAS STILL UNBOUNDED, and is closed here:
--   - user_agent. Fully attacker-controlled, and the one field with no cap at
--     all — message was capped, the header next to it was not. One POST could
--     carry a megabyte there.
--   - name / phone / email / best_time. Non-empty was checked; LENGTH never
--     was, so a 1 MB name walked straight through the policy.
--   - A row with neither phone nor email: accepted, and unreachable — useless
--     to us, free filler to an abuser.
-- Same storage-exhaustion class 090007 closed for keepalive, still open on the
-- one table strangers can write to.
--
-- THE OVERLAP IS DELIBERATE. Re-stating non-empty-name and message length as a
-- CHECK is belt-and-braces in the idiom of 090009: a policy applies only to the
-- role it names, so inbound_insert_anon protects nothing on an authenticated
-- path, a future service-side writer, or a psql session. A CHECK binds every
-- writer. The policy stays as the first line; this is the floor under it.
--
-- 090007's fix was a volume bound; that does not translate here, because
-- pruning old enquiries would delete real leads. What DOES translate is a SIZE
-- bound per row, so no single submission can be arbitrarily large.
--
-- What this deliberately does NOT do:
--   - RATE limiting. Postgres CHECKs can't express "N per hour per visitor",
--     and there is no edge function in this stack. The honeypot + client-side
--     throttle in Contact.tsx are the rate guard, and they are bypassable by
--     anyone driving the REST endpoint directly. That is a known, accepted gap
--     — documented in docs/DEPLOYMENT.md — not an oversight. The row cap here
--     is what makes the gap survivable: an attacker can still make many rows,
--     but each one is small and bounded.
--   - Widen anon's grants in any way. anon still has INSERT and nothing else.
--
-- Caps are generous versus the real form (zod: name 2+, best_time <= 80,
-- message 10+) so a legitimate visitor can never hit one.
-- ─────────────────────────────────────────────────────────────────────

-- ── Pre-flight: name any existing row the new CHECKs would reject ─────
do $$
declare
  v_n   int;
  v_bad text;
begin
  select count(*), string_agg(format('%s (kind %s, name %L)', id, kind, name), E'\n  ')
    into v_n, v_bad
  from public.inbound_enquiries
  where length(trim(name)) = 0
     or length(name) > 120
     or length(coalesce(phone, '')) > 32
     or length(coalesce(email, '')) > 200
     or length(coalesce(best_time, '')) > 80
     or length(coalesce(message, '')) > 5000
     or length(coalesce(user_agent, '')) > 400;

  if v_n > 0 then
    raise exception E'090011 pre-flight: % enquiry row(s) exceed the new bounds:\n  %', v_n, v_bad;
  end if;

  raise notice '090011 pre-flight: 0 out-of-bounds enquiry rows.';
end;
$$;

alter table public.inbound_enquiries
  add constraint inbound_enquiries_bounds
  check (
    length(trim(name)) > 0
    and length(name) <= 120
    and length(coalesce(phone, '')) <= 32
    and length(coalesce(email, '')) <= 200
    and length(coalesce(best_time, '')) <= 80
    and length(coalesce(message, '')) <= 5000
    and length(coalesce(user_agent, '')) <= 400
  );

comment on constraint inbound_enquiries_bounds on public.inbound_enquiries is
  'Caps the size of a row an anonymous visitor can write. The anon key is '
  'public, so this table is writable by anyone; without a bound one POST could '
  'carry an arbitrarily large body. Rate limiting is NOT enforced here — see '
  'the migration header and docs/DEPLOYMENT.md.';

-- A visitor with no contact detail at all is unreachable, so the row is
-- useless to us and pure filler to an abuser. Require at least one route back.
alter table public.inbound_enquiries
  add constraint inbound_enquiries_contactable
  check (phone is not null or email is not null);

comment on constraint inbound_enquiries_contactable on public.inbound_enquiries is
  'Every enquiry must carry at least one way to reply — callback gives phone, '
  'query gives email. A row with neither cannot be actioned.';
