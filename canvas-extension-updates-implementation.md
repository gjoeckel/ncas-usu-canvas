# Canvas Extension Updates - Implementation Guide
*Created: December 2024*
*Purpose: Detailed implementation plan for missing Canvas extension components*

## Overview

This document provides a systematic, step-by-step implementation approach for adding the missing components identified in the canvas-extension-updates.md analysis. Each section includes code examples, testing procedures, and troubleshooting guidance.

## Implementation Phases

### Phase 1: Critical Missing Components (Priority: High)
- [ ] Popup Interface (popup.html, popup.js)
- [ ] Background Service Worker (background.js)
- [ ] Icon Files (icon16.png, icon48.png, icon128.png)

### Phase 2: Enhanced Functionality (Priority: Medium)
- [ ] Enhanced Resource Type Coverage
- [ ] Server Debug Endpoints
- [ ] Rule Generation Utility

### Phase 3: Polish & Testing (Priority: Low)
- [ ] Error Handling Improvements
- [ ] Performance Optimization
- [ ] Documentation Updates

---

## Phase 1: Critical Missing Components

### 1.0 Recommended: Enhanced Background Service Worker with Logging

> **IMPORTANT**: This is the recommended implementation with comprehensive logging. The logging-only version is simpler but this version provides full monitoring capabilities.

### 1.1 Create Enhanced Background Service Worker with Logging

#### File: `popup.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Canvas Dev Interceptor</title>
  <style>
    body {
      width: 320px;
      padding: 16px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
    }
    
    .header {
      display: flex;
      align-items: center;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 2px solid #e0e0e0;
    }
    
    .icon {
      width: 32px;
      height: 32px;
      margin-right: 12px;
    }
    
    .title {
      font-size: 18px;
      font-weight: 600;
      color: #1a1a1a;
    }
    
    .status-card {
      background: #f5f5f5;
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 16px;
    }
    
    .status-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    
    .status-row:last-child {
      margin-bottom: 0;
    }
    
    .status-label {
      font-size: 14px;
      color: #666;
    }
    
    .status-value {
      font-size: 14px;
      font-weight: 600;
      padding: 4px 8px;
      border-radius: 4px;
    }
    
    .status-online {
      background: #d4edda;
      color: #155724;
    }
    
    .status-offline {
      background: #f8d7da;
      color: #721c24;
    }
    
    .button-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    button {
      width: 100%;
      padding: 10px;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s;
    }
    
    .btn-primary {
      background: #0066cc;
      color: white;
    }
    
    .btn-primary:hover {
      background: #0052a3;
    }
    
    .btn-secondary {
      background: #f0f0f0;
      color: #333;
    }
    
    .btn-secondary:hover {
      background: #e0e0e0;
    }
    
    .info-section {
      margin-top: 16px;
      padding-top: 12px;
      border-top: 1px solid #e0e0e0;
      font-size: 12px;
      color: #666;
    }
    
    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
    }
  </style>
</head>
<body>
  <div class="header">
    <img src="icon48.png" alt="Canvas Interceptor" class="icon">
    <div class="title">Canvas Dev Interceptor</div>
  </div>
  
  <div class="status-card">
    <div class="status-row">
      <span class="status-label">Server Status:</span>
      <span class="status-value" id="server-status">Checking...</span>
    </div>
    <div class="status-row">
      <span class="status-label">Interceptions:</span>
      <span class="status-value" id="interception-count">0</span>
    </div>
  </div>
  
  <div class="button-group">
    <button class="btn-primary" id="reload-btn">Reload Canvas Page</button>
    <button class="btn-secondary" id="clear-cache-btn">Clear Cache</button>
    <button class="btn-secondary" id="view-mappings-btn">View Mappings</button>
  </div>
  
  <div class="info-section">
    <div class="info-row">
      <span>Version:</span>
      <span>1.0.7</span>
    </div>
    <div class="info-row">
      <span>Status:</span>
      <span id="extension-status">Active</span>
    </div>
  </div>
  
  <script src="popup.js"></script>
