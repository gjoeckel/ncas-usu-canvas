# Test Cursor Terminal Configuration
Write-Host "Testing Cursor Terminal Configuration..." -ForegroundColor Blue

# Test Git Bash path
$gitBashPath = "C:\Users\A00288946\AppData\Local\Programs\Git\bin\bash.exe"
if (Test-Path $gitBashPath) {
    Write-Host "✅ Git Bash found at: $gitBashPath" -ForegroundColor Green
} else {
    Write-Host "❌ Git Bash not found at: $gitBashPath" -ForegroundColor Red
    exit 1
}

# Test Git Bash execution
try {
    $result = & $gitBashPath -c "echo 'Git Bash test successful' && pwd" 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Git Bash execution test passed" -ForegroundColor Green
        Write-Host "Output: $result" -ForegroundColor Gray
    } else {
        Write-Host "❌ Git Bash execution failed" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Git Bash execution error: $($_.Exception.Message)" -ForegroundColor Red
}

# Check Cursor settings
$cursorSettingsPath = "$env:APPDATA\Cursor\User\settings.json"
if (Test-Path $cursorSettingsPath) {
    Write-Host "✅ Cursor settings file found" -ForegroundColor Green
    
    $settings = Get-Content $cursorSettingsPath -Raw | ConvertFrom-Json
    if ($settings.'terminal.integrated.defaultProfile.windows' -eq "Git Bash") {
        Write-Host "✅ Default terminal profile set to Git Bash" -ForegroundColor Green
    } else {
        Write-Host "❌ Default terminal profile not set to Git Bash" -ForegroundColor Red
    }
    
    if ($settings.'terminal.integrated.profiles.windows'."Git Bash".path -eq $gitBashPath) {
        Write-Host "✅ Git Bash path in settings is correct" -ForegroundColor Green
    } else {
        Write-Host "❌ Git Bash path in settings is incorrect" -ForegroundColor Red
    }
} else {
    Write-Host "❌ Cursor settings file not found" -ForegroundColor Red
}

Write-Host "`n🎯 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Close Cursor completely" -ForegroundColor White
Write-Host "2. Reopen Cursor" -ForegroundColor White
Write-Host "3. Press Ctrl+` to open terminal" -ForegroundColor White
Write-Host "4. Should now open Git Bash instead of PowerShell" -ForegroundColor White

Write-Host "`n✅ Configuration test complete!" -ForegroundColor Green
