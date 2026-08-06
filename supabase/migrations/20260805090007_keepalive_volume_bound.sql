-- ─────────────────────────────────────────────────────────────────────
-- 20260805090007 — keepalive: volume bound instead of time bound
--
-- 090006 moved anon off the table and behind ping_keepalive(), which fixed
-- arbitrary writes and heartbeat deletion — but its prune was TIME-based
-- (older than 14 days), so it never bounded table SIZE. anon can call the RPC
-- as fast as it likes and every row survives 14 days; at ~50 bytes/row that is
-- ~10M rows to fill the 500MB free tier, and the anon key is public by design
-- (it ships in the JS bundle). The storage vector survived the table→RPC move.
--
-- Replace the prune with a VOLUME bound: keep only the ~100 most recent rows.
-- Now the table can never grow without limit regardless of call rate, while
-- still retaining recent history for debugging.
-- ─────────────────────────────────────────────────────────────────────

create or replace function public.ping_keepalive()
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.keepalive (source) values ('ping_keepalive');
  -- Volume bound: after inserting, delete everything but the ~100 newest rows
  -- (id is a monotonic bigserial). Bounded forever, independent of call rate.
  delete from public.keepalive
  where id < (select max(id) - 100 from public.keepalive);
$$;

-- create-or-replace preserves the existing ACL, but re-assert it so this
-- migration is self-contained: EXECUTE for anon only, never PUBLIC.
revoke all on function public.ping_keepalive() from public;
grant execute on function public.ping_keepalive() to anon;
