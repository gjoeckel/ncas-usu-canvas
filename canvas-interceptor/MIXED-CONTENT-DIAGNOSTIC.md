# Mixed Content Diagnostic

## The Problem

Your rules **ARE MATCHING** ✅ (testMatchOutcome confirms it)

But Canvas still loads original files, which means:

**Chrome is BLOCKING the redirect due to Mixed Content Policy**

### What is Mixed Content?

Canvas loads over HTTPS, but we redirect to HTTP localhost:3000

Chrome blocks: HTTPS page → HTTP resource

---

## Confirmation Steps

### 1. Check Browser Console

Open Canvas page → DevTools Console

Look for errors like:
```
Mixed Content: The page at 'https://canvas...' was loaded over HTTPS, but requested an insecure resource 'http://localhost:3000/...'. This request has been blocked; the content must be served over HTTPS.
```

### 2. Check Network Tab

Open Canvas page → DevTools → Network tab

Filter by `ncas2` and look for:
- ✅ Status: `(blocked:mixed-content)` 
- ❌ Or no request at all (silent block)

### 3. Check onRuleMatchedDebug

If no `[CDI] RULE MATCHED` logs appear, rules are triggering but redirect is blocked.

---

## Solutions

### Option A: HTTPS Localhost (Recommended)

**Step 1**: Generate self-signed certificate

```bash
# In canvas-interceptor directory
openssl req -x509 -newkey rsa:2048 -nodes -sha256 -subj '/CN=localhost' \
  -keyout localhost-key.pem \
  -out localhost-cert.pem \
  -days 365
```

**Step 2**: Update server.js to use HTTPS

```javascript
const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync('./localhost-key.pem'),
  cert: fs.readFileSync('./localhost-cert.pem')
};

https.createServer(options, app).listen(PORT, () => {
  console.log(`Server running on: https://localhost:${PORT}`);
  // ... rest of startup
});
```

**Step 3**: Update manifest.json

```json
"host_permissions": [
  "https://localhost:3000/*"
]
```

**Step 4**: Update TEMPLATE in background.js

```javascript
const TEMPLATE = 'https://localhost:3000/test-url?url={{URL}}';
```

**Step 5**: Trust the certificate
- Chrome will show "Not secure" warning
- Click "Advanced" → "Proceed to localhost"
- Or add exception: `chrome://flags/#allow-insecure-localhost`

---

### Option B: Use chrome-extension:// URLs (Alternative)

Serve files directly from extension instead of localhost.

**Pros**: No HTTPS needed
**Cons**: Must reload extension to update files

Not recommended for development workflow.

---

### Option C: Chrome Mixed Content Settings (Temporary)

**NOT recommended** - insecure and affects all sites

1. Click lock icon in Chrome
2. Site settings
3. Allow insecure content

---

## Quick Test

Before implementing HTTPS, verify mixed content is the issue:

Open Canvas page → Network tab → Look for:
- Blocked requests with `(blocked:mixed-content)` status
- Or no localhost:3000 requests appearing

---

## Recommendation

Set up HTTPS localhost. It's the proper solution and will work reliably.

---

*Next step: Generate SSL certificate and update server to HTTPS*

