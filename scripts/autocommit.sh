#!/bin/sh
# Periodic checkpoint commits, run by launchd (see install-autocommit.sh).
# Commits carry only the user's git identity.

REPO="/Users/emredayangac/Documents/maze-fold"
cd "$REPO" || exit 1
[ -d .git ] || exit 0
# Don't interfere with an in-progress merge/rebase.
if [ -e .git/MERGE_HEAD ] || [ -d .git/rebase-merge ] || [ -d .git/rebase-apply ]; then
  exit 0
fi
git add -A
git diff --cached --quiet || git commit --no-gpg-sign -m "autosave: $(date '+%Y-%m-%d %H:%M')"
