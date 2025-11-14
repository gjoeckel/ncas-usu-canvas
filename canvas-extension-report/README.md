CANVAS INTERCEPTOR - IMPROVED VERSION
=====================================

PROBLEM SOLVED:
Your Chrome extension wasn't consistently intercepting Canvas LMS files.
This package provides an improved, more reliable solution with better debugging.

WHAT'S INCLUDED:
---------------

Chrome Extension Files (NEW & IMPROVED):
  ✓ manifest.json       - Extension configuration
  ✓ rules.json          - URL redirect rules (updated for YOUR URLs)
  ✓ background.js       - Service worker with logging
  ✓ popup.html          - Status interface
  ✓ popup.js            - Popup functionality
  ✓ icon.svg            - Icon template (convert to PNG)
  ✓ create-icons.sh     - Script to generate icon PNGs

Server Files (ENHANCED):
  ✓ server-improved.js  - Enhanced server with better logging
  ✓ generate-rules.js   - Auto-generate extension rules from mappings

Documentation:
  ✓ QUICK-START.txt     - Installation guide (START HERE!)
  ✓ TROUBLESHOOTING.txt - Comprehensive debugging guide
  ✓ README.md           - This file

WHY IT WASN'T WORKING:
---------------------

1. CACHE ISSUES (90% of problems)
   - Browser/Canvas caching old files
   - Solution: Hard reload (Ctrl+Shift+R) + disable cache

2. URL MISMATCHES
   - Your README had different attachment IDs (1205817) than your 
     file-mappings.json (1206448)
   - Solution: rules.json now matches YOUR actual URLs

3. RESOURCE TYPE ISSUES
   - Canvas sometimes loads CSS/JS with unexpected types
   - Solution: Added multiple resource types to catch all methods

4. DEBUGGING DIFFICULTIES
   - Hard to tell if extension or server was failing
   - Solution: Enhanced logging everywhere

IMPROVEMENTS IN THIS VERSION:
-----------------------------

Extension:
  ✓ Popup interface shows server status
  ✓ One-click cache clearing
  ✓ One-click page reload
  ✓ Better logging in service worker
  ✓ Multiple resource types to catch all load methods

Server:
  ✓ Enhanced request logging with timestamps
  ✓ Request counter for debugging
  ✓ New /test-url endpoint to verify mappings
  ✓ New /debug/mappings endpoint
  ✓ Better error messages
  ✓ Improved file change detection

Utilities:
  ✓ generate-rules.js - Auto-sync extension rules with server mappings
  ✓ create-icons.sh - Easy icon generation

QUICK START:
-----------

1. READ QUICK-START.txt for full installation guide

2. Install Chrome extension:
   - Create folder: canvas-interceptor-extension/
   - Copy these files into it:
     * manifest.json
     * rules.json (UPDATED with YOUR URLs!)
     * background.js
     * popup.html
     * popup.js
     * icon*.png (generate from icon.svg)
   - Load in Chrome: chrome://extensions/ > Load unpacked

3. Update server:
   - Replace server.js with server-improved.js
   - OR just use server-improved.js alongside: node server-improved.js

4. Sync extension rules:
   - Run: node generate-rules.js
   - Copy new rules.json to extension folder
   - Reload extension in Chrome

5. Test:
   - Start server: npm start
   - Click extension icon (should show green status)
   - Open Canvas with DevTools (F12)
   - Disable cache in Network tab
   - Hard reload: Ctrl+Shift+R
   - Check server console for [INTERCEPTED] messages

TESTING CHECKLIST:
-----------------

Test 1: Server Health
  curl http://localhost:3000/health
  Expected: JSON with status:"ok" and file info

Test 2: Mappings Debug
  curl http://localhost:3000/debug/mappings
  Expected: Shows your URLs and local paths

Test 3: URL Testing
  curl "http://localhost:3000/test-url?url=YOUR_CANVAS_URL"
  Expected: Shows if URL would be intercepted

Test 4: Direct Fetch
  curl "http://localhost:3000/?url=YOUR_FULL_CANVAS_URL"
  Expected: Returns your local file content

