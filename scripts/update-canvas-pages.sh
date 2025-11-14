#!/bin/bash

# Update Canvas Pages via API
# This script reads HTML files and updates Canvas wiki pages using the Canvas API
#
# Usage:
#   ./scripts/update-canvas-pages.sh              # Preview and confirm before updating
#   ./scripts/update-canvas-pages.sh --yes        # Skip confirmation and update all
#   ./scripts/update-canvas-pages.sh --help       # Show help message

# Don't use set -e - we want to handle errors manually and continue processing

# Parse command line arguments (before functions, use echo for errors)
SKIP_CONFIRM="false"
SHOW_HELP="false"

for arg in "$@"; do
    case $arg in
        --yes|-y)
            SKIP_CONFIRM="true"
            shift
            ;;
        --help|-h)
            SHOW_HELP="true"
            shift
            ;;
        *)
            echo "Error: Unknown option: $arg"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Show help if requested (before other setup)
if [ "$SHOW_HELP" = "true" ]; then
    echo "Update Canvas Pages via API"
    echo ""
    echo "Usage:"
    echo "  $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --yes, -y     Skip confirmation and update all pages"
    echo "  --help, -h    Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                    # Preview pages and confirm before updating"
    echo "  $0 --yes              # Update all pages without confirmation"
    exit 0
fi

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
HTML_DIR="$PROJECT_ROOT/projects/ncas-usu-canvas"
TOKEN_FILE="$PROJECT_ROOT/secrets/canvas-api-token.txt"
CANVAS_BASE_URL="https://usucourses.instructure.com"
COURSE_ID="2803"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required files/directories exist
if [ ! -d "$HTML_DIR" ]; then
    log_error "HTML directory not found: $HTML_DIR"
    exit 1
fi

if [ ! -f "$TOKEN_FILE" ]; then
    log_error "Canvas API token file not found: $TOKEN_FILE"
    exit 1
fi

# Read API token (remove any newlines or whitespace, remove optional prefix)
CANVAS_TOKEN=$(cat "$TOKEN_FILE" | tr -d '\n\r ' | sed -E 's/^[0-9]+~//')
if [ -z "$CANVAS_TOKEN" ]; then
    log_error "Failed to read Canvas API token from $TOKEN_FILE"
    exit 1
fi

log_info "Canvas API token loaded successfully"
log_info "Course ID: $COURSE_ID"
log_info "Base URL: $CANVAS_BASE_URL"

# Function to convert HTML filename to Canvas page URL
# e.g., "alternative-text.html" -> "alternative-text"
get_page_url() {
    local filename="$1"
    basename "$filename" .html
}

# Function to update a single Canvas page
update_page() {
    local html_file="$1"
    local page_url=$(get_page_url "$html_file")
    local api_url="${CANVAS_BASE_URL}/api/v1/courses/${COURSE_ID}/pages/${page_url}"
    
    log_info "Updating page: $page_url"
    
    # Read HTML content
    local html_content=$(cat "$html_file")
    
    # Canvas API uses multipart form data for wiki page updates
    # Send the HTML content directly as form data
    # Note: Using printf to preserve newlines and special characters
    local response=$(printf '%s' "$html_content" | curl -s -w "\n%{http_code}" -X PUT \
        -H "Authorization: Bearer ${CANVAS_TOKEN}" \
        -F "wiki_page[body]=<-" \
        "$api_url")
    
    # Extract HTTP status code (last line)
    local http_code=$(echo "$response" | tail -n1)
    
    # Extract response body (all but last line)
    local response_body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -eq 200 ] || [ "$http_code" -eq 201 ]; then
        log_info "✓ Successfully updated: $page_url (HTTP $http_code)"
        return 0
    else
        log_error "✗ Failed to update: $page_url (HTTP $http_code)"
        if [ "$HAS_JQ" = "true" ]; then
            echo "$response_body" | jq '.' 2>/dev/null || echo "$response_body"
        else
            echo "$response_body"
        fi
        return 1
    fi
}

# Check if jq is installed (preferred for JSON processing)
HAS_JQ=false
if command -v jq &> /dev/null; then
    HAS_JQ=true
    log_info "jq found - using jq for JSON processing"
else
    log_warn "jq not found - using built-in JSON escaping (less reliable for complex HTML)"
    log_info "For better results, install jq:"
    log_info "  Windows (via Chocolatey): choco install jq"
    log_info "  macOS: brew install jq"
    log_info "  Linux: sudo apt-get install jq"
fi

# Global variable to store temp file path
TEMP_FILE_LIST=""

# Whitelist of core skills pages to update (9 individual skill pages)
CORE_SKILLS_PAGES=(
    "alternative-text"
    "captions"
    "clear-writing"
    "color-use"
    "headings"
    "links"
    "tables"
    "text-contrast"
    "lists"
)

