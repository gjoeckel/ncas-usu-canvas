# Methods to Prevent Main Content from Scrolling Under Header

Based on analysis of https://usucourses.instructure.com/courses/2803

## Problem
The `<main>` element content is scrolling underneath the header because:
- Header has `position: static` (line 42 in ncas2.css)
- Header has fixed height of 150px
- Main element has no offset/padding to account for header height
- Both elements exist in normal document flow

## Solution 1: Add Padding-Top to Main (IMPLEMENTED) ✅
**Location**: Line 99 in `ncas2.css`

```css
#ncas-main.main-content {
  /* ... existing styles ... */
  padding-top: 150px; /* Match header height */
}
```

**Pros**: Simple, maintains layout flow, responsive to header height
**Cons**: Creates spacing at top of main content
**Best for**: Static headers with fixed height

---

## Solution 2: Use Fixed Positioning on Header
**Location**: Update line 42 in `ncas2.css`

```css
#ncas-header.ncademi-header,
.ncademi-header {
  position: fixed !important; /* Changed from static */
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  /* ... rest of styles ... */
}

#ncas-main.main-content {
  margin-top: 150px; /* Offset for fixed header */
}
```

**Pros**: Header stays visible while scrolling
**Cons**: Requires careful z-index management, potential accessibility issues
**Best for**: When header should always be visible

---

## Solution 3: Use CSS Grid with Grid Template Rows
**Location**: Apply to parent container (body or wrapper)

```css
body:not(.ncademi-excluded) {
  display: grid;
  grid-template-rows: 150px 1fr auto; /* header main footer */
  min-height: 100vh;
}

#ncas-header.ncademi-header {
  position: static;
  grid-row: 1;
}

#ncas-main.main-content {
  position: static;
  grid-row: 2;
  overflow-y: auto;
}

#ncas-footer.footer-content {
  grid-row: 3;
}
```

**Pros**: Modern CSS approach, explicit layout control
**Cons**: Requires restructuring parent elements, may break Canvas layout
**Best for**: New implementations or complete redesigns

---

## Solution 4: Use Scroll Container Approach
**Location**: Create scrollable container within main

```css
#ncas-main.main-content {
  position: relative;
  height: 100vh;
  overflow: hidden; /* Prevent main from scrolling */
}

#ncas-main.main-content > #content-wrapper {
  height: calc(100vh - 150px); /* Account for header */
  overflow-y: auto;
  padding-top: 0; /* No top spacing needed */
}
```

**Pros**: Precise control over scroll area
**Cons**: More complex, requires specific HTML structure
**Best for**: When you need fine-grained scroll control

---

## Current Implementation

**Method 1 is implemented** in `ncas2.css` at line 99.

The server should automatically reload the file. Check the terminal output for:
```
[FILE CHANGED] ../projects/NCAS/NCAS1/ncas2.css
```

## Testing

After implementing any method:
1. Hard reload the Canvas page: Ctrl+Shift+R
2. Scroll the page
3. Verify main content no longer scrolls under header
4. Check that header remains visible

## Recommendation

**Method 1 (padding-top)** is recommended because:
- ✅ Minimal code change
- ✅ Maintains accessibility (static positioning)
- ✅ Works with existing flexbox layout
- ✅ Easy to adjust if header height changes
- ✅ No z-index conflicts
- ✅ Compatible with Canvas's existing structure

---

*Generated: 2024-12-29*
*Course: https://usucourses.instructure.com/courses/2803*

