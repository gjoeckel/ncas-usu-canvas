# Cursor Global Configuration - Windows Setup Script
# Automated installation for Windows machines with Git Bash
# Run this with: .\setup-windows.ps1

param(
    [switch]$Help
)

if ($Help) {
    Write-Host @"
Cursor Global Configuration - Windows Setup Script

USAGE:
    .\setup-windows.ps1

DESCRIPTION:
    Installs cursor-global configuration for Windows:
    - Creates .cursor directory
    - Installs Windows-compatible MCP configuration
    - Installs Windows-compatible workflows
    - Makes scripts executable
    - Configures PATH (optional)

REQUIREMENTS:
    - Git for Windows (with Git Bash)
    - Node.js v16+ with npx
    - PowerShell 5.1+

"@
    exit 0
}

# Colors for output
function Write-Success { Write-Host $args -ForegroundColor Green }
function Write-Info { Write-Host $args -ForegroundColor Cyan }
function Write-Warning { Write-Host $args -ForegroundColor Yellow }
function Write-Error { Write-Host $args -ForegroundColor Red }

Write-Info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Info "  Cursor Global Configuration - Windows Setup"
Write-Info "  (Portable - works from any location!)"
Write-Info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Host ""

# Auto-detect installation location
$CURSOR_GLOBAL_DIR = $PSScriptRoot
$CONFIG_DIR = Join-Path $CURSOR_GLOBAL_DIR "config"
$SCRIPTS_DIR = Join-Path $CURSOR_GLOBAL_DIR "scripts"
$CHANGELOGS_DIR = Join-Path $CURSOR_GLOBAL_DIR "changelogs"

Write-Success "📍 Detected location: $CURSOR_GLOBAL_DIR"
Write-Host ""

# Verify structure
if (!(Test-Path $CONFIG_DIR) -or !(Test-Path $SCRIPTS_DIR)) {
    Write-Error "❌ Invalid cursor-global structure!"
    Write-Warning "   Missing config/ or scripts/ directory"
    exit 1
}

Write-Success "✅ cursor-global structure verified"

# Verify Git Bash
Write-Info "`n🔍 Checking dependencies..."

try {
    $gitPath = (Get-Command git -ErrorAction Stop).Source
    $gitDir = Split-Path (Split-Path $gitPath)
    $bashPath = Join-Path $gitDir "bin\bash.exe"
    
    if (Test-Path $bashPath) {
        Write-Success "   ✅ Git Bash found at: $bashPath"
    } else {
        Write-Error "   ❌ Git Bash not found"
        Write-Warning "      Install Git for Windows from: https://git-scm.com/"
        exit 1
    }
} catch {
    Write-Error "   ❌ Git not found"
    Write-Warning "      Install Git for Windows from: https://git-scm.com/"
    exit 1
}

# Verify Node.js
try {
    $nodeVersion = (node --version)
    Write-Success "   ✅ Node.js $nodeVersion installed"
} catch {
    Write-Error "   ❌ Node.js not found"
    Write-Warning "      Install from: https://nodejs.org/"
    exit 1
}

# Verify npx
try {
    $npxVersion = (npx --version)
    Write-Success "   ✅ npx $npxVersion installed"
} catch {
    Write-Error "   ❌ npx not found"
    Write-Warning "      Should come with Node.js - reinstall Node.js"
    exit 1
}

# Create .cursor directory
Write-Info "`n📁 Setting up .cursor directory..."
$cursorDir = Join-Path $env:USERPROFILE ".cursor"
New-Item -ItemType Directory -Force -Path $cursorDir | Out-Null
Write-Success "   ✅ Directory created: $cursorDir"

# Create changelogs directories
Write-Info "`n📂 Setting up changelogs..."
New-Item -ItemType Directory -Force -Path (Join-Path $CHANGELOGS_DIR "projects") | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $CHANGELOGS_DIR "backups") | Out-Null
Write-Success "   ✅ Changelog directories ready"

