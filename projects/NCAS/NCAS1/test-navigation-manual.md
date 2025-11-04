# Manual E2E Navigation Tests

## Test Checklist for Visual Shift Prevention

### Prerequisites
- Open browser DevTools (F12)
- Enable Console and Elements tabs
- Navigate to a Canvas course page

---

## Test 1: Header Structure Validation

**Steps:**
1. Open browser console
2. Run: `document.querySelector('#content-header.course-content-header')`
3. Check structure manually or run test-navigation-e2e.html

**Expected Results:**
- ✅ Header exists as `#content-header.course-content-header`
- ✅ Header contains `.ncademi-header-wrapper`
- ✅ Wrapper contains `.ncademi-header-title` and `#ncademi-nav`
- ✅ Header is `document.body.firstChild`

---

## Test 2: Navigation Between Core Skills and Start Here

**Steps:**
1. Start on Core Skills page
2. Click "Start Here" link
3. Observe header during navigation
4. Click "Core Skills" link
5. Observe header during navigation

**Expected Results:**
- ✅ **NO VISUAL SHIFT** - Header stays visible throughout
- ✅ Active state updates smoothly
- ✅ Header remains in same position
- ✅ No flickering or jumping

**Console Check:**
```javascript
// Before navigation
const header = document.querySelector('#content-header');
const rect1 = header.getBoundingClientRect();
console.log('Before:', rect1.top, rect1.left);

// After navigation (check console logs)
// Should see: "Header exists in correct position, updating active states"
// Should see: "Updated existing header without removal"

// After navigation
const rect2 = header.getBoundingClientRect();
console.log('After:', rect2.top, rect2.left);
console.log('Shift?', rect1.top !== rect2.top || rect1.left !== rect2.left);
// Should be: false (no shift)
```

---

## Test 3: Navigation to Progress Page

**Steps:**
1. Start on any page (Core Skills or Start Here)
2. Click "Progress" link
3. Observe header AND page content during navigation
4. Wait for page to fully load

**Expected Results:**
- ✅ **NO VISUAL SHIFT** - Header stays visible
- ✅ Page content loads without jumping
- ✅ h1.page-title appears without causing shift
- ✅ Active state updates to Progress link

**Console Check:**
```javascript
// Monitor for these log messages:
// "Canvas navigation detected, updating header and page logic"
// "Header exists in correct position, updating active states"
// "Updated existing header without removal"
// "Page title 'Progress' injected"

// Check page title exists and is positioned correctly
const pageTitle = document.querySelector('h1.page-title');
console.log('Page title:', pageTitle?.textContent);
console.log('Next sibling:', pageTitle?.nextElementSibling?.id);
// Should be: "grades_summary"
```

---

## Test 4: Navigation from Progress to Other Pages

**Steps:**
1. Start on Progress page
2. Click "Core Skills" or "Start Here"
3. Observe header during navigation

**Expected Results:**
- ✅ **NO VISUAL SHIFT** - Header stays visible
- ✅ Active state updates smoothly
- ✅ Page title removed/hidden without shift

**Console Check:**
```javascript
// Check that page title is removed when leaving Progress
// (Should not exist on non-Progress pages)
const pageTitle = document.querySelector('h1.page-title');
console.log('Page title on non-Progress page:', pageTitle);
// Should be: null
```

---

## Test 5: Navigation to Feedback Page

**Steps:**
1. Start on any page
2. Click "Feedback" link
3. Observe header during navigation

**Expected Results:**
- ✅ **NO VISUAL SHIFT** - Header stays visible
- ✅ Active state updates to Feedback link
- ✅ Page loads smoothly

---

## Test 6: Rapid Navigation (Stress Test)

**Steps:**
1. Rapidly click between different nav links
2. Click: Core Skills → Progress → Start Here → Feedback → Core Skills
3. Observe header behavior

**Expected Results:**
- ✅ Header remains stable throughout
- ✅ Active states update correctly
- ✅ No visual shifts or flickering
- ✅ No console errors

---

## Test 7: Responsive Behavior

**Steps:**
1. Resize browser window to < 850px width
2. Navigate between pages
3. Observe header stacking behavior

**Expected Results:**
- ✅ Header stacks vertically
- ✅ All elements full width
- ✅ Active state extends full width
- ✅ No visual shifts during navigation

