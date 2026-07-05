#!/bin/sh
# Dev server + autocommit watcher in one: any dev session gets periodic
# checkpoint commits without relying on the launchd agent.
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
sh "$ROOT/scripts/autocommit-watch.sh" &
WATCHER=$!
trap 'kill "$WATCHER" 2>/dev/null' EXIT INT TERM
cd "$ROOT" && npx vite "$@"
