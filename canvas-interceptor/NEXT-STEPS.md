# Next Steps - Canvas Dev Interceptor Debugging

## ✅ Current Status

- **Extension**: Loaded, rules enabled (2 rules active)
- **Server**: Running on localhost:3000, serving files correctly
- **Logging**: Enhanced debug output added
- **Version**: 0.1.4

## 🔍 Critical Diagnostic Step Required

**You need to check if the rules are actually being TRIGGERED when Canvas loads.**

### Action: Reload Extension and Check Console

1. **Go to `chrome://extensions`**
2. **Find "Canvas Dev Interceptor (Minimal)"**
3. **Click "Inspect views: service worker"** (or the refresh/reload icon)
4. **Keep the console window open**
5. **In a separate tab, load a Canvas page**
6. **Watch the console for these messages:**

Expected messages if rules are working:
```
[CDI] RULE MATCHED: {requestId: ..., url: '...ncas2.css', ...}
```

### What to Look For

**IF you see `[CDI] RULE MATCHED` logs:**
- ✅ Rules ARE being triggered
- 🔴 Issue: Redirect URL is wrong or server not responding
- 💡 Check: Network tab shows what URL the redirect goes to

**IF you DON'T see `[CDI] RULE MATCHED` logs:**
- 🔴 Rules are NOT being triggered
- 💡 Likely causes:
  - Wrong URLs in TARGETS (Canvas loading different URLs)
  - Extension not active on the Canvas domain
  - Rules overridden by another extension

---

## 🎯 Most Likely Issue: Wrong URLs

Canvas might be loading URLs that are slightly different from what we're expecting.

### Solution: Find the REAL URLs Canvas is Loading

1. **Open Canvas in Chrome**
2. **Open DevTools (F12)**
3. **Go to Network tab**
4. **Filter by "CSS" or "JS"**
5. **Look for files named `ncas2.css` or similar**
6. **Right-click on the request → Copy → Copy URL**

Example of what you might find:
- ✅ What we have: `https://instructure-uploads.s3.amazonaws.com/account_43980000000000001/attachments/1207657/ncas2.css`
- 🔴 Actual URL: `https://instructure-uploads.s3.amazonaws.com/account_43980000000000001/attachments/1207657/ncas2.css?v=123456`
- 🔴 OR: `https://instructure-uploads.s3.amazonaws.com/account_43980000000000001/attachments/1207657/ncas2.abc123.css`
- 🔴 OR: Completely different URL pattern

---

## 🛠️ Alternative: Use Wildcard Matching

If URLs have version parameters or are dynamic, we can use wildcards:

### Update background.js to use wildcard patterns:

```javascript
const TARGETS = {
  css: '*ncas2.css',  // Match any URL containing ncas2.css
  js:  '*ncas2.js'    // Match any URL containing ncas2.js
};

async function enable() {
  const addRules = [
    {
      id: RULE_IDS.CSS,
      priority: 1000,
      action: { type: 'redirect', redirect: { url: 'http://localhost:3000/test-url?url={{URL}}' } },
      condition: { urlFilter: '*ncas2.css', resourceTypes: ['stylesheet'] }
    },
    {
      id: RULE_IDS.JS,
      priority: 1000,
      action: { type: 'redirect', redirect: { url: 'http://localhost:3000/test-url?url={{URL}}' } },
      condition: { urlFilter: '*ncas2.js', resourceTypes: ['script'] }
    }
  ];
  // ... rest of code
}
```

**NOTE**: DeclarativeNetRequest doesn't support template replacement `{{URL}}` in wildcard mode!

### Better Solution: Use regex or exact match with getURL

We need to handle the redirect URL differently. The issue is we can't use `{{URL}}` placeholder with wildcards.

**Option A: Hardcode full redirect for exact URLs**
```javascript
condition: { urlFilter: TARGETS.css, resourceTypes: ['stylesheet'] },
action: { type: 'redirect', redirect: { 
  url: 'http://localhost:3000/test-url?url=' + encodeURIComponent(TARGETS.css)
}}
```

Wait, that's what we already have. The issue is we need the ORIGINAL URL in the redirect.

**Option B: Use transform rule (Chrome 121+)**
```javascript
action: { 
  type: 'redirect', 
  redirect: { 
    transform: { 
      host: 'localhost:3000',
      path: '/test-url',
      queryTransform: {
        addOrReplaceParams: [
          { key: 'url', replaceOnly: true }
        ]
      }
    }
  }
}
```

**Option C: Use modifyHeaders with custom logic**

Actually, the simplest solution: Just hardcode the exact redirect URL we need!

---

## 🚨 BUG FOUND: Redirect URL Template

Looking at the code, I see the problem now. The redirect URL is:
```
http://localhost:3000/test-url?url={{URL}}
```

But `{{URL}}` is a **template placeholder** that DeclarativeNetRequest should replace with the **original request URL**. However, **this only works in certain contexts**.

Let me check if we're using this correctly...

**FIXED**: We're already encoding the URL in `redirectUrl()` function, so the template `{{URL}}` is being replaced by our code, not by Chrome. That's correct.

---

## 📋 Diagnostic Checklist

Run through this checklist:

- [ ] Extension reloaded (v0.1.4)
- [ ] Service worker console open
- [ ] Canvas page refreshed
- [ ] Check for `[CDI] RULE MATCHED` logs in console
- [ ] Check Network tab for redirected URLs
- [ ] Verify redirected URL goes to localhost:3000
- [ ] Verify server is receiving requests (check terminal/server logs)
- [ ] Check CORS headers in Network tab
- [ ] Try hard refresh (Ctrl+Shift+R)
- [ ] Disable all other extensions

---

## 💬 Share Your Findings

Please provide:
1. Screenshot or copy of console output (especially `[CDI] RULE MATCHED` messages)
2. Network tab screenshot showing CSS/JS requests
3. Actual URLs Canvas is requesting (not what we expect)
4. Any error messages in console or Network tab

---

## 🔧 Quick Test

Try this in the extension console while on a Canvas page:

```javascript
// Check what rules are active
chrome.declarativeNetRequest.getDynamicRules().then(console.log);

// Manually trigger a test
fetch('https://instructure-uploads.s3.amazonaws.com/account_43980000000000001/attachments/1207657/ncas2.css')
  .then(r => r.text())
  .then(console.log);
```

This will show you what URL Chrome actually fetches.

---

*Next version: 0.1.5 (awaiting diagnostic feedback)*

