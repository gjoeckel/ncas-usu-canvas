# Canvas Page Update Script

This script updates Canvas wiki pages via the Canvas API by reading local HTML files and pushing them to Canvas.

## Overview

The script reads HTML files from `projects/ncas-usu-canvas/` and updates the **9 individual core skills pages** using the Canvas API PUT endpoint.

**Note**: The script only updates the core skills pages (not other pages like `core-skills.html`, `start-here.html`, `feedback.html`, etc.).

## Requirements

- **Git Bash** (or bash-compatible shell)
- **curl** (usually pre-installed on Windows with Git Bash)
- **jq** (JSON processor) - [Installation instructions](#installing-jq)

## Configuration

The script uses these default values (configured in the script):

- **Canvas Base URL**: `https://usucourses.instructure.com`
- **Course ID**: `2803`
- **API Token**: Read from `secrets/canvas-api-token.txt`
- **HTML Files Directory**: `projects/ncas-usu-canvas/`

## Canvas API Endpoint

```
PUT /api/v1/courses/:course_id/wiki/:url
```

Parameters:
- `course_id`: Canvas course ID (2803)
- `url`: Wiki page URL (e.g., "alternative-text", "captions")
- `wiki_page[body]`: HTML content of the page

## Usage

### Interactive Mode (Default)

The script shows a preview of all pages that will be updated and asks for confirmation:

```bash
./scripts/update-canvas-pages.sh
```

**Output Example:**
```
[INFO] Canvas API token loaded successfully
[INFO] Course ID: 2803
[INFO] Base URL: https://usucourses.instructure.com
[INFO] Starting Canvas page updates...
[INFO] Reading HTML files from: /path/to/projects/ncas-usu-canvas

[INFO] Preview: Pages to be updated

HTML File                          Canvas Page URL                     Size      
--------------------------------------------------------------------------------
alternative-text.html              alternative-text                    8KB
captions.html                      captions                            10KB
clear-writing.html                 clear-writing                       7KB
...

[INFO] Found 12 page(s) to update

Do you want to proceed with updating these pages? (yes/no): 
```

### Skip Confirmation

To update all pages without confirmation (useful for automation):

```bash
./scripts/update-canvas-pages.sh --yes
# or
./scripts/update-canvas-pages.sh -y
```

### Show Help

```bash
./scripts/update-canvas-pages.sh --help
# or
./scripts/update-canvas-pages.sh -h
```

### Core Skills Pages (9 pages)

The script only updates these 9 individual core skills pages:

1. `alternative-text.html` → `alternative-text`
2. `captions.html` → `captions`
3. `clear-writing.html` → `clear-writing`
4. `color-use.html` → `color-use`
5. `headings.html` → `headings`
6. `links.html` → `links`
7. `lists.html` → `lists`
8. `tables.html` → `tables`
9. `text-contrast.html` → `text-contrast`

**Note**: Other HTML files (like `core-skills.html`, `start-here.html`, `feedback.html`, `create-a-free-usu-canvas-account.html`) are **not** processed by this script.

## Installing jq

jq is required for JSON processing. Install it using one of these methods:

### Windows (Chocolatey)

```powershell
choco install jq
```

### Windows (Manual)

Download from: https://github.com/jqlang/jq/releases

### macOS

```bash
brew install jq
```

### Linux

```bash
sudo apt-get install jq
# or
sudo yum install jq
```

## Canvas API Token

The script reads the Canvas API token from `secrets/canvas-api-token.txt`.

**Important**: 
- The token file should contain only the token (with optional `4398~` prefix)
- The token must have permission to update wiki pages
- Keep the token file secure and never commit it to git

## Error Handling

The script:
- Exits with error code 1 if any page update fails
- Provides detailed error messages including HTTP status codes
- Shows a summary of successful and failed updates
- Includes a small delay (0.5s) between requests to avoid rate limiting

## Example Output

```
[INFO] Canvas API token loaded successfully
[INFO] Course ID: 2803
[INFO] Base URL: https://usucourses.instructure.com
[INFO] Starting Canvas page updates...
[INFO] Reading HTML files from: /path/to/projects/ncas-usu-canvas

[INFO] Processing: alternative-text.html -> alternative-text
[INFO] Updating page: alternative-text
[INFO] ✓ Successfully updated: alternative-text (HTTP 200)

[INFO] Processing: captions.html -> captions
[INFO] Updating page: captions
[INFO] ✓ Successfully updated: captions (HTTP 200)

...

=========================================
[INFO] Update Summary:
  Success: 12
  Errors:  0
  Skipped: 0
=========================================
```

## Troubleshooting

### "jq is required but not installed"

Install jq using the instructions above.

### "Canvas API token file not found"

Ensure `secrets/canvas-api-token.txt` exists and contains a valid Canvas API token.

### "Failed to update: [page] (HTTP 401)"

Your API token may be invalid or expired. Check the token file.

### "Failed to update: [page] (HTTP 403)"

Your API token doesn't have permission to update wiki pages. Ensure the token has the required permissions.

### "Failed to update: [page] (HTTP 404)"

The page URL may not exist in Canvas. Check that the page exists at: `https://usucourses.instructure.com/courses/2803/pages/[page-url]`

## Rate Limiting

Canvas API has rate limits. The script includes a 0.5 second delay between requests to avoid hitting rate limits. If you encounter rate limiting issues:

1. Increase the delay in the script (change `sleep 0.5` to `sleep 1` or higher)
2. Process pages in smaller batches
3. Check Canvas API rate limit documentation

## Security Notes

- Never commit the API token file to git
- Keep the token file secure (it's in `.gitignore`)
- Rotate tokens periodically
- Use tokens with minimal required permissions

## Related Documentation

- [Canvas API Documentation](https://canvas.instructure.com/doc/api/pages.html)
- [Canvas API Authentication](https://canvas.instructure.com/doc/api/file.oauth.html)

---

**Last Updated**: December 2024

