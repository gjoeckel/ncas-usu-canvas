# JavaScript Inline CSS Analysis

## Summary
This document lists all JavaScript code that adds inline CSS styles and determines if each can be moved to CSS files.

---

## 1. Status Column Styles (Grades Page)
**Location:** `populateStatusColumn()` function (lines 859-888)

**Code:**
```javascript
let statusStyle = 'font-size: 1.25rem !important;';
if (Y === '-') {
  statusStyle += ' color: #666666 !important; font-style: italic !important;';
} else if (scoreY < X) {
  statusStyle += ' color: #955823 !important; font-weight: bold !important;';
} else {
  statusStyle += ' color: #38993D !important; font-weight: bold !important;';
}
statusCell.setAttribute('style', statusStyle);
```

**Can be moved to CSS?** ✅ **YES**
- Status cells already have `data-status` attribute (`pending`, `active`, `done`)
- Status cells already have `ncademi-status` class
- All styles can be moved to CSS using attribute selectors:
  ```css
  td.status.ncademi-status {
    font-size: 1.25rem !important;
  }
  td.status.ncademi-status[data-status="pending"] {
    color: #666666 !important;
    font-style: italic !important;
  }
  td.status.ncademi-status[data-status="active"] {
    color: #955823 !important;
    font-weight: bold !important;
  }
  td.status.ncademi-status[data-status="done"] {
    color: #38993D !important;
    font-weight: bold !important;
  }
  ```

---

## 2. Body Display Toggle (Redirect Handling)
**Location:** Multiple locations (lines 950-951, 962, 1151)

**Code:**
```javascript
// Line 950-951
if (document.body && document.body.style.display === 'none') {
  document.body.style.display = '';
}

// Line 962
document.body.style.display = '';

// Line 1151
document.body.style.display = 'none';
```

**Can be moved to CSS?** ❌ **NO**
- This is dynamic state management (hiding body before redirect, showing after)
- Needs to be set programmatically based on redirect logic
- CSS cannot conditionally hide/show body based on redirect state

---

## 3. Redirect Overlay Styles
**Location:** `handleRedirectFromHome()` function (lines 968-990)

**Code:**
```javascript
overlay.style.cssText = `
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ffffff;
  z-index: 999999;
  opacity: 1;
  transition: opacity 400ms ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

loadingText.style.cssText = `
  font-size: 2rem;
  text-align: center;
`;

// Later (line 1001)
overlay.style.opacity = '0';
```

**Can be moved to CSS?** ⚠️ **PARTIALLY**
- Static styles (position, size, background, etc.) can be moved to CSS
- Dynamic `opacity` change needs to remain in JS (fade-out animation)
- Overlay has unique ID: `#ncademi-redirect-overlay`
- Loading text can have a class added

**Recommendation:**
- Move static overlay styles to CSS
- Keep `opacity` manipulation in JS for fade-out
- Add class to loading text for CSS styling

---

## 4. Container Width Enforcement
**Location:** `enforceContainerWidths()` function (lines 1187, 1196, 1200, 1209, 1217, 1224)

**Code:**
```javascript
el.style.width = '100%';
el.style.maxWidth = '100vw';  // or '100%'
el.style.paddingRight = '0';
el.style.marginLeft = '0';
el.style.marginRight = '0';
```

**Can be moved to CSS?** ⚠️ **PARTIALLY**
- CSS can set these values, but the function is **reactive** - it checks computed styles and only applies if they differ
- Purpose: Prevent Canvas from dynamically changing these values
- The function uses `MutationObserver` to continuously enforce these values

**Recommendation:**
- CSS already has rules for these (lines 432-495 in ncas12.css)
- The JS is **defensive** - it ensures Canvas doesn't override CSS values
- Keep JS for enforcement, but CSS should have the base rules (which it does)

---

## 5. Hide H1 Heading (Grades Page)
**Location:** `hideH1Title()` function (line 1383)

**Code:**
```javascript
h1Heading.style.display = 'none';
```

**Can be moved to CSS?** ✅ **YES**
- Target selector: `.ic-Action-header__Heading, h1.ic-Action-header__Heading`
- Can be handled with CSS: `display: none !important;`
- Already has CSS rule at line 1591 in ncas12.css for grades page

**Note:** Current CSS already handles this, but JS is used for immediate application before CSS loads.

---

## Summary Table

| # | Location | Purpose | Can Move to CSS? | Notes |
|---|----------|---------|------------------|-------|
| 1 | Lines 859-888 | Status column text styles | ✅ YES | Already has data-status attributes |
| 2 | Lines 950-951, 962, 1151 | Body display toggle | ❌ NO | Dynamic state management |
| 3 | Lines 968-990, 1001 | Redirect overlay styles | ⚠️ PARTIAL | Static styles yes, opacity animation no |
| 4 | Lines 1187-1224 | Container width enforcement | ⚠️ PARTIAL | Reactive enforcement needed |
| 5 | Line 1383 | Hide H1 heading | ✅ YES | CSS can handle, JS for immediate application |

---

## Recommendations

### High Priority (Easy to Move)
1. **Status Column Styles** - Move to CSS using existing `data-status` attributes
2. **H1 Heading Hide** - Already in CSS, but JS ensures immediate application

### Medium Priority (Partial)
3. **Redirect Overlay** - Move static styles to CSS, keep opacity animation in JS
4. **Container Width Enforcement** - Keep JS for reactive enforcement, CSS already has base rules

### Low Priority (Keep in JS)
5. **Body Display Toggle** - Must remain in JS for redirect state management

