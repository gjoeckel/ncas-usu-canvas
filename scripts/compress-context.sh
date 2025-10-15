#!/bin/bash

# Context Compression Script - Create intelligent context summary
# Compresses multiple sessions into digestible summary for new AI sessions

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


# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🗜️  Compressing AI session context...${NC}"

# Create changelog directory if it doesn't exist
CHANGELOG_DIR="$CHANGELOGS_DIR"
mkdir -p "$CHANGELOG_DIR"

# Generate intelligent context summary
SUMMARY_FILE="$CHANGELOG_DIR/context-summary.md"
TIMESTAMP=$(date)

echo -e "${YELLOW}📊 Generating context summary...${NC}"

# Get recent sessions (last 7 days)
RECENT_SESSIONS=$(find "$CHANGELOG_DIR" -name "session-*.md" -mtime -7 2>/dev/null | sort -r | head -10)

# Get project information
CURRENT_PROJECT=$(basename $(pwd))
PROJECT_COUNT=$(find "$CHANGELOG_DIR/projects" -name "*.md" 2>/dev/null | wc -l)

# Extract key information from recent sessions
KEY_CHANGES=""
KEY_DECISIONS=""
NEXT_STEPS=""
ACTIVE_PROJECTS=""

if [ -n "$RECENT_SESSIONS" ]; then
    # Extract key changes
    KEY_CHANGES=$(grep -h "## 🔧" $RECENT_SESSIONS | head -10 | sed 's/## 🔧 //' || echo "No recent changes detected")

    # Extract key decisions
    KEY_DECISIONS=$(grep -h "## 💡" $RECENT_SESSIONS | head -8 | sed 's/## 💡 //' || echo "No recent decisions recorded")

    # Extract next steps
    NEXT_STEPS=$(grep -h "## 🚀" $RECENT_SESSIONS | head -8 | sed 's/## 🚀 //' || echo "No next steps identified")

    # Get active projects
    ACTIVE_PROJECTS=$(find "$CHANGELOG_DIR/projects" -name "*.md" -mtime -7 2>/dev/null | xargs basename -s .md | tr '\n' ', ' || echo "No active projects")
fi

# Create comprehensive context summary
cat > "$SUMMARY_FILE" << EOF
# AI Development Context Summary
*Last Updated: $TIMESTAMP*

## 🎯 **Current Development State**
- **Active Focus**: SRD Development (Simple, Reliable, DRY)
- **MCP Tools**: 7 servers configured and operational
- **Development Environment**: macOS Tahoe with Cursor IDE
- **Active Projects**: $ACTIVE_PROJECTS
- **Total Projects Tracked**: $PROJECT_COUNT

## 🔧 **Recent Key Changes (Last 7 Days)**
$KEY_CHANGES

## 💡 **Key Decisions & Context**
$KEY_DECISIONS

## 🚀 **Current Priorities & Next Steps**
$NEXT_STEPS

## 📊 **Active Configurations**
- **MCP Servers**: memory, github, filesystem, sequential-thinking, everything, puppeteer
- **SRD Tools**: ESLint, Prettier, Jest with SRD-specific rules
- **GitHub Push Gate**: Requires token "push to github"
- **Development Focus**: Simple, Reliable, DRY code principles

## 🛠️ **Available Tools & Capabilities**
- **Code Quality**: ESLint with complexity limits, Prettier formatting
- **Testing**: Jest with 80% coverage requirements
- **Analysis**: Complexity, duplication, and dependency analysis
- **Automation**: Browser automation via Puppeteer
- **Database**: (none configured via MCP in this project)
- **Memory**: Persistent context storage via MCP memory

## 📈 **Development Metrics**
- **Sessions Tracked**: $(find "$CHANGELOG_DIR" -name "session-*.md" 2>/dev/null | wc -l)
- **Projects Active**: $PROJECT_COUNT
- **Recent Activity**: $(find "$CHANGELOG_DIR" -name "session-*.md" -mtime -1 2>/dev/null | wc -l) sessions in last 24 hours

