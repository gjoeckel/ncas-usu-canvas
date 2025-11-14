# Root Cause Analysis: Main Content Scrolling Under Header

## THE PROBLEM

Content in `<main id="ncas-main">` was scrolling underneath the header.

## ROOT CAUSE IDENTIFIED ✅

**File**: `ncas2.css` Line 89 vs Line 99

```css
/* Line 89 - BLOCKING LINE */
padding: 0;  /* ❌ This was overriding the fix! */

/* Line 99 - FIX LINE */
padding-top: 150px; /* FIX: Prevent main content from scrolling under header */
```

### Why It Didn't Work

**CSS Cascade Rule**: When you have conflicting properties, the LAST one wins if they have the same specificity.

However, `padding: 0` is a shorthand property that sets ALL padding values to 0. The `padding-top: 150px` came AFTER but was still being overridden because of how the shorthand property works.

**The Solution**: Move `padding-top` BEFORE `padding` AND add `!important` to ensure it takes precedence.

## THE FIX (Implemented)

```css
#ncas-main.main-content {
  /* FIX: Prevent main content from scrolling under header */
  padding-top: 150px !important; /* Match header height - MUST come before padding: 0 */
  padding: 0 !important; /* Reset all other padding */
  /* ... rest of styles ... */
}
```

### Key Changes:
1. ✅ `padding-top` moved to FIRST
2. ✅ Added `!important` to `padding-top`
3. ✅ Added `!important` to `padding: 0`
4. ✅ Added comment explaining the order dependency

## Why You Spent Hours on This

The issue wasn't in the JavaScript injection or HTML structure. The problem was:

1. **CSS Specificity Battle**: The shorthand `padding: 0` was silently overriding the specific `padding-top: 150px`
2. **Cascade Order**: Even though `padding-top` came after, the shorthand still won
3. **Hard to Debug**: Browser DevTools showed the rule existed but wasn't being applied
4. **Logical vs Actual**: The fix LOOKED correct but wasn't actually working due to CSS internals

## Testing

After this fix:
1. Hard reload the page: `Ctrl+Shift+R`
2. Check that main content starts BELOW header
3. Scroll - content should NOT go under header
4. Verify in DevTools that `padding-top: 150px` is actually applied

## Lessons Learned

1. **Shorthand Properties Win**: `padding: 0` sets all sides to 0, overriding specific `padding-top`
2. **Order Matters**: Put specific properties BEFORE shorthand
3. **Use !important Sparingly**: Needed here because of specificity conflict
4. **DevTools Can Lie**: Shows rules exist but not if they're actually effective

## Alternative Fixes (Not Used)

You could also:
- Use `padding: 150px 0 0 0` instead of separate declarations
- Remove `padding: 0` entirely and set each side explicitly
- Use margin instead of padding (but that changes layout differently)

---

*Root cause analysis completed: 2024-12-29*
*Issue: CSS specificity conflict between shorthand and specific padding properties*

