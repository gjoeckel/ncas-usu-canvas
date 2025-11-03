const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const chokidar = require('chokidar');
const FileInterceptor = require('./proxy');

const app = express();
const PORT = process.env.PORT || 3000;
// Parse JSON bodies for admin endpoints
app.use(express.json());

// Initialize file interceptor
const interceptor = new FileInterceptor('./file-mappings.json');

// Request counter for statistics
let requestCounter = 0;

// CORS configuration - allow all origins for development
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Additional headers for better compatibility
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Canvas Interceptor MCP Server is running',
    timestamp: new Date().toISOString()
  });
});

// List mappings endpoint
app.get('/mappings', (req, res) => {
  const mappings = JSON.parse(fs.readFileSync('./file-mappings.json', 'utf8'));
  res.json(mappings);
});

// Admin: update mappings (urls and/or local paths)
app.post('/admin/mappings', (req, res) => {
  try {
    const body = req.body || {};
    const { cssUrl, cssLocalPath, jsUrl, jsLocalPath } = body;
    const configPath = './file-mappings.json';
    const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));

    // Helper to update or insert mapping
    function upsertMapping(url, localPath, contentType) {
      if (!url && !localPath) return;
      const idx = cfg.mappings.findIndex(m => m.url === url);
      if (idx >= 0) {
        if (localPath) cfg.mappings[idx].localPath = localPath;
        if (contentType) cfg.mappings[idx].contentType = contentType;
      } else if (url && localPath) {
        cfg.mappings.push({ url, localPath, contentType: contentType || 'application/octet-stream' });
      }
    }

    if (cssUrl || cssLocalPath) upsertMapping(cssUrl, cssLocalPath, 'text/css');
    if (jsUrl || jsLocalPath) upsertMapping(jsUrl, jsLocalPath, 'application/javascript');

    fs.writeFileSync(configPath, JSON.stringify(cfg, null, 2), 'utf8');
    interceptor.loadMappings(configPath);
    res.json({ ok: true, mappings: cfg });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

// Admin: simple file browser - lists dirs/files for a given path
app.get('/admin/browse', (req, res) => {
  try {
    const workspaceRoot = path.resolve('..');
    const userRoot = process.env.USERPROFILE ? path.resolve(process.env.USERPROFILE) : workspaceRoot;
    const requestedRoot = req.query.root ? path.resolve(req.query.root) : workspaceRoot;
    // Allowed roots: workspace and user home
    const allowedRoots = [workspaceRoot, userRoot];
    const baseRoot = allowedRoots.find(r => requestedRoot.startsWith(r)) ? requestedRoot : workspaceRoot;
    const requested = req.query.path ? path.resolve(req.query.path) : baseRoot;
    // Prevent path escape outside chosen baseRoot
    const safePath = requested.startsWith(baseRoot) ? requested : baseRoot;
    const entries = fs.readdirSync(safePath, { withFileTypes: true })
      .filter(d => d.name !== 'node_modules' && !d.name.startsWith('.'))
      .map(d => ({ name: d.name, type: d.isDirectory() ? 'dir' : 'file', fullPath: path.join(safePath, d.name) }));
    res.json({ ok: true, root: baseRoot, path: safePath, entries });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

// Admin: list available roots (workspace and user home; enumerate Windows drives heuristically)
app.get('/admin/roots', (req, res) => {
  try {
    const roots = [];
    const workspaceRoot = path.resolve('..');
    roots.push({ label: 'Workspace', path: workspaceRoot });
    if (process.env.USERPROFILE) roots.push({ label: 'User Home', path: path.resolve(process.env.USERPROFILE) });
    // Windows drive enumeration
    for (let i = 67; i <= 90; i++) { // C..Z
      const drive = String.fromCharCode(i) + ':\\';
      try { if (fs.existsSync(drive)) roots.push({ label: drive, path: drive }); } catch {}
    }
    res.json({ ok: true, roots });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

// Debug mappings endpoint
app.get('/debug/mappings', (req, res) => {
  const mappings = JSON.parse(fs.readFileSync('./file-mappings.json', 'utf8'));
  
  // Check if local files exist
  mappings.mappings = mappings.mappings.map(mapping => {
    const exists = fs.existsSync(path.resolve(mapping.localPath));
    const stats = exists ? fs.statSync(path.resolve(mapping.localPath)) : null;
    return {
      ...mapping,
      exists,
      stats: stats ? {
        size: stats.size,
        modified: stats.mtime,
        isFile: stats.isFile()
      } : null
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

// Test URL endpoint - serves intercepted content
app.get('/test-url', (req, res) => {
  const testUrl = req.query.url;
  requestCounter++;
  
  if (!testUrl) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }
  
  // Try to intercept and serve local file
  if (interceptor.shouldIntercept(testUrl)) {
    interceptor.serveLocalFile(testUrl, res);
    return; // Important: don't continue
  } else {
    // If not in our mappings, return JSON debug info
    const mapping = interceptor.getLocalFile(testUrl);
    res.json({
      url: testUrl,
      shouldIntercept: false,
      mapping,
      timestamp: new Date().toISOString()
    });
  }
});

// Statistics endpoint
app.get('/stats', (req, res) => {
  res.json({
    uptime: process.uptime(),
    requests: requestCounter,
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  });
});

// Main interception endpoint - handles both direct requests and proxied requests
app.get('*', (req, res) => {
  // Increment request counter
  requestCounter++;
  
  // Reconstruct full URL from request
  const fullUrl = req.query.url || `https://${req.headers.host}${req.url}`;
  
  // Try to intercept and serve local file
  if (interceptor.shouldIntercept(fullUrl)) {
    interceptor.serveLocalFile(fullUrl, res);
  } else {
    // If not in our mappings, return 404
    res.status(404).json({ 
      error: 'URL not in interception mappings',
      url: fullUrl 
    });
  }
});

// File watcher for auto-reload
const watcher = chokidar.watch(['../projects/NCAS/NCAS1/**/*', 'file-mappings.json'], {
  ignored: /node_modules/,
  persistent: true
});

watcher.on('change', (filepath) => {
  console.log(`\n[FILE CHANGED] ${filepath}`);
  
  if (filepath === 'file-mappings.json') {
    console.log('[RELOADING] Mappings configuration...');
    interceptor.loadMappings('./file-mappings.json');
  } else {
    console.log('[DETECTED] Local file update - changes will be served on next request');
  }
});

// Start HTTP server
app.listen(PORT, () => {
  console.log('\n========================================');
  console.log('Canvas Interceptor MCP Server Started');
  console.log('========================================');
  console.log(`Working directory: ${process.cwd()}`);
  console.log(`Server running on: http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`View mappings: http://localhost:${PORT}/mappings`);
  console.log(`Debug mappings: http://localhost:${PORT}/debug/mappings`);
  console.log(`Test URL: http://localhost:${PORT}/test-url?url=YOUR_URL`);
  console.log(`Stats: http://localhost:${PORT}/stats`);
  console.log('\nWatching for file changes...');
  console.log('Press Ctrl+C to stop\n');
});
