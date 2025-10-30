// Canvas Dev Interceptor - Background Service Worker (MV3)

const RULE_IDS = { CSS: 1001, JS: 1002 };
const DEFAULTS = {
  cssUrl: "https://instructure-uploads.s3.amazonaws.com/account_43980000000000001/attachments/1207657/ncas2.css",
  jsUrl:  "https://instructure-uploads.s3.amazonaws.com/account_43980000000000001/attachments/1207656/ncas2.js"
};

async function getRedirectTemplates() {
  const defaults = {
    cssRedirect: "http://localhost:3000/test-url?url={{URL}}",
    jsRedirect:  "http://localhost:3000/test-url?url={{URL}}",
  };
  const { cssRedirect, jsRedirect } = await chrome.storage.sync.get(defaults);
  return { cssRedirect, jsRedirect };
}

function applyRedirectTemplate(template, originalUrl) {
  try {
    return template.replace("{{URL}}", encodeURIComponent(originalUrl));
  } catch {
    const url = new URL("http://localhost:3000/");
    url.searchParams.set("url", originalUrl);
    return url.toString();
  }
}

async function getTargets() {
  const { cssUrl, jsUrl } = await chrome.storage.sync.get({ cssUrl: DEFAULTS.cssUrl, jsUrl: DEFAULTS.jsUrl });
  return { css: cssUrl, js: jsUrl };
}

async function enableRedirects() {
  const targets = await getTargets();
  const templates = await getRedirectTemplates();
  const addRules = [
    {
      id: RULE_IDS.CSS,
      priority: 1,
      action: { type: "redirect", redirect: { url: applyRedirectTemplate(templates.cssRedirect, targets.css) } },
      condition: { urlFilter: targets.css, resourceTypes: ["stylesheet"] }
    },
    {
      id: RULE_IDS.JS,
      priority: 1,
      action: { type: "redirect", redirect: { url: applyRedirectTemplate(templates.jsRedirect, targets.js) } },
      condition: { urlFilter: targets.js, resourceTypes: ["script"] }
    }
  ];
  await chrome.declarativeNetRequest.updateDynamicRules({ addRules, removeRuleIds: [] });
  return { ok: true };
}

async function disableRedirects() {
  await chrome.declarativeNetRequest.updateDynamicRules({ addRules: [], removeRuleIds: [RULE_IDS.CSS, RULE_IDS.JS] });
  return { ok: true };
}

async function getRedirectState() {
  const rules = await chrome.declarativeNetRequest.getDynamicRules();
  const enabled = rules.some(r => r.id === RULE_IDS.CSS || r.id === RULE_IDS.JS);
  return { enabled };
}

async function toggleRedirects() {
  const state = await getRedirectState();
  if (state.enabled) return disableRedirects();
  return enableRedirects();
}

async function getHealth() {
  try {
    const res = await fetch("http://localhost:3000/health", { cache: "no-store" });
    const text = await res.text();
    return { ok: res.ok, status: res.status, body: text };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

async function clearCache() {
  try {
    await chrome.browsingData.remove({ since: 0 }, { cache: true, cacheStorage: true });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    try {
      if (msg?.type === "ENABLE_REDIRECTS") return sendResponse(await enableRedirects());
      if (msg?.type === "DISABLE_REDIRECTS") return sendResponse(await disableRedirects());
      if (msg?.type === "TOGGLE_REDIRECTS") return sendResponse(await toggleRedirects());
      if (msg?.type === "GET_STATE") return sendResponse(await getRedirectState());
      if (msg?.type === "HEALTH") return sendResponse(await getHealth());
      if (msg?.type === "CLEAR_CACHE") return sendResponse(await clearCache());
      if (msg?.type === "GET_TARGETS") return sendResponse(await getTargets());
      if (msg?.type === "GET_REDIRECT_TEMPLATES") return sendResponse(await getRedirectTemplates());
      return sendResponse({ ok: false, error: "Unknown message" });
    } catch (e) {
      return sendResponse({ ok: false, error: String(e) });
    }
  })();
  return true; // async response
});


