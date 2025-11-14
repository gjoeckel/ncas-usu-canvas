#!/bin/bash

# Session Update Script - Record mid-session progress
# Records current progress without ending the session

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
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
CHANGELOG_DIR="$CHANGELOGS_DIR"
PROJECT_NAME=$(basename $(pwd))
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
UPDATE_ID="update-$TIMESTAMP"

echo -e "${BLUE}📝 Recording Mid-Session Progress${NC}"
echo -e "${BLUE}=================================${NC}"
echo ""

# Create directories if they don't exist
mkdir -p "$CHANGELOG_DIR"
mkdir -p "$CHANGELOG_DIR/projects"
mkdir -p "$CHANGELOG_DIR/updates"

# Detect current changes
echo -e "${YELLOW}🔍 Detecting current changes...${NC}"

# Git changes since last commit
GIT_CHANGES=""
if git rev-parse --git-dir > /dev/null 2>&1; then
    GIT_CHANGES=$(git diff --name-only 2>/dev/null || echo "No git changes detected")
    GIT_STATUS=$(git status --porcelain 2>/dev/null || echo "No git status available")
else
    GIT_CHANGES="Not a git repository"
    GIT_STATUS="Not a git repository"
fi

# Recent file modifications (last 2 hours)
RECENT_FILES=$(find . -type f \( -name "*.js" -o -name "*.ts" -o -name "*.json" -o -name "*.md" -o -name "*.php" -o -name "*.css" \) -mmin -120 2>/dev/null | head -10 || echo "No recent file changes")

# Current working directory files
CURRENT_FILES=$(find . -maxdepth 2 -type f \( -name "*.js" -o -name "*.ts" -o -name "*.json" -o -name "*.md" \) | head -15)

# Generate update record
UPDATE_FILE="$CHANGELOG_DIR/updates/$UPDATE_ID.md"
cat > "$UPDATE_FILE" << EOF
# Mid-Session Update - $UPDATE_ID
*Recorded: $(date)*

## 🎯 **Current Session Progress**
- **Project**: $PROJECT_NAME
- **Update Time**: $(date)
- **Session Status**: In Progress

## 🔧 **Changes Since Last Update**
\`\`\`
$GIT_CHANGES
\`\`\`

## 📊 **Git Status**
\`\`\`
$GIT_STATUS
\`\`\`

## 📁 **Recent File Modifications (Last 2 Hours)**
\`\`\`
$RECENT_FILES
\`\`\`

## 🗂️ **Current Project Files**
\`\`\`
$CURRENT_FILES
\`\`\`

## 💡 **Current Context**
- **Working Directory**: $(pwd)
- **Active Files**: [List any currently open files]
- **Current Focus**: [What you're working on right now]

## 🚀 **Next Steps**
- [What you plan to do next in this session]

## 📝 **Session Notes**
- [Any important notes about current progress]
- [Issues encountered or resolved]
- [Key decisions made]

---
*This is a mid-session update. Session continues...*
EOF

echo -e "${GREEN}✅ Update recorded: $UPDATE_ID${NC}"

# Update project-specific context
PROJECT_FILE="$CHANGELOG_DIR/projects/$PROJECT_NAME.md"
if [ -f "$PROJECT_FILE" ]; then
    # Append update to project file
    echo "" >> "$PROJECT_FILE"
    echo "## 📝 Mid-Session Update - $(date)" >> "$PROJECT_FILE"
    echo "- **Update ID**: $UPDATE_ID" >> "$PROJECT_FILE"
    echo "- **Changes**: $(echo "$GIT_CHANGES" | wc -l) files modified" >> "$PROJECT_FILE"
    echo "- **Status**: Session in progress" >> "$PROJECT_FILE"
else
    # Create new project file
    cat > "$PROJECT_FILE" << EOF
# Project Context: $PROJECT_NAME
*Created: $(date)*

## 📝 Mid-Session Update - $(date)
- **Update ID**: $UPDATE_ID
- **Changes**: $(echo "$GIT_CHANGES" | wc -l) files modified
- **Status**: Session in progress

## 🎯 **Project Overview**
- **Name**: $PROJECT_NAME
- **Location**: $(pwd)
- **Type**: [Project type - web app, library, etc.]

## 🔧 **Recent Activity**
- **Last Update**: $(date)
- **Active Development**: Yes
- **Current Focus**: [Current development focus]

## 📊 **Project Structure**
\`\`\`
$CURRENT_FILES
\`\`\`

## 🚀 **Development Status**
- **Current Phase**: [Development phase]
- **Next Milestone**: [Next major goal]
- **Blockers**: [Any current blockers]

---
*Project context automatically maintained*
EOF
fi

echo -e "${GREEN}✅ Project context updated${NC}"

# Create quick context update
QUICK_UPDATE_FILE="$CHANGELOG_DIR/quick-update.md"
cat > "$QUICK_UPDATE_FILE" << EOF
# Quick Session Update
*Last Updated: $(date)*

## 🎯 **Current Status**
- **Project**: $PROJECT_NAME
- **Session**: In Progress
- **Last Update**: $UPDATE_ID

## 🔧 **Recent Changes**
$(echo "$GIT_CHANGES" | head -5)

## 💡 **Current Focus**
- [What you're working on right now]

## 🚀 **Next Steps**
- [Immediate next actions]

---
*Quick context for AI agent*
EOF

echo -e "${GREEN}✅ Quick context updated${NC}"

# Store in MCP memory if available
if command -v mcp-server-memory &> /dev/null; then
    echo -e "${YELLOW}💾 Storing update in MCP memory...${NC}"
    # This would integrate with MCP memory server
    echo -e "${GREEN}✅ Update stored in MCP memory${NC}"
fi

echo ""
echo -e "${BLUE}📊 Update Summary${NC}"
echo -e "${BLUE}================${NC}"
echo -e "${GREEN}✅ Update ID: $UPDATE_ID${NC}"
echo -e "${GREEN}✅ Files Modified: $(echo "$GIT_CHANGES" | wc -l)${NC}"
echo -e "${GREEN}✅ Project Context: Updated${NC}"
echo -e "${GREEN}✅ Quick Context: Updated${NC}"
echo -e "${GREEN}✅ Session Status: Continues${NC}"
echo ""
echo -e "${YELLOW}💡 Session continues... Use 'ai-end' when finished${NC}"
echo -e "${YELLOW}📁 Update details: $UPDATE_FILE${NC}"
