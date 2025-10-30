const RULE_IDS = { CSS: 9001, JS: 9002 };
// Hardcoded targets (update here when needed)
const TARGETS = {
  css: 'https://instructure-uploads.s3.amazonaws.com/account_43980000000000001/attachments/1207657/ncas2.css',
  js:  'https://instructure-uploads.s3.amazonaws.com/account_43980000000000001/attachments/1207656/ncas2.js'
};
// Hardcoded redirect template
const TEMPLATE = 'http://localhost:3000/test-url?url={{URL}}';

function redirectUrl(original) {
  return TEMPLATE.replace('{{URL}}', encodeURIComponent(original));
}

async function enable() {
  const addRules = [
    {
      id: RULE_IDS.CSS,
      priority: 1,
      action: { type: 'redirect', redirect: { url: redirectUrl(TARGETS.css) } },
      condition: { urlFilter: TARGETS.css, resourceTypes: ['stylesheet'] }
    },
    {
      id: RULE_IDS.JS,
      priority: 1,
      action: { type: 'redirect', redirect: { url: redirectUrl(TARGETS.js) } },
      condition: { urlFilter: TARGETS.js, resourceTypes: ['script'] }
    }
  ];
  await chrome.declarativeNetRequest.updateDynamicRules({ addRules, removeRuleIds: [] });
  return { ok: true };
}

async function disable() {
  await chrome.declarativeNetRequest.updateDynamicRules({ addRules: [], removeRuleIds: [RULE_IDS.CSS, RULE_IDS.JS] });
  return { ok: true };
}

async function state() {
  const rules = await chrome.declarativeNetRequest.getDynamicRules();
  return { enabled: rules.some(r => r.id === RULE_IDS.CSS || r.id === RULE_IDS.JS) };
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
      return sendResponse({ ok: false, error: 'Unknown' });
    } catch (e) { return sendResponse({ ok: false, error: String(e) }); }
  })();
  return true;
});


