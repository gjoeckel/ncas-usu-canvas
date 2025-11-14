# CRITICAL FIX: Universal Position Static Rule

## THE REAL PROBLEM

Found on line 706 of `ncas2.css`:

```css
/* V1: Ensure no elements stick to top */
* {
  position: static !important;
}
```

### Why This Breaks Everything

This universal selector forces **EVERY ELEMENT** to `position: static !important`, including:
- ❌ The header (`#ncas-header`)
- ❌ The main element (`#ncas-main`)
- ❌ All flexbox children
- ❌ Everything!

### What Was Happening

1. **JS creates header** with `position: static` (line 324 in ncas2.js)
2. **CSS tries to keep it static** with comment "WCAG: No fixed positioning for better accessibility" (line 42 in ncas2.css)
3. **Universal selector** forces it to static anyway (line 706)
4. **Main element** can't scroll because everything is forced to static
5. **Flexbox breaks** because children can't properly lay out

### The Fix Applied

**REMOVED** the universal selector entirely because:
- ✅ Flexbox needs elements to flow normally
- ✅ Static positioning breaks flex layouts
- ✅ The specific sticky element hiding is sufficient
- ✅ No need for nuclear option

**CHANGED** header from `position: fixed` to `position: static` to match JS and CSS intent.

## Testing

After this fix:
1. Hard reload: `Ctrl+Shift+R`
2. Page should scroll properly
3. Header stays at top
4. Main content scrolls below header
5. No content goes under header

## Why Previous Fixes Didn't Work

- `padding-top: 150px` was correct but CSS was broken by universal rule
- The universal selector was overriding everything
- Flexbox couldn't work properly with forced static positioning

---

*Critical fix completed: 2024-12-29*
*Root cause: Universal `* { position: static !important; }` selector*

