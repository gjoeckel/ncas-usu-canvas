#!/bin/bash
# Generate Project Workflows Documentation
# Combines global and project workflows into single reference

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

PROJECT_DIR=$(pwd)
OUTPUT_FILE="$PROJECT_DIR/workflows.md"
GLOBAL_WORKFLOWS="$CONFIG_DIR/workflows.json"
PROJECT_WORKFLOWS="$PROJECT_DIR/.cursor/workflows.json"

echo "📋 Generating workflows documentation..."

# Start document
cat > "$OUTPUT_FILE" << 'HEADER'
# 🔀 Cursor Workflows Reference

**Project workflows documentation - Auto-generated**
**Combines global and project-specific workflows**

---

HEADER

# Parse global workflows
if [ -f "$GLOBAL_WORKFLOWS" ]; then
    echo "## 🌐 Global Workflows (Available in ALL Projects)" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"

    # Extract workflow names and descriptions
    GLOBAL_LIST=$(cat "$GLOBAL_WORKFLOWS" | jq -r 'to_entries[] | "- **\(.key)** - \(.value.description)"' | sort)
    echo "$GLOBAL_LIST" >> "$OUTPUT_FILE"

    GLOBAL_COUNT=$(cat "$GLOBAL_WORKFLOWS" | jq 'keys | length')
    echo "" >> "$OUTPUT_FILE"
    echo "**Total Global:** $GLOBAL_COUNT workflows" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
fi

# Parse project workflows
if [ -f "$PROJECT_WORKFLOWS" ]; then
    echo "## 📦 Project-Specific Workflows (This Project Only)" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"

    PROJECT_LIST=$(cat "$PROJECT_WORKFLOWS" | jq -r 'to_entries[] | "- **\(.key)** - \(.value.description)"' | sort)
    echo "$PROJECT_LIST" >> "$OUTPUT_FILE"

    PROJECT_COUNT=$(cat "$PROJECT_WORKFLOWS" | jq 'keys | length')
    echo "" >> "$OUTPUT_FILE"
    echo "**Total Project:** $PROJECT_COUNT workflows" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
else
    echo "## 📦 Project-Specific Workflows" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    echo "**No project-specific workflows configured.**" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    PROJECT_COUNT=0
fi

# Add usage section
cat >> "$OUTPUT_FILE" << 'USAGE'
---

## 🚀 Usage

### Type in Cursor Chat (Easiest)
Simply type the workflow name:
```
ai-start
ai-local-commit
mcp-health
proj-dry
```

### Command Palette
1. Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
2. Type workflow name
3. Select and execute

### Terminal Alternative
Global workflow scripts are in PATH:
```bash
session-start.sh
git-local-commit.sh
check-mcp-health.sh
```

---

## 📊 Summary

USAGE

# Calculate totals
TOTAL=$((GLOBAL_COUNT + PROJECT_COUNT))

echo "**Total Workflows:** $TOTAL ($GLOBAL_COUNT global + $PROJECT_COUNT project)" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
echo "**Categories:**" >> "$OUTPUT_FILE"
echo "- AI Session Management (ai-start, ai-end, ai-update, ai-repeat, ai-compress)" >> "$OUTPUT_FILE"
echo "- Git Operations (ai-local-commit, ai-local-merge)" >> "$OUTPUT_FILE"
echo "- MCP Management (mcp-health, mcp-restart)" >> "$OUTPUT_FILE"
echo "- Utilities (ai-clean)" >> "$OUTPUT_FILE"

if [ "$PROJECT_COUNT" -gt 0 ]; then
    echo "- Project Tools (proj-*)" >> "$OUTPUT_FILE"
fi

echo "" >> "$OUTPUT_FILE"
echo "---" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
echo "_Last updated: $(date)_" >> "$OUTPUT_FILE"
echo "_Auto-generated from $GLOBAL_WORKFLOWS and .cursor/workflows.json_" >> "$OUTPUT_FILE"

echo "✅ Generated workflows.md ($TOTAL workflows documented)"
