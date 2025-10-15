#!/bin/bash

# AI Session End Handler - Generate automated changelog
# Run this at the end of each AI session to capture context

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

echo -e "${BLUE}📝 Generating AI session changelog...${NC}"

# Create changelog directory
CHANGELOG_DIR="$CHANGELOGS_DIR"
mkdir -p "$CHANGELOG_DIR"
mkdir -p "$CHANGELOG_DIR/projects"

# Generate session ID and timestamp
SESSION_ID=$(date +%Y%m%d-%H%M%S)
TIMESTAMP=$(date)
PROJECT_NAME=$(basename $(pwd))

echo -e "${YELLOW}Session ID: $SESSION_ID${NC}"
echo -e "${YELLOW}Project: $PROJECT_NAME${NC}"

# Detect changes made during session
echo -e "${BLUE}🔍 Detecting changes...${NC}"

# Git changes (if in a git repo)
if git rev-parse --git-dir > /dev/null 2>&1; then
    GIT_CHANGES=$(git diff --name-only HEAD~1 2>/dev/null || echo "No recent git changes")
    GIT_STATUS=$(git status --porcelain 2>/dev/null || echo "No git status available")
else
    GIT_CHANGES="Not a git repository"
    GIT_STATUS="Not a git repository"
fi

# File modifications in current directory
RECENT_FILES=$(find . -name "*.js" -o -name "*.ts" -o -name "*.json" -o -name "*.md" -o -name "*.sh" -mtime -1 2>/dev/null | head -10 || echo "No recent file modifications")

# Generate session changelog
SESSION_FILE="$CHANGELOG_DIR/session-$SESSION_ID.md"
cat > "$SESSION_FILE" << EOF
# AI Session Summary - $SESSION_ID

**Date**: $TIMESTAMP
**Project**: $PROJECT_NAME
**Duration**: [Session duration]
**AI Agent**: Claude (Cursor IDE)

---

## 🎯 **Session Goals**
- [Extracted from conversation context - to be filled manually or via AI analysis]

## 🔧 **Key Changes Made**
### Git Changes
\`\`\`
$GIT_CHANGES
\`\`\`

### Git Status
\`\`\`
$GIT_STATUS
\`\`\`

### Recent File Modifications
\`\`\`
$RECENT_FILES
\`\`\`

## 📊 **Files Modified**
$(find . -name "*.js" -o -name "*.ts" -o -name "*.json" -o -name "*.md" -o -name "*.sh" | head -20)

## 🚀 **Next Steps**
- [Identified from conversation - to be filled manually or via AI analysis]

## 💡 **Key Context for Next Session**
- [Important decisions made]
- [Configuration changes]
- [Outstanding issues]
- [Current project state]

## 🔧 **Technical Details**
- **Working Directory**: $(pwd)
- **Shell**: $SHELL
- **Node Version**: $(node --version 2>/dev/null || echo "Node.js not available")
- **Git Branch**: $(git branch --show-current 2>/dev/null || echo "Not a git repository")

## 📋 **Session Notes**
- [Additional notes from the session]

---

*Generated automatically by session-end.sh*
EOF

echo -e "${GREEN}✅ Session changelog generated: $SESSION_FILE${NC}"

# Update project-specific context
PROJECT_FILE="$CHANGELOG_DIR/projects/$PROJECT_NAME.md"
if [ -f "$PROJECT_FILE" ]; then
    # Append to existing project file
    echo "" >> "$PROJECT_FILE"
    echo "## Session $SESSION_ID - $TIMESTAMP" >> "$PROJECT_FILE"
    echo "- [Session summary]" >> "$PROJECT_FILE"
else
    # Create new project file
    cat > "$PROJECT_FILE" << EOF
# Project Context: $PROJECT_NAME

**Created**: $TIMESTAMP
**Last Updated**: $TIMESTAMP

## 🎯 **Project Overview**
- [Project description and goals]

## 🔧 **Current State**
- **Working Directory**: $(pwd)
- **Git Repository**: $(git remote get-url origin 2>/dev/null || echo "No remote repository")
- **Main Technologies**: [To be identified]

## 📊 **Recent Sessions**
### Session $SESSION_ID - $TIMESTAMP
- [Session summary]

## 🚀 **Active Development Areas**
- [Current focus areas]

## 💡 **Important Context**
- [Key project decisions]
- [Configuration details]
- [Outstanding issues]

---

*Auto-generated project context file*
EOF
fi

echo -e "${GREEN}✅ Project context updated: $PROJECT_FILE${NC}"

# Generate quick summary for next session
SUMMARY_FILE="$CHANGELOG_DIR/last-session-summary.md"
cat > "$SUMMARY_FILE" << EOF
# Last Session Summary

**Session**: $SESSION_ID
**Project**: $PROJECT_NAME
**Date**: $TIMESTAMP

## 🔧 **Key Changes**
$GIT_CHANGES

## 📊 **Files Modified**
$RECENT_FILES

## 🚀 **Next Steps**
- [To be filled from conversation]

## 💡 **Context**
- [Key decisions and configurations]

---
*Quick summary for next AI session*
EOF

echo -e "${GREEN}✅ Quick summary generated: $SUMMARY_FILE${NC}"

# Store in MCP memory if available
if command -v mcp-server-memory &> /dev/null; then
    echo -e "${BLUE}🧠 Storing context in MCP memory...${NC}"
    # This would be called by the AI agent using MCP memory tools
    echo "Context ready for MCP memory storage"
fi

echo ""
echo -e "${BLUE}🎉 Session changelog generation complete!${NC}"
echo -e "${YELLOW}📁 Files created:${NC}"
echo "   • $SESSION_FILE"
echo "   • $PROJECT_FILE"
echo "   • $SUMMARY_FILE"
echo ""
echo -e "${YELLOW}💡 Next steps:${NC}"
echo "   1. Review and fill in [bracketed] sections manually"
echo "   2. Run session-start.sh at beginning of next AI session"
echo "   3. Use MCP memory tools to store/retrieve context"


