#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────
# Stop hook — a turn must not end with commits that exist only locally.
#
# "Committed" is not "done": a phase is incomplete until `git push` output
# shows the remote ref moving. This existed as a remembered habit, held for
# phases 4b/5/6, and was then dropped at phase 7. Habits regress; a hook does
# not. Blocks the turn and hands the reason back so the push actually happens.
#
# Fails OPEN everywhere it cannot be certain (not a repo, no remote, detached
# HEAD, git missing): a hook that wrongly blocks is worse than one that misses.
# ─────────────────────────────────────────────────────────────────────
set -uo pipefail

input="$(cat)"
jqr() { printf '%s' "$input" | jq -r "$1" 2>/dev/null; }

# Claude Code sets stop_hook_active when the model is already continuing
# BECAUSE of this hook. Blocking again would loop forever.
[ "$(jqr '.stop_hook_active // false')" = "true" ] && exit 0

cd "$(jqr '.cwd // "."')" 2>/dev/null || exit 0
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || exit 0
[ -n "$(git remote 2>/dev/null)" ] || exit 0   # local-only repo: nothing to push to

branch="$(git rev-parse --abbrev-ref HEAD 2>/dev/null)" || exit 0
[ "$branch" = "HEAD" ] && exit 0               # detached: no branch to push

block() {
  jq -n --arg r "$1" '{decision: "block", reason: $r}'
  exit 0
}

if upstream="$(git rev-parse --abbrev-ref --symbolic-full-name '@{u}' 2>/dev/null)"; then
  unpushed="$(git log --oneline "$upstream..HEAD" 2>/dev/null)"
  [ -z "$unpushed" ] && exit 0
  n="$(printf '%s\n' "$unpushed" | grep -c .)"
  block "$n local commit(s) are not on $upstream:

$unpushed

Run \`git push\` and paste its output before ending the turn. A phase is not
done until that output shows the remote ref moving — \"committed\" is not
\"done\". If this work is deliberately staying local, say so explicitly to the
user rather than ending silently."
else
  # No upstream. Only complain once the branch actually holds commits that are
  # on no remote, so a freshly-created branch doesn't nag straight away.
  #
  # HEAD is named explicitly: `--not --remotes` already fills git's revision
  # slot, so without it git never falls back to HEAD and prints nothing —
  # which silently turned this whole branch into a no-op.
  [ -z "$(git log --oneline HEAD --not --remotes 2>/dev/null | head -1)" ] && exit 0
  block "Branch '$branch' has no upstream, and has commits that exist on no remote.

Run \`git push -u origin $branch\` and paste its output before ending the turn.
A phase is not done until the remote ref moves."
fi
