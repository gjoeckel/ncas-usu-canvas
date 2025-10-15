# Windows Global Configuration Refactor

**Date:** October 15, 2025  
**Purpose:** Adapt macOS-based cursor-global template for Windows OS  
**Target Machine:** `C:\Users\A00288946\`  
**Status:** 🔧 In Progress

---

## Executive Summary

This document outlines the complete refactoring plan to adapt the macOS-based cursor-global configuration repository for Windows compatibility. The goal is to create a fully portable, Windows-native global Cursor IDE configuration that maintains all functionality while adapting to Windows-specific paths, shell environments, and system behaviors.

**Key Finding:** 90% of the codebase is already compatible with Windows Git Bash. Only targeted changes needed for paths and shell configuration.

---

## Table of Contents

1. [Current State Analysis](#current-state-analysis)
2. [Windows vs macOS Differences](#windows-vs-macos-differences)
3. [Required Changes](#required-changes)
4. [Implementation Plan](#implementation-plan)
5. [Verification Checklist](#verification-checklist)
6. [Troubleshooting Guide](#troubleshooting-guide)

---

## Current State Analysis

### Repository Overview

**Location:** `C:\Users\A00288946\Desktop\cursor-global`  
**Origin:** macOS (Tahoe OS) template  
**Components:**
- 13 bash automation scripts
- 12 global workflows
- 7 MCP server configurations
- Complete session management system
- Git automation with smart merge

### Compatibility Assessment

| Component | macOS | Windows Status | Notes |
|-----------|-------|----------------|-------|
| **Bash Scripts** | ✅ | ✅ Compatible | Git Bash supports all syntax |
| **BASH_SOURCE** | ✅ | ✅ Compatible | Self-location works |
| **Symlinks (ln -s)** | ✅ | ✅ Compatible | Git Bash supports |
| **$HOME variable** | ✅ | ✅ Compatible | Works in Git Bash |
| **sed commands** | ✅ | ✅ Compatible | Git Bash sed works |
| **jq JSON processing** | ✅ | ⚠️ Needs install | Available via Git Bash |
| **Cursor config paths** | ✅ | ❌ Needs change | Different on Windows |
| **Shell config files** | .zshrc | ❌ Needs change | Use .bashrc |
| **Settings.json path** | macOS | ❌ Needs change | AppData vs Library |

**Compatibility Score:** 90% compatible, 10% needs adaptation

---

## Windows vs macOS Differences

### 1. Cursor IDE Configuration Paths

**macOS:**
```
~/.cursor/workflows.json                          # Global workflows
~/.cursor/mcp.json                                # MCP servers
~/Library/Application Support/Cursor/User/        # Settings directory
~/Library/Application Support/Cursor/User/settings.json
```

**Windows:**
```
C:\Users\A00288946\.cursor\workflows.json         # Global workflows
C:\Users\A00288946\.cursor\mcp.json              # MCP servers
C:\Users\A00288946\AppData\Roaming\Cursor\User\  # Settings directory
C:\Users\A00288946\AppData\Roaming\Cursor\User\settings.json
```

**Git Bash Equivalent (Windows):**
```bash
~/.cursor/workflows.json                          # Works! Expands to correct path
~/.cursor/mcp.json                               # Works!
$APPDATA/Cursor/User/                            # Use this variable
/c/Users/A00288946/AppData/Roaming/Cursor/User/  # OR absolute Git Bash path
```

### 2. Shell Configuration Files

**macOS (multiple options):**
```bash
~/.zshrc                    # Primary (zsh is default on macOS)
~/.bashrc                   # Alternative (bash)
~/.bash_profile             # Alternative (bash)
```

**Windows (Git Bash only):**
```bash
~/.bashrc                   # Primary (Git Bash uses bash, NOT zsh)
~/.bash_profile             # Alternative
# NO .zshrc - Windows doesn't ship with zsh
```

### 3. Environment Variables

**macOS:**
```bash
HOME=/Users/username
SHELL=/bin/zsh (or /bin/bash)
```

**Windows (Git Bash):**
```bash
HOME=/c/Users/A00288946
USERPROFILE=C:\Users\A00288946
APPDATA=C:\Users\A00288946\AppData\Roaming
SHELL=/usr/bin/bash
# NO zsh available by default
```

### 4. Path Separators

**Both Systems (in Git Bash):**
```bash
# Git Bash handles both automatically
/c/Users/A00288946/cursor-global/     ✅ Works
C:\Users\A00288946\cursor-global\     ✅ Works (converted internally)
${HOME}/cursor-global/                ✅ Works
```

---

## Required Changes

### Category A: ✅ NO CHANGES NEEDED (Already Compatible)

1. **All 13 Bash Scripts** - Git Bash syntax identical to Unix bash
2. **Self-location detection** - `BASH_SOURCE` and `dirname` work perfectly
3. **Symlink creation** - `ln -s` supported in Git Bash
4. **Environment variables** - `${HOME}` works correctly
5. **Path derivation logic** - All scripts' path calculations work
6. **Workflow automation** - Platform-agnostic
7. **Session management** - No OS-specific dependencies
8. **Git operations** - Git Bash provides full git support

### Category B: ⚠️ CHANGES REQUIRED

#### 1. setup.sh (Lines 94-138)

**Issue:** Detects and configures for zsh, which doesn't exist on Windows Git Bash

**Current Code:**
```bash
# Detect shell (lines 94-114)
SHELL_CONFIG=""
if [ -n "$ZSH_VERSION" ]; then
    SHELL_CONFIG="$HOME/.zshrc"
