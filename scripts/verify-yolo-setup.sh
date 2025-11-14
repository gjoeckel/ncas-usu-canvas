#!/bin/bash
# YOLO Setup Verification Script
# Verifies AI Autonomy settings and MCP server status before YOLO operations

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

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 YOLO Setup Verification${NC}"
echo "==============================="
echo "Timestamp: $(date)"
echo ""

TOTAL_ISSUES=0
VERIFICATION_PASSED=true

# Function to check AI Autonomy settings
check_ai_autonomy_settings() {
    echo -e "${BLUE}🤖 Checking AI Autonomy Settings...${NC}"
    
    local settings_file="$CONFIG_DIR/settings.json"
    
    if [ ! -f "$settings_file" ]; then
        echo -e "  ${RED}❌ Settings file not found: $settings_file${NC}"
        TOTAL_ISSUES=$((TOTAL_ISSUES + 1))
        VERIFICATION_PASSED=false
        return 1
    fi
    
    echo -e "  ${GREEN}✅ Settings file found${NC}"
    
    # Check YOLO setting
    if grep -q '"YOLO": true' "$settings_file"; then
        echo -e "  ${GREEN}✅ YOLO mode enabled${NC}"
    else
        echo -e "  ${RED}❌ YOLO mode not enabled${NC}"
        TOTAL_ISSUES=$((TOTAL_ISSUES + 1))
        VERIFICATION_PASSED=false
    fi
    
    # Check AI autonomy settings
    local required_settings=(
        '"cursor.ai.enabled": true'
        '"cursor.ai.autoExecute": true'
        '"cursor.ai.confirmationLevel": "none"'
        '"cursor.ai.terminalAccess": true'
        '"cursor.ai.fileSystemAccess": true'
        '"cursor.ai.shellAccess": true'
        '"mcp.enabled": true'
        '"mcp.autoStart": true'
    )
    
    for setting in "${required_settings[@]}"; do
        if grep -q "$setting" "$settings_file"; then
            echo -e "  ${GREEN}✅ $(echo "$setting" | cut -d'"' -f2) configured correctly${NC}"
        else
            echo -e "  ${RED}❌ $(echo "$setting" | cut -d'"' -f2) not configured correctly${NC}"
            TOTAL_ISSUES=$((TOTAL_ISSUES + 1))
            VERIFICATION_PASSED=false
        fi
    done
}

# Function to check MCP server configuration
check_mcp_configuration() {
    echo -e "${BLUE}🔧 Checking MCP Configuration...${NC}"
    
    local mcp_config_file="$CONFIG_DIR/mcp.json"
    
    if [ ! -f "$mcp_config_file" ]; then
        echo -e "  ${RED}❌ MCP config file not found: $mcp_config_file${NC}"
        TOTAL_ISSUES=$((TOTAL_ISSUES + 1))
        VERIFICATION_PASSED=false
        return 1
    fi
    
    echo -e "  ${GREEN}✅ MCP config file found${NC}"
    
    # Check for required MCP servers
    local required_servers=(
        "github-minimal"
        "shell-minimal"
        "puppeteer-minimal"
        "sequential-thinking-minimal"
        "agent-autonomy"
        "filesystem"
        "memory"
    )
    
    for server in "${required_servers[@]}"; do
        if grep -q "\"$server\":" "$mcp_config_file"; then
            echo -e "  ${GREEN}✅ $server server configured${NC}"
        else
            echo -e "  ${RED}❌ $server server not configured${NC}"
            TOTAL_ISSUES=$((TOTAL_ISSUES + 1))
            VERIFICATION_PASSED=false
        fi
    done
}