Test 5: Extension Status
  Click extension icon
  Expected: Green "Server running" status

Test 6: Live Interception
  1. Open Canvas with DevTools Network tab
  2. Disable cache
  3. Hard reload (Ctrl+Shift+R)
  4. Check for localhost:3000 requests
  5. Verify X-Intercepted-By header

TROUBLESHOOTING:
---------------

IF EXTENSION SHOWS "SERVER OFFLINE":
  → Start the Node server: npm start
  → Check http://localhost:3000/health in browser

IF FILES STILL LOAD FROM S3:
  → Hard reload: Ctrl+Shift+R (not regular F5)
  → Disable cache in DevTools Network tab
  → Clear cache via extension popup
  → Check URLs exactly match in rules.json
  → Reload extension in chrome://extensions/

IF GETTING 404 ERRORS:
  → Check file paths in file-mappings.json
  → Verify local files actually exist
  → Run: curl http://localhost:3000/debug/mappings

IF NOTHING WORKS:
  → Read TROUBLESHOOTING.txt (comprehensive guide)
  → Use DevTools Local Overrides (bulletproof method)
  → Check extension console: chrome://extensions/ > service worker

ALTERNATIVE METHOD:
------------------
If extension still doesn't work reliably, use Chrome DevTools Local Overrides:

1. Open DevTools (F12) on Canvas
2. Sources tab > Overrides
3. Select folder for overrides
4. Network tab > find your file > right-click > Override content
5. Edit directly in DevTools

This method is 100% reliable and doesn't require an extension.

KEY FILES TO UPDATE:
-------------------

In YOUR project:

1. file-mappings.json
   - Update URLs to match YOUR Canvas attachment URLs
   - Update localPath to YOUR local file paths
   - Get URLs from DevTools Network tab on Canvas

2. Extension rules.json
   - Run: node generate-rules.js
   - This auto-generates rules from file-mappings.json
   - Copy to extension folder
   - Reload extension

DAILY WORKFLOW:
--------------

1. Start server: npm start
2. Edit your local CSS/JS files
3. Save changes
4. Hard reload Canvas: Ctrl+Shift+R
5. See changes instantly

The server watches for changes automatically!

BEST PRACTICES:
--------------

✓ Keep server console visible to see interceptions
✓ Keep DevTools open with cache disabled
✓ Always use hard reload (Ctrl+Shift+R)
✓ Add unique comments in files to verify they're loading
✓ Use extension popup for quick cache clear + reload
✓ Run generate-rules.js after changing file-mappings.json

DEBUGGING TIPS:
--------------

Server Console:
  - Should show [INTERCEPTED] for each file served
  - Shows detailed request information
  - Shows file change notifications

Extension Console:
  - Open chrome://extensions/
  - Find Canvas Interceptor
  - Click "service worker" link
  - Should show "Rule matched" messages

Network Tab:
  - Filter by your filename (e.g., "ncas1")
  - Check Request URL (should be localhost:3000)
  - Check Response Headers (should have X-Intercepted-By)

SUPPORT:
-------

1. Read QUICK-START.txt for installation
2. Read TROUBLESHOOTING.txt for debugging
3. Check server console for errors
4. Check extension console for errors
5. Test endpoints with curl commands
6. Try DevTools Overrides as backup

WHAT'S FIXED:
------------

Before: Extension inconsistently intercepted files
After: Multiple improvements for reliability:
  ✓ Matches multiple resource types
  ✓ Better logging to see what's happening
  ✓ Auto-generates rules from mappings
  ✓ Status interface shows when it's working
  ✓ Easy cache clearing
  ✓ Better error messages
  ✓ Comprehensive documentation

You should have much more reliable interception now!

NEXT STEPS:
----------

1. Follow QUICK-START.txt to install
2. Run generate-rules.js to create updated rules
3. Install extension with new files
4. Test with the checklist above
5. If issues persist, check TROUBLESHOOTING.txt

Good luck! 🚀
