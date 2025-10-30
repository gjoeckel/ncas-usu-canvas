const defaults = {
  css: 'https://instructure-uploads.s3.amazonaws.com/account_43980000000000001/attachments/1207657/ncas2.css',
  js:  'https://instructure-uploads.s3.amazonaws.com/account_43980000000000001/attachments/1207656/ncas2.js'
};

async function loadFromStorage() {
  const { cssUrl, jsUrl } = await chrome.storage.sync.get({
    cssUrl: defaults.css,
    jsUrl: defaults.js
  });
  document.getElementById('currentCss').value = cssUrl;
  document.getElementById('currentJs').value = jsUrl;
  await refreshLocalPaths(cssUrl, jsUrl);
}

function isValidUrl(value) {
  try { new URL(value); return true; } catch { return false; }
}

// No save/update actions – display only

async function refreshLocalPaths(cssUrl, jsUrl) {
  try {
    const res = await fetch('http://localhost:3000/mappings', { cache: 'no-store' });
    const data = await res.json();
    const mappings = (data && data.mappings) || [];
    const cssMap = mappings.find(m => m.url === (cssUrl || ''));
    const jsMap = mappings.find(m => m.url === (jsUrl || ''));
    document.getElementById('currentLocalCss').value = cssMap?.localPath || '';
    document.getElementById('currentLocalJs').value = jsMap?.localPath || '';
  } catch (e) {
    console.warn('Failed to fetch current local paths', e);
  }
}

async function onRestoreDefaults() {
  await chrome.storage.sync.set({
    cssUrl: defaults.css,
    jsUrl: defaults.js,
    cssRedirect: 'http://localhost:3000/test-url?url={{URL}}',
    jsRedirect: 'http://localhost:3000/test-url?url={{URL}}',
  });
  await loadFromStorage();
  alert('Restored defaults');
}

async function onLoadDefaults() {
  // Show defaults in the new URL inputs without saving
  document.getElementById('cssUrl').value = defaults.css;
  document.getElementById('jsUrl').value = defaults.js;
  document.getElementById('cssRedirect').value = 'http://localhost:3000/test-url?url={{URL}}';
  document.getElementById('jsRedirect').value = 'http://localhost:3000/test-url?url={{URL}}';
}

document.addEventListener('DOMContentLoaded', () => {
  loadFromStorage();
});


