#!/bin/bash
# AI Local Merge - Merge current branch to main
# Non-interactive, AI-agent optimized
# Supports: --finalize flag to complete a merge after manual conflict resolution

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
BLUE='\033[0;34m'
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

# Function to update changelog after successful merge
finalize_merge() {
    local MERGE_SHA=$(git rev-parse --short HEAD)

    # Find and update the most recent [pending] merge entry
    if [ -f "$CHANGELOG" ] && grep -q "\*\*Status:\*\* \[pending\]" "$CHANGELOG"; then
        # Use a more portable sed approach
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s/\*\*Status:\*\* \[pending\]/\*\*Status:\*\* ✅ Complete\n\*\*Merge Commit:\*\* ${MERGE_SHA}/" "$CHANGELOG"
        else
            # Linux
            sed -i "s/\*\*Status:\*\* \[pending\]/\*\*Status:\*\* ✅ Complete\n\*\*Merge Commit:\*\* ${MERGE_SHA}/" "$CHANGELOG"
        fi

        # Commit the changelog update
        git add "$CHANGELOG"
        git commit -m "Update changelog: Mark merge as complete" 2>/dev/null || true

        echo -e "${GREEN}✅ Changelog updated with merge commit ${MERGE_SHA}${NC}"
    fi
}

# Handle --finalize flag to complete a merge after manual resolution
if [ "$1" = "--finalize" ]; then
    if [ "$CURRENT_BRANCH" != "main" ] && [ "$CURRENT_BRANCH" != "master" ]; then
        echo "❌ Not on main branch. Run this from main after completing the merge."
        exit 1
    fi

    finalize_merge
    echo -e "${GREEN}✅ Merge finalization complete${NC}"
    exit 0
fi

# Check if on main already
if [ "$CURRENT_BRANCH" = "main" ] || [ "$CURRENT_BRANCH" = "master" ]; then
    echo "⚠️  Already on main branch, nothing to merge"
    exit 0
fi

# Generate timestamp
if [ -f "$PROJECT_DIR/scripts/generate-timestamp.sh" ]; then
    TIMESTAMP=$(bash "$PROJECT_DIR/scripts/generate-timestamp.sh")
else
    TIMESTAMP=$(date -u +"%Y-%m-%d %H:%M:%S UTC")
fi

# Create changelog entry for merge
CHANGELOG_ENTRY="### ${TIMESTAMP} - Merged ${CURRENT_BRANCH} to main

**Action:** Local branch merge
**Source Branch:** ${CURRENT_BRANCH}
**Target Branch:** main
**Status:** [pending]

---
"

# Create or update changelog.md
if [ ! -f "$CHANGELOG" ]; then
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
    LINE_NUM=$(grep -n "## Entries" "$CHANGELOG" | head -1 | cut -d: -f1)
    {
        head -n "$LINE_NUM" "$CHANGELOG"
        echo ""
        echo "$CHANGELOG_ENTRY"
        tail -n +$((LINE_NUM + 1)) "$CHANGELOG"
    } > "$CHANGELOG.tmp"
    mv "$CHANGELOG.tmp" "$CHANGELOG"
else
    echo -e "\n## Entries\n\n$CHANGELOG_ENTRY" >> "$CHANGELOG"
fi

# Commit changelog update on current branch
git add "$CHANGELOG"
git commit -m "Pre-merge: Update changelog for ${CURRENT_BRANCH} → main" 2>/dev/null || true

# Store source branch name for later use
SOURCE_BRANCH="$CURRENT_BRANCH"

# ========================================
# SMART CHANGELOG MERGE STRATEGY
# ========================================
# Extract new entries from feature branch before merge
# This prevents changelog conflicts entirely

echo -e "${BLUE}📋 Preparing smart changelog merge...${NC}"

# Get the last entry header from main's changelog (before merge)
LAST_MAIN_ENTRY=$(git show main:changelog.md 2>/dev/null | grep "^### " | head -1 || echo "")

if [ -n "$LAST_MAIN_ENTRY" ]; then
    # Extract all new entries from current branch up to (but not including) main's last entry
    # This gets everything between "## Entries" and the last known main entry
    ENTRIES_LINE=$(grep -n "^## Entries" "$CHANGELOG" | head -1 | cut -d: -f1)

    if [ -n "$ENTRIES_LINE" ]; then
        # Extract new entries from feature branch
        TEMP_NEW_ENTRIES=$(mktemp)

        # Get line number where main's last entry appears in our changelog
        LAST_MAIN_LINE=$(grep -n "^${LAST_MAIN_ENTRY}" "$CHANGELOG" | head -1 | cut -d: -f1 || echo "")

        if [ -n "$LAST_MAIN_LINE" ]; then
            # Extract only the new entries (between "## Entries" and last main entry)
            sed -n "$((ENTRIES_LINE + 1)),$((LAST_MAIN_LINE - 1))p" "$CHANGELOG" > "$TEMP_NEW_ENTRIES"
            echo -e "${GREEN}✅ Extracted $(grep -c '^###' "$TEMP_NEW_ENTRIES" || echo 0) new changelog entries from ${SOURCE_BRANCH}${NC}"
        else
            # All entries are new (main's last entry not found in our branch)
            sed -n "$((ENTRIES_LINE + 1)),\$p" "$CHANGELOG" > "$TEMP_NEW_ENTRIES"
            echo -e "${GREEN}✅ All entries are new - extracted for merge${NC}"
        fi
    fi
