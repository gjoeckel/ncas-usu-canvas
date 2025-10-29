# Load GitHub Token from cursor-global secrets
# Purpose: Set GITHUB_TOKEN environment variable from centralized token file
# Usage: .\load-github-token.ps1

$tokenFile = "$env:USERPROFILE\cursor-global\secrets\github-token.txt"

if (Test-Path $tokenFile) {
    $token = Get-Content $tokenFile -Raw
    $token = $token.Trim()
    
    # Set for current session
    $env:GITHUB_TOKEN = $token
    
    # Set as persistent User environment variable
    [System.Environment]::SetEnvironmentVariable('GITHUB_TOKEN', $token, 'User')
    
    Write-Host "✅ GITHUB_TOKEN loaded and set successfully" -ForegroundColor Green
    Write-Host "   Token: $($token.Substring(0,7))... (hidden)" -ForegroundColor Gray
    Write-Host "   Source: cursor-global/secrets/github-token.txt" -ForegroundColor Gray
    Write-Host ""
    Write-Host "✅ Environment variable set for:" -ForegroundColor Green
    Write-Host "   • Current session (immediate)" -ForegroundColor Gray
    Write-Host "   • User environment (persistent)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "⚠️  Restart Cursor to pick up the new token" -ForegroundColor Yellow
} else {
    Write-Host "❌ Token file not found: $tokenFile" -ForegroundColor Red
    Write-Host "   Create the file with your GitHub Personal Access Token" -ForegroundColor Yellow
    exit 1
}
