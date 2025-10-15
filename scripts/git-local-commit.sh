#!/bin/bash
# AI Local Commit - Automated changelog and commit workflow
# Non-interactive, AI-agent optimized

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
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Get current directory (project root)
PROJECT_DIR=$(pwd)
CHANGELOG="$PROJECT_DIR/changelog.md"
CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Not a git repository"
    exit 1
fi

# Generate timestamp
if [ -f "$PROJECT_DIR/scripts/generate-timestamp.sh" ]; then
    TIMESTAMP=$(bash "$PROJECT_DIR/scripts/generate-timestamp.sh")
else
    TIMESTAMP=$(date -u +"%Y-%m-%d %H:%M:%S UTC")
fi

# Get git status summary
MODIFIED_COUNT=$(git status --short | wc -l | tr -d ' ')
MODIFIED_FILES=$(git status --short | head -10 | awk '{print "- " $2}')
if [ "$MODIFIED_COUNT" -gt 10 ]; then
    MODIFIED_FILES="$MODIFIED_FILES\n- ... and $((MODIFIED_COUNT - 10)) more files"
fi

# Auto-generate concise title
if [ "$MODIFIED_COUNT" -eq 0 ]; then
    echo "⚠️  No changes to commit"
    exit 0
fi

TITLE="Local Commit: ${MODIFIED_COUNT} files on ${CURRENT_BRANCH}"

# Create changelog entry (without commit SHA yet)
CHANGELOG_ENTRY="### ${TIMESTAMP} - ${TITLE}

**Branch:** ${CURRENT_BRANCH}
**Files Modified:** ${MODIFIED_COUNT}
${MODIFIED_FILES}
**Commit:** [pending]

---
"

# Create or update changelog.md
if [ ! -f "$CHANGELOG" ]; then
    # Create new changelog with template
    cat > "$CHANGELOG" << 'EOF'
# Changelog

## Instructions

1. Generate timestamp using `./scripts/generate-timestamp.sh` and copy the output
2. Review last entry (reverse chronological)
3. Add new entry to the top of the Entries section that documents all changes

## Entries

EOF
fi

# Insert entry after "## Entries" line
if grep -q "## Entries" "$CHANGELOG"; then
    # Find line number of "## Entries"
    LINE_NUM=$(grep -n "## Entries" "$CHANGELOG" | head -1 | cut -d: -f1)
    # Insert after that line
    {
        head -n "$LINE_NUM" "$CHANGELOG"
        echo ""
        echo "$CHANGELOG_ENTRY"
        tail -n +$((LINE_NUM + 1)) "$CHANGELOG"
    } > "$CHANGELOG.tmp"
    mv "$CHANGELOG.tmp" "$CHANGELOG"
else
    # Append to end
    echo -e "\n## Entries\n\n$CHANGELOG_ENTRY" >> "$CHANGELOG"
fi

# Commit all changes
COMMIT_MSG="Local commit: ${MODIFIED_COUNT} files - ${CURRENT_BRANCH}"

# Try to commit
if git add -A && git commit -m "$COMMIT_MSG" 2>&1; then
    COMMIT_SHA=$(git rev-parse --short HEAD)

    # Update changelog entry with commit SHA (will be committed next time)
    sed -i.bak "s/\*\*Commit:\*\* \[pending\]/\*\*Commit:\*\* ${COMMIT_SHA}/" "$CHANGELOG"
    rm -f "$CHANGELOG.bak"

    # Success message
    echo -e "${GREEN}✅ Committed to ${CURRENT_BRANCH} (${COMMIT_SHA}): ${MODIFIED_COUNT} files${NC}"
    exit 0
else
    # Capture error
    ERROR_MSG=$(git commit -m "$COMMIT_MSG" 2>&1 || true)

    # Update changelog with error
    sed -i.bak "s/\*\*Commit:\*\* \[pending\]/\*\*Commit:\*\* ERROR - ${ERROR_MSG:0:100}/" "$CHANGELOG"
    rm -f "$CHANGELOG.bak"

    echo -e "${RED}❌ Commit failed: ${ERROR_MSG}${NC}"
    exit 1
fi
