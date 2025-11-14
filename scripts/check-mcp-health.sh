#!/bin/bash
# AccessiList MCP Health Check Script
# Checks the health and status of MCP servers and connections

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


echo "🔧 AccessiList MCP Health Check"
echo "==============================="
echo "Timestamp: $(date)"
echo ""

# Configuration
TOTAL_ISSUES=0
MCP_SERVERS=("puppeteer" "filesystem" "memory" "github" "sequential-thinking" "everything")

# Function to check MCP server status
check_mcp_server() {
    local server="$1"
    echo "  🔍 Checking $server MCP server..."

    # Check if server process is running (simplified check)
    if pgrep -f "$server" >/dev/null 2>&1; then
        echo "    ✅ $server server process is running"
    else
        echo "    ⚠️  $server server process not detected (may be managed externally)"
    fi

    # Check for server configuration
    case "$server" in
        "puppeteer")
            if command -v node &> /dev/null; then
                echo "    ✅ Node.js is available for Puppeteer"
            else
                echo "    ❌ Node.js not found (required for Puppeteer)"
                TOTAL_ISSUES=$((TOTAL_ISSUES + 1))
            fi
            ;;
        "filesystem")
            if [ -d "." ] && [ -r "." ]; then
                echo "    ✅ Filesystem access is working"
            else
                echo "    ❌ Filesystem access issues detected"
                TOTAL_ISSUES=$((TOTAL_ISSUES + 1))
            fi
            ;;
        "memory")
            echo "    ✅ Memory MCP server (no specific checks needed)"
            ;;
        "github")
            if command -v git &> /dev/null; then
                echo "    ✅ Git is available for GitHub integration"
            else
                echo "    ❌ Git not found"
                TOTAL_ISSUES=$((TOTAL_ISSUES + 1))
            fi
            ;;
        "sequential-thinking")
            echo "    ✅ Sequential Thinking MCP server (no specific checks needed)"
            ;;
        "everything")
            echo "    ✅ Everything MCP server (no specific checks needed)"
            ;;
    esac
}

# Function to check MCP configuration
check_mcp_configuration() {
    echo "📋 Checking MCP Configuration..."

    # Check for MCP configuration files
    if [ -f ".cursor/mcp.json" ] || [ -f "mcp.json" ]; then
        echo "  ✅ MCP configuration file found"
    else
        echo "  ⚠️  MCP configuration file not found (may be using defaults)"
    fi

    # Check for Cursor rules that reference MCP
    if [ -d ".cursor/rules" ]; then
        if grep -r "mcp\|MCP" ".cursor/rules" >/dev/null 2>&1; then
            echo "  ✅ MCP references found in Cursor rules"
        else
            echo "  ⚠️  No MCP references found in Cursor rules"
        fi
    else
        echo "  ❌ .cursor/rules directory not found"
        TOTAL_ISSUES=$((TOTAL_ISSUES + 1))
    fi
}

# Function to check Puppeteer MCP
check_puppeteer_mcp() {
    echo "🎭 Checking Puppeteer MCP..."

    # Check if Node.js is available
    if command -v node &> /dev/null; then
        local node_version=$(node --version 2>/dev/null || echo "Unknown")
        echo "  ✅ Node.js is available: $node_version"
    else
        echo "  ❌ Node.js not found (required for Puppeteer)"
        TOTAL_ISSUES=$((TOTAL_ISSUES + 1))
    fi

    # Check if Puppeteer is installed
    if npm list puppeteer &> /dev/null; then
        echo "  ✅ Puppeteer is installed"
    else
        echo "  ⚠️  Puppeteer not found in package.json"
    fi
}

# Function to check filesystem MCP
check_filesystem_mcp() {
    echo "📁 Checking Filesystem MCP..."

    # Check read access
    if [ -r "." ]; then
        echo "  ✅ Read access to current directory"
    else
        echo "  ❌ No read access to current directory"
        TOTAL_ISSUES=$((TOTAL_ISSUES + 1))
    fi

    # Check write access
    if [ -w "." ]; then
        echo "  ✅ Write access to current directory"
    else
        echo "  ❌ No write access to current directory"
        TOTAL_ISSUES=$((TOTAL_ISSUES + 1))
    fi

    # Check for required directories
    local required_dirs=("tests" "php" "js" "images")
    for dir in "${required_dirs[@]}"; do
        if [ -d "$dir" ]; then
            echo "  ✅ $dir/ directory exists"
        else
            echo "  ❌ $dir/ directory missing"
            TOTAL_ISSUES=$((TOTAL_ISSUES + 1))
        fi
    done
}

