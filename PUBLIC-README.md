# Cursor Global Configuration

**Portable Cursor IDE setup for AI-assisted development with workflows, MCP servers, and automation.**

## 🎯 What This Provides

- **12 Global Workflows** (ai-start, ai-end, ai-local-commit, etc.)
- **39 MCP Tools** (filesystem, memory, GitHub, shell, browser automation)
- **Autonomous AI Development** (YOLO mode with zero confirmations)
- **Smart Git Workflows** (conflict-free merges, auto-changelog updates)
- **Session Management** (context preservation across sessions)

## 🚀 Quick Setup

### 1. Clone & Setup
```bash
git clone https://github.com/yourusername/cursor-global.git
cd cursor-global
chmod +x setup.sh
./setup.sh
```

### 2. Restart Cursor IDE
- Quit Cursor completely (`Cmd+Q` / `Ctrl+Q`)
- Reopen Cursor
- Verify MCP servers are running (check status in Cursor settings)

### 3. Test Installation
Type in Cursor chat: `ai-start` - should load session context

## 📋 Manual Setup (If AI Can't Auto-Execute)

If your Cursor AI agent requires manual authorization for each action:

### Step 1: Copy Configuration Files
```bash
# Copy workflows
cp config/workflows.json ~/.cursor/workflows.json

# Copy MCP configuration
cp config/mcp.json ~/.cursor/mcp.json

# Copy settings
cp config/settings.json ~/Library/Application\ Support/Cursor/User/settings.json
```

### Step 2: Install Scripts
```bash
# Create scripts directory
mkdir -p ~/.local/bin/cursor-tools

# Copy and make executable
cp scripts/*.sh ~/.local/bin/cursor-tools/
chmod +x ~/.local/bin/cursor-tools/*.sh

# Add to PATH (add to ~/.zshrc or ~/.bash_profile)
echo 'export PATH="$PATH:~/.local/bin/cursor-tools"' >> ~/.zshrc
source ~/.zshrc
```

### Step 3: Install MCP Servers
```bash
# Install required packages
npm install -g @modelcontextprotocol/server-filesystem
npm install -g @modelcontextprotocol/server-memory

# Clone custom MCP servers (optional - for GitHub, shell, browser tools)
git clone https://github.com/gjoeckel/my-mcp-servers.git
cd my-mcp-servers
npm install
npm run build
```

### Step 4: Restart Cursor
- Quit Cursor completely
- Reopen Cursor
- Check MCP servers are running

## 🔑 Post-Installation Setup

### GitHub Personal Access Token (Required)
1. Go to https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Select scopes: `repo`, `workflow`, `read:org`
4. Add to your shell profile:
   ```bash
   echo 'export GITHUB_TOKEN=your_token_here' >> ~/.zshrc
   source ~/.zshrc
   ```

### Optional: Custom MCP Servers (Enhanced Features)
For GitHub, shell, and browser automation tools:
```bash
git clone https://github.com/gjoeckel/my-mcp-servers.git
cd my-mcp-servers
npm install
npm run build
```

### Optional: Anthropic API Key (Enhanced AI)
1. Get key at: https://console.anthropic.com/
2. Add to shell profile:
   ```bash
   echo 'export ANTHROPIC_API_KEY=your_key_here' >> ~/.zshrc
   source ~/.zshrc
   ```

## ✅ Verification

After setup, test these workflows in Cursor chat:
- `ai-start` - Load session context
- `mcp-health` - Check MCP server status
- `ai-local-commit` - Commit with changelog
- `ai-end` - Save session context

**Your Cursor AI agent can guide you through all these setup steps!**

## 🔧 Troubleshooting

**MCP servers not starting?**
- Check `~/.cursor/mcp.json` exists
- Verify npm packages installed
- Restart Cursor IDE

**Workflows not found?**
- Check `~/.cursor/workflows.json` exists
- Verify scripts are in PATH: `which session-start.sh`

**Permission errors?**
- Make scripts executable: `chmod +x ~/.local/bin/cursor-tools/*.sh`

## 📚 What You Get

### Global Workflows (12)
- `ai-start` - Initialize AI session
- `ai-end` - Save session context
- `ai-local-commit` - Smart git commits
- `ai-local-merge` - Conflict-free merges
- `mcp-health` - Check MCP status
- And 7 more...

### MCP Tools (39)
- **Filesystem** (15 tools) - File operations
- **Memory** (8 tools) - Knowledge graph
- **GitHub** (4 tools) - Repository operations
- **Shell** (4 tools) - Terminal commands
- **Browser** (4 tools) - Web automation
- **Thinking** (4 tools) - Problem solving

### Features
- **Autonomous Development** - AI works without confirmations
- **Smart Git** - Automatic changelog updates, conflict prevention
- **Session Persistence** - Context preserved across sessions
- **Portable** - Works on any machine, any location

## 🎯 Perfect For

- **AI-assisted development** with maximum autonomy
- **Consistent workflows** across multiple machines
- **Smart git operations** with automatic changelog management
- **MCP-powered development** with 39+ tools
- **Session management** for complex projects

---

**Ready to supercharge your Cursor IDE experience!** 🚀
