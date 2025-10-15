#!/bin/bash
# Restart MCP Servers - Quick Restart for Development
# Use this when you need to restart MCP servers without full setup

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


echo "🔄 RESTARTING MCP SERVERS"
echo "=========================="

PROJECT_ROOT="${HOME}/Projects/accessilist"

# Stop existing servers
echo "🛑 Stopping existing MCP servers..."
for pid_file in "$PROJECT_ROOT/.cursor"/*.pid; do
    if [ -f "$pid_file" ]; then
        pid=$(cat "$pid_file")
        if kill -0 "$pid" 2>/dev/null; then
            echo "Stopping process $pid..."
            kill "$pid" 2>/dev/null || true
        fi
        rm -f "$pid_file"
    fi
done

# Wait for cleanup
sleep 2

# Start servers using the main startup script
echo "🚀 Restarting MCP servers..."
"$PROJECT_ROOT/scripts/start-mcp-servers.sh"

echo "✅ MCP servers restarted successfully!"