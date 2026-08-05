#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────
# Proves the migrations against a throwaway local Postgres cluster: applies
# the compat harness + all migrations + seed, then runs the 8 checks.
# Requires local `initdb`/`pg_ctl`/`psql` (no Docker/Supabase CLI needed).
# Nothing here touches the real Supabase project.
# ─────────────────────────────────────────────────────────────────────
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
TMP="$(mktemp -d)"
export PGDATA="$TMP/data" PGTZ=UTC
SOCK="$TMP/sock"; mkdir -p "$SOCK"
PORT=54329

cleanup() { pg_ctl stop -m immediate >/dev/null 2>&1 || true; rm -rf "$TMP"; }
trap cleanup EXIT

initdb -A trust -U postgres >/dev/null
pg_ctl -o "-p $PORT -k $SOCK -c listen_addresses=''" -l "$TMP/pg.log" -w start >/dev/null
PSQL=(psql -v ON_ERROR_STOP=1 -q -h "$SOCK" -p "$PORT" -U postgres -d crmtest)
createdb -h "$SOCK" -p "$PORT" -U postgres crmtest

"${PSQL[@]}" -f "$ROOT/supabase/test/00_compat.sql"
for f in "$ROOT"/supabase/migrations/*.sql; do
  echo "-- applying $(basename "$f")"
  "${PSQL[@]}" -f "$f"
done
"${PSQL[@]}" -f "$ROOT/supabase/seed.sql"
echo "-- migrations + seed applied cleanly --"
echo

# Verification runs with ON_ERROR_STOP OFF so blocked ops print + continue.
psql -v ON_ERROR_STOP=0 -h "$SOCK" -p "$PORT" -U postgres -d crmtest \
  -f "$ROOT/supabase/test/run_verification.sql"
