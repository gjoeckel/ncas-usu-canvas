# Cursor Global - Windows Setup Guide

**Last Updated:** October 15, 2025  
**Windows Version Tested:** Windows 10/11  
**Status:** ✅ Fully Functional

---

## 🎯 Overview

This guide explains how to install cursor-global on Windows machines. The setup uses **Git Bash** to run the automation scripts while maintaining full Windows compatibility.

---

## ✅ Prerequisites

### Required Software

1. **Git for Windows** (includes Git Bash)
   - Download: https://git-scm.com/download/win
   - ✅ Verified working: Git v2.51.0
   - Includes Git Bash (required for running .sh scripts)

2. **Node.js** v16 or higher
   - Download: https://nodejs.org/
   - ✅ Verified working: Node.js v22.20.0
   - Includes npx (required for MCP servers)

3. **PowerShell** 5.1 or higher
   - Included with Windows 10/11
   - Used for installation and management

### Optional Tools

- **jq** - JSON processor (improves MCP diagnostics)
  - Download: https://stedolan.github.io/jq/download/
  - Not required, but recommended

---

## 🚀 Quick Start (5 Minutes)

### Option A: Automated Setup (Recommended)

```powershell
# 1. Clone or download cursor-global
cd C:\Users\YOUR_USERNAME\Projects
git clone https://github.com/gjoeckel/cursor-global.git
cd cursor-global

# 2. Run Windows setup script
.\setup-windows.ps1

# 3. Restart Cursor IDE

# Done! ✅
```

### Option B: Manual Setup

```powershell
# 1. Create .cursor directory
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.cursor"

# 2. Copy MCP config (create manually - see below)

# 3. Copy workflows config (create manually - see below)

# 4. Make scripts executable
& "C:\Program Files\Git\bin\bash.exe" -c "cd ./scripts && chmod +x *.sh"

# 5. Restart Cursor IDE
```

---

## 📁 Installation Locations

### Default Paths

```
C:\Users\YOUR_USERNAME\
├── .cursor\                     # Cursor IDE configuration
│   ├── mcp.json                # MCP server config (created by setup)
│   └── workflows.json          # Global workflows (created by setup)
│
└── Projects\
    └── cursor-global\          # Main installation
        ├── config\
        ├── scripts\
        └── changelogs\
```

**Note:** cursor-global can be placed ANYWHERE on your system. The setup script auto-detects its location.

---

## 🔧 Configuration Details

### 1. MCP Configuration (`~/.cursor/mcp.json`)

**Windows Version (Official Servers Only):**

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "C:\\Users\\YOUR_USERNAME"
      ],
      "env": {
        "ALLOWED_PATHS": "C:\\Users\\YOUR_USERNAME",
        "READ_ONLY": "false"
      }
    },
    "memory": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-memory"
      ]
    }
  }
}
```

**Tools Available:**
- ✅ 15 filesystem tools (file operations)
- ✅ 8 memory tools (knowledge storage)
- **Total: 23 tools**

**Custom MCP Servers:**
- The original macOS config includes 5 custom servers (16 additional tools)
- These require building from source: https://github.com/gjoeckel/my-mcp-servers
- **Recommended:** Start with official servers, add custom later if needed

---

### 2. Workflows Configuration (`~/.cursor/workflows.json`)

**Key Difference:** Windows requires full path to Git Bash executable.

**Example Workflow:**

```json
{
  "ai-start": {
    "description": "Load AI session context and initialize environment",
    "commands": [
      "C:\\Users\\A00288946\\AppData\\Local\\Programs\\Git\\bin\\bash.exe C:\\Users\\A00288946\\Projects\\cursor-global\\scripts\\session-start.sh"
    ],
    "auto_approve": true,
    "timeout": 30000,
    "on_error": "continue"
  }
}
```

**Your bash.exe path might differ:**
- Standard: `C:\Program Files\Git\bin\bash.exe`
- Portable: `C:\Users\USERNAME\AppData\Local\Programs\Git\bin\bash.exe`
- Find yours: `where.exe bash` in PowerShell

The `setup-windows.ps1` script auto-detects your bash.exe location.

---

## 🎯 Available Workflows

All 12 global workflows work on Windows:

| Workflow | Description | Status |
|----------|-------------|--------|
| `ai-start` | Load session context | ✅ Working |
| `ai-end` | Save session & changelog | ✅ Working |
| `ai-update` | Record progress | ✅ Working |
| `ai-repeat` | Reload context | ✅ Working |
| `ai-clean` | Clean temp files | ✅ Windows version |
| `ai-compress` | Compress context | ✅ Working |
| `mcp-health` | Check MCP status | ✅ Working* |
| `mcp-restart` | Restart MCP servers | ✅ Working* |
| `ai-local-commit` | Commit with changelog | ✅ Working |
| `ai-local-merge` | Smart merge | ✅ Working |
| `ai-merge-finalize` | Finalize merge | ✅ Working |
| `ai-docs-sync` | Generate workflows.md | ✅ Working |

*MCP workflows show warnings about `pgrep` command (Linux-only), but still function correctly.

---

## 🧪 Testing Your Installation

### Test 1: Verify Cursor Configuration

```powershell
# Check .cursor directory
dir $env:USERPROFILE\.cursor

