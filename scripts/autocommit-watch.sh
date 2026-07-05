#!/bin/sh
# Foreground watcher: checkpoint-commit every 10 minutes.
# Runs from a user terminal session (which has ~/Documents access),
# so it works even when the launchd agent is blocked by macOS TCC.
DIR="$(cd "$(dirname "$0")" && pwd)"
while :; do
  sleep 600
  sh "$DIR/autocommit.sh"
done
