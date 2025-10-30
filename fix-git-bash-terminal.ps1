# Fix Git Bash as Default Terminal
Write-Host "Fixing Git Bash as Default Terminal..." -ForegroundColor Blue

# 1. Set Windows Terminal as default
Write-Host "Setting Windows Terminal as default..." -ForegroundColor Yellow
Set-ItemProperty -Path "HKCU:\Console" -Name "DelegationConsole" -Value "{61c54bbd-c2c6-5271-96e7-009a87ff44bf}" -Force
Set-ItemProperty -Path "HKCU:\Console" -Name "DelegationTerminal" -Value "{61c54bbd-c2c6-5271-96e7-009a87ff44bf}" -Force
Write-Host "Windows Terminal set as default" -ForegroundColor Green

# 2. Update Cursor settings
Write-Host "Updating Cursor settings..." -ForegroundColor Yellow
$cursorSettingsPath = "$env:APPDATA\Cursor\User\settings.json"

if (Test-Path $cursorSettingsPath) {
    $cursorSettings = Get-Content $cursorSettingsPath -Raw | ConvertFrom-Json
    
    # Force all terminal settings to use Git Bash
    $cursorSettings.'terminal.integrated.defaultProfile.windows' = "Git Bash"
    $cursorSettings.'terminal.integrated.shell.windows' = "C:\Users\A00288946\AppData\Local\Programs\Git\bin\bash.exe"
    $cursorSettings.'terminal.integrated.shellArgs.windows' = @("--login")
    $cursorSettings.'terminal.integrated.automationShell.windows' = "C:\Users\A00288946\AppData\Local\Programs\Git\bin\bash.exe"
    $cursorSettings.'terminal.integrated.automationShellArgs.windows' = @("--login")
    $cursorSettings.'terminal.external.windowsExec' = "C:\Users\A00288946\AppData\Local\Programs\Git\bin\bash.exe"
    
    # Update profiles to only have Git Bash
    $cursorSettings.'terminal.integrated.profiles.windows' = @{
        "Git Bash" = @{
            "path" = "C:\Users\A00288946\AppData\Local\Programs\Git\bin\bash.exe"
            "args" = @("--login")
            "icon" = "terminal-bash"
        }
    }
    
    $cursorSettings | ConvertTo-Json -Depth 10 | Set-Content $cursorSettingsPath -Encoding UTF8
    Write-Host "Cursor settings updated" -ForegroundColor Green
}

# 3. Set environment variables
Write-Host "Setting environment variables..." -ForegroundColor Yellow
[Environment]::SetEnvironmentVariable("SHELL", "C:\Users\A00288946\AppData\Local\Programs\Git\bin\bash.exe", "User")
[Environment]::SetEnvironmentVariable("TERM", "xterm-256color", "User")
Write-Host "Environment variables set" -ForegroundColor Green

# 4. Test Git Bash
Write-Host "Testing Git Bash..." -ForegroundColor Yellow
try {
    $testResult = & "C:\Users\A00288946\AppData\Local\Programs\Git\bin\bash.exe" -c "echo 'Git Bash test successful'; pwd"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Git Bash test passed" -ForegroundColor Green
    } else {
        Write-Host "Git Bash test failed" -ForegroundColor Red
    }
} catch {
    Write-Host "Git Bash test error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "Configuration Complete!" -ForegroundColor Green
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Close ALL terminal windows and applications" -ForegroundColor White
Write-Host "2. Restart Cursor completely" -ForegroundColor White
Write-Host "3. Open a new terminal (Ctrl+`) - should now be Git Bash" -ForegroundColor White