**Console Check:**
```javascript
// Check responsive classes
const header = document.querySelector('#content-header');
const isMobile = window.innerWidth <= 850;
console.log('Viewport:', window.innerWidth);
console.log('Is mobile:', isMobile);
console.log('Has mobile class:', header.classList.contains('ncademi-mobile-header'));
console.log('Has desktop class:', header.classList.contains('ncademi-desktop-header'));
```

---

## Test 8: AJAX Navigation Monitoring

**Steps:**
1. Open console
2. Add navigation listener monitor (see code below)
3. Navigate between pages
4. Observe console output

**Code to paste in console:**
```javascript
// Monitor navigation events
(function() {
  let navEvents = [];
  const originalNavigate = window.Backbone?.history?.navigate;
  
  if (originalNavigate && !originalNavigate._ncademiWrapped) {
    window.Backbone.history.navigate = function(...args) {
      const path = args[0];
      const options = args[1] || {};
      navEvents.push({
        path,
        timestamp: Date.now(),
        trigger: options.trigger || false
      });
      console.log('Navigation event:', path, options);
      return originalNavigate.apply(this, args);
    };
    console.log('✅ Navigation monitoring enabled');
  } else {
    console.log('Navigation already wrapped or Backbone not available');
  }
  
  // Expose events for inspection
  window._navEvents = navEvents;
})();

// After navigating, check events
console.log('Navigation events:', window._navEvents);
```

**Expected Results:**
- ✅ Navigation events logged
- ✅ Header updates happen after navigation
- ✅ No duplicate updates
- ✅ Events fire in correct order

---

## Test 9: Header Update Without Removal

**Steps:**
1. Open Elements tab in DevTools
2. Select `#content-header` element
3. Navigate to different page
4. Watch the Elements tab - header should NOT be removed/recreated

**Expected Results:**
- ✅ Header element remains in DOM (not removed)
- ✅ Only active classes change
- ✅ No DOM manipulation that causes reflow

**Visual Check:**
- Header should stay highlighted in Elements tab
- Only child elements (nav links) should update
- No flash of header disappearing/reappearing

---

## Test 10: Page-Specific Logic Execution

**Steps:**
1. Navigate to Progress page
2. Check console for page-specific logic execution

**Console Check:**
```javascript
// Check if page-specific elements are present
const activeKey = window.location.pathname.includes('/grades') ? 'progress' : 'other';
console.log('Current page key:', activeKey);

if (activeKey === 'progress') {
  const pageTitle = document.querySelector('h1.page-title');
  const gradesTable = document.querySelector('table#grades_summary');
  const canvasHeading = document.querySelector('.ic-Action-header__Heading');
  
  console.log('Progress page elements:', {
    pageTitle: !!pageTitle,
    gradesTable: !!gradesTable,
    canvasHeadingHidden: canvasHeading ? window.getComputedStyle(canvasHeading).display === 'none' : 'N/A'
  });
}
```

**Expected Results:**
- ✅ Page title injected on Progress page
- ✅ Canvas heading hidden
- ✅ Grades table enhancements applied
- ✅ All happen without visual shift

---

## Success Criteria

All tests should pass with:
- ✅ **ZERO visual shifts** during navigation
- ✅ Header remains visible at all times
- ✅ Active states update correctly
- ✅ No console errors
- ✅ Smooth user experience

---

## Common Issues to Watch For

1. **Header disappears/reappears** → Header being removed/recreated
2. **Page jumps up/down** → Content-wrapper or body padding changing
3. **Active state flashes** → Classes being removed before new ones added
4. **Nav links shift** → Wrapper structure changing
5. **Progress page content shifts** → Page title or Canvas heading causing layout change

---

## Debugging Tips

If visual shift occurs:

1. **Check console logs** - Look for:
   - "Creating header element structure" (should NOT appear during navigation)
   - "Header exists in correct position, updating active states" (should appear)
   - "Updated existing header without removal" (should appear)

2. **Monitor DOM changes**:
   ```javascript
   // Watch for header removal
   const observer = new MutationObserver((mutations) => {
     mutations.forEach((mutation) => {
       if (mutation.removedNodes.length > 0) {
         mutation.removedNodes.forEach((node) => {
           if (node.id === 'content-header') {
             console.error('❌ Header was removed!');
           }
         });
       }
     });
   });
   observer.observe(document.body, { childList: true });
   ```

3. **Check timing**:
   ```javascript
   // Time navigation events
   console.time('navigation');
   // Navigate...
   // Should see timing in console logs
   ```

4. **Inspect CSS**:
   - Check if `contain: layout style` is applied to header
   - Check if `min-height` is set
   - Check if `margin: 0` is applied