## 🎯 **SRD Development Principles**
- **Simple**: Code complexity < 10, functions < 50 lines, max 4 parameters
- **Reliable**: 80% test coverage, error handling, type safety
- **DRY**: No code duplication, reusable components, shared utilities

## 💾 **Context Management**
- **Session Tracking**: Automated changelog generation
- **Context Compression**: Intelligent summarization
- **Memory Storage**: MCP memory for persistent context
- **Size Management**: Optimized for AI session efficiency

---

*This summary is automatically generated and updated with each context compression run.*
EOF

echo -e "${GREEN}✅ Context summary generated: $SUMMARY_FILE${NC}"

# Create lightweight context for quick loading
QUICK_CONTEXT="$CHANGELOG_DIR/quick-context.md"
cat > "$QUICK_CONTEXT" << EOF
# Quick Context Summary
*Updated: $TIMESTAMP*

## 🎯 **Current State**
- **Focus**: SRD Development (Simple, Reliable, DRY)
- **MCP Tools**: 7 servers operational
- **Environment**: macOS Tahoe + Cursor IDE

## 🔧 **Recent Changes**
$(echo "$KEY_CHANGES" | head -3)

## 🚀 **Next Steps**
$(echo "$NEXT_STEPS" | head -3)

## 💡 **Key Context**
- GitHub push gate: token "push to github"
- SRD tools configured and ready
- Full AI autonomy enabled

---
*Lightweight context for quick AI session startup*
EOF

echo -e "${GREEN}✅ Quick context generated: $QUICK_CONTEXT${NC}"

# Create project-specific summaries
echo -e "${YELLOW}📁 Generating project-specific summaries...${NC}"
for project_file in "$CHANGELOG_DIR/projects"/*.md; do
    if [ -f "$project_file" ]; then
        PROJECT_NAME=$(basename "$project_file" .md)
        PROJECT_SUMMARY="$CHANGELOG_DIR/projects/$PROJECT_NAME-summary.md"

        # Extract key information from project file
        cat > "$PROJECT_SUMMARY" << EOF
# Project Summary: $PROJECT_NAME
*Updated: $TIMESTAMP*

## 🎯 **Project Overview**
$(grep -A 5 "## 🎯" "$project_file" | tail -4 || echo "No overview available")

## 🔧 **Current State**
$(grep -A 5 "## 🔧" "$project_file" | tail -4 || echo "No current state available")

## 🚀 **Active Development**
$(grep -A 5 "## 🚀" "$project_file" | tail -4 || echo "No active development info")

## 💡 **Key Context**
$(grep -A 5 "## 💡" "$project_file" | tail -4 || echo "No key context available")

---
*Project-specific context summary*
EOF

        echo -e "${GREEN}✅ Project summary: $PROJECT_SUMMARY${NC}"
    fi
done

# Display compression statistics
echo ""
echo -e "${BLUE}📊 Context Compression Statistics:${NC}"
echo "=================================="
echo "**Total Sessions**: $(find "$CHANGELOG_DIR" -name "session-*.md" 2>/dev/null | wc -l)"
echo "**Recent Sessions**: $(find "$CHANGELOG_DIR" -name "session-*.md" -mtime -7 2>/dev/null | wc -l)"
echo "**Active Projects**: $PROJECT_COUNT"
echo "**Summary File Size**: $(wc -c < "$SUMMARY_FILE" 2>/dev/null || echo "0") bytes"
echo "**Quick Context Size**: $(wc -c < "$QUICK_CONTEXT" 2>/dev/null || echo "0") bytes"
echo "=================================="

echo ""
echo -e "${BLUE}🎉 Context compression complete!${NC}"
echo -e "${YELLOW}📋 Generated files:${NC}"
echo "   • $SUMMARY_FILE (comprehensive context)"
echo "   • $QUICK_CONTEXT (lightweight context)"
echo "   • Project-specific summaries"
echo ""
echo -e "${YELLOW}💡 Usage:${NC}"
echo "   • Load quick context for fast AI session startup"
echo "   • Use full summary for comprehensive context"
echo "   • Project summaries for project-specific context"
echo ""
echo -e "${GREEN}✅ Context optimized for AI session efficiency!${NC}"


