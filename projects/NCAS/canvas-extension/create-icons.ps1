# PowerShell script to create PNG icons from SVG
# Note: You'll need to install ImageMagick or use a different method

Write-Host "Creating icon files..." -ForegroundColor Cyan

# Check if ImageMagick is installed
try {
    $null = Get-Command magick -ErrorAction Stop
    Write-Host "ImageMagick found!" -ForegroundColor Green
    
    # Convert SVG to PNG in different sizes
    magick icon.svg -resize 16x16 icon16.png
    magick icon.svg -resize 48x48 icon48.png
    magick icon.svg -resize 128x128 icon128.png
    
    Write-Host "`n✅ Icons created successfully!" -ForegroundColor Green
    Write-Host "Files created:" -ForegroundColor Yellow
    Write-Host "  - icon16.png"
    Write-Host "  - icon48.png"
    Write-Host "  - icon128.png"
} catch {
    Write-Host "`n⚠️  ImageMagick not found!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Options:" -ForegroundColor Cyan
    Write-Host "1. Install ImageMagick: https://imagemagick.org/script/download.php"
    Write-Host "2. Use an online converter: https://convertio.co/svg-png/"
    Write-Host "3. Create simple colored PNG files with these dimensions:"
    Write-Host "   - icon16.png: 16x16 pixels" -ForegroundColor White
    Write-Host "   - icon48.png: 48x48 pixels" -ForegroundColor White
    Write-Host "   - icon128.png: 128x128 pixels" -ForegroundColor White
}

