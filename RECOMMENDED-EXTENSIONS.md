# Cursor IDE - Recommended Extensions

**For cursor-global portable configuration**

This guide lists recommended Cursor/VS Code extensions that enhance the AI-assisted development workflow, especially for the automated Git workflows and MCP integration.

---

## 📊 Currently Installed ✅

**Status:** All recommended extensions installed!

### Git & GitHub
✅ **GitHub Pull Requests** (github.vscode-pull-request-github) - v0.108.0
✅ **GitLens** (eamodio.gitlens) - v17.6.1
✅ **Git Graph** (mhutchie.git-graph) - v1.30.0

### Development
✅ **Prettier** (esbenp.prettier-vscode) - v11.0.0
✅ **Error Lens** (usernamehw.errorlens) - v3.26.0

### Bash/Shell (For Your Scripts!)
✅ **ShellCheck** (timonwong.shellcheck) - v0.38.3
✅ **Bash IDE** (mads-hartmann.bash-ide-vscode) - v1.43.0

### Markdown
✅ **Markdown All in One** (yzhang.markdown-all-in-one) - v3.6.2

### Docker (Already Had)
✅ **Docker** (ms-azuretools.vscode-docker) - v2.0.0
✅ **Dev Containers** (ms-azuretools.vscode-containers) - v2.1.0

**Total:** 10 extensions installed

---

## 🎯 Highly Recommended Extensions

### 1. Git & GitHub Integration

#### **GitHub Pull Requests and Issues**
- **ID:** `GitHub.vscode-pull-request-github`
- **Why:** Essential for GitHub workflow integration
- **Features:**
  - Create/review PRs directly in Cursor
  - Browse and manage issues
  - Perfect complement to your `ai-local-commit` and `ai-local-merge` workflows
  - View PR diffs and comments inline

#### **GitLens**
- **ID:** `eamodio.gitlens`
- **Why:** Supercharges Git capabilities
- **Features:**
  - Inline blame annotations
  - Visual file history
  - Compare branches/commits
  - Works great with your automated Git workflows
  - See who changed what and when

#### **Git Graph**
- **ID:** `mhutchie.git-graph`
- **Why:** Visual Git branch management
- **Features:**
  - Visual branch history
  - Easy branch comparisons
  - Helpful for understanding merge history
  - Complements your `ai-local-merge` workflow

### 2. Development Workflow

#### **Prettier - Code Formatter**
- **ID:** `esbenp.prettier-vscode`
- **Why:** Consistent code formatting
- **Features:**
  - Auto-format on save
  - Supports JS, CSS, JSON, MD, etc.
  - Works well with AI-generated code

#### **ESLint**
- **ID:** `dbaeumer.vscode-eslint`
- **Why:** JavaScript/TypeScript linting
- **Features:**
  - Real-time error detection
  - Auto-fix common issues
  - Essential for JS projects

#### **EditorConfig**
- **ID:** `EditorConfig.EditorConfig`
- **Why:** Consistent formatting across teams
- **Features:**
  - Maintains coding styles
  - Works across different editors
  - Useful for multi-machine setups

### 3. Markdown & Documentation

#### **Markdown All in One**
- **ID:** `yzhang.markdown-all-in-one`
- **Why:** Enhanced markdown editing
- **Features:**
  - Table of contents generation
  - Preview
  - Perfect for your extensive .md documentation

#### **Markdown Preview Enhanced**
- **ID:** `shd101wyy.markdown-preview-enhanced`
- **Why:** Better markdown preview
- **Features:**
  - Live preview
  - Export to PDF/HTML
  - Great for README files

### 4. Remote & Container Development

#### **Remote - SSH**
- **ID:** `ms-vscode-remote.remote-ssh`
- **Why:** Work on remote machines
- **Features:**
  - SSH into remote servers
  - Run cursor-global from anywhere
  - Perfect for multi-machine setup

#### **Already Installed: Docker + Dev Containers** ✅
- You're all set for Docker development!
- Works perfectly with your `docker-compose.yml`

### 5. AI & Productivity

#### **Better Comments**
- **ID:** `aaron-bond.better-comments`
- **Why:** Categorize comments
- **Features:**
  - Color-coded comments (TODO, FIXME, etc.)
  - Helps organize AI-assisted code reviews

#### **Error Lens**
- **ID:** `usernamehw.errorlens`
- **Why:** Inline error messages
- **Features:**
  - Show errors right in the editor
  - Faster debugging
  - Great for AI code generation review

#### **Path Intellisense**
- **ID:** `christian-kohler.path-intellisense`
- **Why:** Auto-complete file paths
- **Features:**
  - Autocomplete filenames
  - Fewer typos in imports
  - Helpful with your self-locating scripts