elif [ -n "$BASH_VERSION" ]; then
    SHELL_CONFIG="$HOME/.bashrc"
else
    case "$SHELL" in
        */zsh)
            SHELL_CONFIG="$HOME/.zshrc"
            ;;
        */bash)
            SHELL_CONFIG="$HOME/.bashrc"
            ;;
    esac
fi
```

**Required Change:**
```bash
# Windows-compatible shell detection
SHELL_CONFIG=""

# Detect OS first
OS_TYPE="$(uname -s)"
case "$OS_TYPE" in
    Linux*|Darwin*)
        # macOS/Linux - supports both zsh and bash
        if [ -n "$ZSH_VERSION" ]; then
            SHELL_CONFIG="$HOME/.zshrc"
        elif [ -n "$BASH_VERSION" ]; then
            SHELL_CONFIG="$HOME/.bashrc"
        else
            case "$SHELL" in
                */zsh) SHELL_CONFIG="$HOME/.zshrc" ;;
                */bash) SHELL_CONFIG="$HOME/.bashrc" ;;
            esac
        fi
        ;;
    MINGW*|MSYS*|CYGWIN*)
        # Windows Git Bash - only bash supported
        if [ -f "$HOME/.bashrc" ]; then
            SHELL_CONFIG="$HOME/.bashrc"
        elif [ -f "$HOME/.bash_profile" ]; then
            SHELL_CONFIG="$HOME/.bash_profile"
        else
            # Create .bashrc if it doesn't exist
            SHELL_CONFIG="$HOME/.bashrc"
            touch "$SHELL_CONFIG"
        fi
        ;;
    *)
        echo -e "${YELLOW}   ⚠️  Unknown OS type: $OS_TYPE${NC}"
        SHELL_CONFIG="$HOME/.bashrc"  # Default to bashrc
        ;;
esac
```

**Impact:** Ensures Windows users get .bashrc configuration, not .zshrc

---

#### 2. configure-cursor-autonomy.sh (Line 30)

**Issue:** Hardcoded macOS path for Cursor settings

**Current Code:**
```bash
# Line 30
CURSOR_CONFIG_DIR="$HOME/Library/Application Support/Cursor/User"
```

**Required Change:**
```bash
# Detect OS and set appropriate Cursor settings directory
OS_TYPE="$(uname -s)"
case "$OS_TYPE" in
    Darwin*)
        # macOS
        CURSOR_CONFIG_DIR="$HOME/Library/Application Support/Cursor/User"
        ;;
    MINGW*|MSYS*|CYGWIN*)
        # Windows
        CURSOR_CONFIG_DIR="$APPDATA/Cursor/User"
        ;;
    Linux*)
        # Linux
        CURSOR_CONFIG_DIR="$HOME/.config/Cursor/User"
        ;;
    *)
        echo -e "${RED}❌ Unsupported OS: $OS_TYPE${NC}"
        exit 1
        ;;
