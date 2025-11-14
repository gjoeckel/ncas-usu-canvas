# Methods to Constrain Page Content to 1200px Max-Width

## Method 1: Constrain at #wrapper level with margin auto (Centered)
**Best for:** Centering the entire layout container

```css
div#wrapper.ic-Layout-wrapper {
  max-width: 1200px !important;
  margin-left: auto !important;
  margin-right: auto !important;
}
```

**Pros:** Simple, centers entire layout
**Cons:** May affect sidebar positioning if #left-side is positioned relative to wrapper

---

## Method 2: Constrain at #content-wrapper level (Content area only)
**Best for:** Constraining only the main content while keeping sidebars full-width

```css
#content-wrapper.ic-Layout-contentWrapper {
  max-width: 1200px !important;
  margin-left: auto !important;
  margin-right: auto !important;
}
```

**Pros:** Only constrains content area, sidebars remain full-width
**Cons:** May need to adjust padding calculations

---

## Method 3: Constrain at #content level (Deepest content container)
**Best for:** Constraining the actual page content while preserving Canvas layout structure

```css
div#content.ic-Layout-contentMain {
  max-width: 1200px !important;
  margin-left: auto !important;
  margin-right: auto !important;
}
```

**Pros:** Most precise control over actual content width
**Cons:** Needs to account for existing padding (36px top padding currently)

---

## Method 4: Constrain at multiple nested levels (Most robust)
**Best for:** Ensuring constraint works across all layout scenarios

```css
/* Constrain wrapper */
div#wrapper.ic-Layout-wrapper {
  max-width: 1200px !important;
  margin-left: auto !important;
  margin-right: auto !important;
}

/* Ensure child elements respect parent constraint */
div#main.ic-Layout-columns {
  max-width: 100% !important; /* Change from 100vw to 100% */
}

#not_right_side.ic-app-main-content {
  max-width: 100% !important; /* Change from 100vw to 100% */
}

#content-wrapper.ic-Layout-contentWrapper {
  max-width: 100% !important; /* Already 100%, but ensure it's respected */
}
```

**Pros:** Most robust, handles all nested elements
**Cons:** More CSS rules to maintain

---

## Recommended Approach

**Method 4** is recommended because:
1. It ensures the constraint works at all layout levels
2. It changes `max-width: 100vw` to `max-width: 100%` on child elements so they respect the parent's 1200px constraint
3. It centers the content with `margin: auto`
4. It's the most reliable across different page types and Canvas layouts

