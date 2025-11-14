#!/usr/bin/env bash
set -euo pipefail

BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}Configuring Windows Terminal for Git Bash...${NC}"

# Resolve paths
GIT_BASH_EXE="${LOCALAPPDATA%\\*}\\Local\\Programs\\Git\\bin\\bash.exe"
WT_SETTINGS_WIN="${LOCALAPPDATA}\\Packages\\Microsoft.WindowsTerminal_8wekyb3d8bbwe\\LocalState\\settings.json"
WT_SETTINGS="$(cygpath -u "$WT_SETTINGS_WIN" 2>/dev/null || echo "$WT_SETTINGS_WIN")"

# 1) Make Windows Terminal the default terminal
echo -e "${YELLOW}Setting Windows Terminal as default terminal app...${NC}"
reg.exe ADD "HKCU\\Console" /v DelegationConsole /t REG_SZ /d "{61c54bbd-c2c6-5271-96e7-009a87ff44bf}" /f >/dev/null
reg.exe ADD "HKCU\\Console" /v DelegationTerminal /t REG_SZ /d "{61c54bbd-c2c6-5271-96e7-009a87ff44bf}" /f >/dev/null
echo -e "${GREEN}✔ Windows Terminal set as default${NC}"

# 2) Update Windows Terminal settings to default to Git Bash profile
echo -e "${YELLOW}Updating Windows Terminal settings...${NC}"
if [ -f "$WT_SETTINGS" ]; then
  cp "$WT_SETTINGS" "${WT_SETTINGS}.backup.$(date +%Y%m%d-%H%M%S)" || true
fi

cat > "$WT_SETTINGS" <<'JSON'
{
  "$schema": "https://aka.ms/terminal-profiles-schema",
  "defaultProfile": "{61c54bbd-c2c6-5271-96e7-009a87ff44bf}",
  "profiles": {
    "list": [
      {
        "guid": "{61c54bbd-c2c6-5271-96e7-009a87ff44bf}",
        "name": "Git Bash",
        "commandline": "C:\\Users\\A00288946\\AppData\\Local\\Programs\\Git\\bin\\bash.exe --login -i",
        "startingDirectory": "%USERPROFILE%",
        "icon": "C:\\Users\\A00288946\\AppData\\Local\\Programs\\Git\\mingw64\\share\\git\\git-for-windows.ico",
        "fontFace": "Cascadia Code",
        "fontSize": 12,
        "colorScheme": "Campbell"
      }
    ]
  }
}
JSON

echo -e "${GREEN}✔ Windows Terminal configured for Git Bash${NC}"

echo -e "${BLUE}Done.${NC}"