esac
```

**Impact:** Correctly places Cursor settings on Windows

---

#### 3. config/mcp.json (Lines 4-29)

**Issue:** Hardcoded macOS-specific paths to MCP server packages

**Current Code:**
```json
{
  "mcpServers": {
    "github-minimal": {
      "command": "node",
      "args": ["${HOME}/Projects/accessilist/my-mcp-servers/packages/github-minimal/build/index.js"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
      }
    }
  }
}
```

**Problem:** Path assumes specific macOS directory structure

**Solution Options:**

**Option A: Use Remote npm Packages (RECOMMENDED)**
```json
{
  "mcpServers": {
    "github-minimal": {
      "command": "npx",
      "args": ["-y", "git+https://github.com/gjoeckel/my-mcp-servers.git#main:packages/github-minimal"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
      }
    }
  }
}
```
**Benefits:** Platform-agnostic, no local clone needed, auto-updates

**Option B: Make Path Configurable**
```json
{
  "mcpServers": {
    "github-minimal": {
      "command": "node",
      "args": ["${MCP_SERVERS_PATH}/packages/github-minimal/build/index.js"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
      }
    }
  }
}
```
**Benefits:** User can specify location, works with local development

**Option C: Use Official MCP Servers Only**
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "${HOME}"]
    },
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    }
  }
}
```
**Benefits:** No custom servers needed, guaranteed compatibility

**RECOMMENDATION:** Use Option A (remote npm packages) for maximum portability

---

#### 4. Documentation Updates

**Files to Update:**

1. **README.md**
   - Add Windows-specific path examples
   - Document Git Bash requirement
   - Add Windows setup section

2. **QUICK-START.md**
   - Add Windows quick start
   - Include Git Bash installation step
   - Show Windows path examples

3. **PUBLIC-README.md**
   - Add Windows support badge
   - List Windows requirements

---

### Category C: 🆕 NEW FILES NEEDED

#### 1. setup-windows.sh

**Purpose:** Windows-specific setup wrapper with extra safety checks

**Content:**
```bash
#!/bin/bash
# Windows-Specific Cursor Global Setup
# Wraps setup.sh with Windows-specific checks and configurations

set -e

echo "🪟 Windows Cursor Global Configuration Setup"
echo "============================================="

# Verify we're on Windows
if [[ ! "$OSTYPE" =~ ^(msys|mingw|cygwin) ]]; then
    echo "❌ This script is for Windows only"
    echo "💡 For macOS/Linux, use: ./setup.sh"
    exit 1
fi

# Verify Git Bash
if ! command -v git &> /dev/null; then
    echo "❌ Git Bash not found"
    echo "📥 Install Git for Windows: https://git-scm.com/download/win"
    exit 1
fi

# Check for required tools
echo "🔍 Checking prerequisites..."

MISSING_TOOLS=()

if ! command -v node &> /dev/null; then
    MISSING_TOOLS+=("Node.js")
fi

if ! command -v jq &> /dev/null; then
    echo "⚠️  jq not found (recommended for JSON processing)"
    echo "📥 Install: https://stedolan.github.io/jq/download/"
fi

if [ ${#MISSING_TOOLS[@]} -gt 0 ]; then
    echo "❌ Missing required tools: ${MISSING_TOOLS[*]}"
    echo "📥 Install and try again"
    exit 1
fi

echo "✅ All prerequisites met"
echo ""

# Create .bashrc if it doesn't exist
if [ ! -f "$HOME/.bashrc" ]; then
    echo "📝 Creating .bashrc..."
    touch "$HOME/.bashrc"
fi

# Run main setup
echo "🚀 Running main setup script..."
./setup.sh

echo ""
echo "🪟 Windows-Specific Configuration Complete!"
echo ""
echo "⚠️  IMPORTANT - Windows-Specific Notes:"
echo "   • Git Bash must be used for all scripts"
echo "   • PowerShell is NOT compatible with these scripts"
echo "   • Use Git Bash terminal in Cursor for workflows"
echo "   • Cursor settings location: $APPDATA\\Cursor\\User\\"
echo ""
echo "🔄 Next Steps:"
echo "   1. Close and reopen Git Bash (or run: source ~/.bashrc)"
echo "   2. Restart Cursor IDE"
echo "   3. Type 'ai-start' in Cursor chat to test"
echo ""
```

