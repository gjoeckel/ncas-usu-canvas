#!/bin/bash

# Cursor IDE Full Autonomy Configuration Script
# This script configures Cursor IDE to allow AI agents full autonomy

set -e

# ========================================
# AUTO-DETECT SCRIPT LOCATION (Portable)
# ========================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CURSOR_GLOBAL_DIR="$(dirname "$SCRIPT_DIR")"

# Derived paths
CONFIG_DIR="$CURSOR_GLOBAL_DIR/config"
CHANGELOGS_DIR="$CURSOR_GLOBAL_DIR/changelogs"
SCRIPTS_DIR="$CURSOR_GLOBAL_DIR/scripts"


echo "🚀 Configuring Cursor IDE for Full AI Autonomy..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Detect OS and set appropriate Cursor settings directory
OS_TYPE="$(uname -s)"
case "$OS_TYPE" in
    Darwin*)
        CURSOR_CONFIG_DIR="$HOME/Library/Application Support/Cursor/User"
        echo -e "${BLUE}🍎 macOS detected${NC}"
        ;;
    MINGW*|MSYS*|CYGWIN*)
        CURSOR_CONFIG_DIR="$APPDATA/Cursor/User"
        echo -e "${BLUE}🪟 Windows detected${NC}"
        ;;
    Linux*)
        CURSOR_CONFIG_DIR="$HOME/.config/Cursor/User"
        echo -e "${BLUE}🐧 Linux detected${NC}"
        ;;
    *)
        echo -e "${RED}❌ Unsupported OS: $OS_TYPE${NC}"
        exit 1
        ;;
esac

mkdir -p "$CURSOR_CONFIG_DIR"

echo -e "${BLUE}📁 Creating Cursor configuration directory...${NC}"
echo "Directory: $CURSOR_CONFIG_DIR"

# Backup existing settings if they exist
if [ -f "$CURSOR_CONFIG_DIR/settings.json" ]; then
    echo -e "${YELLOW}📋 Backing up existing settings...${NC}"
    cp "$CURSOR_CONFIG_DIR/settings.json" "$CURSOR_CONFIG_DIR/settings.json.backup.$(date +%Y%m%d-%H%M%S)"
fi

# Create optimized Cursor settings for AI autonomy
echo -e "${BLUE}⚙️  Creating AI-optimized Cursor settings...${NC}"
cat > "$CURSOR_CONFIG_DIR/settings.json" << 'EOF'
{
  "editor.fontSize": 14,
  "editor.lineHeight": 2,
  "editor.fontFamily": "SF Mono, Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace",
  "editor.tabSize": 2,
  "editor.insertSpaces": true,
  "editor.wordWrap": "on",
  "editor.minimap.enabled": true,
  "editor.minimap.maxColumn": 120,
  "files.autoSave": "afterDelay",
  "files.autoSaveDelay": 1000,
  "files.trimTrailingWhitespace": true,
  "files.insertFinalNewline": true,
  "terminal.integrated.fontSize": 13,
  "terminal.integrated.lineHeight": 2,
  "terminal.integrated.fontFamily": "SF Mono, Monaco, 'Cascadia Code', monospace",
  "workbench.colorTheme": "Default Dark+",
  "workbench.iconTheme": "vs-seti",
  "git.enableSmartCommit": true,
  "git.confirmSync": false,
  "extensions.autoUpdate": true,
  "telemetry.telemetryLevel": "off",
  "cursor.ai.enabled": true,
  "cursor.ai.autoComplete": true,
  "cursor.ai.chat.enabled": true,
  "cursor.ai.codeGeneration": true,
  "cursor.ai.terminalAccess": true,
  "cursor.ai.fileSystemAccess": true,
  "cursor.ai.shellAccess": true,
  "cursor.ai.autoExecute": true,
  "cursor.ai.confirmationLevel": "none",
  "cursor.ai.autoApprove": true,
  "cursor.ai.trustedMode": true,
  "cursor.ai.fullAccess": true,
  "mcp.enabled": true,
  "mcp.configPath": "~/.config/mcp/cursor-config.json",
  "mcp.autoStart": true,
  "mcp.servers": {
    "apple-mcp": true,
    "xcode-build-mcp": true,
    "app-opener": true,
    "mac-monitor-mcp": true
  }
}
EOF

echo -e "${GREEN}✅ Cursor settings configured for AI autonomy${NC}"

# Create MCP configuration directory
echo -e "${BLUE}🔧 Setting up Model Context Protocol (MCP)...${NC}"
mkdir -p "$HOME/.config/mcp"

# Run comprehensive MCP server setup
echo -e "${BLUE}🚀 Running comprehensive MCP server setup...${NC}"
"$(dirname "$0")/setup-mcp-servers.sh"

echo -e "${GREEN}✅ MCP servers installed and configured${NC}"

# Create AI autonomy permissions file
echo -e "${BLUE}🔐 Setting up AI autonomy permissions...${NC}"
cat > "$HOME/.cursor-ai-permissions" << 'EOF'
# Cursor AI Autonomy Permissions
# This file grants the AI agent full autonomy to:
# - Execute terminal commands
# - Modify system files
# - Install software packages
# - Configure development environment
# - Access file system
# - Run shell scripts
# - Install extensions
# - Configure system settings

