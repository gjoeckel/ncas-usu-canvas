#!/bin/bash
# Create PNG icons from SVG
# Requires ImageMagick: convert command

echo "Creating icon files..."

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "ImageMagick not found. Please install ImageMagick first."
    echo "Or manually convert icon.svg to icon16.png, icon48.png, icon128.png"
    echo ""
    echo "Alternatively, use an online converter:"
    echo "https://convertio.co/svg-png/"
    echo ""
    echo "Or create simple colored PNG files with these dimensions:"
    echo "- icon16.png: 16x16 pixels"
    echo "- icon48.png: 48x48 pixels"
    echo "- icon128.png: 128x128 pixels"
    exit 1
fi

# Convert SVG to PNG in different sizes
convert icon.svg -resize 16x16 icon16.png
convert icon.svg -resize 48x48 icon48.png
convert icon.svg -resize 128x128 icon128.png

echo "✅ Icons created successfully!"
echo "Files created:"
echo "  - icon16.png"
echo "  - icon48.png"
echo "  - icon128.png"

