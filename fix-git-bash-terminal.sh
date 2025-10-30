#!/usr/bin/env bash
set -euo pipefail

BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}Fixing Git Bash as default for Cursor...${NC}"

GIT_BASH_EXE="C:\\Users\\A00288946\\AppData\\Local\\Programs\\Git\\bin\\bash.exe"

echo -e "${YELLOW}Setting Windows Terminal as default...${NC}"
reg.exe ADD "HKCU\\Console" /v DelegationConsole /t REG_SZ /d "{61c54bbd-c2c6-5271-96e7-009a87ff44bf}" /f >/dev/null
reg.exe ADD "HKCU\\Console" /v DelegationTerminal /t REG_SZ /d "{61c54bbd-c2c6-5271-96e7-009a87ff44bf}" /f >/dev/null
echo -e "${GREEN}✔ Windows Terminal set as default${NC}"

CURSOR_SETTINGS_WIN="$APPDATA\\Cursor\\User\\settings.json"
CURSOR_SETTINGS_PATH="$(cygpath -u "$CURSOR_SETTINGS_WIN" 2>/dev/null || echo "$CURSOR_SETTINGS_WIN")"

echo -e "${YELLOW}Updating Cursor settings...${NC}"
mkdir -p "$(dirname "$CURSOR_SETTINGS_PATH")"
cat > "$CURSOR_SETTINGS_PATH" <<JSON
{
  "terminal.integrated.defaultProfile.windows": "Git Bash",
  "terminal.integrated.shell.windows": "$GIT_BASH_EXE",
  "terminal.integrated.shellArgs.windows": ["--login"],
  "terminal.integrated.automationShell.windows": "$GIT_BASH_EXE",
  "terminal.integrated.automationShellArgs.windows": ["--login"],
  "terminal.external.windowsExec": "$GIT_BASH_EXE",
  "terminal.integrated.profiles.windows": {
    "Git Bash": {
      "path": "$GIT_BASH_EXE",
      "args": ["--login"],
      "icon": "terminal-bash"
    }
  }
}
JSON
echo -e "${GREEN}✔ Cursor settings updated${NC}"

echo -e "${YELLOW}Setting environment variables...${NC}"
setx SHELL "$GIT_BASH_EXE" >/dev/null
setx TERM "xterm-256color" >/dev/null
echo -e "${GREEN}✔ Environment variables set${NC}"

echo -e "${BLUE}Done. Restart Cursor to apply changes.${NC}"