</body>
</html>
```

#### File: `popup.js`

```javascript
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
```

### 1.2 Create Background Service Worker

#### File: `background.js` (Enhanced with Comprehensive Logging)

```javascript
// ============================================================================
// CANVAS INTERCEPTOR - Background Service Worker with Logging
// Monitors CSS and JS file interception only
// ============================================================================

const SERVER_URL = 'http://localhost:3000';

// Storage for statistics
let stats = {
  interceptions: 0,
  lastCheck: null,
  serverOnline: false,
  logs: []
};

// ============================================================================
// RULE MATCH LOGGING - Shows when interception SUCCEEDS
// ============================================================================

chrome.declarativeNetRequest.onRuleMatchedDebug.addListener((details) => {
  const url = details.request.url;
  const ruleId = details.rule.ruleId;
  const timestamp = new Date().toISOString();
  
  // Only log CSS and JS files
  if (url.includes('ncas1.css') || url.includes('ncas1.js')) {
    console.log('═══════════════════════════════════════════════════════');
    console.log(`✅ INTERCEPTION SUCCESS - Rule #${ruleId}`);
    console.log(`Time: ${timestamp}`);
    console.log(`Original URL: ${url}`);
    console.log(`Redirected to: localhost:3000`);
    console.log(`File type: ${url.endsWith('.css') ? 'CSS' : 'JavaScript'}`);
    console.log('═══════════════════════════════════════════════════════');
    
    // Update stats
    stats.interceptions++;
    stats.lastCheck = timestamp;
    
    // Store in logs
    stats.logs.push({ 
      type: 'interception', 
      timestamp, 
      url, 
      ruleId 
    });
    if (stats.logs.length > 100) stats.logs.shift();
  }
});

// ============================================================================
// WEB REQUEST LOGGING - Shows ALL requests to Canvas domains
// ============================================================================

chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    const url = details.url;
    
    // Only track CSS and JS files from Canvas S3
    if ((url.includes('ncas1.css') || url.includes('ncas1.js')) && 
        url.includes('instructure-uploads.s3.amazonaws.com')) {
      
      console.log('───────────────────────────────────────────────────────');
      console.log(`📥 REQUEST DETECTED`);
      console.log(`Time: ${new Date().toISOString()}`);
      console.log(`URL: ${url}`);
      console.log(`Type: ${details.type}`);
      console.log(`Method: ${details.method}`);
      console.log(`Frame: ${details.frameId === 0 ? 'Main' : 'Sub-frame'}`);
      console.log('───────────────────────────────────────────────────────');
      
      // Store in logs
      stats.logs.push({ 
        type: 'request', 
        timestamp: new Date().toISOString(), 
        url, 
        resourceType: details.type 
      });
      if (stats.logs.length > 100) stats.logs.shift();
    }
  },
  {
    urls: [
      "*://instructure-uploads.s3.amazonaws.com/*ncas1.css*",
      "*://instructure-uploads.s3.amazonaws.com/*ncas1.js*"
    ]
  }
);

// ============================================================================
// SERVER HEALTH MONITORING - Checks if local server is running
// ============================================================================

function checkServerHealth() {
  fetch(`${SERVER_URL}/health`)
    .then(response => response.json())
    .then(data => {
      const wasOffline = stats.serverOnline === false;
      stats.serverOnline = true;
      stats.lastCheck = new Date().toISOString();
      
      if (wasOffline) {
        console.log('🟢 SERVER ONLINE');
        console.log(`Health check: ${stats.lastCheck}`);
        console.log(`Server status: ${JSON.stringify(data, null, 2)}`);
      }
    })
    .catch(error => {
      const wasOnline = stats.serverOnline === true;
      stats.serverOnline = false;
      stats.lastCheck = new Date().toISOString();
      
      if (wasOnline) {
        console.log('🔴 SERVER OFFLINE');
        console.log(`Last check: ${stats.lastCheck}`);
        console.log(`Error: ${error.message}`);
        console.log('⚠️  CSS/JS files will NOT be intercepted!');
      }
    });
}

// Check server health immediately on startup
checkServerHealth();

// Check server health every 30 seconds
setInterval(checkServerHealth, 30000);

// ============================================================================
// EXTENSION LIFECYCLE LOGGING
// ============================================================================

