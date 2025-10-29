// Direct injection script for Canvas CSS/JS interception
// This will be injected directly into the Canvas page

(function() {
  'use strict';
  
  console.log('[Canvas Direct Injection] Starting CSS/JS interception');
  
  // Function to replace CSS link
  function replaceCSSLink() {
    const cssLink = document.querySelector('link[href*="ncas1.css"]');
    if (cssLink) {
      console.log('[Canvas Direct Injection] Found CSS link, replacing with local version');
      cssLink.href = 'http://localhost:3000/?url=https://instructure-uploads.s3.amazonaws.com/account_43980000000000001/attachments/1206448/ncas1.css';
      return true;
    }
    return false;
  }
  
  // Function to inject JavaScript
  function injectJavaScript() {
    // Check if our JS is already loaded
    if (window.NCAS2_LOADED) {
      console.log('[Canvas Direct Injection] JavaScript already loaded');
      return;
    }
    
    console.log('[Canvas Direct Injection] Injecting local JavaScript');
    const script = document.createElement('script');
    script.src = 'http://localhost:3000/?url=https://instructure-uploads.s3.amazonaws.com/account_43980000000000001/attachments/1206447/ncas1.js';
    script.onload = function() {
      console.log('[Canvas Direct Injection] Local JavaScript loaded successfully');
      window.NCAS2_LOADED = true;
    };
    script.onerror = function() {
      console.error('[Canvas Direct Injection] Failed to load local JavaScript');
    };
    document.head.appendChild(script);
  }
  
  // Function to remove inline styles
  function removeInlineStyles() {
    const elements = [
      '#content-wrapper',
      '.dp-wrapper',
      '.container-fluid',
      '.row',
      '.col-lg-4',
      '.col-md-4',
      '.col-12'
    ];
    
    elements.forEach(selector => {
      const element = document.querySelector(selector);
      if (element && element.hasAttribute('style')) {
        console.log('[Canvas Direct Injection] Removing inline styles from:', selector);
        element.removeAttribute('style');
      }
    });
  }
  
  // Main execution
  function init() {
    console.log('[Canvas Direct Injection] Initializing...');
    
    // Replace CSS immediately
    if (replaceCSSLink()) {
      console.log('[Canvas Direct Injection] CSS replaced successfully');
    } else {
      console.log('[Canvas Direct Injection] CSS link not found, will retry...');
    }
    
    // Inject JavaScript
    injectJavaScript();
    
    // Remove inline styles
    removeInlineStyles();
    
    // Set up mutation observer for inline styles
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
          const target = mutation.target;
          if (target.id === 'content-wrapper' ||
              target.classList.contains('dp-wrapper') ||
              target.classList.contains('container-fluid') ||
              target.classList.contains('row') ||
              target.classList.contains('col-lg-4') ||
              target.classList.contains('col-md-4') ||
              target.classList.contains('col-12')) {
            console.log('[Canvas Direct Injection] Removing inline style from:', target);
            target.removeAttribute('style');
          }
        }
      });
    });
    
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['style'],
      subtree: true
    });
  }
  
  // Run immediately if DOM is ready, otherwise wait
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
  // Also run after a delay to catch late-loading elements
  setTimeout(init, 1000);
  setTimeout(init, 3000);
  
})();
