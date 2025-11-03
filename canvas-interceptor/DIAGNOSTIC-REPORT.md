# Canvas Dev Interceptor - Diagnostic Report

## Issue: CSS/JS Override Not Working

### System Status ✅
- **Server Running**: Yes (PID 1581, serving correctly)
- **Extension Loaded**: Version 0.1.2
- **Redirects Toggle**: On
- **Server Health**: Online
- **Test URL Works**: Confirmed serving ncas3.css from localhost:3000

---

## Four Potential Causes & Fixes

### Cause #1: Browser Cache Not Cleared ❌
**Problem**: Browser cached old CSS/JS; hard refresh not clearing service worker cache.

**Evidence**:
- Chrome DevTools Network tab shows old CSS despite redirect
- Cache-Control headers may not be respected by extension redirects

**Fix #1**: Manual Cache Clear
1. Open Chrome DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"
4. OR: DevTools → Application tab → Storage → Clear site data

**Fix #1b**: Add Cache Busters to Server
```javascript
res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
res.setHeader('Pragma', 'no-cache');
res.setHeader('Expires', '0');
```

**Fix #1c**: Extension-based Cache Clear
Add to background.js on toggle enable:
```javascript
async function enable() {
  // Clear cache first
  await chrome.browsingData.removeCache({});
  // Then add rules
  // ... existing code
}
```

---

### Cause #2: Wrong URL Being Requested 🔍
**Problem**: Canvas may be loading different URLs than expected.

**Evidence**:
- Hardcoded URLs in background.js may be outdated
- Canvas may use versioned URLs or different file paths

**Fix #2**: Dynamic URL Detection
1. Open Chrome DevTools → Network tab
2. Filter by CSS/JS
3. Find the actual URLs Canvas is loading
4. Update background.js TARGETS with actual URLs

**Fix #2b**: Use Wildcard URL Matching
Replace specific URLs with patterns:
```javascript
condition: { 
  urlFilter: '*ncas*.css',  // Match any ncas CSS
  resourceTypes: ['stylesheet'] 
}
```

**Fix #2c**: Debug Mode - Log All Requests
Add to background.js:
```javascript
chrome.declarativeNetRequest.onRuleMatchedDebug.addListener((details) => {
  console.log('Rule matched:', details);
});
```

---

### Cause #3: CORS or Security Restrictions 🚫
**Problem**: localhost:3000 blocked by CORS or mixed content policies.

**Evidence**:
- Network tab shows failed requests to localhost
- CORS errors in console
- Mixed content warnings (HTTPS → HTTP)

**Fix #3**: Verify CORS Headers
Server already has:
```javascript
app.use(cors({ origin: '*', ... }));
```
Check if it's actually being applied to redirected requests.

**Fix #3b**: Add Server CORS Headers to All Responses
```javascript
res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
res.setHeader('Access-Control-Expose-Headers', '*');
```

**Fix #3c**: Use HTTPS localhost (advanced)
For mixed content issues, use HTTPS tunnel:
- ngrok: `ngrok http 3000`
- Or: Set up local SSL certificate

---

### Cause #4: Extension Rules Not Active ⚙️
**Problem**: DeclarativeNetRequest rules not being applied or conflicting.

**Evidence**:
- Rules exist but requests not intercepted
- Priority conflicts with other extensions
- Rules disabled by Chrome

**Fix #4**: Verify Rules Are Actually Applied
Add debug to background.js:
```javascript
async function state() {
  const rules = await chrome.declarativeNetRequest.getDynamicRules();
  console.log('Current rules:', rules);  // Debug
  return { enabled: rules.some(r => r.id === RULE_IDS.CSS || r.id === RULE_IDS.JS) };
}
```

**Fix #4b**: Increase Rule Priority
```javascript
priority: 1,  // Change to higher value
priority: 1000,  // Force higher priority
```

**Fix #4c**: Check for Extension Conflicts
1. chrome://extensions → Developer mode
2. Disable ALL other extensions
3. Test if intercept works
4. Re-enable one by one to find conflict

---

## Recommended Diagnostic Steps

### Step 1: Network Tab Inspection 🔍
1. Open Canvas in Chrome
2. Open DevTools → Network tab
3. Filter by "CSS" or "JS"
4. Look for:
   - What URLs are being requested
   - Are they going to localhost:3000?
   - Any 404/500 errors?
   - Response preview shows old or new content?

### Step 2: Extension Debug Console 🐛
1. chrome://extensions → Canvas Dev Interceptor → Details
2. Click "Inspect views: service worker"
3. In console, check:
   - Any errors on load?
   - Log messages from background.js
   - Run: `chrome.declarativeNetRequest.getDynamicRules()` to see rules

### Step 3: Verify Redirect Chain 🔗
1. Network tab → Find CSS request
2. Check:
   - Original URL: Should be S3 URL
   - Redirect to: Should be localhost:3000/test-url?url=...
   - Final response: Should show ncas3.css content

### Step 4: Server Logs Check 📋
From terminal:
```bash
cd canvas-interceptor
# Should see in logs:
# [INTERCEPTED] https://...
# [SERVED] C:\...\ncas3.css
```

---

## Quick Fix Checklist

- [ ] Extension reloaded in chrome://extensions
- [ ] Popup shows "Redirects: On"
- [ ] Popup shows "Server: Online"
- [ ] Hard refresh Canvas (Ctrl+Shift+R)
- [ ] DevTools Network tab checked
- [ ] No cache issues
- [ ] Correct URLs being intercepted
- [ ] CORS headers present
- [ ] Extension rules active
- [ ] No conflicting extensions

---

## Alternative Approaches

### Alternative 1: Use Content Script Injection
Instead of redirecting, inject CSS/JS directly:
```javascript
// content.js
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'INJECT_CSS') {
    const style = document.createElement('style');
    style.textContent = msg.css;
    document.head.appendChild(style);
  }
});
```

### Alternative 2: Use webRequest API (Manifest V2)
Switch to manifest V2 for more control:
- More powerful request modification
- Can inject arbitrary content
- Less restricted than declarativeNetRequest

### Alternative 3: Use Proxy Configuration
Set up system proxy to intercept:
- Fiddler/Charles proxy
- Redirect S3 URLs to localhost
- Works outside browser

### Alternative 4: Use Service Worker on Page
Inject service worker into Canvas page:
```javascript
navigator.serviceWorker.register('/sw.js');
// Override fetch to serve local files
```

---

## Next Steps

1. **Run diagnostic checks** (Steps 1-4 above)
2. **Share findings**:
   - Network tab screenshot
   - Extension console errors
   - Server logs
   - Canvas URLs being requested
3. **Try quick fixes** in order of likelihood
4. **Test after each fix** before moving to next

---

*Generated: 2025-10-30*
*Server Status: Running on localhost:3000*
*Extension: v0.1.2*