# Create Windows-compatible mcp.json
Write-Info "`n🔧 Creating Windows-compatible MCP configuration..."

$mcpConfig = @{
    mcpServers = @{
        filesystem = @{
            command = "npx"
            args = @(
                "-y",
                "@modelcontextprotocol/server-filesystem",
                $env:USERPROFILE
            )
            env = @{
                ALLOWED_PATHS = $env:USERPROFILE
                READ_ONLY = "false"
            }
        }
        memory = @{
            command = "npx"
            args = @(
                "-y",
                "@modelcontextprotocol/server-memory"
            )
        }
    }
} | ConvertTo-Json -Depth 10

$mcpPath = Join-Path $cursorDir "mcp.json"
$mcpConfig | Out-File -FilePath $mcpPath -Encoding UTF8
Write-Success "   ✅ MCP config created (official servers: filesystem + memory)"
Write-Success "      23 tools available (15 filesystem + 8 memory)"

# Create Windows-compatible workflows.json
Write-Info "`n🔧 Creating Windows-compatible workflows..."

# Build workflow commands with proper Windows paths
$workflowCommands = @{
    "ai-start" = "$bashPath $SCRIPTS_DIR\session-start.sh"
    "ai-end" = "$bashPath $SCRIPTS_DIR\session-end.sh"
    "ai-update" = "$bashPath $SCRIPTS_DIR\session-update.sh"
    "ai-repeat" = "$bashPath $SCRIPTS_DIR\session-start.sh"
    "ai-compress" = "$bashPath $SCRIPTS_DIR\compress-context.sh"
    "mcp-health" = "$bashPath $SCRIPTS_DIR\check-mcp-health.sh"
    "mcp-restart" = "$bashPath $SCRIPTS_DIR\restart-mcp-servers.sh"
    "ai-local-commit" = "$bashPath $SCRIPTS_DIR\git-local-commit.sh"
    "ai-local-merge" = "$bashPath $SCRIPTS_DIR\git-local-merge.sh"
    "ai-merge-finalize" = "$bashPath $SCRIPTS_DIR\git-local-merge.sh --finalize"
    "ai-docs-sync" = "$bashPath $SCRIPTS_DIR\generate-workflows-doc.sh"
}

