# Browser Console Commands for Force Reload

## Method 1: Force CSS/JS Reload
Open the browser console (F12) and run:

```javascript
// Reload all stylesheets
document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
  link.href = link.href.replace(/\?.*/, '') + '?_t=' + Date.now();
});

// Reload all scripts
Array.from(document.querySelectorAll('script[src]')).forEach(script => {
  const newScript = document.createElement('script');
  newScript.src = script.src.replace(/\?.*/, '') + '?_t=' + Date.now();
  script.parentNode.replaceChild(newScript, script);
});
```

## Method 2: Just NCAS2 Files
```javascript
// Reload just the NCAS2 files
document.querySelectorAll('link[href*="ncas2.css"], script[src*="ncas2.js"]').forEach(el => {
  if (el.tagName === 'LINK') {
    el.href = el.href.replace(/\?.*/, '') + '?_t=' + Date.now();
  } else {
    el.src = el.src.replace(/\?.*/, '') + '?_t=' + Date.now();
  }
});
```

## Method 3: Simple Page Reload
Just press **Ctrl+Shift+R** for a hard refresh

