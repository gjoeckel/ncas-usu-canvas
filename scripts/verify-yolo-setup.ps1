# YOLO Setup Verification Script (PowerShell)
# Verifies AI Autonomy settings and MCP server status before YOLO operations

param(
    [switch]$Verbose
)

# Set error action preference
$ErrorActionPreference = "Stop"

# Get script directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$CursorGlobalDir = Split-Path -Parent $ScriptDir
$ConfigDir = Join-Path $CursorGlobalDir "config"
$ScriptsDir = Join-Path $CursorGlobalDir "scripts"

Write-Host "YOLO Setup Verification" -ForegroundColor Blue
Write-Host "===============================" -ForegroundColor Blue
Write-Host "Timestamp: $(Get-Date)"
Write-Host ""

$TotalIssues = 0
$VerificationPassed = $true

# Function to check AI Autonomy settings
function Check-AIAutonomySettings {
    Write-Host "Checking AI Autonomy Settings..." -ForegroundColor Blue
    
    $SettingsFile = Join-Path $ConfigDir "settings.json"
    
    if (-not (Test-Path $SettingsFile)) {
        Write-Host "  ERROR: Settings file not found: $SettingsFile" -ForegroundColor Red
        $script:TotalIssues++
        $script:VerificationPassed = $false
        return
    }
    
    Write-Host "  OK: Settings file found" -ForegroundColor Green
    
    $SettingsContent = Get-Content $SettingsFile -Raw
    
    # Check YOLO setting
    if ($SettingsContent -match '"YOLO":\s*true') {
        Write-Host "  OK: YOLO mode enabled" -ForegroundColor Green
    } else {
        Write-Host "  ERROR: YOLO mode not enabled" -ForegroundColor Red
        $script:TotalIssues++
        $script:VerificationPassed = $false
    }
    
    # Check AI autonomy settings
    $RequiredSettings = @(
        '"cursor.ai.enabled": true',
        '"cursor.ai.autoExecute": true',
        '"cursor.ai.confirmationLevel": "none"',
        '"cursor.ai.terminalAccess": true',
        '"cursor.ai.fileSystemAccess": true',
        '"cursor.ai.shellAccess": true',
        '"mcp.enabled": true',
        '"mcp.autoStart": true'
    )
    
    foreach ($Setting in $RequiredSettings) {
        $SettingName = ($Setting -split '"')[1]
        if ($SettingsContent -match [regex]::Escape($Setting)) {
            Write-Host "  OK: $SettingName configured correctly" -ForegroundColor Green
        } else {
            Write-Host "  ERROR: $SettingName not configured correctly" -ForegroundColor Red
            $script:TotalIssues++
            $script:VerificationPassed = $false
        }
    }
}

# Function to check MCP server configuration
function Check-MCPConfiguration {
    Write-Host "Checking MCP Configuration..." -ForegroundColor Blue
    
    $MCPConfigFile = Join-Path $ConfigDir "mcp.json"
    
    if (-not (Test-Path $MCPConfigFile)) {
        Write-Host "  ERROR: MCP config file not found: $MCPConfigFile" -ForegroundColor Red
        $script:TotalIssues++
        $script:VerificationPassed = $false
        return
    }
    
    Write-Host "  OK: MCP config file found" -ForegroundColor Green
    
    # Check for required MCP servers
    $RequiredServers = @(
        "github-minimal",
        "shell-minimal", 
        "puppeteer-minimal",
        "sequential-thinking-minimal",
        "agent-autonomy",
        "filesystem",
        "memory"
    )
    
    $MCPContent = Get-Content $MCPConfigFile -Raw
    
    foreach ($Server in $RequiredServers) {
        if ($MCPContent -match [regex]::Escape('"' + $Server + '":')) {
            Write-Host "  OK: $Server server configured" -ForegroundColor Green
        } else {
            Write-Host "  ERROR: $Server server not configured" -ForegroundColor Red
            $script:TotalIssues++
            $script:VerificationPassed = $false
        }
    }
}

