// Canvas Dev Interceptor - Popup Script
const SERVER_URL = 'http://localhost:3000';

// DOM Elements
const serverStatusEl = document.getElementById('server-status');
const interceptionCountEl = document.getElementById('interception-count');
const extensionStatusEl = document.getElementById('extension-status');
const reloadBtn = document.getElementById('reload-btn');
const clearCacheBtn = document.getElementById('clear-cache-btn');
const viewMappingsBtn = document.getElementById('view-mappings-btn');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  checkServerStatus();
  setupEventListeners();
  
  // Check server status every 5 seconds
  setInterval(checkServerStatus, 5000);
});

// Setup event listeners
function setupEventListeners() {
  reloadBtn.addEventListener('click', handleReload);
  clearCacheBtn.addEventListener('click', handleClearCache);
  viewMappingsBtn.addEventListener('click', handleViewMappings);
}

// Check if server is running
async function checkServerStatus() {
  try {
    const response = await fetch(`${SERVER_URL}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.ok) {
      const data = await response.json();
      updateServerStatus(true);
      
      // Get interception count from background script if available
      chrome.runtime.sendMessage({ action: 'getStats' }, (response) => {
        if (response && response.interceptions) {
          interceptionCountEl.textContent = response.interceptions;
        }
      });
    } else {
      updateServerStatus(false);
    }
  } catch (error) {
    console.error('Server check failed:', error);
    updateServerStatus(false);
  }
}

// Update server status display
function updateServerStatus(isOnline) {
  if (isOnline) {
    serverStatusEl.textContent = 'Online';
    serverStatusEl.className = 'status-value status-online';
    extensionStatusEl.textContent = 'Active';
  } else {
    serverStatusEl.textContent = 'Offline';
    serverStatusEl.className = 'status-value status-offline';
    extensionStatusEl.textContent = 'Inactive - Start server';
  }
}

// Handle reload button click
async function handleReload() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (tab.url && tab.url.includes('instructure.com')) {
      await chrome.tabs.reload(tab.id);
      showNotification('Page reloaded');
    } else {
      showNotification('Not on a Canvas page');
    }
  } catch (error) {
    console.error('Reload failed:', error);
    showNotification('Reload failed');
  }
}

// Handle clear cache button click
async function handleClearCache() {
  try {
    // Clear browser cache for Canvas domain
    await chrome.browsingData.remove(
      { urls: ['*://*.instructure.com/*'] },
      { cache: true, cookies: false, localStorage: false }
    );
    
    showNotification('Cache cleared');
    
    // Optionally reload the page
    setTimeout(async () => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab.url && tab.url.includes('instructure.com')) {
        await chrome.tabs.reload(tab.id);
      }
    }, 500);
  } catch (error) {
    console.error('Clear cache failed:', error);
    showNotification('Cache clear failed');
  }
}

// Handle view mappings button click
async function handleViewMappings() {
  try {
    const response = await fetch(`${SERVER_URL}/mappings`);
    const data = await response.json();
    
    // Open new tab with mappings
    chrome.tabs.create({
      url: `${SERVER_URL}/mappings`
    });
  } catch (error) {
    console.error('View mappings failed:', error);
    showNotification('Could not fetch mappings');
  }
}

// Show notification message
function showNotification(message) {
  // You can enhance this to show a toast notification
  console.log(message);
}