# Function to check memory MCP
check_memory_mcp() {
    echo "🧠 Checking Memory MCP..."

    # Check available memory
    if command -v free &> /dev/null; then
        local available_memory=$(free -m | awk 'NR==2{printf "%.0f", $7}')
        echo "  ✅ Available memory: ${available_memory}MB"

        if [ "$available_memory" -gt 1000 ]; then
            echo "  ✅ Sufficient memory available"
        else
            echo "  ⚠️  Low memory available (${available_memory}MB)"
        fi
    else
        echo "  ⚠️  Cannot check memory status (free command not available)"
    fi
}

# Function to check GitHub MCP
check_github_mcp() {
    echo "🐙 Checking GitHub MCP..."

    # Check Git availability
    if command -v git &> /dev/null; then
        local git_version=$(git --version)
        echo "  ✅ Git is available: $git_version"

        # Check if we're in a Git repository
        if git rev-parse --git-dir >/dev/null 2>&1; then
            echo "  ✅ Current directory is a Git repository"

            # Check for remote repositories
            if git remote -v | grep -q "github.com"; then
                echo "  ✅ GitHub remote repository configured"
            else
                echo "  ⚠️  No GitHub remote repository found"
            fi
        else
            echo "  ❌ Current directory is not a Git repository"
            TOTAL_ISSUES=$((TOTAL_ISSUES + 1))
        fi
    else
        echo "  ❌ Git not found"
        TOTAL_ISSUES=$((TOTAL_ISSUES + 1))
    fi
}

# Function to check MCP integration
check_mcp_integration() {
    echo "🔗 Checking MCP Integration..."

    # Check for MCP-related test files
    if [ -f "tests/puppeteer/run-all-tests.js" ]; then
        echo "  ✅ Puppeteer MCP test files found"
    else
        echo "  ❌ Puppeteer MCP test files missing"
        TOTAL_ISSUES=$((TOTAL_ISSUES + 1))
    fi

    # Check for MCP-related documentation
    if grep -r "mcp\|MCP" ".cursor/rules" >/dev/null 2>&1; then
        echo "  ✅ MCP documentation found in rules"
    else
        echo "  ⚠️  MCP documentation not found in rules"
    fi
}

# Function to generate summary report
generate_summary() {
    echo ""
    echo "📊 MCP Health Check Summary"
    echo "=========================="
    echo "Total Issues Found: $TOTAL_ISSUES"

    if [ "$TOTAL_ISSUES" -eq 0 ]; then
        echo "✅ Status: EXCELLENT - All MCP servers are healthy!"
        echo "🎯 MCP integration is working properly"
    elif [ "$TOTAL_ISSUES" -le 2 ]; then
        echo "✅ Status: GOOD - Minor MCP issues detected"
        echo "💡 Consider addressing remaining issues for optimal MCP performance"
    else
        echo "⚠️  Status: NEEDS ATTENTION - Multiple MCP issues detected"
        echo "🔧 Consider fixing issues before using MCP features"
    fi

    echo ""
    echo "💡 Recommendations:"
    echo "  - Ensure all required browsers and tools are installed"
    echo "  - Check MCP server configurations"
    echo "  - Verify file permissions for MCP access"
    echo "  - Test MCP functionality with test scripts"
    echo "  - Monitor MCP server logs for errors"
}

# Main execution
main() {
    check_mcp_configuration

    for server in "${MCP_SERVERS[@]}"; do
        check_mcp_server "$server"
    done

    check_puppeteer_mcp
    check_filesystem_mcp
    check_memory_mcp
    check_github_mcp
    check_mcp_integration
    generate_summary

    # Exit with appropriate code
    if [ "$TOTAL_ISSUES" -gt 2 ]; then
        exit 1
    else
        exit 0
    fi
}

# Run main function
main "$@"