#### 2. config/mcp-windows-template.json

**Purpose:** Template for Windows users to customize MCP paths

**Content:**
```json
{
  "_comment": "Windows MCP Server Configuration Template",
  "_instructions": "Replace placeholders with your actual paths or use remote npm packages",
  
  "mcpServers": {
    "github-minimal": {
      "command": "npx",
      "args": ["-y", "git+https://github.com/gjoeckel/my-mcp-servers.git#main:packages/github-minimal"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
      }
    },
    "shell-minimal": {
      "command": "npx",
      "args": ["-y", "git+https://github.com/gjoeckel/my-mcp-servers.git#main:packages/shell-minimal"],
      "env": {
        "WORKING_DIRECTORY": "${HOME}",
        "ALLOWED_COMMANDS": "npm,git,node,curl,wget,ls,cat,grep,find,mkdir,rm,cp,mv"
      }
    },
    "puppeteer-minimal": {
      "command": "npx",
      "args": ["-y", "git+https://github.com/gjoeckel/my-mcp-servers.git#main:packages/puppeteer-minimal"]
    },
    "sequential-thinking-minimal": {
      "command": "npx",
      "args": ["-y", "git+https://github.com/gjoeckel/my-mcp-servers.git#main:packages/sequential-thinking-minimal"]
    },
    "agent-autonomy": {
      "command": "npx",
      "args": ["-y", "mcp-agent-autonomy"]
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "${HOME}"],
      "env": {
        "ALLOWED_PATHS": "${HOME}",
        "READ_ONLY": "false"
      }
    },
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    }
  }
}
```

#### 3. WINDOWS-SETUP.md

**Purpose:** Complete Windows setup guide

**Content:** (See detailed guide in Implementation Plan section)

---

## Implementation Plan

### Phase 1: Prepare Repository (On Windows Machine)

**Current Location:** `C:\Users\A00288946\Desktop\cursor-global`

```bash
# Open Git Bash
cd /c/Users/A00288946/Desktop/cursor-global

# Create new Windows-specific files
touch setup-windows.sh
touch config/mcp-windows-template.json
touch WINDOWS-SETUP.md

# Make setup-windows.sh executable
chmod +x setup-windows.sh
```

---

### Phase 2: Modify Existing Files

#### 2.1 Update setup.sh

**Change Location:** Lines 94-138 (Shell configuration detection)

**Add at beginning of file (after set -e):**
```bash
# Detect operating system
OS_TYPE="$(uname -s)"
echo -e "${BLUE}🖥️  Detected OS: $OS_TYPE${NC}"
```

**Replace lines 94-114:**
```bash
# OS-aware shell configuration
SHELL_CONFIG=""
case "$OS_TYPE" in
    Linux*|Darwin*)
        # macOS/Linux - supports both zsh and bash
        if [ -n "$ZSH_VERSION" ]; then
            SHELL_CONFIG="$HOME/.zshrc"
        elif [ -n "$BASH_VERSION" ]; then
            SHELL_CONFIG="$HOME/.bashrc"
        else
            case "$SHELL" in
                */zsh) SHELL_CONFIG="$HOME/.zshrc" ;;
                */bash) SHELL_CONFIG="$HOME/.bashrc" ;;
                *) SHELL_CONFIG="" ;;
            esac
        fi
        ;;
    MINGW*|MSYS*|CYGWIN*)
        # Windows Git Bash - only bash supported
        if [ -f "$HOME/.bashrc" ]; then
            SHELL_CONFIG="$HOME/.bashrc"
        elif [ -f "$HOME/.bash_profile" ]; then
            SHELL_CONFIG="$HOME/.bash_profile"
        else
            # Create .bashrc if it doesn't exist
            echo -e "${YELLOW}   Creating .bashrc...${NC}"
            SHELL_CONFIG="$HOME/.bashrc"
            touch "$SHELL_CONFIG"
        fi
        ;;
    *)
        echo -e "${YELLOW}   ⚠️  Unknown OS type: $OS_TYPE${NC}"
        SHELL_CONFIG="$HOME/.bashrc"  # Default fallback
        ;;
esac
```

#### 2.2 Update configure-cursor-autonomy.sh

**Change Location:** Line 30

**Replace:**
```bash
CURSOR_CONFIG_DIR="$HOME/Library/Application Support/Cursor/User"
```