AUTONOMY_LEVEL=full
TERMINAL_ACCESS=true
FILE_SYSTEM_ACCESS=true
PACKAGE_INSTALLATION=true
SYSTEM_CONFIGURATION=true
EXTENSION_MANAGEMENT=true
SHELL_SCRIPT_EXECUTION=true
AUTO_APPROVE_ACTIONS=true

# GitHub Push Security Gate
GITHUB_PUSH_GATE=true
GITHUB_PUSH_TOKEN="push to github"
REQUIRE_PUSH_TOKEN=true
EOF

echo -e "${GREEN}✅ AI autonomy permissions configured${NC}"

# Setup GitHub push security gate
echo -e "${BLUE}🔒 Setting up GitHub push security gate...${NC}"
chmod +x "$(dirname "$0")/github-push-gate.sh"
"$(dirname "$0")/github-push-gate.sh" setup

echo -e "${GREEN}✅ GitHub push security gate configured${NC}"

# Create development directory structure
echo -e "${BLUE}📂 Creating development directory structure...${NC}"
mkdir -p "$HOME/Developer/{projects,scripts,configs,tools}"
mkdir -p "$HOME/Developer/projects/{github,gitlab,bitbucket,local}"
mkdir -p "$HOME/.dotfiles/{zsh,git,cursor,iterm2}"

echo -e "${GREEN}✅ Development directories created${NC}"

# Create AI agent workspace configuration
echo -e "${BLUE}🤖 Creating AI agent workspace configuration...${NC}"
cat > "$HOME/Developer/.ai-workspace-config" << 'EOF'
{
  "aiAgent": {
    "name": "macOS Development Environment Setup Agent",
    "version": "1.0.0",
    "capabilities": [
      "system_administration",
      "package_management",
      "development_environment_setup",
      "shell_configuration",
      "terminal_setup",
      "ide_configuration",
      "docker_setup",
      "security_configuration",
      "performance_optimization"
    ],
    "autonomy": {
      "level": "full",
      "autoExecute": true,
      "confirmationRequired": false,
      "backupBeforeChanges": true
    },
    "security": {
      "githubPushGate": {
        "enabled": true,
        "requiredToken": "push to github",
        "description": "All pushes to GitHub repositories require the exact token 'push to github'"
      }
    },
    "workspace": {
      "root": "${HOME}/Projects/accessilist",
      "template": "template.md",
      "output": "$HOME/Developer"
    }
  }
}
EOF

echo -e "${GREEN}✅ AI agent workspace configuration created${NC}"

# Create execution script for the template
echo -e "${BLUE}📜 Creating template execution script...${NC}"
cat > "$HOME/Developer/scripts/execute-template.sh" << 'EOF'
#!/bin/bash

# macOS Tahoe Development Environment Setup - AI Agent Execution Script
# This script executes the template.md setup with full AI autonomy

set -e

echo "🚀 Starting macOS Tahoe Development Environment Setup..."
echo "🤖 AI Agent has full autonomy to execute all phases"

# Get the template directory
TEMPLATE_DIR="${HOME}/Projects/accessilist"
TEMPLATE_FILE="$TEMPLATE_DIR/template.md"

if [ ! -f "$TEMPLATE_FILE" ]; then
    echo "❌ Template file not found: $TEMPLATE_FILE"
    exit 1
fi

echo "📋 Template found: $TEMPLATE_FILE"
echo "🎯 AI Agent will now execute all phases autonomously"
echo ""

# The AI agent will now execute the template phases
echo "✅ Configuration complete. AI Agent is ready to execute template.md"
echo "🔧 Run: cursor $TEMPLATE_DIR"
echo "💬 Then ask the AI: 'Please implement the macOS Tahoe development environment setup from template.md'"
EOF

chmod +x "$HOME/Developer/scripts/execute-template.sh"

echo -e "${GREEN}✅ Template execution script created${NC}"

# Final summary
echo ""
echo -e "${BLUE}🎉 Cursor IDE Full Autonomy Configuration Complete!${NC}"
echo ""
echo -e "${GREEN}✅ What's been configured:${NC}"
echo "   • Cursor IDE settings optimized for AI autonomy"
echo "   • Model Context Protocol (MCP) integration"
echo "   • AI autonomy permissions file"
echo "   • GitHub push security gate (requires token: 'push to github')"
echo "   • Development directory structure"
echo "   • AI agent workspace configuration"
echo "   • Template execution script"
echo ""
echo -e "${YELLOW}🚀 Next Steps:${NC}"
echo "   1. Open Cursor IDE: cursor ${HOME}/Projects/accessilist"
echo "   2. Ask the AI: 'Please implement the macOS Tahoe development environment setup from template.md'"
echo "   3. The AI will now have full autonomy to execute all phases"
echo ""
echo -e "${BLUE}💡 The AI agent can now:${NC}"
echo "   • Execute terminal commands automatically"
echo "   • Install packages and software"
echo "   • Configure system settings"
echo "   • Create and modify files"
echo "   • Run shell scripts"
echo "   • Install extensions"
echo "   • Set up the complete development environment"
echo ""
echo -e "${BLUE}🔒 Security Features:${NC}"
echo "   • GitHub push gate requires exact token: 'push to github'"
echo "   • Automatic backups before changes"
echo "   • Rollback capabilities"
echo "   • Recovery scripts for common issues"
echo ""
echo -e "${GREEN}🎯 Ready for autonomous execution!${NC}"
