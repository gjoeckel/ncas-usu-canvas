async function send(type) {
  return await chrome.runtime.sendMessage({ type });
}

async function checkServer() {
  try {
    const res = await fetch('http://localhost:3000/health', { method: 'GET', signal: AbortSignal.timeout(2000) });
    const data = await res.json();
    return data.status === 'ok';
  } catch (e) {
    console.error('[CDI Popup] Server check failed:', e);
    return false;
  }
}

async function refresh() {
  const s = await send('STATE');
  const el = document.getElementById('st');
  el.textContent = s.enabled ? 'On' : 'Off';
  el.style.color = s.enabled ? '#0a0' : '#c00';
  
  const serverEl = document.getElementById('server');
  const online = await checkServer();
  serverEl.textContent = online ? 'Online' : 'Offline';
  serverEl.style.color = online ? '#0a0' : '#c00';
}

document.getElementById('tg').onclick = async () => {
  await send('TOGGLE');
  refresh();
};

document.addEventListener('DOMContentLoaded', refresh);

