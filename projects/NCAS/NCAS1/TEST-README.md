# NCAS Navigation E2E Test Suite

This directory contains comprehensive tests to validate the end-to-end navigation process and ensure visual shift prevention.

## Test Files

1. **`test-navigation-e2e.html`** - Interactive HTML test page with UI
2. **`test-navigation-e2e.js`** - Programmatic test suite for browser console
3. **`test-navigation-manual.md`** - Manual testing checklist and procedures

## Quick Start

### Option 1: Interactive HTML Tests

1. Open `test-navigation-e2e.html` in a browser
2. Click "Run All Tests" button
3. Review test results

**Note:** These tests check DOM structure and CSS properties but require Canvas environment for full functionality.

### Option 2: Browser Console Tests (Recommended)

1. Navigate to a Canvas course page
2. Open browser DevTools (F12)
3. Go to Console tab
4. Copy and paste the entire contents of `test-navigation-e2e.js`
5. Run: `NCASNavigationTests.runAll()`

**Example:**
```javascript
// After pasting test-navigation-e2e.js into console:
NCASNavigationTests.runAll()

// Or run individual tests:
NCASNavigationTests.testHeaderStructure()
NCASNavigationTests.testVisualShiftPrevention()
NCASNavigationTests.testNavigationFlow()
```

### Option 3: Manual Testing

Follow the step-by-step checklist in `test-navigation-manual.md`.

## Test Coverage

### ✅ Header Structure Tests
- Header element existence and position
- Wrapper structure (`.ncademi-header-wrapper`)
- Title and navigation elements
- Correct DOM hierarchy

### ✅ Navigation Tests
- All links present (Start Here, Core Skills, Progress, Feedback)
- Active state management
- Link text correctness

### ✅ Visual Shift Prevention Tests
- CSS `min-height` set on header
- CSS `contain` property for layout stability
- Header margin set to 0
- Wrapper min-height set

### ✅ Header Persistence Tests
- Header remains in DOM during navigation
- Update logic vs. recreation logic
- Correct position for updates

### ✅ Page-Specific Tests
- Progress page title injection
- Canvas heading hiding
- Grades table enhancements

### ✅ Navigation Listener Tests
- Backbone navigation wrapping
- Listener flag verification

### ✅ Responsive Tests
- Mobile/desktop class application
- Breakpoint handling (850px)

## Monitoring Visual Shifts

### Real-time Monitoring

To monitor for visual shifts during navigation:

```javascript
// Start monitoring
NCASNavigationTests.monitor()

// Navigate between pages
// Watch console for shift alerts

// Stop monitoring
window._navMonitor.disconnect()
```

### Manual Position Check

```javascript
// Before navigation
const header = document.querySelector('#content-header');
const before = header.getBoundingClientRect();
console.log('Before:', before.top, before.left);

// After navigation (navigate to another page)
const after = header.getBoundingClientRect();
console.log('After:', after.top, after.left);
console.log('Shift?', before.top !== after.top || before.left !== after.left);
// Should be: false (no shift)
```

## Test Results Interpretation

### ✅ PASS
- Test condition met
- Expected behavior confirmed

### ❌ FAIL
- Test condition not met
- Review error message for details
- Check console for additional context

### ℹ️ INFO
- Informational message
- Not a pass/fail indicator

## Common Issues and Solutions

### Issue: Header Not Found
**Solution:** Ensure you're on a Canvas course page with `ncas10.js` loaded.

### Issue: Navigation Listener Not Wrapped
**Solution:** Check that `ncas10.js` has executed and `window.ncademiNavigationListenerSet === true`.

### Issue: Visual Shift Detected
**Solution:** 
1. Check console for "Header exists in correct position" message
2. Verify `updateExistingHeader()` is being called, not `createHeader()`
3. Check CSS properties: `min-height`, `contain`, `margin: 0`

### Issue: Active State Not Updating
**Solution:**
1. Verify navigation listener is active
2. Check that `updateExistingHeader()` is updating active classes
3. Review console logs for navigation events

## Integration with CI/CD

To integrate these tests into automated testing:

```javascript
// In your test runner:
const result = NCASNavigationTests.runAll();
if (result.failed > 0) {
  throw new Error('Navigation tests failed');
}
```

## Test Scenarios

### Scenario 1: Initial Page Load
- ✅ Header injected correctly
- ✅ Active state matches current page
- ✅ No visual shift on load

### Scenario 2: Navigation Between Core Skills and Start Here
- ✅ Header persists (no removal)
- ✅ Active state updates
- ✅ No visual shift

### Scenario 3: Navigation to Progress Page
- ✅ Header persists
- ✅ Page title injected
- ✅ Active state updates
- ✅ No visual shift

### Scenario 4: Navigation from Progress to Other Pages
- ✅ Header persists
- ✅ Page title removed/hidden
- ✅ Active state updates
- ✅ No visual shift

### Scenario 5: Rapid Navigation (Stress Test)
- ✅ Header remains stable
- ✅ All active states update correctly
- ✅ No errors or flickering

### Scenario 6: Responsive Navigation
- ✅ Header stacks correctly on mobile
- ✅ Active state extends full width
- ✅ No visual shifts during navigation

## Debugging Tips

1. **Enable Console Logging:**
   ```javascript
   // In ncas10.js, ensure logging is enabled
   const DEBUG = true;
   ```

2. **Monitor DOM Changes:**
   ```javascript
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

3. **Check Function Calls:**
   ```javascript
   // Override functions to log calls
   const originalUpdate = updateExistingHeader;
   updateExistingHeader = function(...args) {
     console.log('updateExistingHeader called');
     return originalUpdate.apply(this, args);
   };
   ```

## Success Criteria

All tests should pass with:
- ✅ **ZERO visual shifts** during navigation
- ✅ Header remains visible at all times
- ✅ Active states update correctly
- ✅ No console errors
- ✅ Smooth user experience across all navigation scenarios

## Reporting Issues

If tests fail or visual shifts are detected:

1. Run full test suite: `NCASNavigationTests.runAll()`
2. Capture console output
3. Note the failing test(s)
4. Check browser console for error messages
5. Verify `ncas10.js` and `ncas10.css` are loaded correctly
6. Document the navigation path that causes the issue

## Maintenance

- Update tests when navigation structure changes
- Add new tests for new features
- Review test coverage periodically
- Update manual test checklist as needed