**With:**
```bash
# Detect OS and set appropriate Cursor settings directory
OS_TYPE="$(uname -s)"
case "$OS_TYPE" in
    Darwin*)
        CURSOR_CONFIG_DIR="$HOME/Library/Application Support/Cursor/User"
        echo -e "${BLUE}🍎 macOS detected${NC}"
        ;;
    MINGW*|MSYS*|CYGWIN*)
        CURSOR_CONFIG_DIR="$APPDATA/Cursor/User"
        echo -e "${BLUE}🪟 Windows detected${NC}"
        ;;
    Linux*)
        CURSOR_CONFIG_DIR="$HOME/.config/Cursor/User"
        echo -e "${BLUE}🐧 Linux detected${NC}"
        ;;
    *)
        echo -e "${RED}❌ Unsupported OS: $OS_TYPE${NC}"
        exit 1
        ;;
esac
```

#### 2.3 Update config/mcp.json

**Strategy:** Convert to use remote npm packages (platform-agnostic)

**Replace entire file with:**
```json
{
  "mcpServers": {
    "github-minimal": {
      "command": "npx",
      "args": ["-y", "git+https://github.com/gjoeckel/my-mcp-servers.git#main:packages/github-minimal"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
      }
    },
    "shell-minimal": {
      "command": "npx",
      "args": ["-y", "git+https://github.com/gjoeckel/my-mcp-servers.git#main:packages/shell-minimal"],
      "env": {
        "WORKING_DIRECTORY": "${HOME}",
        "ALLOWED_COMMANDS": "npm,git,node,curl,wget,ls,cat,grep,find,chmod,mkdir,rm,cp,mv"
      }
    },
    "puppeteer-minimal": {
      "command": "npx",
      "args": ["-y", "git+https://github.com/gjoeckel/my-mcp-servers.git#main:packages/puppeteer-minimal"]
    },
    "sequential-thinking-minimal": {
      "command": "npx",
      "args": ["-y", "git+https://github.com/gjoeckel/my-mcp-servers.git#main:packages/sequential-thinking-minimal"]
    },
    "agent-autonomy": {
      "command": "npx",
      "args": ["-y", "mcp-agent-autonomy"]
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "${HOME}"],
      "env": {
        "ALLOWED_PATHS": "${HOME}:${HOME}/.cursor:${HOME}/.config",
        "READ_ONLY": "false"
      }
    },
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    }
  }
}
```

**Benefits:**
- ✅ Platform-agnostic (works on Windows, macOS, Linux)
- ✅ No local cloning required
- ✅ Auto-updates from GitHub
- ✅ Same configuration across all platforms

---

### Phase 3: Create New Files

#### 3.1 Create setup-windows.sh

```bash
#!/bin/bash
# Windows-Specific Cursor Global Setup
# Verifies Windows environment and runs main setup

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  🪟 Windows Cursor Global Configuration Setup${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Verify Windows environment
OS_TYPE="$(uname -s)"
if [[ ! "$OS_TYPE" =~ ^(MINGW|MSYS|CYGWIN) ]]; then
    echo -e "${RED}❌ This script is for Windows (Git Bash) only${NC}"
    echo -e "${YELLOW}💡 Detected OS: $OS_TYPE${NC}"
    echo -e "${YELLOW}💡 For macOS/Linux, use: ./setup.sh${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Windows (Git Bash) environment detected${NC}"
echo ""

# Verify Git Bash
if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ Git not found${NC}"
    echo -e "${YELLOW}📥 Install Git for Windows: https://git-scm.com/download/win${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Git Bash available${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found (required for MCP servers)${NC}"
    echo -e "${YELLOW}📥 Install Node.js: https://nodejs.org/${NC}"
    exit 1
fi

NODE_VERSION=$(node --version)
echo -e "${GREEN}✅ Node.js available: $NODE_VERSION${NC}"

# Check jq (optional but recommended)
if ! command -v jq &> /dev/null; then
    echo -e "${YELLOW}⚠️  jq not found (recommended for JSON processing)${NC}"
    echo -e "${YELLOW}📥 Install from: https://stedolan.github.io/jq/download/${NC}"
else
    echo -e "${GREEN}✅ jq available${NC}"
fi

echo ""

# Create .bashrc if it doesn't exist
if [ ! -f "$HOME/.bashrc" ]; then
    echo -e "${YELLOW}📝 Creating .bashrc...${NC}"
    touch "$HOME/.bashrc"
    echo -e "${GREEN}✅ .bashrc created${NC}"
fi

# Run main setup script
echo -e "${BLUE}🚀 Running main setup script...${NC}"
echo ""
./setup.sh

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Windows Setup Complete!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}⚠️  WINDOWS-SPECIFIC NOTES:${NC}"
echo -e "   • Always use Git Bash for running scripts"
echo -e "   • PowerShell is NOT compatible with these bash scripts"
echo -e "   • Cursor settings: $APPDATA\\Cursor\\User\\"
echo -e "   • Global config: $HOME\\.cursor\\"
echo ""
echo -e "${YELLOW}🔄 NEXT STEPS:${NC}"
echo -e "   1. Close and reopen Git Bash terminal"
echo -e "      ${BLUE}OR run: source ~/.bashrc${NC}"
echo -e "   2. Restart Cursor IDE completely"
echo -e "   3. Type 'ai-start' in Cursor chat to test"
echo ""
```

