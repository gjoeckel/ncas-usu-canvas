# Canvas LMS File Interceptor - MCP Server

Local development server that intercepts Canvas LMS CSS/JS files and serves local versions.

## Setup

1. Install dependencies:
   npm install

2. Ensure local files exist:
   - NCAS1/CSS/testing/ncas1.css
   - NCAS1/CSS/testing/ncas1.js

3. Start server:
   npm start

## Usage

### Method 1: Browser Extension (Recommended)

Use one of the included MV3 extensions:

- Full: `canvas-interceptor/extension` (UI, options, health, cache)
- Minimal: `canvas-interceptor/min-extension` (hardcoded S3 targets → localhost redirects; single toggle)
Minimal extension
-----------------
1) Load unpacked → `canvas-interceptor/min-extension`
2) Click popup: Toggle Redirects → On
3) Hard refresh Canvas

Hardcoded targets in `min-extension/background.js`:
- CSS: https://instructure-uploads.s3.amazonaws.com/account_43980000000000001/attachments/1207657/ncas2.css
- JS:  https://instructure-uploads.s3.amazonaws.com/account_43980000000000001/attachments/1207656/ncas2.js
Redirect template: http://localhost:3000/test-url?url={{URL}}

Steps:
1) Load extension: Chrome → chrome://extensions → Enable Developer mode → Load unpacked → select `canvas-interceptor/extension`.
2) Click the extension icon (popup) to:
   - Enable/Disable Redirects (dynamic rules to localhost)
   - Start Server (requires Native Messaging host; otherwise shows fallback command)
   - Health (pings http://localhost:3000/health)
   - Clear Cache (chrome.browsingData)
   - Toggle Overlay (content script panel on Canvas pages)

Native Messaging (optional: Start server button)
---------------------------------------------
Windows setup:
- Update `canvas-interceptor/native-messaging/host.json` allowed_origins with your installed extension ID.
- Register host per Chrome docs (Registry). Example (PowerShell as Admin):
  New-Item -Path "HKCU:\Software\Google\Chrome\NativeMessagingHosts\com.canvas.dev.interceptor" -Force | Out-Null
  New-ItemProperty -Path "HKCU:\Software\Google\Chrome\NativeMessagingHosts\com.canvas.dev.interceptor" -Name "(default)" -Value "C:\\Users\\A00288946\\cursor-global\\canvas-interceptor\\native-messaging\\host.json" -PropertyType String -Force | Out-Null
- The stub `start-server-helper.cmd` starts the server in Git Bash.

If native messaging is not configured, the popup shows the command to run in Git Bash.

### Method 2: Chrome DevTools Network Override

1. Open Chrome DevTools (F12)
2. Go to Network tab
3. Right-click the CSS/JS file
4. Select "Override content"
5. Point to your local file

### Method 3: Service Worker (Advanced)

Inject a service worker into the Canvas page that intercepts fetch requests.

## Testing

1. Start the server:
   npm start

2. Test health endpoint:
   curl http://localhost:3000/health

3. Test CSS interception:
   curl "http://localhost:3000/?url=https://instructure-uploads.s3.amazonaws.com/account_43980000000000001/attachments/1205817/ncas1-reboot-14.css"

4. Test JS interception:
   curl "http://localhost:3000/?url=https://instructure-uploads.s3.amazonaws.com/account_43980000000000001/attachments/1205816/ncas1-reboot-14.js"

5. Open Canvas page:
   https://usucourses.instructure.com/courses/2803

## Extension Targets

- Dynamic redirects target:
  - CSS: https://instructure-uploads.s3.amazonaws.com/account_43980000000000001/attachments/1207657/ncas2.css → ../projects/NCAS/NCAS1/ncas3.css
  - JS:  https://instructure-uploads.s3.amazonaws.com/account_43980000000000001/attachments/1207656/ncas2.js  → ../projects/NCAS/NCAS1/ncas3.js


## File Watching

The server automatically watches for changes in:
- NCAS1/CSS/testing/ncas1.css
- NCAS1/CSS/testing/ncas1.js
- file-mappings.json

Changes are detected and logged. Simply refresh the Canvas page to see updates.
