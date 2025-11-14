const fs = require('fs');
const path = require('path');

class FileInterceptor {
  constructor(mappingsPath) {
    this.loadMappings(mappingsPath);
  }

  loadMappings(mappingsPath) {
    const data = fs.readFileSync(mappingsPath, 'utf8');
    const config = JSON.parse(data);
    this.mappings = new Map();
    
    config.mappings.forEach(mapping => {
      this.mappings.set(mapping.url, {
        localPath: path.resolve(mapping.localPath),
        contentType: mapping.contentType
      });
    });
    
    console.log('Loaded mappings:');
    this.mappings.forEach((value, key) => {
      console.log(`  ${key} -> ${value.localPath}`);
    });
  }

  shouldIntercept(url) {
    return this.mappings.has(url);
  }

  getLocalFile(url) {
    return this.mappings.get(url);
  }

  serveLocalFile(url, res) {
    const mapping = this.getLocalFile(url);
    
    if (!mapping) {
      return false;
    }

    try {
      if (!fs.existsSync(mapping.localPath)) {
        console.error(`Local file not found: ${mapping.localPath}`);
        res.status(404).send('Local file not found');
        return true;
      }

      const content = fs.readFileSync(mapping.localPath, 'utf8');
      
      res.setHeader('Content-Type', mapping.contentType);
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('X-Intercepted-By', 'Canvas-MCP-Interceptor');
      
      res.send(content);
      
      console.log(`[INTERCEPTED] ${url}`);
      console.log(`[SERVED] ${mapping.localPath}`);
      
      return true;
    } catch (error) {
      console.error(`Error serving local file: ${error.message}`);
      res.status(500).send('Error serving local file');
      return true;
    }
  }
}

module.exports = FileInterceptor;
