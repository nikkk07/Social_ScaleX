#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────
# Runs the pure-function unit checks. No test runner is wired in this
# project: esbuild bundles each file, node executes it, and each file
# exits non-zero if any check failed.
#
# Dummy Supabase env is injected so importing a module whose import chain
# reaches src/lib/supabase.ts doesn't throw at load. Since the Next.js
# migration those are process.env.NEXT_PUBLIC_* rather than import.meta.env.
#
# Add a new suite by listing its path in SUITES.
# ─────────────────────────────────────────────────────────────────────
set -uo pipefail
cd "$(dirname "$0")/.."

SUITES=(
  src/crm/leads/leadsQuery.test.ts
  src/components/sections/enquiry.test.ts
)

OUT=node_modules/.cache/ssx-tests
mkdir -p "$OUT"
failed=0

for suite in "${SUITES[@]}"; do
  name="$(basename "$suite" .test.ts)"
  echo "── $suite"
  npx esbuild "$suite" \
    --bundle --format=esm --platform=node \
    --alias:@=./src \
    --define:process.env.NEXT_PUBLIC_SUPABASE_URL='"https://x.supabase.co"' \
    --define:process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY='"anon"' \
    --outfile="$OUT/$name.mjs" --log-level=error || { failed=1; continue; }
  node "$OUT/$name.mjs" || failed=1
  echo
done

if [ "$failed" -ne 0 ]; then
  echo "UNIT SUITES FAILED"
  exit 1
fi
echo "ALL UNIT SUITES PASS"
