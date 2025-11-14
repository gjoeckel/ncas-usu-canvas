function logOut(obj) {
  const el = document.getElementById('log');
  el.textContent = (typeof obj === 'string') ? obj : JSON.stringify(obj, null, 2);
}

async function send(type) {
  return await chrome.runtime.sendMessage({ type });
}

document.getElementById('toggleRedirects').addEventListener('click', async () => {
  const res = await send('TOGGLE_REDIRECTS');
  logOut(res);
  await refreshState();
});

document.getElementById('health').addEventListener('click', async () => {
  const res = await send('HEALTH');
  logOut(res);
  setServerStatus(res);
});

document.getElementById('clearCache').addEventListener('click', async () => {
  const res = await send('CLEAR_CACHE');
  logOut(res);
});

document.getElementById('toggleOverlay').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_OVERLAY' });
});

document.getElementById('openOptions').addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

function setRedirectStatus(state) {
  const el = document.getElementById('redirStatus');
  el.textContent = state?.enabled ? 'On' : 'Off';
  el.style.color = state?.enabled ? '#0a0' : '#c00';
}

function setServerStatus(health) {
  const el = document.getElementById('serverStatus');
  const online = !!health?.ok && health?.status === 200;
  el.textContent = online ? 'Online' : 'Offline';
  el.style.color = online ? '#0a0' : '#c00';
}

async function refreshState() {
  const state = await send('GET_STATE');
  setRedirectStatus(state);
  const health = await send('HEALTH');
  setServerStatus(health);
}

document.addEventListener('DOMContentLoaded', refreshState);


