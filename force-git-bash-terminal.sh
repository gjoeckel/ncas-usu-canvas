#!/usr/bin/env bash
set -euo pipefail

echo "🚀 FORCING Git Bash as default terminal (nuclear option)"

# Make Windows Terminal default and configure profile
bash "$(dirname "$0")/configure-windows-terminal.sh"

# Overwrite Cursor settings with Git Bash terminal defaults
bash "$(dirname "$0")/fix-git-bash-terminal.sh"

# Kill Cursor to ensure settings reload next start (ignore errors)
taskkill //IM Cursor.exe //F >/dev/null 2>&1 || true

echo "🎯 Done. Restart Cursor and open a new terminal (Ctrl+`)."