chrome.runtime.onInstalled.addListener((details) => {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🚀 CANVAS INTERCEPTOR EXTENSION LOADED');
  console.log(`Reason: ${details.reason}`);
  console.log(`Version: ${chrome.runtime.getManifest().version}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log('═══════════════════════════════════════════════════════');
  console.log('📋 Monitoring these files:');
  console.log('   - ncas1.css (attachment 1206448)');
  console.log('   - ncas1.js (attachment 1206447)');
  console.log('═══════════════════════════════════════════════════════');
  
  checkServerHealth();
});

chrome.runtime.onStartup.addListener(() => {
  console.log('[Canvas Interceptor] Extension started');
  checkServerHealth();
});

// ============================================================================
// MESSAGE HANDLING - Communication with popup
// ============================================================================

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getStats') {
    sendResponse(stats);
  } else if (message.action === 'updateStats') {
    stats.interceptions++;
    stats.lastCheck = new Date().toISOString();
  }
  
  return true; // Keep channel open for async response
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

chrome.runtime.onSuspend.addListener(() => {
  console.log('⚠️  Extension being suspended');
});

self.addEventListener('error', (event) => {
  console.error('❌ Extension Error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('❌ Unhandled Promise Rejection:', event.reason);
});

// ============================================================================
// DIAGNOSTIC INFORMATION (Printed on load)
// ============================================================================

console.log('═══════════════════════════════════════════════════════');
console.log('📊 CANVAS INTERCEPTOR - DIAGNOSTIC INFO');
console.log('═══════════════════════════════════════════════════════');
console.log('Expected workflow:');
console.log('1. Canvas page requests CSS/JS from S3');
console.log('2. You see: "📥 REQUEST DETECTED"');
console.log('3. Extension rule matches');
console.log('4. You see: "✅ INTERCEPTION SUCCESS"');
console.log('5. File served from localhost:3000');
console.log('');
console.log('If you see REQUEST but NOT SUCCESS:');
console.log('→ Rule not matching (check resource types)');
console.log('→ Cache serving old version (hard reload)');
console.log('→ Extension needs reload');
console.log('');
console.log('If you see NOTHING:');
console.log('→ Canvas not loading these files on this page');
console.log('→ Wrong Canvas course/page');
console.log('→ Files already cached');
console.log('═══════════════════════════════════════════════════════');
```

### 1.3 Update Manifest to Include New Components

#### Updates to `manifest.json`

Add these sections to the existing manifest:

```json
{
  "manifest_version": 3,
  "name": "Canvas Dev Interceptor",
  "version": "1.0.8",
  "description": "Intercepts Canvas LMS files and serves local versions",
  
  "permissions": [
    "declarativeNetRequest",
    "declarativeNetRequestWithHostAccess",
    "declarativeNetRequestFeedback",
    "scripting",
    "webRequest",
    "tabs"
  ],
  
  "host_permissions": [
    "*://instructure-uploads.s3.amazonaws.com/*",
    "*://usucourses.instructure.com/*",
    "http://localhost:3000/*"
  ],
  
  "action": {
    "default_popup": "popup.html",
    "default_title": "Canvas Dev Interceptor",
    "default_icon": {
      "16": "icon16.png",
      "48": "icon48.png",
      "128": "icon128.png"
    }
  },
  
  "background": {
    "service_worker": "background.js"
  },
  
  "icons": {
    "16": "icon16.png",
    "48": "icon48.png",
    "128": "icon128.png"
  },
  
  "content_scripts": [{
    "matches": ["*://usucourses.instructure.com/*"],
    "js": ["direct-injection.js"],
    "run_at": "document_start",
    "all_frames": false
  }],
  
  "declarative_net_request": {
    "rule_resources": [{
      "id": "ruleset_1",
      "enabled": true,
      "path": "rules.json"
    }]
  }
}
```

### 1.4 Create Icon Files

#### Option A: Using SVG Template

Create a simple SVG file `icon.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <rect width="128" height="128" fill="#0066cc" rx="20"/>
  <circle cx="64" cy="40" r="12" fill="white"/>
  <rect x="32" y="64" width="64" height="4" fill="white" rx="2"/>
  <rect x="32" y="76" width="64" height="4" fill="white" rx="2"/>
  <rect x="32" y="88" width="48" height="4" fill="white" rx="2"/>
</svg>
```

Then convert to PNG using:
- Online converter: https://convertio.co/svg-png/
- ImageMagick: `convert icon.svg -resize 16x16 icon16.png`
- Or use the `create-icons.sh` script from the report

#### Option B: Quick PNG Creation

Use any image editor to create:
- `icon16.png` - 16x16 pixels
- `icon48.png` - 48x48 pixels  
- `icon128.png` - 128x128 pixels

### 1.5 Testing Phase 1

1. **Install Extension**:
   - Open Chrome → Extensions (chrome://extensions/)
   - Enable Developer mode
   - Click "Load unpacked"
   - Select `projects/NCAS/canvas-extension/` folder

2. **Start Server**:
   ```bash
   cd canvas-interceptor
   npm start
   ```

3. **Test Popup**:
   - Click extension icon
   - Verify server status shows "Online"
   - Test "Reload Canvas Page" button
   - Test "Clear Cache" button
   - Test "View Mappings" button

4. **Test Background Service Worker**:
   - Open `chrome://extensions/`
   - Find "Canvas Dev Interceptor"
   - Click "service worker" link
   - Verify console logs appear
   - Check for "Server is online" message

5. **Verify Icons**:
   - Check extension icon in toolbar
   - Check extensions page shows icon

### 1.6 How to View and Use the Enhanced Logging

#### Step 1: Access the Service Worker Console
1. Open Chrome
2. Go to `chrome://extensions/`
3. Find "Canvas Dev Interceptor"
4. Click **"service worker"** (blue link under the extension)
5. A DevTools console window opens - this is where all logs appear

#### Step 2: Load Canvas Page
1. Navigate to your Canvas course page
2. Open DevTools (F12) on the Canvas page
3. Go to Network tab
4. **Check "Disable cache"**
5. Hard reload: **Ctrl+Shift+R**

#### Step 3: Read the Logs

You'll see one of these patterns in the service worker console:

#### ✅ **SUCCESS Pattern (Everything Working)**
```
═══════════════════════════════════════════════════════
🚀 CANVAS INTERCEPTOR EXTENSION LOADED
Reason: install
Version: 1.0.8
Timestamp: 2024-12-29T23:15:00.000Z
═══════════════════════════════════════════════════════
📋 Monitoring these files:
   - ncas1.css (attachment 1206448)
   - ncas1.js (attachment 1206447)
═══════════════════════════════════════════════════════

🟢 SERVER ONLINE
Health check: 2024-12-29T23:15:05.000Z

───────────────────────────────────────────────────────
📥 REQUEST DETECTED
Time: 2024-12-29T23:15:10.123Z
URL: https://instructure-uploads.s3.amazonaws.com/.../ncas1.css
Type: stylesheet
Method: GET
Frame: Main
───────────────────────────────────────────────────────

═══════════════════════════════════════════════════════
✅ INTERCEPTION SUCCESS - Rule #1
Time: 2024-12-29T23:15:10.125Z
Original URL: https://instructure-uploads.s3.amazonaws.com/.../ncas1.css
Redirected to: localhost:3000
File type: CSS
═══════════════════════════════════════════════════════
```

#### ⚠️ **PARTIAL SUCCESS (Request Detected, No Interception)**
```
🟢 SERVER ONLINE

───────────────────────────────────────────────────────
📥 REQUEST DETECTED
Time: 2024-12-29T23:15:01.123Z
URL: https://instructure-uploads.s3.amazonaws.com/.../ncas1.css
Type: xmlhttprequest  ← NOTICE: Not "stylesheet"!
Method: GET
───────────────────────────────────────────────────────

(NO "✅ INTERCEPTION SUCCESS" MESSAGE)
```
**Problem:** Resource type mismatch. Canvas loaded via XHR, but your rule only covers "stylesheet".  
**Fix:** Add "xmlhttprequest" to resource types in rules.json

#### ❌ **FAILURE Pattern (Server Offline)**
```
🔴 SERVER OFFLINE
Last check: 2024-12-29T23:15:00.000Z
Error: Failed to fetch
⚠️  CSS/JS files will NOT be intercepted!
```
**Problem:** Server not running  
**Fix:** Run `npm start` in canvas-interceptor directory

#### 📊 **Diagnostic Flowchart**

```
Start: Open service worker console
  ↓
See "SERVER ONLINE"?
  ├─ NO → Start server: npm start
  └─ YES → Continue
      ↓
Load Canvas page (Ctrl+Shift+R)
      ↓
See "📥 REQUEST DETECTED"?
  ├─ NO → Canvas not loading these files
  │       • Wrong page?
  │       • Wrong course?
  │       • Files already cached?
  └─ YES → Continue
      ↓
See "✅ INTERCEPTION SUCCESS"?
  ├─ NO → Rule not matching
  │       • Check resource type in REQUEST log
  │       • Add that type to rules.json
  │       • Reload extension
  └─ YES → Working correctly! 🎉
```

#### Common Log Patterns & What They Mean

| Log Message | What It Means | Action Needed |
|------------|---------------|---------------|
| 🟢 SERVER ONLINE | Server running, ready to intercept | None - good! |
| 🔴 SERVER OFFLINE | Server not running | Run `npm start` |
| 📥 REQUEST DETECTED | Canvas requesting file | None - expected |
| ✅ INTERCEPTION SUCCESS | File being intercepted | None - working! |
| Type: xmlhttprequest | Canvas loading via XHR | Add to resource types in rules.json |
| Type: other | Canvas loading via unknown method | Add to resource types |
| (No messages at all) | Extension not running | Reload extension in chrome://extensions/ |

---

## Phase 2: Enhanced Functionality

### 2.1 Improve Resource Type Coverage

#### Update `rules.json`

Modify existing rules to include additional resource types:

```json
[
  {
    "id": 1,
    "priority": 1,
    "action": {
      "type": "redirect",
      "redirect": {
        "url": "http://localhost:3000/?url=https://instructure-uploads.s3.amazonaws.com/account_43980000000000001/attachments/1206448/ncas1.css"
      }
    },
    "condition": {
      "urlFilter": "*instructure-uploads.s3.amazonaws.com/account_43980000000000001/attachments/1206448/ncas1.css*",
      "resourceTypes": ["stylesheet", "xmlhttprequest", "other"]
    }
  },
  {
    "id": 2,
    "priority": 1,
    "action": {
      "type": "redirect",
      "redirect": {
        "url": "http://localhost:3000/?url=https://instructure-uploads.s3.amazonaws.com/account_43980000000000001/attachments/1206447/ncas1.js"
      }
    },
    "condition": {
      "urlFilter": "*instructure-uploads.s3.amazonaws.com/account_43980000000000001/attachments/1206447/ncas1.js*",
      "resourceTypes": ["script", "xmlhttprequest", "other"]
    }
  }
  // ... rest of rules
]
```

### 2.2 Add Server Debug Endpoints

#### Update `canvas-interceptor/server.js`

Add these endpoints after the existing `/mappings` endpoint:

```javascript
let requestCounter = 0;

// Debug mappings endpoint
app.get('/debug/mappings', (req, res) => {
  const mappings = JSON.parse(fs.readFileSync('./file-mappings.json', 'utf8'));
  
  // Check if local files exist
  mappings.mappings = mappings.mappings.map(mapping => {
    const exists = fs.existsSync(mapping.localPath);
    return {
      ...mapping,
      exists,
      stats: exists ? fs.statSync(mapping.localPath) : null
    };
  });
  
  res.json({
    mappings,
    serverStats: {
      uptime: process.uptime(),
      requests: requestCounter,
      timestamp: new Date().toISOString()
    }
  });
});

// Test URL endpoint
app.get('/test-url', (req, res) => {
  const testUrl = req.query.url;
  
  if (!testUrl) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }
  
  const shouldIntercept = interceptor.shouldIntercept(testUrl);
  const mapping = shouldIntercept ? interceptor.getLocalFile(testUrl) : null;
  
  res.json({
    url: testUrl,
    shouldIntercept,
    mapping,
    timestamp: new Date().toISOString()
  });
});

// Increment request counter in main handler
app.get('*', (req, res) => {
  requestCounter++;
  
  // ... existing code
});

// Add startup message with stats
app.listen(PORT, () => {
  console.log('\n========================================');
  console.log('Canvas Interceptor MCP Server Started');
  console.log('========================================');
  console.log(`Server running on: http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`View mappings: http://localhost:${PORT}/mappings`);
  console.log(`Debug mappings: http://localhost:${PORT}/debug/mappings`);
  console.log(`Test URL: http://localhost:${PORT}/test-url?url=YOUR_URL`);
  console.log('\nWatching for file changes...');
  console.log('Press Ctrl+C to stop\n');
});
```

### 2.3 Create Rule Generation Utility

#### File: `canvas-interceptor/generate-rules.js`

```javascript
const fs = require('fs');
const path = require('path');

// Read file mappings
const mappingsData = fs.readFileSync('./file-mappings.json', 'utf8');
const mappings = JSON.parse(mappingsData);

// Generate rules
const rules = mappings.mappings.map((mapping, index) => {
  const ruleId = index + 1;
  const url = mapping.url;
  const filename = url.split('/').pop();
  
  // Determine resource types based on file extension
  let resourceTypes = ['stylesheet', 'xmlhttprequest', 'other'];
  if (filename.endsWith('.js')) {
    resourceTypes = ['script', 'xmlhttprequest', 'other'];
  }
  
  return {
    id: ruleId,
    priority: 1,
    action: {
      type: 'redirect',
      redirect: {
        url: `http://localhost:3000/?url=${encodeURIComponent(url)}`
      }
    },
    condition: {
      urlFilter: `*${url}*`,
      resourceTypes: resourceTypes
    }
  };
});

// Write rules to file
const rulesPath = path.join(__dirname, '../projects/NCAS/canvas-extension/rules.json');
const rulesJSON = JSON.stringify(rules, null, 2);

fs.writeFileSync(rulesPath, rulesJSON, 'utf8');

console.log(`✅ Generated ${rules.length} rules`);
console.log(`📄 Rules written to: ${rulesPath}`);
console.log('\nNext steps:');
console.log('1. Reload the extension in Chrome');
console.log('2. Test the interception');
```

Add script to `package.json`:

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "generate-rules": "node generate-rules.js"
  }
}
```

Usage:

```bash
cd canvas-interceptor
npm run generate-rules
```

### 2.4 Testing Phase 2

1. **Test Enhanced Resource Types**:
   - Update rules.json with new resource types
   - Reload extension
   - Test with Canvas page
   - Verify files load from localhost

2. **Test Debug Endpoints**:
   ```bash
   # Test debug mappings
   curl http://localhost:3000/debug/mappings
   
   # Test URL testing
   curl "http://localhost:3000/test-url?url=https://instructure-uploads.s3.amazonaws.com/account_43980000000000001/attachments/1206448/ncas1.css"
   ```

3. **Test Rule Generation**:
   ```bash
   cd canvas-interceptor
   npm run generate-rules
   
   # Verify rules.json was updated
   cat ../projects/NCAS/canvas-extension/rules.json
   ```

---

## Phase 3: Polish & Testing

### 3.1 Add Error Handling

#### Update `popup.js` - Add error handling

```javascript
// Add at the top of popup.js
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

async function withRetry(fn, retries = MAX_RETRIES) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
    }
  }
}

// Update checkServerStatus function
async function checkServerStatus() {
  try {
    await withRetry(async () => {
      const response = await fetch(`${SERVER_URL}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) throw new Error('Server not responding');
      return response;
    });
    
    updateServerStatus(true);
  } catch (error) {
    console.error('Server check failed after retries:', error);
    updateServerStatus(false);
  }
}
```

### 3.2 Add Logging Enhancement

#### Update `background.js` - Enhanced logging

```javascript
// Add logging helper
function log(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] [${level}] ${message}`;
  
  console.log(logEntry);
  if (data) console.log(data);
  
  // Store recent logs
  if (!stats.logs) stats.logs = [];
  stats.logs.push({ timestamp, level, message, data });
  if (stats.logs.length > 100) stats.logs.shift();
}

// Use throughout background.js
log('INFO', 'Extension installed/updated');
log('DEBUG', 'Server health check', { online: stats.serverOnline });
```

