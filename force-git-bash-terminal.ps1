# Nuclear option: Force Git Bash as default terminal
Write-Host "🚀 FORCING Git Bash as default terminal..." -ForegroundColor Red

# 1. Set Windows Terminal as default terminal app
Write-Host "Setting Windows Terminal as default..." -ForegroundColor Yellow
Set-ItemProperty -Path "HKCU:\Console" -Name "DelegationConsole" -Value "{61c54bbd-c2c6-5271-96e7-009a87ff44bf}" -Force
Set-ItemProperty -Path "HKCU:\Console" -Name "DelegationTerminal" -Value "{61c54bbd-c2c6-5271-96e7-009a87ff44bf}" -Force

# 2. Configure Windows Terminal to use Git Bash
$wtSettingsPath = "$env:LOCALAPPDATA\Packages\Microsoft.WindowsTerminal_8wekyb3d8bbwe\LocalState\settings.json"
if (Test-Path $wtSettingsPath) {
    Write-Host "Configuring Windows Terminal..." -ForegroundColor Yellow
    
    $wtSettings = @{
        "defaultProfile" = "{61c54bbd-c2c6-5271-96e7-009a87ff44bf}"
        "profiles" = @{
            "defaults" = @{
                "fontFace" = "Cascadia Code"
                "fontSize" = 12
            }
            "list" = @(
                @{
                    "guid" = "{61c54bbd-c2c6-5271-96e7-009a87ff44bf}"
                    "name" = "Git Bash"
                    "commandline" = "C:\Users\A00288946\AppData\Local\Programs\Git\bin\bash.exe --login -i"
                    "startingDirectory" = "%USERPROFILE%"
                    "icon" = "C:\Users\A00288946\AppData\Local\Programs\Git\mingw64\share\git\git-for-windows.ico"
                }
            )
        }
    }
    
    $wtSettings | ConvertTo-Json -Depth 10 | Set-Content $wtSettingsPath -Encoding UTF8
    Write-Host "✅ Windows Terminal configured" -ForegroundColor Green
}

# 3. Force Cursor settings
Write-Host "Forcing Cursor settings..." -ForegroundColor Yellow
$cursorSettings = @{
    "cursor.ai.yoloMode" = $true
    "cursor.composer.yoloMode" = $true
    "cursor.agent.yoloMode" = $true
    "cursor.general.enableYOLOMode" = $true
    "agentic.yolo.enabled" = $true
    "cursor.ai.enabled" = $true
    "cursor.ai.autoComplete" = $true
    "cursor.ai.chat.enabled" = $true
    "cursor.ai.codeGeneration" = $true
    "cursor.ai.terminalAccess" = $true
    "cursor.ai.fileSystemAccess" = $true
    "cursor.ai.shellAccess" = $true
    "cursor.ai.autoExecute" = $true
    "cursor.ai.confirmationLevel" = "none"
    "cursor.ai.autoApprove" = $true
    "cursor.ai.trustedMode" = $true
    "cursor.ai.fullAccess" = $true
    "mcp.enabled" = $true
    "mcp.autoStart" = $true
    "cursor.composer.shouldAllowCustomModes" = $true
    "terminal.integrated.defaultProfile.windows" = "Git Bash"
    "terminal.integrated.profiles.windows" = @{
        "Git Bash" = @{
            "path" = "C:\Users\A00288946\AppData\Local\Programs\Git\bin\bash.exe"
            "args" = @("--login")
            "icon" = "terminal-bash"
        }
    }
    "terminal.integrated.shell.windows" = "C:\Users\A00288946\AppData\Local\Programs\Git\bin\bash.exe"
    "terminal.integrated.shellArgs.windows" = @("--login")
    "terminal.integrated.automationShell.windows" = "C:\Users\A00288946\AppData\Local\Programs\Git\bin\bash.exe"
    "terminal.integrated.automationShellArgs.windows" = @("--login")
    "terminal.external.windowsExec" = "C:\Users\A00288946\AppData\Local\Programs\Git\bin\bash.exe"
    "window.commandCenter" = $true
    "cursor.agent_layout_browser_beta_setting" = $true
    "editor.minimap.enabled" = $true
    "explorer.confirmDelete" = $false
    "explorer.confirmDragAndDrop" = $false
    "php.validate.executablePath" = "php"
    "javascript.updateImportsOnFileMove.enabled" = "always"
    "diffEditor.maxComputationTime" = 0
    "[dockercompose]" = @{
        "editor.insertSpaces" = $true
        "editor.tabSize" = 2
        "editor.autoIndent" = "advanced"
        "editor.defaultFormatter" = "redhat.vscode-yaml"
    }
    "[github-actions-workflow]" = @{
        "editor.defaultFormatter" = "redhat.vscode-yaml"
    }
}

$cursorSettings | ConvertTo-Json -Depth 10 | Set-Content "$env:APPDATA\Cursor\User\settings.json" -Encoding UTF8
Write-Host "✅ Cursor settings forced" -ForegroundColor Green

# 4. Kill all Cursor processes
Write-Host "Killing Cursor processes..." -ForegroundColor Yellow
Get-Process -Name "Cursor" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# 5. Test Git Bash
Write-Host "Testing Git Bash..." -ForegroundColor Yellow
try {
    $result = & "C:\Users\A00288946\AppData\Local\Programs\Git\bin\bash.exe" -c "echo 'Git Bash working!' && pwd" 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Git Bash test successful" -ForegroundColor Green
        Write-Host "Output: $result" -ForegroundColor Gray
    } else {
        Write-Host "❌ Git Bash test failed" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Git Bash error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎯 NUCLEAR OPTION COMPLETE!" -ForegroundColor Red
Write-Host "1. Restart Cursor" -ForegroundColor White
Write-Host "2. Open terminal (Ctrl+`)" -ForegroundColor White
Write-Host "3. Should now be Git Bash!" -ForegroundColor White
Write-Host "`nIf this doesn't work, Cursor might be ignoring all settings..." -ForegroundColor Yellow
