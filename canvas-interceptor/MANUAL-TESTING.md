# Manual Testing Instructions

## Automatic Testing

When you click "Toggle Redirects" to turn them ON, the test runs automatically.

Look in the extension console for:
```
[CDI] Rules updated successfully
[CDI] CSS test result: {...}
[CDI] JS test result: {...}
```

---

## Manual Testing (Extension Console)

If you want to test WITHOUT toggling:

1. Go to `chrome://extensions`
2. Find "Canvas Dev Interceptor (Minimal)"
3. Click **"Inspect views: service worker"** (the popup button)
4. Extension console opens
5. Paste this:

```javascript
chrome.declarativeNetRequest.testMatchOutcome({
  url: 'https://instructure-uploads.s3.amazonaws.com/account_43980000000000001/attachments/1207657/ncas2.css',
  type: 'stylesheet',
  method: 'get'
}).then(console.log);
```

6. Press Enter

---

## Manual Testing (Extension Popup)

Easier way - use the DEBUG command:

1. Click the extension icon
2. Open popup console (if you have it) OR
3. Go to extension console and run:

```javascript
chrome.runtime.sendMessage({type: 'DEBUG'})
  .then(console.log);
```

This runs testMatchOutcome AND shows all active rules.

---

## What You're Looking For

### Good Signs ✅

**testMatchOutcome result:**
```javascript
{
  matched: true,
  redirect: "http://localhost:3000/test-url?url=..."
}
```
This means rules ARE matching! ✅

### Bad Signs 🔴

**testMatchOutcome result:**
```javascript
{
  matched: false
}
```
This means rules DON'T match - pattern is wrong!

**Or error:**
```javascript
"Could not test rules: [error message]"
```
This means permission issue or API not available.

---

## To Trigger Test Right Now

**Option 1** (Easiest):
1. Open extension (chrome://extensions)
2. Toggle extension OFF, then ON again
3. Check extension console

**Option 2** (Popup):
1. Click extension icon
2. Toggle "Redirects" button OFF then ON
3. Extension console shows test results

**Option 3** (Extension Console):
1. Open extension console (see above)
2. Run: `chrome.runtime.sendMessage({type: 'DEBUG'})`
3. Check output

---

*The test was added to automatically verify rules work without needing external tools.*