#### 3.2 Create WINDOWS-SETUP.md

```markdown
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
# Option A: Clone from Git
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

## Support

**Documentation:**
- `README.md` - Complete setup guide
- `QUICK-START.md` - Quick reference
- `config/workflows.md` - Workflow documentation

**Common Issues:**
- Ensure Git Bash is used (not PowerShell)
- Restart Cursor after setup
- Reload .bashrc after path changes

---

**Windows Setup Complete!** 🎉

Your cursor-global configuration is now fully operational on Windows.
```

#### 3.3 Create config/mcp-windows-template.json

(Content provided in "Required Changes" section above)

---

### Phase 4: Update Documentation

#### 4.1 Update README.md

**Add Windows section after "Quick Setup" section:**

```markdown
## 🪟 Windows Setup

### Windows Prerequisites

1. **Git for Windows** (required)
   ```powershell
   # Download and install from:
   https://git-scm.com/download/win
   ```

2. **Node.js** (required for MCP servers)
   ```powershell
   # Download and install from:
   https://nodejs.org/
   ```

3. **Open Git Bash** (NOT PowerShell)
   - Use Git Bash for all commands
   - Scripts are NOT compatible with PowerShell

### Windows Quick Setup

```bash
# 1. Open Git Bash
# 2. Clone or place cursor-global anywhere
cd /c/Users/YourUsername/
git clone <repo-url> cursor-global
cd cursor-global

# 3. Run Windows setup
./setup-windows.sh

# 4. Reload shell
source ~/.bashrc

# 5. Restart Cursor IDE

# Done! ✅
```

**Windows-Specific Paths:**
```bash
# Cursor config
~/.cursor/                                  # Global config
$APPDATA/Cursor/User/                      # Cursor settings

# cursor-global installation
/c/Users/YourUsername/cursor-global/       # Example location
```

**See [WINDOWS-SETUP.md](WINDOWS-SETUP.md) for complete Windows guide.**
```

---

## Verification Checklist

### Pre-Implementation Verification

- [ ] Current location: `C:\Users\A00288946\Desktop\cursor-global`
- [ ] Git Bash installed and working
- [ ] Node.js installed (`node --version`)
- [ ] Repository contains all original files

### Post-Implementation Verification

#### Files Created
- [ ] `setup-windows.sh` exists and is executable
- [ ] `WINDOWS-SETUP.md` exists
- [ ] `config/mcp-windows-template.json` exists

#### Files Modified
- [ ] `setup.sh` has OS detection logic
- [ ] `configure-cursor-autonomy.sh` has Windows path support
- [ ] `config/mcp.json` uses remote npm packages
- [ ] `README.md` has Windows section

#### Functional Tests
- [ ] Run `./setup-windows.sh` successfully
- [ ] Verify `.bashrc` contains PATH entry
- [ ] Check symlinks: `ls -la ~/.cursor/`
- [ ] Test script access: `which session-start.sh`
- [ ] Verify workflows: `cat ~/.cursor/workflows.json`
- [ ] Test workflow in Cursor: `ai-start`

---

## Troubleshooting Guide

### Common Windows Issues

