# Cursor Global - Quick Start Guide

**✨ Place it ANYWHERE - Desktop, Documents, USB drive, anywhere!**

## 🚀 30-Second Setup (New Machine)

```bash
# 1. Place cursor-global WHEREVER YOU WANT
#    Examples:
#    ~/cursor-global/           ✅ Home
#    ~/Desktop/cursor-global/   ✅ Desktop
#    ~/Documents/cursor-global/ ✅ Documents
#    /Volumes/USB/cursor-global/✅ USB drive

# 2. Navigate to it
cd /wherever/you/put/cursor-global

# 3. Run setup (auto-detects location!)
./setup.sh

# 4. Reload shell
source ~/.zshrc  # or ~/.bashrc

# 5. Restart Cursor IDE

# Done! ✅
```

**Setup auto-detects where you placed it and configures everything!**

---

## 💡 Essential Commands

### In Cursor Chat (Type These)
```
ai-start          # Start new AI session
ai-local-commit   # Commit changes
ai-local-merge    # Merge branch to main
ai-end            # End session
```

### In Terminal
```bash
session-start.sh      # Load context
git-local-commit.sh   # Commit with changelog
git-local-merge.sh    # Smart merge
mcp-health            # Check MCP status
```

---

## 📁 Key Locations

**Note:** Paths adapt to wherever you place cursor-global!

```
/your/path/cursor-global/config/workflows.json  # Global workflows
/your/path/cursor-global/scripts/               # All automation scripts
/your/path/cursor-global/changelogs/            # Session summaries
~/.cursor/workflows.json                        # → Symlink to your config/
```

**Example:** If you place it on Desktop:
```
~/Desktop/cursor-global/config/workflows.json   # Actual location
~/.cursor/workflows.json → ~/Desktop/cursor-global/config/workflows.json
```

---

## 🔧 Common Tasks

### Start Working
```
1. Open Cursor IDE
2. Type: ai-start
3. Start coding!
```

### Commit & Merge
```bash
# On feature branch
ai-local-commit        # Commits all changes

# Ready to merge
ai-local-merge         # Merges to main, deletes branch
```

### Check MCP Servers
```
mcp-health             # Quick status
mcp-restart            # Restart if needed
```

---

## 📖 Full Documentation

See **[README.md](README.md)** for complete documentation.

---

## 🐛 Quick Fixes

### Workflows not showing?
```bash
ls -la ~/.cursor/workflows.json  # Should be a symlink
# If not:
ln -sf ~/cursor-global/config/workflows.json ~/.cursor/workflows.json
# Restart Cursor IDE
```

### Scripts not found?
```bash
echo $PATH | grep cursor-global  # Should be there
# If not:
echo 'export PATH="$HOME/cursor-global/scripts:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

---

**Need Help?** Check **[README.md](README.md)** → Troubleshooting section