### 3.3 Performance Monitoring

#### Add to `server.js`

```javascript
const startTime = Date.now();
const memUsage = process.memoryUsage();

app.get('/stats', (req, res) => {
  res.json({
    uptime: process.uptime(),
    requests: requestCounter,
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  });
});
```

---

## Troubleshooting Guide

### Common Issues

#### 1. Popup Shows "Server Offline"
**Solution**: 
- Verify server is running: `curl http://localhost:3000/health`
- Check server console for errors
- Ensure CORS is enabled
- Try restarting the server

#### 2. Extension Icon Not Showing
**Solution**:
- Verify icon files exist in extension directory
- Check file permissions
- Reload extension in Chrome
- Clear Chrome extension cache

#### 3. Background Service Worker Not Starting
**Solution**:
- Check `chrome://extensions/` for errors
- Verify `background.js` is in extension directory
- Check manifest.json has correct background configuration
- Look for syntax errors in background.js

#### 4. Rules Not Working After Update
**Solution**:
- Reload extension in `chrome://extensions/`
- Check rules.json syntax
- Verify URL patterns match Canvas URLs
- Test with `/test-url` endpoint

#### 5. Popup Buttons Not Working
**Solution**:
- Check browser console for JavaScript errors
- Verify permissions in manifest.json
- Test individual functions
- Check server connectivity

