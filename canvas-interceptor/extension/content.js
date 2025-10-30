// Simple overlay panel toggled from popup

let overlay;

function createOverlay() {
  overlay = document.createElement('div');
  overlay.id = 'cdi-overlay';
  overlay.style.cssText = [
    'position:fixed', 'top:10px', 'right:10px', 'z-index:999999',
    'background:#0b2a45', 'color:#fff', 'padding:12px', 'border-radius:8px', 'box-shadow:0 2px 8px rgba(0,0,0,0.3)'
  ].join(';');
  overlay.innerHTML = `
    <div style="display:flex;align-items:center;gap:8px;">
      <strong>Canvas Dev Interceptor</strong>
      <button id="cdi-close" style="margin-left:8px;">✕</button>
    </div>
    <div style="margin-top:8px;font-size:12px;">
      Use the extension popup for redirects, health, and cache.
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.querySelector('#cdi-close').onclick = () => { overlay.remove(); overlay = null; };
}

function toggle() {
  if (overlay) { overlay.remove(); overlay = null; }
  else createOverlay();
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.type === 'TOGGLE_OVERLAY') toggle();
});