$workflows = @{
    "ai-start" = @{
        description = "Load AI session context and initialize environment"
        commands = @($workflowCommands["ai-start"])
        auto_approve = $true
        timeout = 30000
        on_error = "continue"
    }
    "ai-end" = @{
        description = "Save session context and generate changelog"
        commands = @($workflowCommands["ai-end"])
        auto_approve = $true
        timeout = 20000
        on_error = "continue"
    }
    "ai-update" = @{
        description = "Record mid-session progress"
        commands = @($workflowCommands["ai-update"])
        auto_approve = $true
        timeout = 20000
        on_error = "continue"
    }
    "ai-repeat" = @{
        description = "Reload session context"
        commands = @($workflowCommands["ai-repeat"])
        auto_approve = $true
        timeout = 20000
        on_error = "continue"
    }
    "ai-clean" = @{
        description = "Clean temporary files and logs (works in any project)"
        commands = @("powershell -Command `"if (Test-Path logs) { Remove-Item -Force logs\*.log -ErrorAction SilentlyContinue }; if (Test-Path node_modules\.cache) { Remove-Item -Recurse -Force node_modules\.cache -ErrorAction SilentlyContinue }; Write-Host '✅ Project cleaned'`"")
        auto_approve = $true
        timeout = 10000
        on_error = "continue"
    }
    "ai-compress" = @{
        description = "Compress session context into summary"
        commands = @($workflowCommands["ai-compress"])
        auto_approve = $true
        timeout = 30000
        on_error = "continue"
    }
    "mcp-health" = @{
        description = "Check MCP server health and status"
        commands = @($workflowCommands["mcp-health"])
        auto_approve = $true
        timeout = 15000
        on_error = "continue"
    }
    "mcp-restart" = @{
        description = "Restart all MCP servers"
        commands = @($workflowCommands["mcp-restart"])
        auto_approve = $true
        timeout = 30000
        on_error = "continue"
    }
    "ai-local-commit" = @{
        description = "Update changelog and commit all changes to current local branch"
        commands = @($workflowCommands["ai-local-commit"])
        auto_approve = $true
        timeout = 20000
        on_error = "continue"
    }
    "ai-local-merge" = @{
        description = "Merge current branch to main, auto-updates changelog (handles conflicts gracefully)"
        commands = @($workflowCommands["ai-local-merge"])
        auto_approve = $true
        timeout = 30000
        on_error = "continue"
    }
    "ai-merge-finalize" = @{
        description = "Finalize merge after manual conflict resolution (updates changelog, run from main)"
        commands = @($workflowCommands["ai-merge-finalize"])
        auto_approve = $true
        timeout = 10000
        on_error = "continue"
    }
    "ai-docs-sync" = @{
        description = "Generate project workflows.md from global and project configs"
        commands = @($workflowCommands["ai-docs-sync"])
        auto_approve = $true
        timeout = 10000
        on_error = "continue"
    }
} | ConvertTo-Json -Depth 10

$workflowsPath = Join-Path $cursorDir "workflows.json"
$workflows | Out-File -FilePath $workflowsPath -Encoding UTF8
Write-Success "   ✅ Workflows created (12 global workflows)"

# Make all scripts executable (using Git Bash)
Write-Info "`n🔧 Making scripts executable..."
& $bashPath -c "cd '$SCRIPTS_DIR' && chmod +x *.sh"
Write-Success "   ✅ All scripts are now executable"

# Optional: Add to PATH
Write-Info "`n📝 Configuring PATH..."
$currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($currentPath -like "*$SCRIPTS_DIR*") {
    Write-Success "   ✅ PATH already configured"
} else {
    $response = Read-Host "   Add cursor-global scripts to PATH? (y/N)"
    if ($response -eq 'y' -or $response -eq 'Y') {
        $newPath = "$SCRIPTS_DIR;$currentPath"
        [Environment]::SetEnvironmentVariable("Path", $newPath, "User")
        Write-Success "   ✅ Added $SCRIPTS_DIR to PATH"
        Write-Warning "   ⚠️  Restart PowerShell to apply PATH changes"
    } else {
        Write-Info "   ⏭️  Skipped PATH configuration"
    }
}

# Summary
Write-Info "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Success "✅ Cursor Global Configuration Setup Complete!"
Write-Info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Host ""
Write-Success "📍 Installed at:" -NoNewline; Write-Host " $CURSOR_GLOBAL_DIR"
Write-Host ""
Write-Warning "Next Steps:"
Write-Info "  1. Restart Cursor IDE to load new workflows"
Write-Info "  2. Test workflows: Type 'ai-start' in Cursor chat"
Write-Info "  3. Verify MCP servers: Type 'mcp-health' in Cursor chat"
Write-Host ""
Write-Success "Available Global Workflows:"
Write-Info "  • ai-start       - Load session context"
Write-Info "  • ai-end         - Save session & changelog"
Write-Info "  • ai-local-commit - Commit with changelog"
Write-Info "  • ai-local-merge - Smart merge (prevents conflicts!)"
Write-Info "  • mcp-health     - Check MCP servers"
Write-Info "  • and 7 more!    - (see README.md)"
Write-Host ""
Write-Info "📖 Documentation:" -NoNewline; Write-Host " $CURSOR_GLOBAL_DIR\README.md"
Write-Warning "💡 Portable:" -NoNewline; Write-Host " Move this folder anywhere and re-run setup-windows.ps1!"
Write-Host ""


