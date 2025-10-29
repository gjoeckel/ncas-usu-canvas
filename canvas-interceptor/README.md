# Canvas LMS File Interceptor - MCP Server

Local development server that intercepts Canvas LMS CSS/JS files and serves local versions.

## Setup

1. Install dependencies:
   npm install

2. Ensure local files exist:
   - NCAS1/CSS/testing/ncas1.css
   - NCAS1/CSS/testing/ncas1.js

3. Start server:
   npm start

## Usage

### Method 1: Browser Extension (Recommended)

Create a simple browser extension to redirect requests:

manifest.json:
{
  "manifest_version": 3,
  "name": "Canvas Dev Interceptor",
  "version": "1.0",
  "permissions": ["declarativeNetRequest"],
  "host_permissions": ["*://instructure-uploads.s3.amazonaws.com/*"],
  "declarativeNetRequest": {
    "rules": [
      {
        "id": 1,
        "priority": 1,
        "action": {
          "type": "redirect",
          "redirect": {
            "url": "http://localhost:3000/?url=https://instructure-uploads.s3.amazonaws.com/account_43980000000000001/attachments/1205817/ncas1-reboot-14.css"
          }
        },
        "condition": {
          "urlFilter": "*instructure-uploads.s3.amazonaws.com/account_43980000000000001/attachments/1205817/ncas1-reboot-14.css*",
          "resourceTypes": ["stylesheet"]
        }
      },
      {
        "id": 2,
        "priority": 1,
        "action": {
          "type": "redirect",
          "redirect": {
            "url": "http://localhost:3000/?url=https://instructure-uploads.s3.amazonaws.com/account_43980000000000001/attachments/1205816/ncas1-reboot-14.js"
          }
        },
        "condition": {
          "urlFilter": "*instructure-uploads.s3.amazonaws.com/account_43980000000000001/attachments/1205816/ncas1-reboot-14.js*",
          "resourceTypes": ["script"]
        }
      }
    ]
  }
}

### Method 2: Chrome DevTools Network Override

1. Open Chrome DevTools (F12)
2. Go to Network tab
3. Right-click the CSS/JS file
4. Select "Override content"
5. Point to your local file

### Method 3: Service Worker (Advanced)

Inject a service worker into the Canvas page that intercepts fetch requests.

## Testing

1. Start the server:
   npm start

2. Test health endpoint:
   curl http://localhost:3000/health

3. Test CSS interception:
   curl "http://localhost:3000/?url=https://instructure-uploads.s3.amazonaws.com/account_43980000000000001/attachments/1205817/ncas1-reboot-14.css"

4. Test JS interception:
   curl "http://localhost:3000/?url=https://instructure-uploads.s3.amazonaws.com/account_43980000000000001/attachments/1205816/ncas1-reboot-14.js"

5. Open Canvas page:
   https://usucourses.instructure.com/courses/2803

## File Watching

The server automatically watches for changes in:
- NCAS1/CSS/testing/ncas1.css
- NCAS1/CSS/testing/ncas1.js
- file-mappings.json

Changes are detected and logged. Simply refresh the Canvas page to see updates.
