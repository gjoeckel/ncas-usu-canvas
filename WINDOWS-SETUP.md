# Cursor Global - Windows Setup Guide

**Platform:** Windows 10/11  
**Shell:** Git Bash (required)  
**Status:** ✅ Full Windows Support

---

## Prerequisites

### Required Software

1. **Git for Windows** (includes Git Bash)
   - Download: https://git-scm.com/download/win
   - ✅ Install with default options
   - ✅ Ensure "Git Bash" is selected during installation

2. **Node.js** (LTS version)
   - Download: https://nodejs.org/
   - ✅ Required for MCP servers
   - ✅ Version 18.x or higher recommended

3. **Cursor IDE**
   - Download: https://cursor.sh/
   - ✅ Latest version recommended

### Optional (Recommended)

4. **jq** (JSON processor)
   - Download: https://stedolan.github.io/jq/download/
   - 💡 Helpful for JSON processing in scripts

---

## Quick Setup (5 Minutes)

### Step 1: Clone or Download Repository

```bash
# Option A: Clone from Git (in Git Bash)
cd /c/Users/A00288946/
git clone <repository-url> cursor-global
cd cursor-global

# Option B: Extract downloaded archive
cd /c/Users/A00288946/Desktop/
# Extract cursor-global.zip here
cd cursor-global
```

### Step 2: Run Windows Setup

```bash
# From Git Bash in cursor-global directory
./setup-windows.sh
```

**What this does:**
- ✅ Verifies Git Bash environment
- ✅ Checks Node.js installation
- ✅ Creates `.bashrc` if needed
- ✅ Runs main setup script
- ✅ Configures PATH for scripts
- ✅ Creates symlinks for Cursor config

### Step 3: Reload Shell

```bash
# Option A: Reload current terminal
source ~/.bashrc

# Option B: Close and reopen Git Bash
```

### Step 4: Restart Cursor IDE

- ✅ Quit Cursor completely
- ✅ Reopen Cursor
- ✅ Verify MCP servers are loading

### Step 5: Test Installation

```bash
# In Cursor chat, type:
ai-start

# Should load session context and show MCP status
```

---

## Windows-Specific Paths

### Cursor Configuration Locations

**Global Configuration:**
```
C:\Users\A00288946\.cursor\workflows.json      # Global workflows
C:\Users\A00288946\.cursor\mcp.json           # MCP servers
```

**Git Bash Equivalent:**
```bash
~/.cursor/workflows.json
~/.cursor/mcp.json
```

**Cursor Settings:**
```
C:\Users\A00288946\AppData\Roaming\Cursor\User\settings.json
```

**Git Bash Equivalent:**
```bash
$APPDATA/Cursor/User/settings.json
```

### cursor-global Installation

**Recommended Locations:**

```bash
# Option 1: User home directory (recommended)
/c/Users/A00288946/cursor-global/

# Option 2: Desktop (for easy access)
/c/Users/A00288946/Desktop/cursor-global/

# Option 3: Documents
/c/Users/A00288946/Documents/cursor-global/
```

**All work identically** - setup auto-detects location!

---

## Shell Configuration

### Windows Uses .bashrc (NOT .zshrc)

**macOS:** Uses `.zshrc` (zsh shell)  
**Windows:** Uses `.bashrc` (Git Bash shell)

**Location:**
```bash
# Git Bash path
~/.bashrc

# Windows path
C:\Users\A00288946\.bashrc
```

**What's added by setup:**
```bash
# Cursor Global Scripts (auto-detected location)
export PATH="/c/Users/A00288946/cursor-global/scripts:$PATH"
```

---

## Troubleshooting

### Issue 1: "bash: ./setup-windows.sh: Permission denied"

**Solution:**
```bash
# In Git Bash:
chmod +x setup-windows.sh
./setup-windows.sh
```

### Issue 2: "Git Bash not found"

**Solution:**
1. Install Git for Windows: https://git-scm.com/download/win
2. During installation, ensure "Git Bash Here" is selected
3. Restart and try again

### Issue 3: "Node.js not found"

**Solution:**
1. Install Node.js LTS: https://nodejs.org/
2. Restart Git Bash terminal
3. Verify: `node --version`

### Issue 4: Scripts not found after setup

**Solution:**
```bash
# Reload .bashrc
source ~/.bashrc

# Verify PATH
echo $PATH | grep cursor-global

# Should show: .../cursor-global/scripts:...
```

### Issue 5: MCP servers not starting

