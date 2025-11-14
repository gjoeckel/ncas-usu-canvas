# Canvas LMS Custom CSS and JavaScript: Issues and Best Practices

## Table of Contents
1. [Vertical Scrollbar Issue](#vertical-scrollbar-issue)
2. [Root Cause Analysis](#root-cause-analysis)
3. [Solutions](#solutions)
4. [Best Practices for Canvas LMS Customization](#best-practices-for-canvas-lms-customization)
5. [Canvas-Specific Considerations](#canvas-specific-considerations)
6. [Testing and Maintenance](#testing-and-maintenance)

---

## Vertical Scrollbar Issue

### Problem Description
Unwanted vertical scrollbars appear on Canvas LMS pages, particularly those with minimal or no content (e.g., `/pages/start-here`), even when all content is visible within the viewport.

### Affected Pages
- Pages with minimal content
- Course home pages with sparse content
- Custom page templates
- Any page where content height < viewport height

---

## Root Cause Analysis

The vertical scrollbar issue stems from a combination of CSS properties and Canvas LMS's DOM structure:

### Primary Causes

1. **Body Padding and Minimum Height Conflict**
   - `body` element has `padding-top: 50px` (from `.ncademi-desktop-body` class)
   - Previously had `min-height: 100vh` 
   - Combination caused total height to exceed viewport: `100vh + 50px` = scrollbar

2. **Content Container Flexibility Issues**
   - `#not_right_side` element (main content area) lacked proper flex constraints
   - Without `flex: 1` and `min-height: 0`, containers cannot shrink below content size
   - Causes overflow even when content is minimal

3. **HTML Height Constraints**
   - `html` element may not be constrained to viewport height
   - Can cause document height to exceed viewport

4. **Canvas DOM Structure Variations**
   - Different page types have different DOM structures
   - Pages with `<main>` elements vs. pages without (e.g., `/pages/*` routes)
   - Requires flexible CSS that works across page types

### Canvas LMS DOM Structure Reference

```
html
└── body (display: flex, flex-direction: column)
    ├── header#ncas-header (custom navigation - 60px desktop, 50px mobile)
    └── div#application.ic-app
        └── div#wrapper.ic-Layout-wrapper
            └── div#main.ic-Layout-columns
                └── div#not_right_side.ic-app-main-content (FLEX CONTAINER)
                    └── div#content-wrapper
                        └── div#content.ic-Layout-contentMain
                            └── [page content]
```

**Key Elements:**
- `body`: Flex container with `flex-direction: column`
- `#not_right_side`: Main content area that should flex to fill remaining space
- `#content-wrapper`: Content wrapper with relative positioning
- `#content`: Main content container with padding

---

## Solutions

### 1. HTML Element Constraints

```css
html {
  overflow-x: hidden !important;
  width: 100% !important;
  max-width: 100vw !important;
  height: 100% !important; /* Ensure html fills viewport */
}
```

**Purpose:** Constrains HTML element to viewport, preventing overflow.

### 2. Body Element Flexbox Layout

```css
body {
  display: flex !important;
  flex-direction: column !important;
  /* DO NOT use min-height: 100vh with padding-top - causes scrollbar */
  margin: 0 !important;
  padding: 0 !important; /* Padding applied via utility classes (.ncademi-desktop-body) */
  overflow-x: hidden !important;
  width: 100% !important;
  max-width: 100vw !important;
}
```

**Critical:** Never combine `min-height: 100vh` with `padding-top` on `body` - this creates scrollbar.

### 3. Main Content Area Flex Constraints

```css
#not_right_side.ic-app-main-content {
  display: flex !important;
  flex-direction: column !important;
  flex: 1 !important; /* Allow element to grow and fill remaining space */
  min-height: 0 !important; /* CRITICAL: Allow flex item to shrink below content size */
  width: 100% !important;
  max-width: none !important;
  margin-right: 0 !important;
  margin-left: 0 !important;
  padding-right: 0 !important;
}
```

**Key Points:**
- `flex: 1` makes element grow to fill available space in flexbox
- `min-height: 0` allows element to shrink below its content size, preventing overflow
- Required for pages with minimal content

### 4. Content Padding Management

```css
div#content.ic-Layout-contentMain {
  padding: 36px 0px 0px 0px !important; /* Top padding only, bottom removed */
  padding-right: 0 !important;
  position: relative;
  overflow-x: hidden !important;
  max-width: 100% !important;
}
```

**Note:** Removed bottom padding (was 48px) to prevent extra whitespace.

### 5. Responsive Body Padding

```css
/* Desktop */
.ncademi-desktop-body {
  padding-top: 50px !important; /* Matches header height */
}

/* Mobile */
.ncademi-mobile-body {
  padding-top: 50px !important; /* Matches mobile header height */
}
```

**Implementation:** Applied via JavaScript utility classes based on viewport width.

---

## Best Practices for Canvas LMS Customization

### 1. Use Canvas Theme Editor

**Preferred Method:**
- Navigate to `Admin` > `Themes` > `Open in Theme Editor`
- Upload custom CSS and JavaScript files via `Upload` tab
- Preview changes before applying
- Save and apply to make changes global

**Benefits:**
- Centralized management
- Persists through Canvas updates
- Institution-wide application
- Version control capabilities

**Reference:** [Canvas Theme Editor Guide](https://www.howtocanvas.com/theme-editor/css-theme-editor)

### 2. CSS Specificity and Selectors

**Use Specific Selectors:**
```css
/* Good: Specific selector */
body:not(.ncademi-excluded):not(.ncademi-admin-view) #not_right_side {
  flex: 1 !important;
}

/* Avoid: Too broad */
body div {
  flex: 1;
}
```

**Guidelines:**
- Target specific Canvas elements using their IDs and classes
- Use scope selectors to limit application (e.g., `body:not(.ncademi-excluded)`)
- Use `!important` sparingly, only when necessary to override Canvas defaults
- Combine multiple selectors for higher specificity when needed

### 3. Flexbox Layout Best Practices

**Key Principles:**
- **Parent container:** Must have `display: flex` and `flex-direction`
- **Flex items:** Use `flex: 1` to grow, `min-height: 0` to allow shrinking
- **Height constraints:** Avoid `min-height: 100vh` on flex items with padding
- **Overflow:** Use `overflow-x: hidden` on containers, `overflow-y: auto` only where scrolling is desired

**Common Pattern:**
```css
body {
  display: flex;
  flex-direction: column;
  min-height: 0; /* Not 100vh if using padding */
}

#not_right_side {
  flex: 1;
  min-height: 0; /* Critical for pages with minimal content */
}
```

### 4. Responsive Design Considerations

**Mobile-First Approach:**
- Test on mobile viewports (≤768px)
- Use media queries for breakpoints
- Apply utility classes via JavaScript for responsive behavior

**Example:**
```css
@media (max-width: 768px) {
  body {
    padding-top: 50px !important;
  }
  
  .ncademi-header {
    height: 50px;
  }
}
```

### 5. Accessibility Compliance

**Critical Requirements:**
- **Never disable scrolling entirely:** Avoid `overflow-y: hidden` on `html` or `body`
- **Maintain keyboard navigation:** Ensure custom styles don't interfere with focus states
- **Screen reader compatibility:** Test with screen readers
- **Color contrast:** Maintain WCAG 2.2 AA standards
- **Reduced motion:** Respect `@media (prefers-reduced-motion: reduce)`

**Accessibility Resources:**
- [Canvas Accessibility Checker](https://community.canvaslms.com/t5/Canvas-Basics-Guide/What-is-the-Accessibility-Checker/ta-p/404478)
- [Designing Accessible Canvas Pages](https://yellowhammerit.com/designing-accessible-pages-in-canvas-lms/)

### 6. JavaScript Best Practices

**DOM Manipulation:**
- Wait for DOM ready before manipulating elements
- Check for element existence before querying
- Use event delegation for dynamic content
- Clean up event listeners when appropriate

**Example Pattern:**
```javascript
function waitForDOM(callback) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', callback);
  } else {
    callback();
  }
}

waitForDOM(() => {
  const element = document.getElementById('content-wrapper');
  if (!element) return; // Safety check
  // Manipulate element
});
```

**Error Handling:**
- Wrap risky operations in try-catch blocks
- Log errors for debugging
- Gracefully degrade when features aren't available

### 7. Canvas Update Compatibility

**Maintenance Strategy:**
- **Monitor Canvas releases:** Check Canvas release notes monthly
- **Test after updates:** Verify customizations still work
- **Version control:** Keep custom CSS/JS in version control
- **Documentation:** Maintain change log of customizations

**Common Breakage Points:**
- DOM structure changes
- CSS class name changes
- JavaScript API changes
- New Canvas features that conflict with customizations

**Reference:** [Canvas Release Notes](https://community.canvaslms.com/t5/Canvas-Releases/ct-p/releases)

---

## Canvas-Specific Considerations

### 1. Canvas Page Types

Different page types have different DOM structures:

**Course Home Page:**
- Contains `<main>` element (custom)
- Has `#loader` div with course navigation
- Typically has more content

**Pages Routes (`/pages/*`):**
- No `<main>` element
- Uses `#content-wrapper` > `#content` structure
- Often minimal content

**Grades Page:**
- Table-based layout
- May have different padding/margin requirements

**Recommendation:** Test customizations on all page types.

### 2. Canvas Default Styles

**Important:** Canvas applies default styles that may conflict:

```css
/* Canvas default - may need override */
.ic-Layout-contentMain {
  padding: 36px 48px 48px 36px; /* Default padding */
}

/* Custom override */
div#content.ic-Layout-contentMain {
  padding: 36px 0px 0px 0px !important;
}
```

**Strategy:**
- Use `!important` only when overriding Canvas defaults
- Match Canvas selector specificity
- Test that overrides don't break Canvas functionality

### 3. Canvas Element IDs and Classes

**Reliable Selectors:**
- `#wrapper.ic-Layout-wrapper`
- `#not_right_side.ic-app-main-content`
- `#content-wrapper`
- `#content.ic-Layout-contentMain`
- `#left-side` (hidden in custom themes)
- `#right-side-wrapper` (hidden in custom themes)

**Unreliable Selectors:**
- Dynamic IDs that change
- Classes that Canvas may modify
- Nested structures that vary by page type

### 4. Custom Header Injection

**Timing:**
- Inject custom header/navigation early in DOM lifecycle
- Use `DOMContentLoaded` or check `document.readyState`
- Ensure header is injected before content loads

**Positioning:**
```javascript
// Insert at top of body
document.body.insertBefore(header, document.body.firstChild);
```

### 5. Canvas Scoping

**Use Scoped Selectors:**
```css
/* Apply only to course pages, exclude admin views */
body:not(.ncademi-excluded):not(.ncademi-admin-view) {
  /* Custom styles */
}
```

**Benefits:**
- Prevents interference with admin panels
- Allows different styling for different contexts
- Maintains Canvas functionality where needed

---

## Testing and Maintenance

### Testing Checklist

**Before Deployment:**
- [ ] Test on course home page
- [ ] Test on `/pages/*` routes (minimal content)
- [ ] Test on grades page
- [ ] Test on assignments page
- [ ] Test on mobile viewport (≤768px)
- [ ] Test on tablet viewport (769px - 1024px)
- [ ] Test on desktop viewport (>1024px)
- [ ] Test with browser dev tools (check for console errors)
- [ ] Test scrollbar behavior with minimal content
- [ ] Test scrollbar behavior with long content
- [ ] Verify no horizontal scrollbar
- [ ] Test with Canvas accessibility checker
- [ ] Test keyboard navigation
- [ ] Test with screen reader (if available)

### Testing Commands (Browser Console)

**Check for Scrollbar:**
```javascript
// Check if scrollbar exists
const hasScrollbar = document.documentElement.scrollHeight > window.innerHeight;
console.log('Has scrollbar:', hasScrollbar);
console.log('Document height:', document.documentElement.scrollHeight);
console.log('Viewport height:', window.innerHeight);
```

**Check Flexbox Layout:**
```javascript
// Check computed styles
const body = document.body;
const notRightSide = document.getElementById('not_right_side');
console.log('Body display:', getComputedStyle(body).display);
console.log('Body flex-direction:', getComputedStyle(body).flexDirection);
console.log('#not_right_side flex:', getComputedStyle(notRightSide).flex);
console.log('#not_right_side min-height:', getComputedStyle(notRightSide).minHeight);
```

**Check Element Heights:**
```javascript
const elements = ['html', 'body', '#wrapper', '#not_right_side', '#content-wrapper', '#content'];
elements.forEach(selector => {
  const el = document.querySelector(selector);
  if (el) {
    const style = getComputedStyle(el);
    console.log(`${selector}:`, {
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
      offsetHeight: el.offsetHeight,
      minHeight: style.minHeight,
      height: style.height
    });
  }
});
```

### Maintenance Schedule

**Monthly:**
- Review Canvas release notes
- Test customizations on staging environment
- Check for console errors

**Quarterly:**
- Full regression testing across all page types
- Review and update documentation
- Check community forums for Canvas changes

**After Canvas Updates:**
- Immediately test customizations
- Check for breaking changes
- Update CSS/JS as needed
- Document any required changes

### Documentation Requirements

**Maintain Records Of:**
- All custom CSS files and their purposes
- All custom JavaScript files and their purposes
- CSS selector purposes and target elements
- Known issues and workarounds
- Canvas version compatibility
- Last tested date
- Testing results

---

## Additional Resources

### Official Canvas Documentation
- [Canvas Admin Guide](https://community.canvaslms.com/html/assets/Canvas_Admin_Guide.pdf)
- [Canvas Theme Editor](https://community.canvaslms.com/t5/Admin-Guide/How-do-I-use-the-Theme-Editor-to-customize-the-Login-page/ta-p/155)

### Community Resources
- [Canvas LMS Users Google Group](https://groups.google.com/g/canvas-lms-users)
- [Canvas Community Forums](https://community.canvaslms.com/)

### Best Practice Guides
- [Canvas Theme Editor Guide](https://www.howtocanvas.com/theme-editor/css-theme-editor)
- [Designing Accessible Canvas Pages](https://yellowhammerit.com/designing-accessible-pages-in-canvas-lms/)

---

## Version History

**2025-01-02**
- Initial documentation
- Documented vertical scrollbar issue and solutions
- Compiled best practices from web research
- Added Canvas-specific considerations

---

## Related Files

- `ncas5.css` - Custom CSS file with scrollbar fixes
- `ncas5.js` - Custom JavaScript for navigation and responsive behavior

---

**Last Updated:** 2025-01-02  
**Maintained By:** NCADEMI Development Team