#### Issue 1: Line Ending Errors

**Symptom:**
```
bash: ./setup-windows.sh: /bin/bash^M: bad interpreter
```

**Cause:** Windows line endings (CRLF) instead of Unix (LF)

**Solution:**
```bash
# Convert line endings
dos2unix setup-windows.sh
# OR
sed -i 's/\r$//' setup-windows.sh
```

#### Issue 2: Path Not Updated

**Symptom:**
```
bash: session-start.sh: command not found
```

**Solution:**
```bash
# Reload .bashrc
source ~/.bashrc

# Verify PATH
echo $PATH | grep cursor-global

# If still missing, manually add:
echo 'export PATH="/c/Users/A00288946/cursor-global/scripts:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

#### Issue 3: Symlinks Not Created

**Symptom:**
```
ls ~/.cursor/
# workflows.json and mcp.json are missing
```

**Solution:**
```bash
# Create manually
ln -sf "$PWD/config/workflows.json" ~/.cursor/workflows.json
ln -sf "$PWD/config/mcp.json" ~/.cursor/mcp.json

# Verify
ls -la ~/.cursor/
```

#### Issue 4: MCP Servers Won't Start

**Symptom:**
```
MCP tools not working in Cursor
```

**Solution:**
```bash
# Test Node.js
node --version

# Test npx
npx --version

# Check MCP config syntax
cat ~/.cursor/mcp.json | jq '.'

# Restart Cursor completely
```

---

## Testing Plan

### Test 1: Windows Environment Detection

```bash
cd cursor-global
./setup-windows.sh

# Expected output:
# ✅ Windows (Git Bash) environment detected
# ✅ Git Bash available
# ✅ Node.js available: vX.X.X
```

### Test 2: Shell Configuration

```bash
cat ~/.bashrc | grep cursor-global

# Expected output:
# export PATH="/c/Users/A00288946/cursor-global/scripts:$PATH"
```

### Test 3: Symlink Creation

```bash
ls -la ~/.cursor/

# Expected output:
# workflows.json -> /c/Users/A00288946/cursor-global/config/workflows.json
# mcp.json -> /c/Users/A00288946/cursor-global/config/mcp.json
```

### Test 4: Script Accessibility

```bash
which session-start.sh

# Expected output:
# /c/Users/A00288946/cursor-global/scripts/session-start.sh
```

### Test 5: Workflow Availability

```bash
cat ~/.cursor/workflows.json | jq 'keys'

# Expected output (should include):
# "ai-start", "ai-end", "ai-local-commit", "mcp-health", etc.
```

### Test 6: End-to-End Test

```bash
# In Cursor IDE chat, type:
ai-start

# Expected: Session context loads with project info and MCP status
```

---

## Success Criteria

✅ **Setup Complete When:**

1. `setup-windows.sh` runs without errors
2. `.bashrc` contains cursor-global PATH entry
3. Symlinks created in `~/.cursor/`
4. Scripts accessible from PATH
5. Workflows visible in Cursor
6. `ai-start` workflow executes successfully
7. MCP servers configured (even if not running yet)

✅ **Full Functionality When:**

1. All above criteria met
2. MCP servers start successfully in Cursor
3. Global workflows execute in Cursor chat
4. Session management scripts work
5. Git workflows function correctly

---

## Timeline Estimate

**Implementation:** 30-45 minutes
- Create new files: 15 minutes
- Modify existing files: 15 minutes
- Testing and verification: 15 minutes

**User Setup (New Machine):** 5-10 minutes
- Run setup-windows.sh: 2 minutes
- Reload shell & restart Cursor: 3 minutes
- Verification: 5 minutes

---

## Conclusion

This refactoring plan provides complete Windows compatibility while maintaining:
- ✅ **Portability** - Works anywhere on Windows filesystem
- ✅ **Compatibility** - 90% of code unchanged
- ✅ **Simplicity** - Single setup command
- ✅ **Cross-platform** - Same workflows on macOS and Windows

**Key Achievement:** Platform-agnostic global Cursor configuration that works identically on Windows and macOS with minimal code changes.

---

**Status:** 📋 Documentation Complete - Ready for Implementation  
**Next Step:** Execute Phase 1-4 of Implementation Plan  
**Expected Outcome:** Fully functional Windows cursor-global configuration