# Expected output:
# mcp.json
# workflows.json
```

### Test 2: Run ai-start Workflow

```
1. Open Cursor IDE
2. Open any project
3. In Cursor chat, type: ai-start
4. Should see context loading output
```

### Test 3: Test MCP Tools

```
1. In Cursor chat, ask AI to: "Read the package.json file"
2. AI should use filesystem MCP tools
3. Should see file contents returned
```

### Test 4: Run Script Directly

```powershell
# From PowerShell
& "C:\Users\YOUR_USERNAME\AppData\Local\Programs\Git\bin\bash.exe" `
  C:\Users\YOUR_USERNAME\Projects\cursor-global\scripts\session-start.sh
```

---

## 🐛 Troubleshooting

### Issue: Workflows Don't Appear in Cursor

**Solution:**
```powershell
# 1. Verify workflows.json exists
Test-Path "$env:USERPROFILE\.cursor\workflows.json"

# 2. Check file content
Get-Content "$env:USERPROFILE\.cursor\workflows.json"

# 3. Restart Cursor IDE (completely quit and reopen)
```

---

### Issue: Bash Script Execution Fails

**Symptoms:** Error about "bash" not recognized

**Solution:**
```powershell
# Find your bash.exe location
where.exe bash

# Update workflows.json with correct path
# Example: C:\Program Files\Git\bin\bash.exe
```

---

### Issue: MCP Servers Not Starting

**Symptoms:** MCP tools don't work, filesystem/memory operations fail

**Solution:**
```powershell
# 1. Verify Node.js and npx
node --version
npx --version

# 2. Check mcp.json exists
Test-Path "$env:USERPROFILE\.cursor\mcp.json"

# 3. Manually test MCP server
npx -y @modelcontextprotocol/server-memory

# 4. Restart Cursor IDE
```

---

### Issue: Scripts Report Missing Commands

**Symptoms:** Warnings about `pgrep`, `jq`, or other commands

**Status:** ⚠️ **Expected behavior on Windows**

These are Linux/macOS commands not available in Git Bash. The scripts still function correctly despite these warnings.

**Optional Improvements:**
- Install `jq` for better JSON processing
- Install Git Bash utilities (busybox)

---

### Issue: Path Issues in Scripts

**Symptoms:** Scripts can't find files, "No such file or directory"

**Solution:**

The scripts use `${BASH_SOURCE[0]}` for portable path detection. This works on Windows Git Bash automatically, but paths are converted to Unix-style:

```
Windows: C:\Users\A00288946\Projects\cursor-global
Git Bash: /c/Users/A00288946/Projects/cursor-global
```

This is **normal** and handled automatically by Git Bash.

---

## 🔄 Updating Cursor Global

### Pull Latest Changes

```powershell
cd C:\Users\YOUR_USERNAME\Projects\cursor-global
git pull origin main
```

### Re-run Setup (If Needed)

```powershell
.\setup-windows.ps1
```

### Restart Cursor IDE

---

## 📊 Windows vs macOS/Linux Differences

