# Cursor Global Configuration

**Portable Cursor IDE configuration for AI-assisted development with full MCP automation**

This repository provides a complete, portable Cursor IDE setup with 39 MCP tools, 12 global workflows, and automated session management that works on both macOS/Linux and Windows.

---

## 🎯 What You Get

- **39 MCP Tools** across 8 servers (filesystem, memory, GitHub, shell, browser automation, and more)
- **12 Global Workflows** (ai-start, ai-end, ai-local-commit, mcp-health, etc.)
- **Automated Session Management** with context preservation
- **Smart Git Workflows** with conflict prevention and auto-changelog
- **Fully Portable** - place anywhere on your machine
- **Cross-platform** - Works on macOS, Linux, and Windows

---

## 📋 Prerequisites

### All Platforms
- **Node.js v18+** - Required for MCP servers ([Download](https://nodejs.org/))
- **Git** - For version control and workflows

### Windows Additional Requirements
- **Git for Windows** (includes Git Bash) - ([Download](https://git-scm.com/download/win))

---

## 🚀 Quick Setup

### macOS / Linux

```bash
# 1. Clone repository
git clone https://github.com/gjoeckel/cursor-global.git
cd cursor-global

# 2. Run setup (auto-detects location!)
chmod +x setup.sh
./setup.sh

# 3. Reload shell
source ~/.zshrc  # or ~/.bashrc

# 4. Build custom MCP servers (REQUIRED)
cd ~/Projects  # or wherever you keep projects
git clone https://github.com/gjoeckel/my-mcp-servers.git
cd my-mcp-servers/my-mcp-servers
npm run install-all

# 5. Restart Cursor IDE

# Done! ✅
```

### Windows 11

```powershell
# 1. Clone repository
git clone https://github.com/gjoeckel/cursor-global.git
cd cursor-global

# 2. Run Windows setup
.\setup-windows.ps1

# 3. Build custom MCP servers (REQUIRED)
cd C:\Users\YOUR_USERNAME\Projects
git clone https://github.com/gjoeckel/my-mcp-servers.git
cd my-mcp-servers\my-mcp-servers
npm run install-all

# Additional packages (if needed)
cd packages\sequential-thinking-minimal && npm install
cd ..\everything-minimal && npm install
cd ..\agent-autonomy && npm install

# 4. Restart Cursor IDE

# Done! ✅
```

---

## ⚠️ Important: Custom MCP Servers Are REQUIRED

This system **requires** building the custom MCP servers from source. This is NOT optional because:

1. **Core Functionality**: Provides 16 of the 39 tools (GitHub, shell, browser automation, etc.)
2. **Already Integrated**: All workflows and configs expect these servers
3. **Custom Features**: Agent autonomy, sequential thinking, and other unique tools

### Windows-Specific Requirements

**After building custom MCP servers, you MUST:**

1. **Fix ES module configuration** in 5 packages (already done in my-mcp-servers repo):
   - Update tsconfig.json to use `"module": "ESNext"` instead of `"commonjs"`
   - Add `"type": "module"` to agent-autonomy/package.json if missing

2. **Create Windows-specific mcp.json** in `~/.cursor/`:
   - Use `node` command (not `npx`) for custom servers
   - Use full Windows paths: `C:\\Users\\USERNAME\\Projects\\my-mcp-servers\\...`
   - The repository's `config/mcp.json` is a template - Windows users need custom config
   - The `setup-windows.ps1` script handles this automatically

**Why:** npx with git URLs doesn't work reliably on Windows with ES module packages. Local builds with full paths are the validated approach.

---

## 🔧 Configuration Files

The setup automatically creates configurations in `~/.cursor/`:

- **mcp.json** - Configures all 8 MCP servers (23 official + 16 custom tools)
- **workflows.json** - Defines 12 global workflows
- **settings.json** - Cursor IDE settings for autonomy

### MCP Servers Included

| Server | Tools | Type | Description |
|--------|-------|------|-------------|
| filesystem | 15 | Official | File operations |
| memory | 8 | Official | Knowledge graph storage |
| github-minimal | 4 | Custom | GitHub repository operations |
| shell-minimal | 4 | Custom | Safe shell command execution |
| puppeteer-minimal | 4 | Custom | Browser automation |
| sequential-thinking | 4 | Custom | Step-by-step problem solving |
| everything-minimal | 4 | Custom | Protocol validation |
| agent-autonomy | 4 | Custom | Workflow automation |

**Total:** 39 tools across 8 servers

### Two MCP Configuration Approaches

**macOS/Linux (npx approach - template in config/mcp.json):**
```json
{
  "github-minimal": {
    "command": "npx",
    "args": ["-y", "git+https://github.com/gjoeckel/my-mcp-servers.git#main:packages/github-minimal"]
  }
}
```
- Uses npx to fetch from git
- No hardcoded paths
- May work on macOS/Linux (needs testing)

**Windows (local build approach - validated & working):**
```json
{
  "github-minimal": {
    "command": "node",
    "args": ["C:\\Users\\USERNAME\\Projects\\my-mcp-servers\\my-mcp-servers\\packages\\github-minimal\\build\\index.js"]
  }
}
```
- Uses locally built packages
- Full Windows paths
- ✅ Validated and confirmed working on Windows 11
- The `setup-windows.ps1` script generates this automatically

---

## 💡 Using the System

### In Cursor Chat

Type any workflow name:
- `ai-start` - Load session context and initialize environment
- `ai-end` - Save session context and generate changelog
- `ai-local-commit` - Commit with automatic changelog update
- `ai-local-merge` - Smart merge with conflict prevention
- `mcp-health` - Check MCP server status

### Available Workflows

**Session Management:**
- ai-start, ai-end, ai-update, ai-repeat, ai-compress

**Utilities:**
- ai-clean, ai-docs-sync

**MCP Management:**
- mcp-health, mcp-restart

**Git Operations:**
- ai-local-commit, ai-local-merge, ai-merge-finalize

---

## 🔍 Troubleshooting

### MCP Servers Not Starting

**Check:**
```bash
# macOS/Linux
ps aux | grep mcp

# Windows
Get-Process | Where-Object {$_.Name -like "*node*"}
```

**Fix:** Restart Cursor IDE completely (quit and relaunch)

### Workflows Not Found

**Verify symlink exists:**
```bash
ls -la ~/.cursor/workflows.json
```

**Fix:** Re-run setup script

### Custom MCP Servers Missing

**Verify builds exist:**
```bash
ls -la ~/Projects/my-mcp-servers/my-mcp-servers/packages/*/build/index.js
```

**Fix:** Run `npm run install-all` in my-mcp-servers directory

---

## 📖 Additional Documentation

- `config/workflows.md` - Complete workflow reference
- `config/README.md` - Configuration details
- `RECOMMENDED-EXTENSIONS.md` - Recommended Cursor extensions

---

## 🌐 Platform Support

| Platform | Status | Notes |
|----------|--------|-------|
| **macOS** | ✅ Fully Supported | Original development platform |
| **Linux** | ✅ Fully Supported | Uses same setup as macOS |
| **Windows 11** | ✅ Fully Supported | Validated and working, uses Git Bash |
| **Windows 10** | ⚠️ Expected to work | May need PowerShell 5.1 adjustments |

---

## ⚙️ Environment Variables (Optional)

### GitHub Token (for github-minimal MCP)

```bash
# macOS/Linux
echo 'export GITHUB_TOKEN=your_token_here' >> ~/.zshrc
source ~/.zshrc

# Windows (PowerShell as admin)
[Environment]::SetEnvironmentVariable("GITHUB_TOKEN", "your_token", "User")
# Then restart Cursor
```

Get token at: https://github.com/settings/tokens (scopes: repo, workflow, read:org)

---

## 🎯 Portability

This system is **fully portable** - you can:
- Place `cursor-global` anywhere on your machine
- Move it to a USB drive
- Sync via Dropbox/iCloud
- Copy to multiple machines

**Just run the setup script from wherever you place it**, and everything adapts automatically!

All scripts use self-location detection - no hardcoded paths.

---

## 🔄 Updating

```bash
cd /path/to/cursor-global
git pull origin main

# Re-run setup if configs changed
./setup.sh  # or setup-windows.ps1 on Windows

# Restart Cursor IDE
```

---

## 🤝 Contributing

Improvements welcome! Please:
1. Test thoroughly on your platform
2. Document platform-specific changes
3. Update this README if adding features

---

## 📄 License

These configurations and scripts are provided as-is for personal use. Modify freely!

---

**Last Updated:** October 15, 2025  
**Repository:** https://github.com/gjoeckel/cursor-global  
**Status:** Production Ready - 39 Tools, 12 Workflows, Cross-platform