**Solution:**
```bash
# Test Node.js
node --version

# Test npx
npx --version

# Check MCP config
cat ~/.cursor/mcp.json

# Restart Cursor IDE completely
```

### Issue 6: Symlinks not working

**Solution:**
```bash
# Verify symlinks exist
ls -la ~/.cursor/

# Should show:
# workflows.json -> /c/Users/A00288946/cursor-global/config/workflows.json
# mcp.json -> /c/Users/A00288946/cursor-global/config/mcp.json

# If missing, re-run setup
./setup-windows.sh
```

### Issue 7: Line ending errors (^M bad interpreter)

**Solution:**
```bash
# Convert Windows (CRLF) to Unix (LF) line endings
dos2unix setup-windows.sh setup.sh
# OR
sed -i 's/\r$//' setup-windows.sh
sed -i 's/\r$//' setup.sh
```

---

## Important Windows Notes

### ✅ DO Use Git Bash

All scripts require Git Bash:
- ✅ Git Bash terminal
- ✅ Git Bash in Cursor integrated terminal
- ✅ Git Bash for running workflows

### ❌ DON'T Use PowerShell

These scripts are NOT compatible with:
- ❌ PowerShell
- ❌ Command Prompt (cmd.exe)
- ❌ WSL (different environment)

### Environment Variables

**Available in Git Bash:**
```bash
$HOME                   # /c/Users/A00288946
$APPDATA                # C:\Users\A00288946\AppData\Roaming
$USERPROFILE            # C:\Users\A00288946
```

**Use in scripts:**
```bash
$HOME/.cursor/          # Recommended (portable)
$APPDATA/Cursor/        # For Cursor settings
```

---

## Verification Checklist

After setup, verify these work:

### ✅ Shell Configuration
```bash
# Should show cursor-global/scripts
echo $PATH | grep cursor-global
```

### ✅ Symlinks Created
```bash
ls -la ~/.cursor/workflows.json
ls -la ~/.cursor/mcp.json
# Both should show as symbolic links
```

### ✅ Scripts Accessible
```bash
which session-start.sh
# Should show: /c/Users/A00288946/cursor-global/scripts/session-start.sh
```

### ✅ Workflows Available
```bash
cat ~/.cursor/workflows.json | grep -c "ai-start"
# Should return: 1
```

### ✅ MCP Config Valid
```bash
cat ~/.cursor/mcp.json | jq '.mcpServers | keys'
# Should list all MCP servers
```

---

## Next Steps

Once setup is complete:

1. **Configure Git (if not already done)**
   ```bash
   git config --global user.name "Your Name"
   git config --global user.email "your.email@example.com"
   ```

2. **Set up GitHub token (for GitHub MCP)**
   ```bash
   echo 'export GITHUB_TOKEN="your_github_token"' >> ~/.bashrc
   source ~/.bashrc
   ```

3. **Customize workflows** (optional)
   - Edit: `cursor-global/config/workflows.json`
   - Add project-specific workflows

4. **Start using global workflows**
   ```
   In Cursor chat:
   - ai-start      # Load session
   - mcp-health    # Check MCP status
   - ai-end        # Save session
   ```

---

## Available Global Workflows

Once setup is complete, these workflows are available in ALL Cursor projects:

### AI Session Management
- **ai-start** - Load session context and initialize environment
- **ai-end** - Save session context and generate changelog
- **ai-update** - Record mid-session progress checkpoint
- **ai-repeat** - Reload session context
- **ai-compress** - Compress session context into summary

### Git Operations
- **ai-local-commit** - Commit with automatic changelog update
- **ai-local-merge** - Smart merge with conflict prevention
- **ai-merge-finalize** - Complete merge after manual conflict resolution
- **ai-docs-sync** - Generate workflows.md documentation

### MCP Management
- **mcp-health** - Check MCP server health and status
- **mcp-restart** - Restart all MCP servers

### Utilities
- **ai-clean** - Clean temporary files and logs

---

## Support

**Documentation:**
- `README.md` - Complete setup guide
- `QUICK-START.md` - Quick reference
- `config/workflows.md` - Workflow documentation
- `windows-global-refactor.md` - Windows adaptation details

**Common Issues:**
- Ensure Git Bash is used (not PowerShell)
- Restart Cursor after setup
- Reload .bashrc after path changes
- Check line endings if getting interpreter errors

---

**Windows Setup Complete!** 🎉

Your cursor-global configuration is now fully operational on Windows.

**Type `ai-start` in Cursor chat to begin your AI-assisted development session!**

