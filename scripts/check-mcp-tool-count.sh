#!/bin/bash
# Check MCP Tool Count and Identify Sources
# This script helps identify why you have 86 tools when limit is 40

set -euo pipefail

# ========================================
# AUTO-DETECT SCRIPT LOCATION (Portable)
# ========================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CURSOR_GLOBAL_DIR="$(dirname "$SCRIPT_DIR")"

# Derived paths
CONFIG_DIR="$CURSOR_GLOBAL_DIR/config"
CHANGELOGS_DIR="$CURSOR_GLOBAL_DIR/changelogs"
SCRIPTS_DIR="$CURSOR_GLOBAL_DIR/scripts"


echo "🔍 CHECKING MCP TOOL COUNT AND SOURCES"
echo "======================================"

# Check globally installed MCP servers
echo "📦 Globally installed MCP servers:"
npm list -g --depth=0 | grep "@modelcontextprotocol" || echo "No global MCP servers found"

echo ""
echo "🔍 MCP Configuration files found:"

# Check for MCP configs in various locations
config_locations=(
    "${HOME}/Projects/accessilist/.cursor/mcp.json"
    "${HOME}/.cursor/mcp.json"
    "${HOME}/.config/mcp/mcp.json"
    "${HOME}/.config/mcp/cursor-config.json"
    "${HOME}/Library/Application Support/Cursor/User/mcp.json"
)

for config in "${config_locations[@]}"; do
    if [ -f "$config" ]; then
        echo "✅ Found: $config"
        echo "   Tools in this config:"
        # Count tools in each server
        if command -v jq &> /dev/null; then
            jq -r '.mcpServers | keys[]' "$config" | while read server; do
                echo "     - $server server"
            done
        fi
    else
        echo "❌ Not found: $config"
    fi
done

echo ""
echo "🔍 Checking for duplicate MCP installations..."

# Check if MCP servers are installed in multiple ways
echo "Checking npm global vs npx..."
for server in filesystem memory puppeteer github sequential-thinking everything shell; do
    echo "Server: $server"
    
    # Check global installation
    if npm list -g "@modelcontextprotocol/server-$server" &> /dev/null; then
        echo "  ✅ Installed globally"
    else
        echo "  ❌ Not installed globally"
    fi
    
    # Check if npx can run it
    if npx "@modelcontextprotocol/server-$server" --help &> /dev/null; then
        echo "  ✅ Available via npx"
    else
        echo "  ❌ Not available via npx"
    fi
done

echo ""
echo "🎯 ESTIMATED TOOL COUNT ANALYSIS"
echo "================================"

# Estimate tool count based on typical MCP servers
echo "Typical tool counts per MCP server:"
echo "  • filesystem: ~15 tools"
echo "  • memory: ~8 tools" 
echo "  • puppeteer: ~12 tools"
echo "  • github: ~20 tools"
echo "  • sequential-thinking: ~5 tools"
echo "  • everything: ~25 tools"
echo "  • shell: ~10 tools"

echo ""
echo "💡 RECOMMENDATIONS TO STAY UNDER 40 TOOL LIMIT:"
echo "=============================================="
echo "1. Use only ESSENTIAL MCP servers:"
echo "   • filesystem (15 tools)"
echo "   • memory (8 tools)"
echo "   • puppeteer (12 tools)"
echo "   Total: ~35 tools ✅"
echo ""
echo "2. Remove NON-ESSENTIAL servers:"
echo "   • everything (25 tools) - REMOVE"
echo "   • github (20 tools) - REMOVE or make optional"
echo "   • sequential-thinking (5 tools) - REMOVE"
echo "   • shell (10 tools) - REMOVE"
echo ""
echo "3. Create MINIMAL configuration with only core servers"