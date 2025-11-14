# Chrome Extension DeclarativeNetRequest Not Matching - Research Request

## Context

A Chrome Manifest V3 extension uses `chrome.declarativeNetRequest` to redirect specific CSS/JS file requests from an S3 bucket to a local development server, but the redirect rules are not being triggered despite being properly registered and enabled.

## Current Setup

### Extension Configuration
- **Manifest**: Manifest V3
- **Permissions**: `declarativeNetRequest`, `declarativeNetRequestWithHostAccess`, `browsingData`
- **Host Permissions**: 
  - `*://instructure-uploads.s3.amazonaws.com/*`
  - `http://localhost:3000/*`

### Target URLs
- CSS: `https://instructure-uploads.s3.amazonaws.com/account_43980000000000001/attachments/1207657/ncas2.css`
- JS: `https://instructure-uploads.s3.amazonaws.com/account_43980000000000001/attachments/1207656/ncas2.js`

### Redirect Configuration
```javascript
const rules = [
  {
    id: 9001,
    priority: 1000,
    action: {
      type: 'redirect',
      redirect: {
        url: 'http://localhost:3000/test-url?url=https%3A%2F%2Finstructure-uploads.s3.amazonaws.com%2Faccount_43980000000000001%2Fattachments%2F1207657%2Fncas2.css'
      }
    },
    condition: {
      urlFilter: '*ncas2.css',
      resourceTypes: ['stylesheet', 'other']
    }
  },
  {
    id: 9002,
    priority: 1000,
    action: {
      type: 'redirect',
      redirect: {
        url: 'http://localhost:3000/test-url?url=https%3A%2F%2Finstructure-uploads.s3.amazonaws.com%2Faccount_43980000000000001%2Fattachments%2F1207656%2Fncas2.js'
      }
    },
    condition: {
      urlFilter: '*ncas2.js',
      resourceTypes: ['script', 'other']
    }
  }
];
```

### Other Attempted Patterns
We've also tried:
- Exact URL match: `urlFilter: TARGETS.css` (full URL)
- Wildcard beginning: `urlFilter: '*' + TARGETS.css`
- Full wildcard: `urlFilter: '*ncas2.css'` ← **Currently trying this**
- Without "other": `resourceTypes: ['stylesheet']` only
- With XMLHttpRequest: `resourceTypes: ['stylesheet', 'xmlhttprequest', 'other']`

### Rules Status
- Rules register successfully: `chrome.declarativeNetRequest.updateDynamicRules()` returns without error
- Rules show as enabled: `getDynamicRules()` returns 4 rules when enabled
- Priority set to 1000 (high)
- Server is running and responding on localhost:3000
- Direct URL test works: `curl http://localhost:3000/test-url?url=...` serves correct files

## Evidence of Failure

### Console Output Shows:
```
[CDI] Enabling redirects...
[CDI] CSS redirect: http://localhost:3000/test-url?url=https%3A%2F%2F...
[CDI] Cache cleared
[CDI] Rules updated successfully
[CDI] State check - Enabled: true Rules: 4
```

### But Canvas Page Still Loads:
```
ncas2.js:17 ✅ 🚀 NCADEMI Navigation v2-min: Injected header/nav at top of body
```

This console log comes from the **original** `ncas2.js` file, not our local version, proving the redirect is NOT happening.

### Expected vs Actual

**Expected**: Canvas page requests CSS/JS → Rules intercept → Redirect to localhost:3000 → Local version served

**Actual**: Canvas page requests CSS/JS → Rules DO NOT intercept → Original S3 files loaded → Old version shows in console

## Additional Context

### Working Example (Different Extension)
An older version of the extension used **declarative_net_request with static rules.json** and it worked:

```json
{
  "id": 1,
  "priority": 1,
  "action": {
    "type": "redirect",
    "redirect": {
      "url": "http://localhost:3000/?url=https://instructure-uploads.s3.amazonaws.com/account_43980000000000001/attachments/1206448/ncas1.css"
    }
  },
  "condition": {
    "urlFilter": "*instructure-uploads.s3.amazonaws.com/account_43980000000000001/attachments/1206448/ncas1.css*",
    "resourceTypes": ["stylesheet", "xmlhttprequest", "other"]
  }
}
```

**Key differences from current attempt:**
- Used `declarative_net_request.rule_resources` with static JSON file
- URL pattern wrapped with `*pattern*` (asterisks on both sides)
- Used different endpoint: `/test-url?url=` vs `/?url=`
- Different attachment IDs (1206448 vs 1207657)

### Testing Attempts

**All of these have been verified:**
1. ✅ Extension loads without errors
2. ✅ Rules register without errors
3. ✅ Rules show as active via `getDynamicRules()`
4. ✅ Server is running on port 3000
5. ✅ Server test endpoint works: `curl http://localhost:3000/test-url?url=...`
6. ✅ Cache is cleared before enabling rules
7. ✅ Extension reloads after changes
8. ✅ No conflicting extensions enabled
9. ✅ Extension has required permissions
10. ✅ Host permissions configured

**What we CAN'T verify:**
- Whether rules are actually being matched (no onRuleMatchedDebug logs appearing)
- Whether the URL being requested by Canvas matches our patterns
- Whether there's a Chrome bug or limitation preventing the redirect

## Questions for Research

1. **DeclarativeNetRequest Wildcard Pattern Matching**: 
   - Is `urlFilter: '*ncas2.css'` a valid pattern for matching `https://any-domain.com/path/ncas2.css`?
   - Are there known issues with wildcard patterns in dynamic rules?

2. **Dynamic vs Static Rules**:
   - Are there differences in how dynamic rules vs static rule_resources behave?
   - Should we use `declarative_net_request.rule_resources` instead of `updateDynamicRules()`?

3. **URL Pattern Matching**:
   - Does the `*` wildcard match across entire URL (protocol + domain + path)?
   - Or only within segments?
   - Should patterns be `*pattern*` (both sides) vs `pattern*` (ending)?

4. **ResourceTypes**:
   - Does `resourceTypes: ['stylesheet', 'other']` actually work?
   - Are there cases where CSS/JS loads as a different type that wouldn't match?

5. **Redirect URL Format**:
   - Does the redirected URL need to be a full URL?
   - Are there restrictions on localhost redirects?
   - Does query parameter encoding matter?

6. **onRuleMatchedDebug**:
   - Why is this API not logging anything?
   - Is it available in production extensions or only developer mode?
   - Is there an alternative way to verify rules are matched?

7. **Known Chrome Bugs**:
   - Are there known issues with declarativeNetRequest wildcards in Chrome?
   - Are there version-specific bugs?
   - Are there issues with HTTP localhost from HTTPS pages?

8. **Alternative Approaches**:
   - Should we use `webRequest` API instead (with appropriate permissions)?
   - Should we use content scripts to override fetch/XMLHttpRequest?
   - Are there manifest configuration issues we're missing?

## System Information

- **Chrome Version**: Latest (unknown specific version)
- **Extension**: Manifest V3
- **Target Domain**: Canvas LMS (HTTPS)
- **Local Server**: HTTP localhost:3000 (possible mixed content issue?)
- **Node.js**: v22.20.0
- **OS**: Windows 11

## Complete Current Code