| Feature | macOS/Linux | Windows | Notes |
|---------|-------------|---------|-------|
| **Setup Script** | `setup.sh` | `setup-windows.ps1` | PowerShell version |
| **Script Execution** | Native bash | Git Bash | Requires full path |
| **Path Format** | `~/cursor-global/` | `C:\Users\...\cursor-global\` | Auto-detected |
| **MCP Servers** | All 7 servers | 2 official servers | Custom servers optional |
| **Tool Count** | 39 tools | 23 tools | Filesystem + Memory |
| **ai-clean** | Unix commands | PowerShell version | Fully functional |
| **Workflows** | 12 workflows | 12 workflows | All working |

---

## 🚀 Advanced Configuration

### Adding Custom MCP Servers

1. Clone the custom MCP servers repo:
   ```powershell
   cd C:\Users\YOUR_USERNAME\Projects
   git clone https://github.com/gjoeckel/my-mcp-servers.git
   cd my-mcp-servers
   ```

2. Install dependencies:
   ```powershell
   npm install
   npm run build
   ```

3. Update `mcp.json` to include custom servers:
   ```json
   {
     "mcpServers": {
       "github-minimal": {
         "command": "node",
         "args": ["C:\\Users\\YOUR_USERNAME\\Projects\\my-mcp-servers\\packages\\github-minimal\\build\\index.js"],
         "env": {
           "GITHUB_PERSONAL_ACCESS_TOKEN": "your_token_here"
         }
       }
     }
   }
   ```

4. Restart Cursor IDE

---

### Environment Variables

**For GitHub MCP Server:**
```powershell
# Set user environment variable
[Environment]::SetEnvironmentVariable("GITHUB_TOKEN", "your_token_here", "User")

# Or add to PowerShell profile
echo '$env:GITHUB_TOKEN = "your_token_here"' >> $PROFILE
```

**For Shell MCP Server:**
```powershell
[Environment]::SetEnvironmentVariable("ALLOWED_COMMANDS", "npm,git,node,powershell", "User")
```

---

### Adding Scripts to PATH

**Option 1: System PATH (Recommended)**
```powershell
$currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
$newPath = "C:\Users\YOUR_USERNAME\Projects\cursor-global\scripts;$currentPath"
[Environment]::SetEnvironmentVariable("Path", $newPath, "User")
```

**Option 2: PowerShell Profile**
```powershell
# Add to $PROFILE
$env:PATH += ";C:\Users\YOUR_USERNAME\Projects\cursor-global\scripts"
```

**Option 3: Git Bash Profile**
```bash
# Add to ~/.bashrc (Git Bash)
export PATH="/c/Users/YOUR_USERNAME/Projects/cursor-global/scripts:$PATH"
```

---

## 📖 Documentation

**Windows-Specific:**
- This file: `WINDOWS-SETUP.md`
- Setup script: `setup-windows.ps1`

**General:**
- Main README: `README.md`
- Quick Start: `QUICK-START.md`
- Workflows: `config/workflows.md`

---

## 🎯 Next Steps

1. ✅ Install cursor-global using `setup-windows.ps1`
2. ✅ Restart Cursor IDE
3. ✅ Test `ai-start` workflow
4. ✅ Verify MCP tools work
5. 🔧 Optional: Add custom MCP servers
6. 🔧 Optional: Install jq for better diagnostics
7. 🔧 Optional: Add scripts to PATH

---

## ✨ Success Criteria

Your installation is complete when:

- ✅ `ai-start` workflow loads context successfully
- ✅ MCP filesystem tools can read/write files
- ✅ MCP memory tools can store/retrieve data
- ✅ Git workflows can commit and merge
- ✅ No errors in Cursor (warnings about pgrep are OK)

---

## 🤝 Support

**Issues?**
- Check troubleshooting section above
- Review script output for specific errors
- Ensure Git Bash and Node.js are properly installed

**Improvements?**
- Submit issues or PRs to the repository
- Share Windows-specific optimizations

---

**Last Tested:** October 15, 2025  
**Platform:** Windows 10 Build 26100  
**Git Version:** 2.51.0.windows.2  
**Node Version:** v22.20.0  
**Status:** ✅ Fully Functional

---

**🎉 Enjoy your Windows-compatible cursor-global setup!**