# Function to check MCP server health
check_mcp_server_health() {
    echo -e "${BLUE}🏥 Checking MCP Server Health...${NC}"
    
    # Check if MCP health check script exists and run it
    local health_script="$SCRIPTS_DIR/check-mcp-health.sh"
    
    if [ ! -f "$health_script" ]; then
        echo -e "  ${RED}❌ MCP health check script not found: $health_script${NC}"
        TOTAL_ISSUES=$((TOTAL_ISSUES + 1))
        VERIFICATION_PASSED=false
        return 1
    fi
    
    echo -e "  ${GREEN}✅ MCP health check script found${NC}"
    
    # Run the health check and capture output
    echo -e "  ${BLUE}🔍 Running MCP health check...${NC}"
    if bash "$health_script" > /tmp/mcp_health_output.log 2>&1; then
        echo -e "  ${GREEN}✅ MCP servers are healthy${NC}"
    else
        echo -e "  ${YELLOW}⚠️  MCP health check completed with warnings${NC}"
        echo -e "  ${BLUE}📋 Health check details:${NC}"
        cat /tmp/mcp_health_output.log | tail -10
    fi
}

# Function to check Git repository status
check_git_status() {
    echo -e "${BLUE}📁 Checking Git Repository Status...${NC}"
    
    if ! git rev-parse --git-dir >/dev/null 2>&1; then
        echo -e "  ${RED}❌ Not in a Git repository${NC}"
        TOTAL_ISSUES=$((TOTAL_ISSUES + 1))
        VERIFICATION_PASSED=false
        return 1
    fi
    
    echo -e "  ${GREEN}✅ Git repository detected${NC}"
    
    # Check for uncommitted changes
    if git diff --quiet && git diff --cached --quiet; then
        echo -e "  ${GREEN}✅ Working directory clean${NC}"
    else
        echo -e "  ${YELLOW}⚠️  Uncommitted changes detected${NC}"
        echo -e "  ${BLUE}📋 Changes to be committed:${NC}"
        git status --short
    fi
    
    # Check current branch
    local current_branch=$(git branch --show-current)
    echo -e "  ${GREEN}✅ Current branch: $current_branch${NC}"
}

# Function to check required tools
check_required_tools() {
    echo -e "${BLUE}🛠️  Checking Required Tools...${NC}"
    
    local required_tools=("git" "node" "npm")
    
    for tool in "${required_tools[@]}"; do
        if command -v "$tool" >/dev/null 2>&1; then
            local version=$($tool --version 2>/dev/null | head -1 || echo "Unknown")
            echo -e "  ${GREEN}✅ $tool available: $version${NC}"
        else
            echo -e "  ${RED}❌ $tool not found${NC}"
            TOTAL_ISSUES=$((TOTAL_ISSUES + 1))
            VERIFICATION_PASSED=false
        fi
    done
}

# Function to generate verification summary
generate_verification_summary() {
    echo ""
    echo -e "${BLUE}📊 YOLO Verification Summary${NC}"
    echo "=============================="
    echo "Total Issues Found: $TOTAL_ISSUES"
    
    if [ "$VERIFICATION_PASSED" = true ] && [ "$TOTAL_ISSUES" -eq 0 ]; then
        echo -e "${GREEN}✅ Status: YOLO READY - All systems verified!${NC}"
        echo -e "${GREEN}🚀 Ready to proceed with YOLO operations${NC}"
        return 0
    elif [ "$TOTAL_ISSUES" -le 2 ]; then
        echo -e "${YELLOW}⚠️  Status: YOLO READY WITH WARNINGS - Minor issues detected${NC}"
        echo -e "${YELLOW}💡 Consider addressing remaining issues for optimal performance${NC}"
        return 0
    else
        echo -e "${RED}❌ Status: YOLO NOT READY - Critical issues detected${NC}"
        echo -e "${RED}🔧 Fix issues before proceeding with YOLO operations${NC}"
        return 1
    fi
}

# Main execution
main() {
    check_ai_autonomy_settings
    check_mcp_configuration
    check_mcp_server_health
    check_git_status
    check_required_tools
    generate_verification_summary
    
    # Clean up temporary files
    rm -f /tmp/mcp_health_output.log 2>/dev/null || true
    
    # Exit with appropriate code
    if [ "$VERIFICATION_PASSED" = true ]; then
        exit 0
    else
        exit 1
    fi
}

# Run main function
main "$@"