fi

# Switch to main
git checkout main 2>&1

# If we extracted new entries, merge them into main's changelog now
if [ -f "$TEMP_NEW_ENTRIES" ] && [ -s "$TEMP_NEW_ENTRIES" ]; then
    echo -e "${BLUE}📝 Merging new changelog entries into main...${NC}"

    # Get the "## Entries" line number in main's changelog
    MAIN_ENTRIES_LINE=$(grep -n "^## Entries" "$CHANGELOG" | head -1 | cut -d: -f1)

    if [ -n "$MAIN_ENTRIES_LINE" ]; then
        # Insert new entries right after "## Entries" line
        {
            head -n "$MAIN_ENTRIES_LINE" "$CHANGELOG"
            echo ""
            cat "$TEMP_NEW_ENTRIES"
            tail -n +$((MAIN_ENTRIES_LINE + 1)) "$CHANGELOG"
        } > "$CHANGELOG.tmp"
        mv "$CHANGELOG.tmp" "$CHANGELOG"

        # Stage the merged changelog to prevent conflicts
        git add "$CHANGELOG"
        echo -e "${GREEN}✅ Changelog pre-merged, conflicts prevented!${NC}"
    fi

    # Clean up temp file
    rm -f "$TEMP_NEW_ENTRIES"
fi

# Attempt merge (changelog is already resolved)
set +e  # Disable exit on error temporarily
git merge "$SOURCE_BRANCH" -m "Merge branch '${SOURCE_BRANCH}' into main" 2>&1
MERGE_EXIT=$?
set -e  # Re-enable exit on error

if [ $MERGE_EXIT -eq 0 ]; then
    # Merge successful (no conflicts)
    echo -e "${GREEN}✅ Merge completed successfully${NC}"

    # Update changelog and finalize
    finalize_merge

    # Delete source branch
    git branch -d "$SOURCE_BRANCH" 2>/dev/null && \
        echo -e "${GREEN}✅ Deleted source branch: ${SOURCE_BRANCH}${NC}"

    echo -e "${GREEN}✅ Merge complete! All changes from ${SOURCE_BRANCH} are now in main${NC}"
    exit 0
else
    # Check if we're in a merge state (conflicts)
    if git status | grep -q "You have unmerged paths"; then
        # Conflicts detected - leave merge in progress
        CONFLICT_FILES=$(git diff --name-only --diff-filter=U)

        echo -e "${YELLOW}⚠️  Merge conflicts detected${NC}"
        echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${YELLOW}Conflicting files:${NC}"
        echo "$CONFLICT_FILES"

        # Special handling for changelog conflicts (should be rare now)
        if echo "$CONFLICT_FILES" | grep -q "changelog.md"; then
            echo ""
            echo -e "${YELLOW}⚠️  Note: changelog.md has conflicts (unexpected!)${NC}"
            echo -e "${YELLOW}   This may indicate both branches modified existing entries.${NC}"
        fi

        echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo ""
        echo -e "${YELLOW}Next steps:${NC}"
        echo -e "  1. ${BLUE}Resolve conflicts${NC} in the files listed above"
        echo -e "  2. ${BLUE}Stage resolved files:${NC} git add <file>"
        echo -e "  3. ${BLUE}Complete the merge:${NC} git commit"
        echo -e "  4. ${BLUE}Update changelog:${NC} bash ~/cursor-global/scripts/git-local-merge.sh --finalize"
        echo -e "  5. ${BLUE}Delete source branch:${NC} git branch -d ${SOURCE_BRANCH}"
        echo ""
        echo -e "${GREEN}💡 Tip:${NC} The merge is in progress. Resolve conflicts and complete the merge manually."
        echo -e "${GREEN}💡 Tip:${NC} Or use AI to help resolve conflicts, then run with --finalize flag"
        echo ""
        exit 1
    else
        # Other merge error
        echo -e "${RED}❌ Merge failed with unexpected error${NC}"
        git status
        exit 1
    fi
fi
