const defaults = {
  css: 'https://instructure-uploads.s3.amazonaws.com/account_43980000000000001/attachments/1207657/ncas2.css',
  js:  'https://instructure-uploads.s3.amazonaws.com/account_43980000000000001/attachments/1207656/ncas2.js'
};

async function loadFromStorage() {
  const { cssUrl, jsUrl, cssRedirect, jsRedirect } = await chrome.storage.sync.get({
    cssUrl: defaults.css,
    jsUrl: defaults.js,
    cssRedirect: 'http://localhost:3000/test-url?url={{URL}}',
    jsRedirect: 'http://localhost:3000/test-url?url={{URL}}',
  });
  document.getElementById('currentCss').value = cssUrl;
  document.getElementById('currentJs').value = jsUrl;
  document.getElementById('currentCssRedirect').value = cssRedirect;
  document.getElementById('currentJsRedirect').value = jsRedirect;
  document.getElementById('cssUrl').value = '';
  document.getElementById('jsUrl').value = '';
  document.getElementById('cssRedirect').value = '';
  document.getElementById('jsRedirect').value = '';
  await refreshLocalPaths(cssUrl, jsUrl);
}

function isValidUrl(value) {
  try { new URL(value); return true; } catch { return false; }
}

async function onSave() {
  const newCss = document.getElementById('cssUrl').value.trim();
  const newJs = document.getElementById('jsUrl').value.trim();
  const newCssRedirect = document.getElementById('cssRedirect').value.trim();
  const newJsRedirect = document.getElementById('jsRedirect').value.trim();
  const cssLocal = document.getElementById('cssLocal').value.trim();
  const jsLocal = document.getElementById('jsLocal').value.trim();
  const toSave = {};
  if (newCss) {
    if (!isValidUrl(newCss)) return alert('Invalid CSS URL');
    toSave.cssUrl = newCss;
  }
  if (newJs) {
    if (!isValidUrl(newJs)) return alert('Invalid JS URL');
    toSave.jsUrl = newJs;
  }
  if (newCssRedirect) {
    if (!newCssRedirect.includes('{{URL}}')) return alert('CSS Redirect must include {{URL}} placeholder');
    toSave.cssRedirect = newCssRedirect;
  }
  if (newJsRedirect) {
    if (!newJsRedirect.includes('{{URL}}')) return alert('JS Redirect must include {{URL}} placeholder');
    toSave.jsRedirect = newJsRedirect;
  }
  if (Object.keys(toSave).length === 0) return alert('Nothing to update');
  await chrome.storage.sync.set(toSave);
  // Optionally update server mappings if local paths were provided
  if (cssLocal || jsLocal || newCss || newJs) {
    try {
      const payload = {
        cssUrl: newCss || undefined,
        cssLocalPath: cssLocal || undefined,
        jsUrl: newJs || undefined,
        jsLocalPath: jsLocal || undefined,
      };
      await fetch('http://localhost:3000/admin/mappings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (e) {
      console.warn('Failed to update server mappings', e);
    }
  }
  await loadFromStorage();
  alert('Saved');
}

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
  document.getElementById('save').addEventListener('click', onSave);
  document.getElementById('reset').addEventListener('click', onRestoreDefaults);
  document.getElementById('loadDefaults').addEventListener('click', onLoadDefaults);
  document.getElementById('saveLocal').addEventListener('click', onSave);
  document.getElementById('saveRedirects').addEventListener('click', onSave);
  document.getElementById('resetRedirects').addEventListener('click', onRestoreDefaults);
  document.getElementById('loadRedirectDefaults').addEventListener('click', onLoadDefaults);
  // File browser
  const fb = {
    modal: document.getElementById('fbModal'),
    path: document.getElementById('fbPath'),
    list: document.getElementById('fbList'),
    rootSel: document.getElementById('fbRoot'),
    chooseBtn: document.getElementById('fbChoose'),
    closeBtn: document.getElementById('fbClose'),
    cancelBtn: document.getElementById('fbCancel'),
    target: null,
    currentPath: null,
    currentRoot: null,
  };
  async function loadRoots() {
    const res = await fetch('http://localhost:3000/admin/roots');
    const data = await res.json();
    fb.rootSel.innerHTML = '';
    (data.roots || []).forEach(r => {
      const opt = document.createElement('option');
      opt.value = r.path; opt.textContent = r.label + ' (' + r.path + ')';
      fb.rootSel.appendChild(opt);
    });
    fb.currentRoot = fb.rootSel.value;
    fb.rootSel.onchange = () => { fb.currentRoot = fb.rootSel.value; loadDir(fb.currentRoot); };
  }
  async function loadDir(p) {
    const qp = new URLSearchParams();
    if (fb.currentRoot) qp.set('root', fb.currentRoot);
    if (p) qp.set('path', p);
    const res = await fetch('http://localhost:3000/admin/browse' + (qp.toString() ? ('?' + qp.toString()) : ''));
    const data = await res.json();
    fb.currentRoot = data.root || fb.currentRoot;
    fb.currentPath = data.path;
    fb.path.textContent = data.path;
    fb.list.innerHTML = '';
    const up = document.createElement('div');
    up.textContent = '..';
    up.style.cursor = 'pointer';
    up.onclick = () => {
      const segs = fb.currentPath.split(/\\|\//);
      if (segs.length <= 1) return;
      const parent = segs.slice(0, -1).join('/');
      if (parent && parent.startsWith(fb.currentRoot)) loadDir(parent);
    };
    fb.list.appendChild(up);
    data.entries.forEach(e => {
      const item = document.createElement('div');
      item.textContent = (e.type === 'dir' ? '[DIR] ' : '[FILE] ') + e.name;
      item.style.cursor = 'pointer';
      item.onclick = () => { if (e.type === 'dir') loadDir(e.fullPath); else fb.path.textContent = e.fullPath; };
      fb.list.appendChild(item);
    });
  }
  function openBrowser(targetInputId) {
    fb.target = document.getElementById(targetInputId);
    fb.modal.style.display = 'block';
    loadRoots().then(() => loadDir(fb.currentRoot));
  }
  fb.chooseBtn.onclick = () => { if (fb.target) fb.target.value = fb.path.textContent; fb.modal.style.display = 'none'; };
  fb.closeBtn.onclick = () => { fb.modal.style.display = 'none'; };
  fb.cancelBtn.onclick = () => { fb.modal.style.display = 'none'; };
  document.getElementById('browseCssLocal').addEventListener('click', () => openBrowser('cssLocal'));
  document.getElementById('browseJsLocal').addEventListener('click', () => openBrowser('jsLocal'));
});


