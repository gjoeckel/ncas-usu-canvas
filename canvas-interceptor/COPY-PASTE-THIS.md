# Copy and Paste This Into Extension Console

Go to chrome://extensions → Canvas Dev Interceptor → Inspect views: service worker

Then paste this entire block:

```javascript
(async () => {
  console.log('=== FULL DIAGNOSTIC ===');
  
  // Get all rules
  const rules = await chrome.declarativeNetRequest.getDynamicRules();
  console.log('\n1. RULES:', rules.length, 'rules found');
  rules.forEach((r, i) => {
    console.log(`Rule ${i}:`, {
      id: r.id,
      priority: r.priority,
      urlFilter: r.condition.urlFilter,
      actionType: r.action.type,
      redirect: r.action.redirect
    });
  });
  
  // Check state
  const state = await chrome.runtime.sendMessage({type: 'STATE'});
  console.log('\n2. STATE:', state);
  
  // Check what extension sees
  console.log('\n3. EXTENSION INFO:', {
    id: chrome.runtime.id,
    manifest: chrome.runtime.getManifest().version
  });
  
  // Try to get more debug info
  try {
    const debug = await chrome.runtime.sendMessage({type: 'DEBUG'});
    console.log('\n4. DEBUG RESPONSE:', debug);
  } catch (e) {
    console.log('\n4. DEBUG ERROR:', e.message);
  }
  
  console.log('\n=== END DIAGNOSTIC ===');
})();
```

This will print everything we need to know!