---

## Testing Checklist

### Phase 1 Testing
- [ ] Extension installs without errors
- [ ] Popup opens and displays correctly
- [ ] Server status shows online when server running
- [ ] Icons display in toolbar and extensions page
- [ ] Background service worker starts without errors
- [ ] Console shows appropriate log messages

### Phase 2 Testing
- [ ] Enhanced rules intercept files correctly
- [ ] Debug endpoints return expected data
- [ ] Rule generation utility creates valid rules
- [ ] Server stats increment correctly
- [ ] URL testing endpoint works

### Phase 3 Testing
- [ ] Error handling works correctly
- [ ] Logging captures relevant events
- [ ] Performance is acceptable
- [ ] All buttons in popup function
- [ ] Extension doesn't impact page performance

---

## Deployment Steps

### 1. Preparation
```bash
# Ensure all files are in place
cd projects/NCAS/canvas-extension
ls -la

# Expected files:
# manifest.json
# rules.json
# direct-injection.js
# popup.html
# popup.js
# background.js
# icon16.png
# icon48.png
# icon128.png
```

### 2. Validation
```bash
# Test rule generation
cd ../../canvas-interceptor
npm run generate-rules

# Check for syntax errors
node -c ../projects/NCAS/canvas-extension/background.js
node -c ../projects/NCAS/canvas-extension/direct-injection.js
```

