const RULE_IDS = { CSS: 9001, JS: 9002 };
const TARGETS = {
  css: 'https://instructure-uploads.s3.amazonaws.com/account_43980000000000001/attachments/1207657/ncas2.css',
  js:  'https://instructure-uploads.s3.amazonaws.com/account_43980000000000001/attachments/1207656/ncas2.js'
};
const TEMPLATE = 'http://localhost:3000/test-url?url={{URL}}';

function redirectUrl(original) {
  // Add cache-busting timestamp to force reload
  const timestamp = Date.now();
  return TEMPLATE.replace('{{URL}}', encodeURIComponent(original)) + `&_t=${timestamp}`;
}

async function enable() {
  const addRules = [
    {
      id: RULE_IDS.CSS,
      priority: 1000,
      action: { type: 'redirect', redirect: { url: redirectUrl(TARGETS.css) } },
      condition: { 
        requestDomains: ['instructure-uploads.s3.amazonaws.com'],
        urlFilter: '*/1207657/ncas2.css',
        resourceTypes: ['stylesheet']
      }
    },
    {
      id: RULE_IDS.JS,
      priority: 1000,
      action: { type: 'redirect', redirect: { url: redirectUrl(TARGETS.js) } },
      condition: { 
        requestDomains: ['instructure-uploads.s3.amazonaws.com'],
        urlFilter: '*/1207656/ncas2.js',
        resourceTypes: ['script']
      }
    }
  ];
  
  console.log('[CDI] Enabling redirects...');
  console.log('[CDI] CSS: ' + TARGETS.css);
  console.log('[CDI] CSS redirect: ' + redirectUrl(TARGETS.css));
  console.log('[CDI] JS: ' + TARGETS.js);
  console.log('[CDI] JS redirect: ' + redirectUrl(TARGETS.js));
  
  // Clear cache before enabling
  try {
    await chrome.browsingData.removeCache({});
    console.log('[CDI] Cache cleared');
  } catch (e) {
    console.warn('[CDI] Could not clear cache:', e.message);
  }
  
  try {
    await chrome.declarativeNetRequest.updateDynamicRules({ addRules, removeRuleIds: [] });
    console.log('[CDI] Rules updated successfully');
    
    // Test if rules match
    await testRules();
  } catch (e) {
    console.error('[CDI] ERROR updating rules:', e);
    throw e;
  }
  
  return { ok: true };
}

async function testRules() {
  try {
    const cssTest = await chrome.declarativeNetRequest.testMatchOutcome({
      url: TARGETS.css,
      type: 'stylesheet',
      method: 'get'
    });
    console.log('[CDI] CSS test result:', JSON.stringify(cssTest, null, 2));
    
    const jsTest = await chrome.declarativeNetRequest.testMatchOutcome({
      url: TARGETS.js,
      type: 'script',
      method: 'get'
    });
    console.log('[CDI] JS test result:', JSON.stringify(jsTest, null, 2));
  } catch (e) {
    console.warn('[CDI] Could not test rules:', e.message);
  }
}

async function disable() {
  console.log('[CDI] Disabling redirects...');
  await chrome.declarativeNetRequest.updateDynamicRules({ addRules: [], removeRuleIds: Object.values(RULE_IDS) });
  console.log('[CDI] Rules disabled');
  return { ok: true };
}

async function state() {
  const rules = await chrome.declarativeNetRequest.getDynamicRules();
  const enabled = rules.some(r => Object.values(RULE_IDS).includes(r.id));
  console.log('[CDI] State check - Enabled:', enabled, 'Rules:', rules.length);
  return { enabled };
}

async function toggle() {
  const s = await state();
  return s.enabled ? disable() : enable();
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    try {
      if (msg?.type === 'TOGGLE') return sendResponse(await toggle());
      if (msg?.type === 'STATE') return sendResponse(await state());
      if (msg?.type === 'DEBUG') return sendResponse(await debug());
      return sendResponse({ ok: false, error: 'Unknown' });
    } catch (e) { return sendResponse({ ok: false, error: String(e) }); }
  })();
  return true;
});

async function debug() {
  const rules = await chrome.declarativeNetRequest.getDynamicRules();
  console.log('[CDI DEBUG] All rules:', JSON.stringify(rules, null, 2));
  
  // Test if rules match
  await testRules();
  
  return { rules };
}

// Debug listener to see when rules are matched
chrome.declarativeNetRequest.onRuleMatchedDebug?.addListener((details) => {
  console.log('[CDI] RULE MATCHED:', details);
});


