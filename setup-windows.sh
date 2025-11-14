#!/bin/bash
# Windows-Specific Cursor Global Setup
# Verifies Windows environment and runs main setup

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  🪟 Windows Cursor Global Configuration Setup${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Verify Windows environment
OS_TYPE="$(uname -s)"
if [[ ! "$OS_TYPE" =~ ^(MINGW|MSYS|CYGWIN) ]]; then
    echo -e "${RED}❌ This script is for Windows (Git Bash) only${NC}"
    echo -e "${YELLOW}💡 Detected OS: $OS_TYPE${NC}"
    echo -e "${YELLOW}💡 For macOS/Linux, use: ./setup.sh${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Windows (Git Bash) environment detected${NC}"
echo ""

# Verify Git Bash
if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ Git not found${NC}"
    echo -e "${YELLOW}📥 Install Git for Windows: https://git-scm.com/download/win${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Git Bash available${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found (required for MCP servers)${NC}"
    echo -e "${YELLOW}📥 Install Node.js: https://nodejs.org/${NC}"
    exit 1
fi

NODE_VERSION=$(node --version)
echo -e "${GREEN}✅ Node.js available: $NODE_VERSION${NC}"

# Check jq (optional but recommended)
if ! command -v jq &> /dev/null; then
    echo -e "${YELLOW}⚠️  jq not found (recommended for JSON processing)${NC}"
    echo -e "${YELLOW}📥 Install from: https://stedolan.github.io/jq/download/${NC}"
else
    echo -e "${GREEN}✅ jq available${NC}"
fi

echo ""

# Create .bashrc if it doesn't exist
if [ ! -f "$HOME/.bashrc" ]; then
    echo -e "${YELLOW}📝 Creating .bashrc...${NC}"
    touch "$HOME/.bashrc"
    echo -e "${GREEN}✅ .bashrc created${NC}"
fi

# Run main setup script
echo -e "${BLUE}🚀 Running main setup script...${NC}"
echo ""
./setup.sh

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Windows Setup Complete!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}⚠️  WINDOWS-SPECIFIC NOTES:${NC}"
echo -e "   • Always use Git Bash for running scripts"
echo -e "   • PowerShell is NOT compatible with these bash scripts"
echo -e "   • Cursor settings: \$APPDATA\\Cursor\\User\\"
echo -e "   • Global config: \$HOME\\.cursor\\"
echo ""
echo -e "${YELLOW}🔄 NEXT STEPS:${NC}"
echo -e "   1. Close and reopen Git Bash terminal"
echo -e "      ${BLUE}OR run: source ~/.bashrc${NC}"
echo -e "   2. Restart Cursor IDE completely"
echo -e "   3. Type 'ai-start' in Cursor chat to test"
echo ""