### background.js
```javascript
const RULE_IDS = { CSS: 9001, JS: 9002, CSS2: 9003, JS2: 9004 };
const TARGETS = {
  css: 'https://instructure-uploads.s3.amazonaws.com/account_43980000000000001/attachments/1207657/ncas2.css',
  js:  'https://instructure-uploads.s3.amazonaws.com/account_43980000000000001/attachments/1207656/ncas2.js'
};
const TEMPLATE = 'http://localhost:3000/test-url?url={{URL}}';

function redirectUrl(original) {
  return TEMPLATE.replace('{{URL}}', encodeURIComponent(original));
}

async function enable() {
  const addRules = [
    {
      id: RULE_IDS.CSS,
      priority: 1000,
      action: { type: 'redirect', redirect: { url: redirectUrl(TARGETS.css) } },
      condition: { urlFilter: '*' + TARGETS.css.split('/').pop(), resourceTypes: ['stylesheet', 'other'] }
    },
    {
      id: RULE_IDS.JS,
      priority: 1000,
      action: { type: 'redirect', redirect: { url: redirectUrl(TARGETS.js) } },
      condition: { urlFilter: '*' + TARGETS.js.split('/').pop(), resourceTypes: ['script', 'other'] }
    },
    {
      id: RULE_IDS.CSS2,
      priority: 999,
      action: { type: 'redirect', redirect: { url: redirectUrl(TARGETS.css) } },
      condition: { urlFilter: '*' + TARGETS.css, resourceTypes: ['stylesheet', 'xmlhttprequest', 'other'] }
    },
    {
      id: RULE_IDS.JS2,
      priority: 999,
      action: { type: 'redirect', redirect: { url: redirectUrl(TARGETS.js) } },
      condition: { urlFilter: '*' + TARGETS.js, resourceTypes: ['script', 'xmlhttprequest', 'other'] }
    }
  ];
  
  console.log('[CDI] Enabling redirects...');
  console.log('[CDI] CSS: ' + TARGETS.css);
  console.log('[CDI] CSS redirect: ' + redirectUrl(TARGETS.css));
  
  try {
    await chrome.browsingData.removeCache({});
    console.log('[CDI] Cache cleared');
  } catch (e) {
    console.warn('[CDI] Could not clear cache:', e.message);
  }
  
  try {
    await chrome.declarativeNetRequest.updateDynamicRules({ addRules, removeRuleIds: [] });
    console.log('[CDI] Rules updated successfully');
  } catch (e) {
    console.error('[CDI] ERROR updating rules:', e);
    throw e;
  }
  
  return { ok: true };
}

chrome.declarativeNetRequest.onRuleMatchedDebug?.addListener((details) => {
  console.log('[CDI] RULE MATCHED:', details);
});
```

### manifest.json
```json
{
  "manifest_version": 3,
  "name": "Canvas Dev Interceptor (Minimal)",
  "version": "0.1.8",
  "permissions": [
    "declarativeNetRequest",
    "declarativeNetRequestWithHostAccess",
    "browsingData"
  ],
  "host_permissions": [
    "*://instructure-uploads.s3.amazonaws.com/*",
    "http://localhost:3000/*"
  ],
  "background": {
    "service_worker": "background.js"
  },
  "action": {
    "default_title": "CDI Minimal",
    "default_popup": "popup.html"
  }
}
```

## Server Configuration

Local server uses `/test-url?url=` endpoint that:
1. Parses the `url` query parameter
2. Checks if URL is in mappings
3. Serves local file from filesystem
4. Sets proper Content-Type headers

Server works correctly when accessed directly.

## Debugging Attempts

All console logging shows rules are registered, but onRuleMatchedDebug listener never fires. This suggests rules are not matching, or the listener isn't working.

---

**Request**: Please research Chrome Extension declarativeNetRequest API to identify:
1. Common reasons wildcard patterns fail to match
2. Best practices for URL pattern matching in MV3
3. Known bugs or limitations with dynamic rules
4. Alternative approaches that might be more reliable
5. Whether onRuleMatchedDebug requires special configuration
6. Whether HTTP localhost redirects from HTTPS pages are blocked

**Goal**: Get redirect rules to successfully intercept and redirect CSS/JS file requests from S3 to localhost development server.

---

*Date: 2025-10-30*
*Issue: Redirect rules registered and enabled but not matching*
*Priority: High - blocking development workflow*

