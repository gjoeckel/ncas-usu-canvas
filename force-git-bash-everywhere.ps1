# Force Git Bash as Default Terminal Everywhere
# This script will configure Windows to use Git Bash as the default terminal

Write-Host "🔧 Forcing Git Bash as Default Terminal Everywhere..." -ForegroundColor Blue

# 1. Set Windows Terminal as default terminal application
Write-Host "Setting Windows Terminal as default..." -ForegroundColor Yellow
$wtPath = "C:\Users\A00288946\AppData\Local\Microsoft\WindowsApps\wt.exe"
if (Test-Path $wtPath) {
    # Set Windows Terminal as default
    Set-ItemProperty -Path "HKCU:\Console" -Name "DelegationConsole" -Value "{61c54bbd-c2c6-5271-96e7-009a87ff44bf}" -Force
    Set-ItemProperty -Path "HKCU:\Console" -Name "DelegationTerminal" -Value "{61c54bbd-c2c6-5271-96e7-009a87ff44bf}" -Force
    Write-Host "✅ Windows Terminal set as default" -ForegroundColor Green
} else {
    Write-Host "❌ Windows Terminal not found" -ForegroundColor Red
}

# 2. Configure Windows Terminal to use Git Bash as default profile
Write-Host "Configuring Windows Terminal..." -ForegroundColor Yellow
$wtSettingsPath = "$env:LOCALAPPDATA\Packages\Microsoft.WindowsTerminal_8wekyb3d8bbwe\LocalState\settings.json"

if (Test-Path $wtSettingsPath) {
    # Backup existing settings
    $backupPath = "$wtSettingsPath.backup.$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    Copy-Item $wtSettingsPath $backupPath
    Write-Host "✅ Backup created: $backupPath" -ForegroundColor Green
    
    # Create new settings with Git Bash as default
    $wtSettings = @{
        "defaultProfile" = "{61c54bbd-c2c6-5271-96e7-009a87ff44bf}"
        "profiles" = @{
            "list" = @(
                @{
                    "guid" = "{61c54bbd-c2c6-5271-96e7-009a87ff44bf}"
                    "name" = "Git Bash"
                    "commandline" = "C:\Users\A00288946\AppData\Local\Programs\Git\bin\bash.exe --login -i"
                    "startingDirectory" = "%USERPROFILE%"
                    "icon" = "C:\Users\A00288946\AppData\Local\Programs\Git\mingw64\share\git\git-for-windows.ico"
                    "fontFace" = "Cascadia Code"
                    "fontSize" = 12
                    "colorScheme" = "Campbell"
                }
            )
        }
        "schemes" = @(
            @{
                "name" = "Campbell"
                "foreground" = "#CCCCCC"
                "background" = "#0C0C0C"
                "colors" = @(
                    "#0C0C0C", "#CD3131", "#0DBC79", "#E5E512", "#2472C8", "#BC3FBC", "#11A8CD", "#E5E5E5",
                    "#666666", "#F14C4C", "#23D18B", "#F5F543", "#3B8EEA", "#D670D6", "#29B8DB", "#E5E5E5"
                )
            }
        )
    }
    
    $wtSettings | ConvertTo-Json -Depth 10 | Set-Content $wtSettingsPath -Encoding UTF8
    Write-Host "✅ Windows Terminal configured with Git Bash as default" -ForegroundColor Green
} else {
    Write-Host "❌ Windows Terminal settings not found" -ForegroundColor Red
}

# 3. Update Cursor settings to force Git Bash
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
    Write-Host "✅ Cursor settings updated" -ForegroundColor Green
} else {
    Write-Host "❌ Cursor settings not found" -ForegroundColor Red
}

# 4. Set environment variables
Write-Host "Setting environment variables..." -ForegroundColor Yellow
[Environment]::SetEnvironmentVariable("SHELL", "C:\Users\A00288946\AppData\Local\Programs\Git\bin\bash.exe", "User")
[Environment]::SetEnvironmentVariable("TERM", "xterm-256color", "User")
Write-Host "✅ Environment variables set" -ForegroundColor Green

# 5. Create a Git Bash launcher script
Write-Host "Creating Git Bash launcher..." -ForegroundColor Yellow
$launcherScript = @"
@echo off
"C:\Users\A00288946\AppData\Local\Programs\Git\bin\bash.exe" --login -i
"@
$launcherPath = "$env:USERPROFILE\git-bash.bat"
Set-Content $launcherPath $launcherScript
Write-Host "✅ Git Bash launcher created: $launcherPath" -ForegroundColor Green

# 6. Test Git Bash
Write-Host "Testing Git Bash..." -ForegroundColor Yellow
try {
    $testResult = & "C:\Users\A00288946\AppData\Local\Programs\Git\bin\bash.exe" -c "echo 'Git Bash test successful' && pwd" 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Git Bash test passed" -ForegroundColor Green
    } else {
        Write-Host "❌ Git Bash test failed" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Git Bash test error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎉 Configuration Complete!" -ForegroundColor Green
Write-Host "`nNext Steps:" -ForegroundColor Yellow
Write-Host "1. Close ALL terminal windows and applications" -ForegroundColor White
Write-Host "2. Restart Cursor completely" -ForegroundColor White
Write-Host "3. Open a new terminal (Ctrl+`) - should now be Git Bash" -ForegroundColor White
Write-Host "4. Test with: echo 'Hello from Git Bash'" -ForegroundColor White

Write-Host "`n🔧 If it still doesn't work:" -ForegroundColor Red
Write-Host "- Check Windows Terminal settings manually" -ForegroundColor White
Write-Host "- Try running: $launcherPath" -ForegroundColor White
Write-Host "- Check if Git Bash is in PATH" -ForegroundColor White
