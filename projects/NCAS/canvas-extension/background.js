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