---

## 🚀 Optional But Useful

### Project Management
- **Todo Tree** (`Gruntfyle.todo-tree`) - Highlight TODOs in code
- **Project Manager** (`alefragnani.project-manager`) - Quick project switching

### Code Quality
- **SonarLint** (`SonarSource.sonarlint-vscode`) - Code quality analysis
- **Code Spell Checker** (`streetsidesoftware.code-spell-checker`) - Catch typos

### Shell/Bash (For Your Scripts!)
- **Shell Check** (`timonwong.shellcheck`) - Bash script linting
- **Bash IDE** (`mads-hartmann.bash-ide-vscode`) - Better bash support
- **ShellCheck** (`timonwong.shellcheck`) - Find bugs in shell scripts

### JSON/Config Files
- **JSON Tools** (`eriklynd.json-tools`) - Format/validate JSON
- **YAML** (`redhat.vscode-yaml`) - YAML support (for docker-compose, MCP config)

---

## 📦 Installation Commands

### Install Essential Extensions (One Command)
```bash
# Core Git/GitHub extensions
code --install-extension GitHub.vscode-pull-request-github
code --install-extension eamodio.gitlens
code --install-extension mhutchie.git-graph

# Markdown for documentation
code --install-extension yzhang.markdown-all-in-one

# Shell scripting support (for your 13 scripts!)
code --install-extension timonwong.shellcheck
code --install-extension mads-hartmann.bash-ide-vscode

# Code quality
code --install-extension esbenp.prettier-vscode
code --install-extension dbaeumer.vscode-eslint
```

**Note:** Replace `code` with `cursor` if the Cursor CLI is set up differently.

### Or Install in Cursor IDE
1. Open Cursor
2. Press `Cmd+Shift+X` (Extensions)
3. Search for extension by ID
4. Click "Install"

---

## 🎯 Recommended Minimal Setup

**For cursor-global portability, install these 5 essential extensions:**

1. ✅ **GitHub Pull Requests** - GitHub integration
2. ✅ **GitLens** - Enhanced Git capabilities
3. ✅ **Markdown All in One** - Better docs editing
4. ✅ **ShellCheck** - Lint your 13 bash scripts!
5. ✅ **Error Lens** - Inline error display

**Why minimal?**
- Faster IDE startup
- Less configuration to sync
- Focus on AI-assisted development
- Extensions can be added as needed

---

## 🔄 Syncing Extensions Across Machines

### Option 1: Extension List File (Recommended)

Create an extension list in cursor-global:

```bash
# Generate extension list
cursor --list-extensions > ~/cursor-global/config/extensions.txt

# On new machine, install all
cat ~/cursor-global/config/extensions.txt | xargs -L 1 cursor --install-extension
```

### Option 2: Settings Sync (Built-in)

Cursor has built-in Settings Sync:
1. Open Settings (`Cmd+,`)
2. Search "Settings Sync"
3. Sign in with GitHub/Microsoft
4. Enable sync for Extensions

**Pros:** Automatic sync
**Cons:** Requires cloud account

### Option 3: Manual Extension Management

Add to your portable setup:

```bash
# In cursor-global/config/
~/cursor-global/config/
  ├── extensions.txt       # List of extension IDs
  └── extensions.json      # Extension settings (optional)
```

---

## 🛠️ Extension Settings for cursor-global

### Recommended settings.json additions:

```json
{
  // GitLens
  "gitlens.codeLens.enabled": true,
  "gitlens.currentLine.enabled": true,

  // Prettier (auto-format)
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",

  // Shell scripts
  "shellcheck.run": "onSave",

  // Error Lens
  "errorLens.enabled": true,

  // Markdown
  "markdown.preview.breaks": true,
  "markdown.preview.linkify": true,

  // Path Intellisense
  "path-intellisense.autoSlashAfterDirectory": true
}
```

Add these to `~/cursor-global/config/settings.json` if you want them portable!

---

## 📋 Extension Checklist for New Machines

When setting up cursor-global on a new machine:

**Essential:**
- [ ] GitHub Pull Requests - GitHub workflow integration
- [ ] GitLens - Enhanced Git features
- [ ] ShellCheck - Validate your bash scripts

**Recommended:**
- [ ] Markdown All in One - Documentation editing
- [ ] Prettier - Code formatting
- [ ] Error Lens - Inline errors

**Project-Specific:**
- [ ] ESLint - If working with JavaScript/TypeScript
- [ ] YAML - If working with YAML configs
- [ ] Language-specific extensions as needed

---

## 🎯 Specific Recommendations for Your Setup

### For Your GitHub Workflows:
✅ **GitHub Pull Requests** - Essential
✅ **GitLens** - See commit history inline
✅ **Git Graph** - Visual branch management

