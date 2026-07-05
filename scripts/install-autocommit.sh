#!/bin/sh
# Install the periodic autocommit LaunchAgent (commits every 10 minutes if dirty).
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"
LABEL="com.emredayangac.mazefold-autocommit"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"

chmod +x "$DIR/autocommit.sh"
# The script must live outside ~/Documents: launchd may not execute files in
# TCC-protected folders. Copy it to Application Support (plist points there).
mkdir -p "$HOME/Library/Application Support/mazefold"
cp "$DIR/autocommit.sh" "$HOME/Library/Application Support/mazefold/autocommit.sh"
mkdir -p "$HOME/Library/LaunchAgents"
cp "$DIR/$LABEL.plist" "$PLIST"
# Reload if already installed.
launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$PLIST"
echo "Installed. Runs every 10 min; log: /tmp/mazefold-autocommit.log"
echo "Force a commit now:  launchctl kickstart gui/$(id -u)/$LABEL"
echo "If macOS asks, approve under System Settings > General > Login Items."
