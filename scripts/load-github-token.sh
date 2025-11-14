#!/bin/bash
# Load GitHub Token from cursor-global secrets
# Purpose: Set GITHUB_TOKEN environment variable from centralized token file
# Usage: source load-github-token.sh

TOKEN_FILE="$HOME/cursor-global/secrets/github-token.txt"

if [ -f "$TOKEN_FILE" ]; then
    export GITHUB_TOKEN=$(cat "$TOKEN_FILE" | tr -d '\n\r')
    
    echo "✅ GITHUB_TOKEN loaded successfully"
    echo "   Token: ${GITHUB_TOKEN:0:7}... (hidden)"
    echo "   Source: cursor-global/secrets/github-token.txt"
    echo ""
    echo "⚠️  This sets the token for current session only"
    echo "   For persistent setting on Windows, run: load-github-token.ps1"
else
    echo "❌ Token file not found: $TOKEN_FILE"
    echo "   Create the file with your GitHub Personal Access Token"
    return 1
fi