### 3. Installation
1. Open Chrome → Extensions
2. Enable Developer mode
3. Click "Load unpacked"
4. Select `projects/NCAS/canvas-extension/` directory
5. Verify extension loads without errors

### 4. Testing
1. Start server: `cd canvas-interceptor && npm start`
2. Open Canvas page
3. Click extension icon
4. Verify all features work
5. Test file interception
6. Check background service worker logs

---

## Maintenance

### Regular Tasks
- Update version numbers when making changes
- Keep server dependencies updated
- Monitor console for errors
- Update URL mappings when Canvas changes
- Review and update rules periodically

### Version History
- v1.0.7: Initial implementation
- v1.0.8: Added popup, background service worker, icons
- v1.0.9: Enhanced resource types, debug endpoints
- v1.1.0: Rule generation utility, error handling

---

## Resources

### Documentation
- Chrome Extension API: https://developer.chrome.com/docs/extensions/
- Manifest V3: https://developer.chrome.com/docs/extensions/mv3/
- DeclarativeNetRequest: https://developer.chrome.com/docs/extensions/reference/declarativeNetRequest/

### Tools
- Chrome DevTools: chrome://extensions/
- Extension Console: Click "service worker" link
- Network Tab: Monitor interceptions
- Application Tab: Check storage and cache

---

*This implementation guide provides comprehensive instructions for adding all missing components to the Canvas extension. Follow phases sequentially for best results.*