# Function to check if a page is a core skills page
is_core_skills_page() {
    local page_url="$1"
    for skill_page in "${CORE_SKILLS_PAGES[@]}"; do
        if [ "$page_url" = "$skill_page" ]; then
            return 0
        fi
    done
    return 1
}

# Function to preview pages that will be updated
preview_pages() {
    log_info "Preview: Core Skills pages to be updated"
    echo ""
    
    local file_count=0
    local files_to_update=()
    
    # Collect only core skills HTML files
    for html_file in "$HTML_DIR"/*.html; do
        if [ ! -f "$html_file" ]; then
            continue
        fi
        
        local filename=$(basename "$html_file")
        local page_url=$(get_page_url "$html_file")
        
        # Only include core skills pages
        if ! is_core_skills_page "$page_url"; then
            continue
        fi
        
        local file_size=$(wc -c < "$html_file" | tr -d ' ')
        files_to_update+=("$html_file|$filename|$page_url|$file_size")
        ((file_count++))
    done
    
    if [ $file_count -eq 0 ]; then
        log_warn "No core skills HTML files found in $HTML_DIR"
        log_info "Expected core skills pages:"
        for skill_page in "${CORE_SKILLS_PAGES[@]}"; do
            echo "  - $skill_page.html"
        done
        return 1
    fi
    
    # Display preview table
    printf "%-35s %-35s %-10s\n" "HTML File" "Canvas Page URL" "Size"
    echo "--------------------------------------------------------------------------------"
    
    for file_info in "${files_to_update[@]}"; do
        IFS='|' read -r html_file filename page_url file_size <<< "$file_info"
        local size_kb=$((file_size / 1024))
        printf "%-35s %-35s %-10s\n" "$filename" "$page_url" "${size_kb}KB"
    done
    
    echo ""
    log_info "Found $file_count page(s) to update"
    echo ""
    
    # Store file list for later use (Windows-compatible temp file)
    TEMP_FILE_LIST="${TMPDIR:-/tmp}/canvas_pages_to_update_$$.txt"
    printf '%s\n' "${files_to_update[@]}" > "$TEMP_FILE_LIST"
    return 0
}

# Function to confirm before proceeding
confirm_update() {
    if [ "$SKIP_CONFIRM" = "true" ]; then
        return 0
    fi
    
    echo ""
    read -p "Do you want to proceed with updating these pages? (yes/no): " -r
    echo ""
    
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        log_warn "Update cancelled by user"
        [ -n "$TEMP_FILE_LIST" ] && [ -f "$TEMP_FILE_LIST" ] && rm -f "$TEMP_FILE_LIST"
        exit 0
    fi
}

# Main execution
main() {
    log_info "Starting Canvas page updates..."
    log_info "Reading HTML files from: $HTML_DIR"
    echo ""
    
    # Preview pages before updating
    if ! preview_pages; then
        exit 1
    fi
    
    # Confirm before proceeding
    confirm_update
    
    log_info "Proceeding with updates..."
    echo ""
    
    local success_count=0
    local error_count=0
    local skipped_count=0
    
    # Read file list from temp file
    local files_to_update=()
    if [ -n "$TEMP_FILE_LIST" ] && [ -f "$TEMP_FILE_LIST" ]; then
        while IFS= read -r line; do
            [ -n "$line" ] && files_to_update+=("$line")
        done < "$TEMP_FILE_LIST"
        rm -f "$TEMP_FILE_LIST"
    else
        # Fallback: process files directly (only core skills pages)
        for html_file in "$HTML_DIR"/*.html; do
            if [ ! -f "$html_file" ]; then
                continue
            fi
            local filename=$(basename "$html_file")
            local page_url=$(get_page_url "$html_file")
            
            # Only include core skills pages
            if is_core_skills_page "$page_url"; then
                files_to_update+=("$html_file|$filename|$page_url")
            fi
        done
    fi
    
    # Process each HTML file
    for file_info in "${files_to_update[@]}"; do
        IFS='|' read -r html_file filename page_url <<< "$file_info"
        
        if [ ! -f "$html_file" ]; then
            log_warn "File not found: $html_file (skipping)"
            skipped_count=$((skipped_count + 1))
            continue
        fi
        
        log_info "Processing: $filename -> $page_url"
        
        if update_page "$html_file"; then
            success_count=$((success_count + 1))
        else
            error_count=$((error_count + 1))
        fi
        
        echo ""
        
        # Small delay to avoid rate limiting
        sleep 0.5
    done
    
    # Summary
    echo "========================================="
    log_info "Update Summary:"
    echo "  Success: $success_count"
    echo "  Errors:  $error_count"
    echo "  Skipped: $skipped_count"
    echo "========================================="
    
    if [ $error_count -gt 0 ]; then
        exit 1
    fi
}

# Run main function
main


