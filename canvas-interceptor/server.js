const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const chokidar = require('chokidar');
const FileInterceptor = require('./proxy');

const app = express();
const PORT = process.env.PORT || 3000;

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

// Start server
app.listen(PORT, () => {
  console.log('\n========================================');
  console.log('Canvas Interceptor MCP Server Started');
  console.log('========================================');
  console.log(`Server running on: http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`View mappings: http://localhost:${PORT}/mappings`);
  console.log(`Debug mappings: http://localhost:${PORT}/debug/mappings`);
  console.log(`Test URL: http://localhost:${PORT}/test-url?url=YOUR_URL`);
  console.log(`Stats: http://localhost:${PORT}/stats`);
  console.log('\nWatching for file changes...');
  console.log('Press Ctrl+C to stop\n');
});
