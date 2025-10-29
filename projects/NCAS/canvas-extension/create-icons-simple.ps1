# Simple icon creation script using PowerShell
Add-Type -AssemblyName System.Drawing

Write-Host "Creating icon files..." -ForegroundColor Cyan

# Create 16x16 icon
$bmp16 = New-Object System.Drawing.Bitmap(16,16)
$g16 = [System.Drawing.Graphics]::FromImage($bmp16)
$g16.Clear([System.Drawing.Color]::FromArgb(0,102,204))
$bmp16.Save('icon16.png',[System.Drawing.Imaging.ImageFormat]::Png)
$g16.Dispose()
$bmp16.Dispose()
Write-Host "Created icon16.png" -ForegroundColor Green

# Create 48x48 icon
$bmp48 = New-Object System.Drawing.Bitmap(48,48)
$g48 = [System.Drawing.Graphics]::FromImage($bmp48)
$g48.Clear([System.Drawing.Color]::FromArgb(0,102,204))
$bmp48.Save('icon48.png',[System.Drawing.Imaging.ImageFormat]::Png)
$g48.Dispose()
$bmp48.Dispose()
Write-Host "Created icon48.png" -ForegroundColor Green

# Create 128x128 icon
$bmp128 = New-Object System.Drawing.Bitmap(128,128)
$g128 = [System.Drawing.Graphics]::FromImage($bmp128)
$g128.Clear([System.Drawing.Color]::FromArgb(0,102,204))
$bmp128.Save('icon128.png',[System.Drawing.Imaging.ImageFormat]::Png)
$g128.Dispose()
$bmp128.Dispose()
Write-Host "Created icon128.png" -ForegroundColor Green

Write-Host "`n✅ All icons created successfully!" -ForegroundColor Green

