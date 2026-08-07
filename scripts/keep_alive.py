#!/usr/bin/env python3
"""
Keep the Supabase project awake.

WHAT ACTUALLY PAUSES
--------------------
Supabase pauses a free-tier project after roughly 7 days of insufficient
DATABASE activity, and the free plan carries no backup retention — so a paused
project is restored by hand and anything not in migrations/seed is gone.

Vercel does not sleep, and there is no Render service in this stack today, so
neither needs a heartbeat. HTTP traffic to the marketing site does NOT count
either: the site is static files off Vercel's CDN and never touches Postgres.
A real database operation is required, which is exactly what this does.

WHY THE RPC AND NOT A TABLE WRITE
---------------------------------
This runs with the ANON key. Since migration 090006 anon holds no grant on
public.keepalive at all — it can neither insert nor delete there. The heartbeat
goes through public.ping_keepalive(), a SECURITY DEFINER function whose EXECUTE
is granted to anon and nobody else. It inserts one row and prunes to the ~100
newest (090007), so the table is volume-bounded no matter how often this runs.

An INSERT straight at the table would fail with a permission error, and that is
by design — do not "fix" it by granting anon table rights.

USAGE
-----
    SUPABASE_URL=https://xxxx.supabase.co \\
    SUPABASE_ANON_KEY=eyJhbGci... \\
    python3 scripts/keep_alive.py

Optional: set RENDER_URL to also ping a Render service (free tier spins down
after 15 minutes of inactivity, with a 30-60 second cold start). Absent, that
step is skipped entirely. Nothing here is ever hard-coded; a missing required
variable is a hard failure, not a default.

Exits 0 only if the database heartbeat succeeded, so a scheduler surfaces a
failure instead of silently reporting green.
"""

from __future__ import annotations

import os
import sys
import time
from typing import Final

import requests

# Retry schedule: 5 attempts, sleeping 2s, 4s, 8s, 16s between them. Enough to
# ride out a redeploy or a brief network blip without hammering the endpoint,
# and short enough that a scheduled job doesn't hang for minutes.
MAX_ATTEMPTS: Final = 5
BASE_BACKOFF_SECONDS: Final = 2
REQUEST_TIMEOUT_SECONDS: Final = 30


def log(message: str) -> None:
    """Unbuffered, so lines appear in CI logs in real order."""
    print(message, flush=True)


def require_env(name: str) -> str:
    value = os.environ.get(name, "").strip()
    if not value:
        log(
            f"ERROR: {name} is not set. Provide it as an environment variable "
            f"(GitHub repository secret, or your shell for a local run). "
            f"It is never hard-coded in this repo."
        )
        raise SystemExit(2)
    return value


def post_with_backoff(url: str, headers: dict[str, str], label: str) -> bool:
    """POST with exponential backoff. True once a 2xx comes back."""
    for attempt in range(1, MAX_ATTEMPTS + 1):
        try:
            response = requests.post(
                url, headers=headers, json={}, timeout=REQUEST_TIMEOUT_SECONDS
            )
            if response.ok:
                log(f"{label}: OK (HTTP {response.status_code}) on attempt {attempt}")
                return True

            # 4xx other than 429 is a configuration problem — a wrong key, a
            # missing function, a revoked grant. Retrying cannot fix it and
            # only delays the failure the scheduler needs to see.
            if 400 <= response.status_code < 500 and response.status_code != 429:
                log(
                    f"{label}: HTTP {response.status_code} — not retrying, this is a "
                    f"configuration error, not a transient one. Body: "
                    f"{response.text[:400]}"
                )
                return False

            log(f"{label}: HTTP {response.status_code} on attempt {attempt}. Body: {response.text[:200]}")
        except requests.RequestException as exc:
            log(f"{label}: request failed on attempt {attempt}: {exc}")

        if attempt < MAX_ATTEMPTS:
            delay = BASE_BACKOFF_SECONDS * (2 ** (attempt - 1))
            log(f"{label}: retrying in {delay}s…")
            time.sleep(delay)

    log(f"{label}: giving up after {MAX_ATTEMPTS} attempts.")
    return False


def ping_database(base_url: str, anon_key: str) -> bool:
    """Call public.ping_keepalive() over PostgREST."""
    url = f"{base_url.rstrip('/')}/rest/v1/rpc/ping_keepalive"
    headers = {
        "apikey": anon_key,
        "Authorization": f"Bearer {anon_key}",
        "Content-Type": "application/json",
        # The function returns void; asking for no body back keeps this cheap.
        "Prefer": "return=minimal",
    }
    return post_with_backoff(url, headers, "supabase ping_keepalive()")


def ping_render(render_url: str) -> bool:
    """Optional warm-up GET for a Render service, if one ever exists."""
    for attempt in range(1, MAX_ATTEMPTS + 1):
        try:
            # Long timeout on purpose: a cold Render free instance takes 30-60s
            # to answer, and that slow response IS the success case.
            response = requests.get(render_url, timeout=90)
            log(f"render: HTTP {response.status_code} on attempt {attempt}")
            if response.ok:
                return True
        except requests.RequestException as exc:
            log(f"render: request failed on attempt {attempt}: {exc}")

        if attempt < MAX_ATTEMPTS:
            delay = BASE_BACKOFF_SECONDS * (2 ** (attempt - 1))
            log(f"render: retrying in {delay}s…")
            time.sleep(delay)
    return False


def main() -> int:
    supabase_url = require_env("SUPABASE_URL")
    anon_key = require_env("SUPABASE_ANON_KEY")

    log(f"Pinging {supabase_url.rstrip('/')}/rest/v1/rpc/ping_keepalive")
    database_ok = ping_database(supabase_url, anon_key)

    render_url = os.environ.get("RENDER_URL", "").strip()
    if render_url:
        log(f"RENDER_URL set — also warming {render_url}")
        if not ping_render(render_url):
            # Deliberately NOT fatal. Render is optional and does not exist in
            # this stack today; a failure there must not mask, or be mistaken
            # for, the database heartbeat that actually prevents a pause.
            log("render: warm-up failed (non-fatal — the database heartbeat is what matters)")
    else:
        log("RENDER_URL not set — skipping (no Render service in this stack).")

    if not database_ok:
        log("FAILED: the database heartbeat did not succeed. Supabase may pause.")
        return 1

    log("Done: database heartbeat recorded.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
