# NCADEMI Website - Rendered HTML Content

## Navigation Structure Analysis

Based on the captured HTML from https://ncademi.org/, here's the navigation structure:

```html
<nav class="main-nav">
  <ul>
    <li id="menu-item-158" class="menu-item menu-item-type-post_type menu-item-object-page current-menu-item page_item page-item-10 current_page_item menu-item-158">
      <a href="https://ncademi.org/about/" aria-current="page">About</a>
    </li>
    <li id="menu-item-156" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-156">
      <a href="https://ncademi.org/events/">Events</a>
    </li>
    <li id="menu-item-157" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-157">
      <a href="https://ncademi.org/resources/">Resources</a>
    </li>
    <li id="menu-item-923" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-923">
      <a href="https://ncademi.org/blog/">Blog</a>
    </li>
    <li id="menu-item-208" class="contact-item menu-item menu-item-type-post_type menu-item-object-page menu-item-208">
      <a href="https://ncademi.org/contact/">Contact Us</a>
    </li>
  </ul>
</nav>
```

## Key Observations for Focus-Visible Fix

1. **Navigation Structure**: The navigation uses a simple `<nav class="main-nav">` with `<ul>` and `<li>` elements
2. **Link Classes**: Links have standard WordPress menu classes but no specific focus-visible classes
3. **Current Page**: The "About" link has `current-menu-item` and `aria-current="page"` attributes
4. **Contact Item**: The "Contact Us" link has an additional `contact-item` class

## Focus-Visible Issues Identified

From the screenshot analysis, the problems are:

1. **Vertical Shift**: The focus-visible element is causing the link text to shift down
2. **Too Large**: The focus outline has too much padding around the text
3. **Layout Disruption**: The focus element is affecting the overall navigation layout

## Recommended CSS Fix

The current focus-visible styles need to be adjusted to:

1. **Prevent vertical shift** by using `position: relative` and `top: 0`
2. **Reduce padding** to minimal values (1-2px)
3. **Use `outline` instead of `border`** to avoid layout shifts
4. **Ensure consistent positioning** across all navigation states

## Full HTML Content

```html
<!DOCTYPE html>
<html>
<head>
  <title>About - National Center on Accessible Digital Educational Materials & Instruction</title>
</head>
<body>
  <header class="site-header header-home">
    <div class="top-bar">
      <div class="logo-container">
        <a href="/">
          <img width="400" height="243" src="https://ncademi.org/wp-content/uploads/2025/07/ncademi-logo.webp" class="attachment-full size-full" alt="NCADEMI: National Center on Accessible Digital Educational Materials & Instruction" decoding="async" fetchpriority="high" srcset="https://ncademi.org/wp-content/uploads/2025/07/ncademi-logo.webp 400w, https://ncademi.org/wp-content/uploads/2025/07/ncademi-logo-300x182.webp 300w" sizes="(max-width: 400px) 100vw, 400px">
        </a>
      </div>
      <div class="search-bar">
        <form action="https://ncademi.org/" method="get">
          <label for="site-search" class="sr-only">Search the site</label>
          <input type="search" id="site-search" name="s" placeholder="Search">
          <button type="submit" aria-label="Submit search">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M10 2a8 8 0 016.32 12.9l4.39 4.38a1 1 0 01-1.41 1.42l-4.38-4.39A8 8 0 1110 2zm0 2a6 6 0 100 12 6 6 0 000-12z"></path>
            </svg>
          </button>
        </form>
      </div>
    </div>

    <div class="nav-bar-wrapper">
      <nav class="main-nav">
        <ul>
          <li id="menu-item-158" class="menu-item menu-item-type-post_type menu-item-object-page current-menu-item page_item page-item-10 current_page_item menu-item-158">
            <a href="https://ncademi.org/about/" aria-current="page">About</a>
          </li>
          <li id="menu-item-156" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-156">
            <a href="https://ncademi.org/events/">Events</a>
          </li>
          <li id="menu-item-157" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-157">
            <a href="https://ncademi.org/resources/">Resources</a>
          </li>
          <li id="menu-item-923" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-923">
            <a href="https://ncademi.org/blog/">Blog</a>
          </li>
          <li id="menu-item-208" class="contact-item menu-item menu-item-type-post_type menu-item-object-page menu-item-208">
            <a href="https://ncademi.org/contact/">Contact Us</a>
          </li>
        </ul>
      </nav>
    </div>
  </header>

  <main id="main" class="site-main">
    <h1>About the National Center on Accessible Digital Educational Materials & Instruction</h1>
    <!-- Main content continues... -->
  </main>

  <footer class="site-footer">
    <!-- Footer content... -->
  </footer>
</body>
</html>
```

## CSS Analysis Needed

The focus-visible styles need to be updated to match the actual NCADEMI website structure. The current styles in ncas1.css are targeting `.ncademi-header #ncademi-nav a` but the actual site uses `.main-nav a`.

## Next Steps

1. Update the CSS selectors to match the actual NCADEMI structure
2. Fix the vertical shift issue by using `outline` instead of `border`
3. Reduce padding to minimal values (1-2px)
4. Ensure consistent positioning across all states