# Function to check MCP server health
function Check-MCPServerHealth {
    Write-Host "Checking MCP Server Health..." -ForegroundColor Blue
    
    # Check if MCP health check script exists
    $HealthScript = Join-Path $ScriptsDir "check-mcp-health.sh"
    
    if (-not (Test-Path $HealthScript)) {
        Write-Host "  WARNING: MCP health check script not found: $HealthScript" -ForegroundColor Yellow
    } else {
        Write-Host "  OK: MCP health check script found" -ForegroundColor Green
    }
    
    # For Windows, we'll do basic checks instead of running the bash script
    Write-Host "  Running basic MCP health checks..." -ForegroundColor Blue
    
    # Check if Node.js is available
    try {
        $NodeVersion = node --version 2>$null
        if ($NodeVersion) {
            Write-Host "  OK: Node.js available: $NodeVersion" -ForegroundColor Green
        } else {
            Write-Host "  ERROR: Node.js not found" -ForegroundColor Red
            $script:TotalIssues++
            $script:VerificationPassed = $false
        }
    } catch {
        Write-Host "  ERROR: Node.js not found" -ForegroundColor Red
        $script:TotalIssues++
        $script:VerificationPassed = $false
    }
    
    # Check if npm is available
    try {
        $NpmVersion = npm --version 2>$null
        if ($NpmVersion) {
            Write-Host "  OK: npm available: $NpmVersion" -ForegroundColor Green
        } else {
            Write-Host "  ERROR: npm not found" -ForegroundColor Red
            $script:TotalIssues++
            $script:VerificationPassed = $false
        }
    } catch {
        Write-Host "  ERROR: npm not found" -ForegroundColor Red
        $script:TotalIssues++
        $script:VerificationPassed = $false
    }
}

# Function to check Git repository status
function Check-GitStatus {
    Write-Host "Checking Git Repository Status..." -ForegroundColor Blue
    
    try {
        $GitStatus = git status --porcelain 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  OK: Git repository detected" -ForegroundColor Green
            
            if ([string]::IsNullOrEmpty($GitStatus)) {
                Write-Host "  OK: Working directory clean" -ForegroundColor Green
            } else {
                Write-Host "  WARNING: Uncommitted changes detected" -ForegroundColor Yellow
                Write-Host "  Changes to be committed:" -ForegroundColor Blue
                $GitStatus | ForEach-Object { Write-Host "    $_" }
            }
            
            # Check current branch
            $CurrentBranch = git branch --show-current 2>$null
            if ($CurrentBranch) {
                Write-Host "  OK: Current branch: $CurrentBranch" -ForegroundColor Green
            }
        } else {
            Write-Host "  ERROR: Not in a Git repository" -ForegroundColor Red
            $script:TotalIssues++
            $script:VerificationPassed = $false
        }
    } catch {
        Write-Host "  ERROR: Git not available or not in a repository" -ForegroundColor Red
        $script:TotalIssues++
        $script:VerificationPassed = $false
    }
}

# Function to check required tools
function Check-RequiredTools {
    Write-Host "Checking Required Tools..." -ForegroundColor Blue
    
    $RequiredTools = @("git", "node", "npm")
    
    foreach ($Tool in $RequiredTools) {
        try {
            $Version = & $Tool --version 2>$null
            if ($Version) {
                $VersionLine = ($Version | Select-Object -First 1)
                Write-Host "  OK: $Tool available: $VersionLine" -ForegroundColor Green
            } else {
                Write-Host "  ERROR: $Tool not found" -ForegroundColor Red
                $script:TotalIssues++
                $script:VerificationPassed = $false
            }
        } catch {
            Write-Host "  ERROR: $Tool not found" -ForegroundColor Red
            $script:TotalIssues++
            $script:VerificationPassed = $false
        }
    }
}

# Function to generate verification summary
function Show-VerificationSummary {
    Write-Host ""
    Write-Host "YOLO Verification Summary" -ForegroundColor Blue
    Write-Host "==============================" -ForegroundColor Blue
    Write-Host "Total Issues Found: $TotalIssues"
    
    if ($VerificationPassed -and $TotalIssues -eq 0) {
        Write-Host "SUCCESS: YOLO READY - All systems verified!" -ForegroundColor Green
        Write-Host "Ready to proceed with YOLO operations" -ForegroundColor Green
        return $true
    } elseif ($TotalIssues -le 2) {
        Write-Host "WARNING: YOLO READY WITH WARNINGS - Minor issues detected" -ForegroundColor Yellow
        Write-Host "Consider addressing remaining issues for optimal performance" -ForegroundColor Yellow
        return $true
    } else {
        Write-Host "ERROR: YOLO NOT READY - Critical issues detected" -ForegroundColor Red
        Write-Host "Fix issues before proceeding with YOLO operations" -ForegroundColor Red
        return $false
    }
}

# Main execution
try {
    Check-AIAutonomySettings
    Check-MCPConfiguration
    Check-MCPServerHealth
    Check-GitStatus
    Check-RequiredTools
    
    $Success = Show-VerificationSummary
    
    if ($Success) {
        exit 0
    } else {
        exit 1
    }
} catch {
    Write-Host "ERROR: Verification failed with error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}