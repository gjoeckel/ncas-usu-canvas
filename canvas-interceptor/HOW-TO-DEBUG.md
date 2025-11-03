# How to Debug the Extension

## ❌ WRONG: Running in Canvas page console
```javascript
// This WON'T work on Canvas page!
chrome.runtime.sendMessage({type: 'DEBUG'})
```

## ✅ CORRECT: Running in Extension console

### Step 1: Open Extension Console
1. Go to `chrome://extensions`
2. Find **"Canvas Dev Interceptor (Minimal)"**
3. Click **"Inspect views: service worker"** (or click the refresh/reload icon)
4. **A new DevTools window opens** - this is the extension console

### Step 2: Run Debug Commands in Extension Console
```javascript
// Check state
chrome.runtime.sendMessage({type: 'STATE'})
  .then(console.log);

// Get all rules
chrome.runtime.sendMessage({type: 'DEBUG'})
  .then(console.log);

// Toggle
chrome.runtime.sendMessage({type: 'TOGGLE'})
  .then(console.log);
```

### Step 3: Check Network Tab on Canvas Page
1. Go back to Canvas page
2. Open DevTools (F12)
3. **Network tab**
4. Filter by `ncas2`
5. Look at the requests

---

## Critical Finding from Your Console Output

**You saw this:**
```
ncas2.js:17 ✅ 🚀 NCADEMI Navigation v2-min: Injected header/nav at top of body
```

**This means:**
- Canvas is loading `ncas2.js` from S3 (original location)
- The request is **NOT being intercepted**
- The redirect rule is **NOT firing**

---

## Root Cause

The redirect rules are either:
1. **Not matching** - URLs don't match exactly
2. **Not active** - Rules not enabled
3. **Overridden** - Another extension/Chrome blocking

---

## Immediate Next Steps

### 1. Check Network Tab
Open Canvas page → DevTools → Network:
1. Find the `ncas2.css` and `ncas2.js` requests
2. **Right-click on request → Copy → Copy URL**
3. **Share those URLs with me**

This will tell us if URLs match what we're expecting.

### 2. Check Extension Console
Open extension console (see above):
1. Run: `chrome.runtime.sendMessage({type: 'DEBUG'}).then(console.log)`
2. **Share the output**
3. Look for any error messages

### 3. Verify Extension is Enabled
1. Go to `chrome://extensions`
2. Make sure "Canvas Dev Interceptor (Minimal)" is **enabled**
3. Click the extension icon
4. Check popup shows: "Redirects: On"

---

## Quick Test

In extension console, run:
```javascript
(async () => {
  const rules = await chrome.declarativeNetRequest.getDynamicRules();
  console.log('Rules:', rules);
  
  const enabled = rules.some(r => r.id === 9001 || r.id === 9002);
  console.log('Should be enabled:', enabled);
})();
```

Then go to Canvas page Network tab and look for `ncas2.css` and `ncas2.js` - do they show `localhost:3000` or original S3 URLs?

---

*The console output proves rules are NOT matching. We need the actual URLs to fix this.*

