# Three Methods to Hide "Return" Button/Header on Quiz Pages

## Problem
The `header.header` element (containing the "Return" button) appears on quiz/external tool pages and needs to be hidden.

## Current Implementation
```css
header.header {
  display: none !important;
}
```
**Issue**: This hides the header on ALL pages, not just quiz pages.

---

## Method 1: CSS-Only - Target by Page Structure (Recommended)

**Approach**: Use CSS selectors that target `header.header` only when it appears on quiz/external tool pages.

### Indicators of Quiz Pages:
- Body class: `external_tool_full_width` or `external_tool`
- Presence of `.tool_content_wrapper` container
- Iframe with class `.tool_launch` or `data-lti-launch="true"`

### Implementation:
```css
/* Hide header.header on quiz/external tool pages only */
body.external_tool_full_width header.header,
body.external_tool header.header,
.tool_content_wrapper ~ header.header,
iframe[data-lti-launch="true"] ~ header.header,
body:has(.tool_content_wrapper) header.header {
  display: none !important;
}
```

### Pros:
- ✅ Pure CSS - no JavaScript needed
- ✅ Fast - applies immediately on page load
- ✅ Works with Canvas's existing structure
- ✅ Uses multiple selectors for reliability

### Cons:
- ⚠️ Requires `:has()` selector (modern browsers only)
- ⚠️ May need fallback for older browsers

### Fallback (if `:has()` not supported):
```css
/* Primary method - works in modern browsers */
body:has(.tool_content_wrapper) header.header {
  display: none !important;
}

/* Fallback - target by body class */
body.external_tool_full_width header.header,
body.external_tool header.header {
  display: none !important;
}

/* Additional fallback - sibling selector (if header comes after tool wrapper) */
.tool_content_wrapper ~ header.header {
  display: none !important;
}
```

---

## Method 2: CSS-Only - Target by URL Pattern

**Approach**: Use CSS attribute selectors to target pages based on URL patterns (though this is limited in CSS).

### Implementation (Limited - CSS can't read URL directly):
```css
/* This approach is limited because CSS cannot directly access window.location */
/* However, Canvas may inject data attributes we can use */

/* If Canvas adds data attributes to body based on page type */
body[data-page-type="external_tool"] header.header,
body[data-page-type="quiz"] header.header {
  display: none !important;
}

/* Alternative: Target by specific container IDs that only appear on quiz pages */
#tool_content_wrapper ~ header.header,
.tool_content_wrapper + header.header {
  display: none !important;
}
```

### Pros:
- ✅ Pure CSS
- ✅ Fast application

### Cons:
- ❌ CSS cannot directly read URL patterns
- ⚠️ Relies on Canvas adding data attributes (may not be reliable)
- ⚠️ Less specific than Method 1

---

## Method 3: JavaScript - Dynamic Detection and Hiding

**Approach**: Use JavaScript to detect quiz/external tool pages and hide the header dynamically.

### Implementation:
```javascript
function hideReturnButtonOnQuizPages() {
  // Check if we're on a quiz/external tool page
  const isQuizPage = 
    document.body.classList.contains('external_tool_full_width') ||
    document.body.classList.contains('external_tool') ||
    document.querySelector('.tool_content_wrapper') !== null ||
    document.querySelector('iframe[data-lti-launch="true"]') !== null ||
    window.location.pathname.includes('/external_tools/') ||
    window.location.pathname.includes('/assignments/') && document.querySelector('.tool_launch');

  if (isQuizPage) {
    const header = document.querySelector('header.header');
    if (header) {
      header.style.display = 'none';
      // Also add a class for CSS targeting
      header.classList.add('ncademi-quiz-page-header');
      logOK("Hidden return button on quiz page");
    }
  }
}

// Call on page load
waitForDOM(() => {
  hideReturnButtonOnQuizPages();
  
  // Also watch for dynamic content (AJAX navigation)
  const observer = new MutationObserver(() => {
    hideReturnButtonOnQuizPages();
  });
  observer.observe(document.body, { childList: true, subtree: true });
});
```

