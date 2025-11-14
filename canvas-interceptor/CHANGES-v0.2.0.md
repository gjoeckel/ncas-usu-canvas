# Version 0.2.0 Changes - Fixed Based on Research

## Critical Fixes Applied

### 1. Added Missing Permission
**Added**: `declarativeNetRequestFeedback` to manifest permissions

**Why**: Required for `onRuleMatchedDebug` listener to work. Without this, we couldn't see if rules were matching.

### 2. Fixed URL Pattern Matching
**Changed**: From wildcard patterns to `requestDomains` + specific path patterns

**Before**:
```javascript
condition: {
  urlFilter: '*ncas2.css',
  resourceTypes: ['stylesheet', 'other']
}
```

**After**:
```javascript
condition: {
  requestDomains: ['instructure-uploads.s3.amazonaws.com'],
  urlFilter: '*/1207657/ncas2.css',
  resourceTypes: ['stylesheet']
}
```

**Why**:
- `requestDomains` is the correct API for domain matching (added in Chrome 101)
- Removing `'other'` from resourceTypes - stick to specific types
- Using specific path patterns (`*/1207657/ncas2.css`) instead of just filename

### 3. Added testMatchOutcome
**Added**: Automatic testing of rules using `chrome.declarativeNetRequest.testMatchOutcome()`

**Where**: 
- Called automatically after enabling rules
- Called when DEBUG message is sent

**Why**: This tells us immediately if rules would match the URLs we want to intercept.

### 4. Simplified Rules
**Removed**: 4 rules (2 primary + 2 backup)

**Now**: 2 rules (one for CSS, one for JS)

**Why**: Simpler is better. If these don't work, we need to try a different approach entirely (like HTTPS localhost or content scripts).

---

## Potential Remaining Issue: Mixed Content

**Problem**: Canvas loads over HTTPS, but we're redirecting to HTTP localhost:3000

**Impact**: Chrome may block these redirects due to mixed content policy

**Solutions** (if rules still don't work):
1. Set up HTTPS on localhost:3000 (self-signed cert)
2. Use `chrome-extension://` URLs instead of localhost
3. Use content script to override fetch/XMLHttpRequest

---

## Testing

After reloading extension to v0.2.0:

### In Extension Console:
Look for:
- `[CDI] CSS test result: {...}` - Shows if CSS rule matches
- `[CDI] JS test result: {...}` - Shows if JS rule matches
- `[CDI] RULE MATCHED: {...}` - Shows when actual requests are intercepted

### If testMatchOutcome shows:
- **Match with redirect**: Good! Rules are working
- **No match**: Pattern is wrong, need to adjust
- **Error**: Permission or API issue

---

## Next Steps Based on Results

### If testMatchOutcome shows "match":
- But onRuleMatchedDebug doesn't fire = mixed content blocking
- Need HTTPS localhost or alternative approach

### If testMatchOutcome shows "no match":
- Pattern still wrong
- Try regexFilter as fallback
- Or check actual URL Canvas is loading

### If testMatchOutcome errors:
- Permission issue
- Chrome version issue
- API not available

---

*Version: 0.2.0*
*Based on: External AI research recommendations*
*Date: 2025-10-30*

