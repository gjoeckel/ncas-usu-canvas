# Quick Fix - Extension Not Loading New Files

## Check These in Order:

### 1. Extension Version
- Go to `chrome://extensions/`
- Look for "Canvas Dev Interceptor (Minimal)" 
- Version should be **0.3.2**
- If not, click the **refresh** button on the extension card

### 2. Extension Enabled
- Make sure the **toggle switch** is ON (blue/green)

### 3. Reload Rules
- Click the **extension icon** in Chrome toolbar
- Click **"Toggle Redirects"** button to turn OFF
- Click **"Toggle Redirects"** again to turn ON
- Check popup shows: "Redirects: On" and "Server: Online"

### 4. Check Service Worker Console
- In `chrome://extensions/`, click **"service worker"** link (blue text)
- Look for logs with `[CDI]` prefix
- Should see: `[CDI] CSS redirect:` with a URL containing `_t=` parameter

### 5. Check Network Tab
- Go to Canvas course page
- Press **F12** → **Network** tab
- Look for `ncas2.css` and `ncas2.js` files
- Should show redirected to `localhost:3000` not AWS

If all checks pass but still seeing old code, the issue is browser caching.