### For Your 13 Bash Scripts:
✅ **ShellCheck** - Lint and find bugs
✅ **Bash IDE** - Better autocomplete
✅ **Path Intellisense** - Help with file paths

### For Your Docker Setup:
✅ **Docker** - Already installed!
✅ **Dev Containers** - Already installed!

### For Your Documentation:
✅ **Markdown All in One** - Edit your 10+ .md files
✅ **Better Comments** - Organize code comments

---

## 💡 Pro Tips

### 1. Extension Portability
- Extensions install to `~/.cursor/extensions/`
- Consider symlinking if you want them in cursor-global
- OR just maintain an extensions list

### 2. Lightweight Setup
- Start minimal, add as needed
- Too many extensions = slower startup
- Cursor's AI works great without many extensions

### 3. GitHub Integration Priority
Given your Git workflows (`ai-local-commit`, `ai-local-merge`):
- **GitHub Pull Requests** is highest priority
- Enables full GitHub workflow from IDE
- Create PRs directly after merge

### 4. Shell Script Development
Since you have 13 bash scripts:
- **ShellCheck** will catch common bugs
- Validates your self-locating logic
- Essential for maintaining portable scripts

---

## 🔧 Add to setup.sh? (Optional)

You could optionally add extension installation to your setup script:

```bash
# In setup.sh, add optional extension installation
echo -e "${BLUE}📦 Installing recommended extensions...${NC}"
if command -v cursor >/dev/null 2>&1; then
    cursor --install-extension GitHub.vscode-pull-request-github
    cursor --install-extension eamodio.gitlens
    cursor --install-extension timonwong.shellcheck
    echo -e "${GREEN}   ✅ Core extensions installed${NC}"
else
    echo -e "${YELLOW}   ⚠️  Install extensions manually from Cursor IDE${NC}"
fi
```

**Recommendation:** Keep setup.sh focused on configuration, install extensions manually.

---

## 📊 Summary

### Required: 0
Cursor works great with AI out of the box!

### Highly Recommended: 5
1. GitHub Pull Requests
2. GitLens
3. ShellCheck
4. Markdown All in One
5. Error Lens

### Nice to Have: Everything else
Install based on your specific needs and projects.

---

**Status:** ✅ **ALL EXTENSIONS INSTALLED!** Ready to use! 🚀

---

## 🎯 Quick Start Guide - Using Your New Extensions

### GitHub Pull Requests
**What it does:** Create and manage PRs directly in Cursor

**Try it:**
1. After running `ai-local-merge`, press `Cmd+Shift+P`
2. Type "GitHub: Create Pull Request"
3. Fill in PR details
4. Submit without leaving Cursor!

**Workflow integration:**
```bash
ai-local-merge          # Merge to main
# Then create PR in Cursor: Cmd+Shift+P → "GitHub: Create Pull Request"
```

### GitLens
**What it does:** Show Git blame and history inline

**Try it:**
- Open any file
- See author info at end of each line
- Hover over code to see commit details
- Click line number → "Open Changes"

**Perfect for:** Understanding changes made by `ai-local-commit`

### ShellCheck (For Your Scripts!)
**What it does:** Lint your bash scripts as you type

**Try it:**
1. Open any script in `~/cursor-global/scripts/`
2. See warnings/errors highlighted inline
3. Hover for explanations and fixes

**Files to check:**
- `git-local-merge.sh` - Your smart merge script
- `session-start.sh` - AI session management
- All 13 scripts now have real-time linting!

### Git Graph
**What it does:** Visual Git history

**Try it:**
1. Press `Cmd+Shift+P`
2. Type "Git Graph: View Git Graph"
3. See visual branch history
4. Great for understanding `ai-local-merge` results

### Error Lens
**What it does:** Show errors inline (no need to hover)

**Try it:**
- Errors appear right next to the code
- Fix issues faster
- Perfect for AI-generated code review

### Markdown All in One
**What it does:** Enhanced markdown editing

**Try it:**
1. Open any `.md` file (you have 10+!)
2. Press `Cmd+Shift+V` for preview
3. `Cmd+Shift+P` → "Markdown: Create Table of Contents"

**Great for:** Your extensive documentation files

---

## 🔄 Extension List Exported

Your current extensions are saved to:
```
~/cursor-global/config/installed-extensions.txt
```

**To replicate on another machine:**
```bash
cat ~/cursor-global/config/installed-extensions.txt | xargs -L 1 cursor --install-extension
```

---

**Next Steps:**
1. ✅ Extensions installed
2. ✅ Extension list exported
3. 🎯 **Restart Cursor IDE to activate all extensions**
4. 🎯 Try the Quick Start Guide above!
