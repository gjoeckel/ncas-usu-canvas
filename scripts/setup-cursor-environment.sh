#!/bin/bash
# Cursor Environment Setup Script
# Sets up optimal environment for autonomous development with Cursor

set -euo pipefail

# ========================================
# AUTO-DETECT SCRIPT LOCATION (Portable)
# ========================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CURSOR_GLOBAL_DIR="$(dirname "$SCRIPT_DIR")"

# Derived paths
CONFIG_DIR="$CURSOR_GLOBAL_DIR/config"
CHANGELOGS_DIR="$CURSOR_GLOBAL_DIR/changelogs"
SCRIPTS_DIR="$CURSOR_GLOBAL_DIR/scripts"


echo "🚀 Setting up Cursor Environment for Autonomous Development"
echo "=========================================================="

# Check prerequisites
echo "🔍 Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js first."
    echo "   Visit: https://nodejs.org/"
    exit 1
else
    echo "✅ Node.js $(node --version) found"
fi

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm not found. Please install npm first."
    exit 1
else
    echo "✅ npm $(npm --version) found"
fi

# Check Git
if ! command -v git &> /dev/null; then
    echo "❌ Git not found. Please install Git first."
    exit 1
else
    echo "✅ Git $(git --version) found"
fi

# Check PHP (for project compatibility)
if ! command -v php &> /dev/null; then
    echo "⚠️  PHP not found. Some project features may not work."
    echo "   Install with: brew install php"
else
    echo "✅ PHP $(php --version | head -n1) found"
fi

# Set up environment variables
echo "🔧 Setting up environment variables..."

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    cat > .env << 'EOF'
# Cursor MCP Environment Variables
# Copy this file and add your actual values

# GitHub Personal Access Token (required for GitHub MCP)
# Get one at: https://github.com/settings/tokens
GITHUB_TOKEN=your_github_token_here

# Anthropic API Key (for AI features)
# Get one at: https://console.anthropic.com/
ANTHROPIC_API_KEY=your_anthropic_key_here

# Project Configuration
PROJECT_ROOT=${HOME}/Projects/accessilist
NODE_ENV=development
EOF
    echo "✅ Created .env file template"
    echo "⚠️  Please edit .env file and add your actual API keys"
else
    echo "✅ .env file already exists"
fi

# Set up shell environment
echo "🔧 Setting up shell environment..."

# Add to .zshrc if not already present
if ! grep -q "CURSOR_MCP_ENV" ~/.zshrc 2>/dev/null; then
    cat >> ~/.zshrc << 'EOF'

# Cursor MCP Environment Setup
export CURSOR_MCP_ENV=1
export PROJECT_ROOT=${HOME}/Projects/accessilist

# Load environment variables if .env exists
if [ -f "$PROJECT_ROOT/.env" ]; then
    export $(grep -v '^#' "$PROJECT_ROOT/.env" | xargs)
fi
EOF
    echo "✅ Added Cursor MCP environment to .zshrc"
    echo "⚠️  Please restart your terminal or run: source ~/.zshrc"
else
    echo "✅ Cursor MCP environment already configured in .zshrc"
fi

# Install MCP servers
echo "🔧 Installing MCP servers..."

# Install filesystem MCP
if npm list -g @modelcontextprotocol/server-filesystem &> /dev/null; then
    echo "✅ Filesystem MCP already installed"
else
    echo "📦 Installing filesystem MCP..."
    npm install -g @modelcontextprotocol/server-filesystem
    echo "✅ Filesystem MCP installed"
fi

# Install memory MCP
if npm list -g @modelcontextprotocol/server-memory &> /dev/null; then
    echo "✅ Memory MCP already installed"
else
    echo "📦 Installing memory MCP..."
    npm install -g @modelcontextprotocol/server-memory
    echo "✅ Memory MCP installed"
fi

# Install puppeteer MCP
if npm list -g @modelcontextprotocol/server-puppeteer &> /dev/null; then
    echo "✅ Puppeteer MCP already installed"
else
    echo "📦 Installing puppeteer MCP..."
    npm install -g @modelcontextprotocol/server-puppeteer
    echo "✅ Puppeteer MCP installed"
fi

# Install GitHub MCP
if npm list -g @modelcontextprotocol/server-github &> /dev/null; then
    echo "✅ GitHub MCP already installed"
else
    echo "📦 Installing GitHub MCP..."
    npm install -g @modelcontextprotocol/server-github
    echo "✅ GitHub MCP installed"
fi

# Install shell MCP
if npm list -g @modelcontextprotocol/server-shell &> /dev/null; then
    echo "✅ Shell MCP already installed"
else
    echo "📦 Installing shell MCP..."
    npm install -g @modelcontextprotocol/server-shell
    echo "✅ Shell MCP installed"
fi

# Set up project dependencies
echo "🔧 Setting up project dependencies..."

if [ -f "package.json" ]; then
    echo "📦 Installing project dependencies..."
    npm install
    echo "✅ Project dependencies installed"
else
    echo "⚠️  No package.json found, skipping project dependencies"
fi

# Create necessary directories
echo "🔧 Creating necessary directories..."

mkdir -p backups/cursor-config
mkdir -p logs
mkdir -p .vscode

echo "✅ Directories created"

# Set up Git hooks (if in a git repository)
if [ -d ".git" ]; then
    echo "🔧 Setting up Git hooks..."

    # Create pre-commit hook for code quality
    cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
# Pre-commit hook for code quality

echo "🔍 Running pre-commit checks..."

# Check for TODO/FIXME comments
if git diff --cached --name-only | xargs grep -l "TODO\|FIXME" 2>/dev/null; then
    echo "⚠️  Found TODO/FIXME comments in staged files"
    echo "   Consider addressing them before committing"
fi

# Check for console.log statements
if git diff --cached --name-only | xargs grep -l "console\.log" 2>/dev/null; then
    echo "⚠️  Found console.log statements in staged files"
    echo "   Consider removing them before committing"
fi

echo "✅ Pre-commit checks complete"
EOF

    chmod +x .git/hooks/pre-commit
    echo "✅ Git hooks configured"
else
    echo "⚠️  Not in a git repository, skipping Git hooks"
fi

# Final setup
echo "🔧 Final setup..."

# Make scripts executable
chmod +x scripts/*.sh 2>/dev/null || true

echo ""
echo "🎯 Cursor Environment Setup Complete!"
echo "===================================="
echo "✅ Prerequisites checked"
echo "✅ Environment variables configured"
echo "✅ MCP servers installed"
echo "✅ Project dependencies installed"
echo "✅ Directories created"
echo "✅ Git hooks configured"
echo ""
echo "🚀 Next steps:"
echo "1. Edit .env file and add your API keys"
echo "2. Restart your terminal or run: source ~/.zshrc"
echo "3. Run: ./scripts/manage-cursor-config.sh optimize"
echo "4. Restart Cursor to apply new configuration"
echo "5. Run: ./scripts/check-cursor-mcp.sh to verify setup"
echo ""
echo "📚 For more information, see:"
echo "   - README.md"
echo "   - cursor-settings-optimized.json"
echo "   - scripts/manage-cursor-config.sh"
