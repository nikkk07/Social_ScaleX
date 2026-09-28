-- ─────────────────────────────────────────────────────────────────────
-- 20260805090009 — Normalisation as a DATABASE guarantee
--
-- Two invariants lived only in TypeScript while database guarantees depended
-- on them. Both are closed here.
--
-- 1. INSTAGRAM HANDLE. leads_instagram_unique (090002) was a plain unique
--    index on the raw column, so it was CASE-SENSITIVE: 'CafeX' and 'cafex'
--    are two distinct keys and both save. The client lowercases and strips
--    '@'/URL prefixes, but neither RPC validates it and no CHECK enforced it,
--    so the dedupe guarantee held only for values entered through the form.
--    Bulk CSV import — the path most likely to carry handles pasted straight
--    out of a browser — would have walked through it.
--
--    Belt and braces: the index over lower() guarantees UNIQUENESS regardless
--    of case; the CHECK guarantees the value actually STORED is the normalised
--    one. Either alone leaves a gap — the index alone would happily store
--    'CafeX' (and every reader would then have to remember to lower() it);
--    the CHECK alone would not stop two rows differing only by case if the
--    index stayed raw.
--
-- 2. PHONE NUMBERS. lead_phones.phone_e164 had no CHECK; both RPCs pass the
--    value straight through and client zod was the only guard. This compounds:
--    phone-based duplicate detection is the ONLY protection against two people
--    adding the same brand under different handles (there is deliberately no
--    unique constraint on phone numbers, and that decision stands). A
--    malformed value — '98765 43210' instead of '+919876543210' — makes that
--    lookup silently miss, and nothing surfaces the failure.
--
-- PRE-FLIGHT: both constraints are validated against existing rows FIRST, in
-- a DO block that names the offending rows. Without it, a violation surfaces
-- as a bare "check constraint is violated by some row" with no row to look at.
-- ─────────────────────────────────────────────────────────────────────

-- ── Pre-flight scan: handles that would violate the new CHECK ─────────
do $$
declare
  v_n   int;
  v_bad text;
begin
  select count(*), string_agg(format('%s → %L', id, instagram_username), E'\n  ')
    into v_n, v_bad
  from public.leads
  where instagram_username is not null
    and (instagram_username <> lower(instagram_username)
         or instagram_username ~ '[@/[:space:]]'
         or instagram_username = '');

  if v_n > 0 then
    raise exception E'090009 pre-flight: % lead(s) hold a non-normalised instagram_username:\n  %\n'
      'Normalise them first, e.g.\n'
      '  update public.leads set instagram_username = nullif(lower(regexp_replace(\n'
      '    regexp_replace(instagram_username, ''^(https?://)?(www\.)?instagram\.com/'', '''', ''i''),\n'
      '    ''[@/[:space:]]'', '''', ''g'')), '''');', v_n, v_bad;
  end if;

  raise notice '090009 pre-flight: 0 non-normalised instagram_username values.';
end;
$$;

-- ── Pre-flight scan: handles that collide once compared case-insensitively ──
-- The rebuilt unique index would fail on these, and its error names only one
-- of the pair.
do $$
declare
  v_n   int;
  v_bad text;
begin
  select count(*), string_agg(g.handles, E'\n  ') into v_n, v_bad
  from (
    select string_agg(format('%s → %L', id, instagram_username), ', ') as handles
    from public.leads
    where deleted_at is null and instagram_username is not null
    group by lower(instagram_username)
    having count(*) > 1
  ) g;

  if v_n > 0 then
    raise exception E'090009 pre-flight: % handle group(s) collide case-insensitively:\n  %', v_n, v_bad;
  end if;

  raise notice '090009 pre-flight: 0 case-insensitive handle collisions.';
end;
$$;

-- ── Pre-flight scan: phones that would violate the new CHECK ─────────
do $$
declare
  v_n   int;
  v_bad text;
begin
  select count(*), string_agg(format('%s (lead %s) → %L', id, lead_id, phone_e164), E'\n  ')
    into v_n, v_bad
  from public.lead_phones
  where phone_e164 !~ '^\+[1-9]\d{6,14}$';

  if v_n > 0 then
    raise exception E'090009 pre-flight: % phone(s) are not E.164:\n  %\n'
      'These are exactly the rows duplicate detection has been silently '
      'missing. Fix them before re-running.', v_n, v_bad;
  end if;

  raise notice '090009 pre-flight: 0 non-E.164 phone numbers.';
end;
$$;

-- ── 1a. Rebuild the dedupe index case-insensitively ──────────────────
-- Same NAME as 090002's index on purpose: the client maps that name to the
-- friendly "A lead with that Instagram handle already exists." message.
drop index if exists public.leads_instagram_unique;
create unique index leads_instagram_unique
  on public.leads (lower(instagram_username))
  where deleted_at is null and instagram_username is not null;

-- ── 1b. …and require the stored value to BE the normalised form ──────
-- No '@', no '/' (so a pasted profile URL can never land here), no
-- whitespace, no uppercase, and not the empty string (both RPCs nullif('')
-- already — this stops anything that doesn't go through them).
alter table public.leads
  add constraint leads_instagram_normalised
  check (
    instagram_username is null
    or (
      instagram_username = lower(instagram_username)
      and instagram_username !~ '[@/[:space:]]'
      and instagram_username <> ''
    )
  );

comment on constraint leads_instagram_normalised on public.leads is
  'instagram_username must already be normalised: lowercase, no @, no /, no whitespace.';

-- ── 2. Phone numbers must be E.164 ───────────────────────────────────
-- '+' then a non-zero country digit then 6–14 more: the same regex the client
-- zod schema uses, now enforced where it actually counts.
alter table public.lead_phones
  add constraint lead_phones_e164
  check (phone_e164 ~ '^\+[1-9]\d{6,14}$');

comment on constraint lead_phones_e164 on public.lead_phones is
  'E.164 only. Duplicate detection matches on this column literally, so a '
  'malformed value would make the lookup silently miss.';
