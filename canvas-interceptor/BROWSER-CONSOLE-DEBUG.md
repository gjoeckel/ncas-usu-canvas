# Browser Console Diagnostic Commands

Run these commands in the browser console on a Canvas page to diagnose the extension.

## 1. Check Extension is Loaded

```javascript
chrome.runtime.sendMessage({type: 'STATE'})
  .then(console.log)
  .catch(console.error);
```

Expected output: `{enabled: true}` or `{enabled: false}`

---

## 2. Get All Rules (New Debug Command)

```javascript
chrome.runtime.sendMessage({type: 'DEBUG'})
  .then(console.log)
  .catch(console.error);
```

This shows all active redirect rules in JSON format.

---

## 3. Check Network Requests

Open DevTools → Network tab, then:

**Filter by CSS:**
- Type `ncas2` in the filter box
- Look for CSS requests

**Filter by JS:**
- Type `ncas2` in the filter box  
- Look for JS requests

**For each request, check:**
1. Request URL (right-click → Copy URL)
2. Response - does it show localhost:3000?
3. Status code
4. Any CORS errors?

---

## 4. Test Direct Fetch

```javascript
fetch('https://instructure-uploads.s3.amazonaws.com/account_43980000000000001/attachments/1207657/ncas2.css')
  .then(r => {
    console.log('Status:', r.status);
    console.log('URL:', r.url);
    return r.text();
  })
  .then(text => {
    console.log('First 200 chars:', text.substring(0, 200));
  })
  .catch(console.error);
```

This will show:
- If the request is redirected to localhost
- What content is actually served
- Any errors

---

## 5. Check for Rule Errors

```javascript
chrome.runtime.sendMessage({type: 'DEBUG'})
  .then(result => {
    console.log('Rule count:', result.rules.length);
    result.rules.forEach((rule, i) => {
      console.log(`Rule ${i}:`, rule);
      // Check for errors
      if (rule.condition.urlFilter.includes('*')) {
        console.log('  - Using wildcard');
      }
      if (rule.action.redirect && rule.action.redirect.url) {
        console.log('  - Redirect URL:', rule.action.redirect.url);
      }
      if (rule.action.redirect && rule.action.redirect.transform) {
        console.log('  - Using transform:', rule.action.redirect.transform);
      }
    });
  })
  .catch(console.error);
```

---

## 6. Test Enable/Disable

```javascript
// Disable
chrome.runtime.sendMessage({type: 'TOGGLE'})
  .then(() => chrome.runtime.sendMessage({type: 'STATE'}))
  .then(console.log);

// Wait a moment, then enable
setTimeout(() => {
  chrome.runtime.sendMessage({type: 'TOGGLE'})
    .then(() => chrome.runtime.sendMessage({type: 'STATE'}))
    .then(console.log);
}, 2000);
```

---

## 7. Check Background Console

1. Go to `chrome://extensions`
2. Find "Canvas Dev Interceptor (Minimal)"
3. Click "Inspect views: service worker"
4. Look for any error messages
5. Check for `[CDI]` log messages

---

## What to Look For

### ✅ Good Signs:
- `enabled: true` in STATE response
- Rules show up in DEBUG response
- Network tab shows requests going to `localhost:3000`
- Direct fetch returns your local file content
- No errors in background console

### 🔴 Bad Signs:
- No rules in DEBUG response
- Rules show but have errors
- Network tab shows original S3 URLs (not redirected)
- CORS errors in console
- "Failed to update rules" errors in background console

---

## Quick Copy-Paste Diagnostic

Run all checks at once:

```javascript
(async () => {
  console.log('=== CDI Diagnostic ===');
  
  // Check state
  const state = await chrome.runtime.sendMessage({type: 'STATE'});
  console.log('State:', state);
  
  // Get rules
  const debug = await chrome.runtime.sendMessage({type: 'DEBUG'});
  console.log('Rules:', debug.rules.length, 'active');
  debug.rules.forEach((r, i) => {
    console.log(`Rule ${i}:`, {
      id: r.id,
      priority: r.priority,
      urlFilter: r.condition.urlFilter,
      action: r.action.type,
      redirect: r.action.redirect?.url || r.action.redirect?.transform
    });
  });
  
  // Test fetch
  console.log('Testing CSS fetch...');
  try {
    const res = await fetch('https://instructure-uploads.s3.amazonaws.com/account_43980000000000001/attachments/1207657/ncas2.css');
    console.log('Fetch status:', res.status);
    console.log('Fetch URL:', res.url);
    console.log('Redirected?', res.url.includes('localhost'));
    const text = await res.text();
    console.log('First line:', text.split('\n')[0]);
  } catch (e) {
    console.error('Fetch error:', e);
  }
  
  console.log('=== End Diagnostic ===');
})();
```

---

*Run these commands and share the output!*

