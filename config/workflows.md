# 🔀 Cursor Workflows Reference

**Global workflows available in ALL Cursor projects**
**Updated:** October 15, 2025

---

## 🤖 AI Session Management Workflows

Manage AI session context, changelogs, and progress tracking.

| Workflow | Description | Script |
|----------|-------------|--------|
| **ai-start** | Load AI session context and initialize environment | `session-start.sh` |
| **ai-end** | Save session context and generate changelog | `session-end.sh` |
| **ai-update** | Record mid-session progress checkpoint | `session-update.sh` |
| **ai-repeat** | Reload session context (same as ai-start) | `session-start.sh` |
| **ai-compress** | Compress session context into intelligent summary | `compress-context.sh` |

**Usage in Cursor:** Type workflow name in chat (e.g., `ai-start`)

**Terminal Alternative:** Scripts are in PATH
```bash
session-start.sh
session-end.sh
session-update.sh
compress-context.sh
```

---

## 🧹 Utility Workflows

General maintenance and cleanup tasks that work in any project.

| Workflow | Description | Commands |
|----------|-------------|----------|
| **ai-clean** | Clean temporary files and logs | `rm logs/*.log`, `rm node_modules/.cache`, `find .DS_Store -delete` |

**Usage in Cursor:** Type `ai-clean` in chat

**What it cleans:**
- Removes all `*.log` files from `logs/` directory
- Clears `node_modules/.cache` directory
- Deletes all `.DS_Store` files recursively

**Works in any project with these directories.**

---

## 🔧 MCP Server Management Workflows

Monitor and manage Model Context Protocol servers.

| Workflow | Description | Script |
|----------|-------------|--------|
| **mcp-health** | Check MCP server health and status | `check-mcp-health.sh` |
| **mcp-restart** | Restart all MCP servers | `restart-mcp-servers.sh` |

---

## 📝 Git Workflows

Automated changelog updates and git operations.

| Workflow | Description | Script |
|----------|-------------|--------|
| **ai-local-commit** | Update changelog, commit all changes to current branch | `git-local-commit.sh` |
| **ai-local-merge** | Merge current branch to main, delete source branch | `git-local-merge.sh` |
| **yolo-full** | Verify YOLO setup, then stage, commit, and push all changes | `verify-yolo-setup.bat` + git commands |

**Usage in Cursor:** Type workflow name in chat (e.g., `mcp-health`)

**Terminal Alternative:**
```bash
check-mcp-health.sh
restart-mcp-servers.sh
```

**MCP Servers Managed:**
- filesystem (15 tools)
- memory (8 tools)
- github-minimal (4 tools)
- shell-minimal (4 tools)
- puppeteer-minimal (4 tools)
- sequential-thinking-minimal (4 tools)
- everything-minimal (4 tools)

**Total: 39 MCP tools**

---

## 📊 Workflow Summary

| Category | Count | Prefix | Scope |
|----------|-------|--------|-------|
| **AI Session Management** | 5 | `ai-*` | Global - all projects |
| **MCP Server Management** | 2 | `mcp-*` | Global - all projects |
| **Git Operations** | 3 | `ai-*`, `yolo-*` | Global - all projects |
| **Utility** | 1 | `ai-*` | Global - all projects |
| **Total Global** | **11** | - | All Cursor projects |

---

## 🚀 Quick Reference

### **Start AI Session**
```
ai-start
```
Loads project context, git status, recent changes, and MCP server status.

### **End AI Session**
```
ai-end
```
Generates changelog, saves context, and prepares summary for next session.

### **Check MCP Servers**
```
mcp-health
```
Verifies all 7 MCP servers are running and healthy.

### **Clean Project**
```
ai-clean
```
Removes temporary files, logs, and caches.

### **YOLO Full Commit**
```
yolo-full
```
Verifies YOLO setup (AI Autonomy settings + MCP servers), then stages, commits, and pushes all changes.

---

## 📖 How to Use Workflows

### **Method 1: Type in Cursor Chat** (Recommended)
Simply type the workflow name:
```
ai-start
mcp-health
ai-end
```

### **Method 2: Command Palette**
1. Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
2. Type workflow name
3. Select and execute

### **Method 3: Terminal** (Alternative)
Scripts are in PATH, run directly:
```bash
session-start.sh
check-mcp-health.sh
session-end.sh
```

---

## 🎯 Workflow Naming Convention

All global workflows follow this pattern:

**Format:** `<category>-<action>-<subject>`

**Categories:**
- `ai-*` = AI session and development workflows
- `mcp-*` = MCP server operation workflows
- `proj-*` = Project-specific workflows (in project .cursor/)

**Rules:**
1. Use kebab-case
2. Start with category prefix
3. Use action verbs
4. Keep concise (under 20 characters)
5. No special characters except hyphens

**Examples:**
- ✅ `ai-start`, `mcp-health`, `proj-deploy`
- ❌ `aiStart`, `mcp_health`, `deploy check`

---

## 📁 Configuration Locations

### **Global Workflows** (8 workflows)
**File:** `~/.cursor/workflows.json`
**Scope:** Available in ALL Cursor projects
**Workflows:** ai-start, ai-end, ai-update, ai-repeat, ai-clean, ai-compress, mcp-health, mcp-restart

### **Project Workflows** (varies by project)
**File:** `<project>/.cursor/workflows.json`
**Scope:** Available ONLY in that specific project
**Example (AccessiList):** proj-dry, proj-deploy-check, proj-test-mirror

---

## 🔄 Adding New Workflows

### **For Global Use (All Projects)**
Add to `~/.cursor/workflows.json`:
```json
{
  "ai-my-workflow": {
    "description": "My global workflow",
    "commands": ["bash ~/.local/bin/cursor-tools/my-script.sh"],
    "auto_approve": true
  }
}
```

### **For Project-Specific Use**
Add to `<project>/.cursor/workflows.json`:
```json
{
  "proj-my-workflow": {
    "description": "My project workflow",
    "commands": ["./scripts/my-script.sh"],
    "auto_approve": true
  }
}
```

---

## 📚 Related Documentation

- **~/.cursor/README.md** - Complete global configuration guide
- **~/.cursor/global-scripts.json** - Script registry and metadata
- **GLOBAL-FUNCTIONS-ANALYSIS.md** - Full analysis of global vs project functions
- **WORKFLOW-NAMING-ANALYSIS.md** - Conflict analysis and naming best practices

---

## 🎉 All Workflows Ready

**11 global workflows** available in every Cursor project
**Scripts in PATH** for terminal access
**Zero conflicts** with Cursor built-in commands
**Production-ready** and fully documented

Type any workflow name in Cursor chat to get started! 🚀
