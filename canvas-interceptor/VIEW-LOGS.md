# How to View Extension Logs

## Step 1: Open Service Worker Console

1. Go to `chrome://extensions/`
2. Find "Canvas Dev Interceptor (Minimal)"
3. Click **"service worker"** link (blue text, not the background.html link)

## Step 2: Toggle Extension

1. Click the extension icon in Chrome toolbar
2. Click **"Toggle Redirects"** button twice (Off → On)

## Step 3: Check Logs

Look for lines that start with `[CDI]`:
- `[CDI] CSS redirect:` should show URL with `&_t=1234567890`
- `[CDI] JS redirect:` should show URL with `&_t=1234567890`

## Step 4: Check Network Logs in Canvas Page

1. Go to your Canvas course page
2. Press **F12** to open DevTools
3. Go to **Network** tab
4. Look for `ncas2.css` and `ncas2.js` requests
5. Check the "URL" column - should show redirected URLs with `localhost:3000`

