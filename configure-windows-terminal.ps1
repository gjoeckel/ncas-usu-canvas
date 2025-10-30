# Configure Windows Terminal to use Git Bash as default
# Run this script as Administrator

Write-Host "Configuring Windows Terminal for Git Bash..." -ForegroundColor Blue

# Check if Windows Terminal is installed
$wtPath = Get-Command wt.exe -ErrorAction SilentlyContinue
if (-not $wtPath) {
    Write-Host "Windows Terminal not found. Please install it from Microsoft Store first." -ForegroundColor Red
    Write-Host "Download: https://apps.microsoft.com/store/detail/windows-terminal/9N0DX20HK701" -ForegroundColor Yellow
    exit 1
}

Write-Host "Windows Terminal found: $($wtPath.Source)" -ForegroundColor Green

# Get Windows Terminal settings path
$wtSettingsPath = "$env:LOCALAPPDATA\Packages\Microsoft.WindowsTerminal_8wekyb3d8bbwe\LocalState\settings.json"

# Check if settings file exists
if (-not (Test-Path $wtSettingsPath)) {
    Write-Host "Windows Terminal settings not found. Please open Windows Terminal first to create the settings file." -ForegroundColor Yellow
    Write-Host "Then run this script again." -ForegroundColor Yellow
    exit 1
}

Write-Host "Windows Terminal settings found: $wtSettingsPath" -ForegroundColor Green

# Create backup
$backupPath = "$wtSettingsPath.backup.$(Get-Date -Format 'yyyyMMdd-HHmmss')"
Copy-Item $wtSettingsPath $backupPath
Write-Host "Backup created: $backupPath" -ForegroundColor Green

# Read current settings
$currentSettings = Get-Content $wtSettingsPath -Raw | ConvertFrom-Json

# Update default profile to Git Bash
$currentSettings.defaultProfile = "{61c54bbd-c2c6-5271-96e7-009a87ff44bf}"

# Ensure Git Bash profile exists
$gitBashProfile = @{
    guid = "{61c54bbd-c2c6-5271-96e7-009a87ff44bf}"
    name = "Git Bash"
    commandline = "C:\Users\A00288946\AppData\Local\Programs\Git\bin\bash.exe --login -i"
    startingDirectory = "%USERPROFILE%"
    icon = "C:\Users\A00288946\AppData\Local\Programs\Git\mingw64\share\git\git-for-windows.ico"
    fontFace = "Cascadia Code"
    fontSize = 12
    colorScheme = "Campbell"
}

# Add or update Git Bash profile
if (-not $currentSettings.profiles) {
    $currentSettings | Add-Member -Type NoteProperty -Name "profiles" -Value @{}
}

if (-not $currentSettings.profiles.list) {
    $currentSettings.profiles | Add-Member -Type NoteProperty -Name "list" -Value @()
}

# Check if Git Bash profile already exists
$existingProfile = $currentSettings.profiles.list | Where-Object { $_.guid -eq "{61c54bbd-c2c6-5271-96e7-009a87ff44bf}" }

if ($existingProfile) {
    Write-Host "Updating existing Git Bash profile..." -ForegroundColor Yellow
    $existingProfile.name = $gitBashProfile.name
    $existingProfile.commandline = $gitBashProfile.commandline
    $existingProfile.startingDirectory = $gitBashProfile.startingDirectory
    $existingProfile.icon = $gitBashProfile.icon
    $existingProfile.fontFace = $gitBashProfile.fontFace
    $existingProfile.fontSize = $gitBashProfile.fontSize
    $existingProfile.colorScheme = $gitBashProfile.colorScheme
} else {
    Write-Host "Adding new Git Bash profile..." -ForegroundColor Yellow
    $currentSettings.profiles.list += $gitBashProfile
}

# Save updated settings
$updatedSettings = $currentSettings | ConvertTo-Json -Depth 10
Set-Content $wtSettingsPath $updatedSettings -Encoding UTF8

Write-Host "Windows Terminal configured successfully!" -ForegroundColor Green
Write-Host "Git Bash is now set as the default terminal profile." -ForegroundColor Green
Write-Host "Restart Windows Terminal or open a new tab to see the changes." -ForegroundColor Yellow

# Test the configuration
Write-Host "`nTesting configuration..." -ForegroundColor Blue
try {
    & wt.exe --help | Out-Null
    Write-Host "Windows Terminal is working correctly." -ForegroundColor Green
} catch {
    Write-Host "Warning: Could not test Windows Terminal." -ForegroundColor Yellow
}

Write-Host "`nConfiguration complete!" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Blue
Write-Host "1. Restart Windows Terminal" -ForegroundColor White
Write-Host "2. Open a new terminal tab - it should default to Git Bash" -ForegroundColor White
Write-Host "3. Test in Cursor by opening a new terminal (Ctrl+`)" -ForegroundColor White
