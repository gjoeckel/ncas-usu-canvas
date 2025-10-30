#!/usr/bin/env bash
set -euo pipefail

BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}Forcing Git Bash as default terminal everywhere...${NC}"

GIT_BASH_EXE="C:\\Users\\A00288946\\AppData\\Local\\Programs\\Git\\bin\\bash.exe"

# Make Windows Terminal default
reg.exe ADD "HKCU\\Console" /v DelegationConsole /t REG_SZ /d "{61c54bbd-c2c6-5271-96e7-009a87ff44bf}" /f >/dev/null
reg.exe ADD "HKCU\\Console" /v DelegationTerminal /t REG_SZ /d "{61c54bbd-c2c6-5271-96e7-009a87ff44bf}" /f >/dev/null

# Configure Windows Terminal profile via shared script
bash "$(dirname "$0")/configure-windows-terminal.sh"

# Update Cursor settings via shared script
bash "$(dirname "$0")/fix-git-bash-terminal.sh"

# Create a simple launcher
LAUNCHER_WIN="${USERPROFILE}\\git-bash.bat"
LAUNCHER_PATH="$(cygpath -u "$LAUNCHER_WIN" 2>/dev/null || echo "$LAUNCHER_WIN")"
cat > "$LAUNCHER_PATH" <<BAT
@echo off
"$GIT_BASH_EXE" --login -i
BAT

echo -e "${GREEN}✔ Git Bash launcher created at: $LAUNCHER_PATH${NC}"
echo -e "${BLUE}Done. Restart Cursor and Windows Terminal to apply changes.${NC}"


