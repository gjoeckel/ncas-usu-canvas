#!/usr/bin/env bash
set -euo pipefail

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Testing terminal configuration...${NC}"

GIT_BASH_EXE_WIN="C:\\Users\\A00288946\\AppData\\Local\\Programs\\Git\\bin\\bash.exe"
echo -e "Expecting Git Bash at: $GIT_BASH_EXE_WIN"

if [ -x "$(cygpath -u "$GIT_BASH_EXE_WIN" 2>/dev/null || echo /nonexistent)" ]; then
  echo -e "${GREEN}✔ Git Bash found${NC}"
else
  echo -e "${RED}✖ Git Bash not found at expected path${NC}"
  exit 1
fi

echo -e "Running a simple Git Bash command..."
"$GIT_BASH_EXE_WIN" -lc 'echo OK && pwd' >/dev/null
echo -e "${GREEN}✔ Git Bash executes commands${NC}"

CURSOR_SETTINGS_WIN="$APPDATA\\Cursor\\User\\settings.json"
CURSOR_SETTINGS_PATH="$(cygpath -u "$CURSOR_SETTINGS_WIN" 2>/dev/null || echo "$CURSOR_SETTINGS_WIN")"
if [ -f "$CURSOR_SETTINGS_PATH" ]; then
  echo -e "${GREEN}✔ Cursor settings present${NC}"
else
  echo -e "${YELLOW}⚠ Cursor settings not found at: $CURSOR_SETTINGS_PATH${NC}"
fi

echo -e "${GREEN}All checks completed.${NC}"