### Complementary CSS:
```css
/* Hide header when JavaScript adds the class */
header.header.ncademi-quiz-page-header {
  display: none !important;
}
```

### Pros:
- ✅ Most flexible - can check multiple conditions
- ✅ Can handle dynamic content loading
- ✅ Can check URL patterns directly
- ✅ Works with AJAX navigation

### Cons:
- ⚠️ Requires JavaScript execution
- ⚠️ May have brief flash before hiding (FOUC - Flash of Unstyled Content)
- ⚠️ More complex implementation

### Enhanced Version (with FOUC prevention):
```javascript
// Hide immediately if header exists on page load
(function() {
  const header = document.querySelector('header.header');
  if (header && (
    document.body.classList.contains('external_tool_full_width') ||
    document.body.classList.contains('external_tool') ||
    document.querySelector('.tool_content_wrapper')
  )) {
    header.style.display = 'none';
  }
})();

// Then verify and hide on full page load
waitForDOM(() => {
  hideReturnButtonOnQuizPages();
});
```

---

## Recommendation: Hybrid Approach (Method 1 + Method 3)

**Best Practice**: Use CSS for immediate hiding + JavaScript for reliability and dynamic content.

### Combined Implementation:

**CSS (Primary - immediate hiding)**:
```css
/* Hide header.header on quiz/external tool pages */
body.external_tool_full_width header.header,
body.external_tool header.header,
.tool_content_wrapper ~ header.header {
  display: none !important;
}

/* Fallback using :has() selector (modern browsers) */
body:has(.tool_content_wrapper) header.header {
  display: none !important;
}
```

**JavaScript (Fallback - for dynamic content and edge cases)**:
```javascript
function hideReturnButtonOnQuizPages() {
  const header = document.querySelector('header.header');
  if (!header) return;
  
  const isQuizPage = 
    document.body.classList.contains('external_tool_full_width') ||
    document.body.classList.contains('external_tool') ||
    document.querySelector('.tool_content_wrapper') !== null ||
    document.querySelector('iframe.tool_launch') !== null;

  if (isQuizPage && header.style.display !== 'none') {
    header.style.display = 'none';
    header.classList.add('ncademi-quiz-page-header');
    log("Hidden return button on quiz page");
  }
}

// Immediate check (before DOM ready)
(function() {
  if (document.body) {
    hideReturnButtonOnQuizPages();
  }
})();

// Full check after DOM ready
waitForDOM(() => {
  hideReturnButtonOnQuizPages();
  
  // Watch for dynamic content
  const observer = new MutationObserver(() => {
    hideReturnButtonOnQuizPages();
  });
  observer.observe(document.body, { 
    childList: true, 
    subtree: true,
    attributes: true,
    attributeFilter: ['class']
  });
});
```

### Why Hybrid?
- ✅ CSS provides instant hiding (no FOUC)
- ✅ JavaScript handles edge cases and dynamic content
- ✅ Works even if CSS selector specificity is an issue
- ✅ Redundant approach ensures reliability

---

## Summary Table

| Method | Type | Speed | Reliability | Complexity | Best For |
|--------|------|-------|-------------|------------|----------|
| Method 1: CSS by Structure | CSS | ⚡ Fast | ✅ High | 🟢 Simple | Most cases |
| Method 2: CSS by URL | CSS | ⚡ Fast | ⚠️ Medium | 🟢 Simple | Limited use |
| Method 3: JavaScript | JS | ⚠️ Medium | ✅ High | 🟡 Medium | Dynamic content |
| **Hybrid (1+3)** | **Both** | **⚡ Fast** | **✅ Very High** | **🟡 Medium** | **Production** |

---

## Next Steps
1. **Test current implementation** - Verify if `header.header` exists on quiz pages
2. **Choose method** - Recommend Method 1 (CSS) or Hybrid approach
3. **Implement** - Add appropriate CSS/JS to `ncas13.css` and `ncas13.js`
4. **Test** - Verify on actual quiz pages

