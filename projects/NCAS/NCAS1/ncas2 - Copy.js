/**
 * NCADEMI Navigation JavaScript
 * v2: Custom layout enhancements
 * Context-aware: Only runs on course pages (URLs containing "courses")
 * Features: Auto-detects course ID, creates semantic structure with preserved functionality
 * 
 * VERSION NOTES:
 * - ncas1.js (v1) = Production file on Canvas/AWS
 * - ncas2.js (v2) = Local override file for development
 * - This file (ncas2.js) serves when intercepting Canvas requests
 */

(function () {
  "use strict";

  // Enhanced logging configuration
  const LOG_PREFIX = "🚀 NCADEMI Navigation v2"; // Updated version
  const DEBUG_MODE = true; // Set to false in production

  // Logging functions
  function log(message, data = null) {
    if (DEBUG_MODE) {
      console.log(`${LOG_PREFIX}: ${message}`, data || "");
    }
  }

  function logSuccess(message, data = null) {
    if (DEBUG_MODE) {
      console.log(`✅ ${LOG_PREFIX}: ${message}`, data || "");
    }
  }

  function logError(message, error = null) {
    if (DEBUG_MODE) {
      console.error(`❌ ${LOG_PREFIX}: ${message}`, error || "");
    }
  }

  // Get current course ID from URL
  function getCurrentCourseId() {
    const url = window.location.href;
    const courseMatch = url.match(/\/courses\/(\d+)/);
    return courseMatch ? courseMatch[1] : null;
  }

  // Check if we're on a course page
  function isCoursePage() {
    return window.location.href.includes("/courses/");
  }

  // V2: Check if we're on an accounts page (admin pages) or pages/home
  function isAccountsPage() {
    return window.location.href.includes("/accounts/") || 
           window.location.href.includes("/pages/home");
  }

  // V2: Add exclusion class to body for pages that should not have NCADEMI enhancements
  function addExclusionClass() {
    log(`Current URL: ${window.location.href}`);
    log(`isAccountsPage(): ${isAccountsPage()}`);
    if (isAccountsPage()) {
      document.body.classList.add("ncademi-excluded");
      log("Added ncademi-excluded class to body - NCADEMI enhancements disabled");
    } else {
      log("Not on accounts page or pages/home - NCADEMI enhancements will be applied");
    }
  }

  // Wait for DOM to be ready
  function waitForDOM(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
    } else {
      callback();
    }
  }

  // Get active state for navigation
  function getActiveState() {
    const currentCourseId = getCurrentCourseId();
    if (!currentCourseId) return null;

    const url = window.location.href;
    const path = window.location.pathname;

    // Check for specific page types
    if (path.includes("/assignments")) {
      return "assignments";
    } else if (path.includes("/pages")) {
      return "pages";
    } else if (path.includes("/modules")) {
      return "modules";
    } else if (path.includes("/grades")) {
      return "grades";
    } else if (path.includes("/external_tools")) {
      return "external_tools";
    } else if (
      path === `/courses/${currentCourseId}` ||
      path === `/courses/${currentCourseId}/`
    ) {
      return "home";
    }

    return null;
  }

  // Create navigation link
  function createNavLink(href, text, isActive = false) {
    const link = document.createElement("a");
    link.href = href;
    link.textContent = text;
    link.setAttribute("aria-label", text);

    if (isActive) {
      link.classList.add("active");
      link.setAttribute("aria-current", "page");
    }

    return link;
  }

  // V2: Function to aggressively hide the right-side column and expand main content
  function hideRightSideColumn() {
    log("Attempting to hide right-side column and expand main content");

    const selectorsToHide = [
      "#right-side-wrapper",
      ".ic-app-main-content__secondary",
      "div#right-side-wrapper.ic-app-main-content__secondary",
      "#right-side",
      "#application #right-side-wrapper",
      "body #right-side-wrapper",
    ];

    let hiddenCount = 0;
    selectorsToHide.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      elements.forEach((element) => {
        if (element && !element.classList.contains("ncademi-hidden")) {
          element.classList.add("ncademi-hidden");
          hiddenCount++;
          log(`Hidden element: ${selector}`, element);
        }
      });
    });

    logSuccess(
      `Right-side column hiding completed - ${hiddenCount} elements hidden`
    );
  }

  // V2: Function to ensure main content expands to full width
  function expandMainContentToFullWidth() {
    log("Attempting to expand main content to full width");

    const containers = [
      "#not_right_side",
      "#content-wrapper",
      "#main",
      ".ic-Layout-columns",
      ".dp-wrapper",
      ".dp-column-container",
    ];

    let expandedCount = 0;
    containers.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      elements.forEach((element) => {
        if (element && !element.classList.contains("ncademi-expanded")) {
          element.classList.add("ncademi-expanded");
          expandedCount++;
          log(`Expanded container: ${selector}`, element);
        }
      });
    });

    // Force rows to take full width
    const rows = document.querySelectorAll(".row.dp-col-3-eq");
    rows.forEach((row) => {
      if (!row.classList.contains("ncademi-row-expanded")) {
        row.classList.add("ncademi-row-expanded");
        log("Expanded row:", row);
      }
    });

    // Force columns to distribute evenly across full width
    const columns = document.querySelectorAll(".col-lg-4, .col-md-4, .col-12");
    columns.forEach((column) => {
      if (!column.classList.contains("ncademi-column-adjusted")) {
        column.classList.add("ncademi-column-adjusted");
        log("Adjusted column width:", column);
      }
    });

    logSuccess(
      `Main content expansion completed - ${expandedCount} containers expanded`
    );
  }


  // V2: Function to hide all sticky elements and prevent scrolling issues
  function hideStickyElements() {
    log("Hiding all sticky elements to prevent scrollbar issues");

    const stickySelectors = [
      ".sticky",
      ".sticky-toolbar",
      "[data-sticky]",
      ".header-bar",
      ".page-toolbar",
      ".sticky-header",
      ".fixed-header",
      ".ic-app-header",
      ".ic-app-header__main-navigation",
      ".ic-app-header__logomark-container",
    ];

    let hiddenCount = 0;
    stickySelectors.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      elements.forEach((element) => {
        if (element && !element.classList.contains("ncademi-sticky-hidden")) {
          element.classList.add("ncademi-sticky-hidden");
          hiddenCount++;
          log(`Hidden sticky element: ${selector}`, element);
        }
      });
    });

    logSuccess(
      `Sticky elements hiding completed - ${hiddenCount} elements hidden`
    );
  }

  // V2: Force correct flexbox layout on body and main
  function forceMainOverflow() {
    const body = document.body;
    const main = document.getElementById("ncas-main");
    
    if (body) {
      // Force flexbox layout on body
      body.style.setProperty("display", "flex", "important");
      body.style.setProperty("flex-direction", "column", "important");
      body.style.setProperty("height", "100vh", "important");
      body.style.setProperty("margin", "0", "important");
      body.style.setProperty("padding", "0", "important");
      log("Forced flexbox layout on body");
    }
    
    if (main) {
      // Force flex properties on main
      main.style.setProperty("flex", "1", "important");
      main.style.setProperty("overflow-y", "auto", "important");
      main.style.setProperty("margin-top", "0", "important");
      main.style.setProperty("min-height", "0", "important");
      log("Forced flex properties on #ncas-main");
    }
  }

  // Function to add CSS classes for proper page layout
  function ensureProperPageLayout() {
    log("Adding CSS classes for page layout");

    // Ensure body has proper layout
    document.body.classList.add("ncademi-body-layout");

    // Ensure main content area has proper flex properties
    const mainContent = document.getElementById("ncas-main");
    if (mainContent) {
      mainContent.classList.add("ncademi-main-layout");
    }

    // Ensure the Canvas main content area also has proper layout
    const canvasMain = document.getElementById("not_right_side");
    if (canvasMain) {
      canvasMain.classList.add("ncademi-canvas-main");
    }

    logSuccess("Page layout classes added");
  }

  // V2: Defensive flexbox enforcement after any DOM mutation
  function enforceMainOverflow() {
    const body = document.body;
    const main = document.getElementById("ncas-main");
    
    if (body) {
      const bodyComputed = window.getComputedStyle(body);
      if (bodyComputed.display !== "flex") {
        body.style.setProperty("display", "flex", "important");
        body.style.setProperty("flex-direction", "column", "important");
        body.style.setProperty("height", "100vh", "important");
        log("Enforced flexbox layout on body after mutation");
      }
    }
    
    if (main) {
      const mainComputed = window.getComputedStyle(main);
      if (mainComputed.flex !== "1" || mainComputed.overflowY !== "auto") {
        main.style.setProperty("flex", "1", "important");
        main.style.setProperty("overflow-y", "auto", "important");
        main.style.setProperty("margin-top", "0", "important");
        log("Enforced flex properties on #ncas-main after mutation");
      }
    }
  }

  // Create the two-element page structure (v1, now v2)
  function createPageStructure() {
    log("Creating two-element page structure (header, main)");

    const currentCourseId = getCurrentCourseId();
    if (!currentCourseId) {
      logError("Could not determine course ID");
      return;
    }

    // Create header element
    const header = document.createElement("header");
    header.id = "ncas-header";
    header.className = "ncademi-header";
    
    // V2: Force static positioning for flexbox layout
    header.style.setProperty("position", "static", "important");
    header.style.setProperty("flex-shrink", "0", "important");

    // Create h1 element with new text
    const h1 = document.createElement("h1");
    h1.textContent = "NCADEMI Core Accessibility Skills"; // V2: Course title
    header.appendChild(h1);

    // Create navigation element
    const nav = document.createElement("div");
    nav.id = "ncademi-nav";

    // Get active state
    const activeState = getActiveState();

    // Create navigation links
    const homeLink = createNavLink(
      `/courses/${currentCourseId}`,
      "Home",
      activeState === "home"
    );
    const assignmentsLink = createNavLink(
      `/courses/${currentCourseId}/assignments`,
      "Assignments",
      activeState === "assignments"
    );

    nav.appendChild(homeLink);
    nav.appendChild(assignmentsLink);
    header.appendChild(nav);

    // Create main element
    const main = document.createElement("main");
    main.id = "ncas-main";
    main.className = "main-content";
    
    // V2: Force flex properties for flexbox layout
    main.style.setProperty("flex", "1", "important");
    main.style.setProperty("overflow-y", "auto", "important");
    main.style.setProperty("margin-top", "0", "important");
    main.style.setProperty("min-height", "0", "important");

    // Find and move content-wrapper
    const contentWrapper = document.getElementById("content-wrapper");
    if (contentWrapper) {
      main.appendChild(contentWrapper);
      log("Moved content-wrapper to main element");
    } else {
      logError("content-wrapper not found");
    }

    // Insert the new structure into the page
    const body = document.body;

    // V2: Force flexbox layout on body first
    body.style.setProperty("display", "flex", "important");
    body.style.setProperty("flex-direction", "column", "important");
    body.style.setProperty("height", "100vh", "important");
    body.style.setProperty("margin", "0", "important");
    body.style.setProperty("padding", "0", "important");

    // Clear existing content and add new structure (header + main only)
    body.innerHTML = "";
    
    body.appendChild(header);
    body.appendChild(main);

    // Hide the original Canvas navigation and right-side column
    const leftSide = document.getElementById("left-side");
    if (leftSide) {
      leftSide.classList.add("ncademi-left-hidden");
      log("Hidden original Canvas left navigation");
    }

    hideRightSideColumn(); // Call the hiding function
    expandMainContentToFullWidth(); // V2: Call the expansion function
    hideStickyElements(); // V2: Call the sticky elements hiding function
    ensureProperPageLayout(); // V2: Call the layout function
    forceMainOverflow(); // V2: Force correct overflow immediately

    logSuccess("Two-element page structure created successfully (header + main)", {
      courseId: currentCourseId,
      headerCreated: !!header,
      mainCreated: !!main,
    });
  }

  // Handle responsive design (v1, now v2)
  function handleResponsive() {
    log("Setting up responsive design");

    // Add responsive event listener
    function handleResize() {
      const isMobile = window.innerWidth <= 768;
      const header = document.getElementById("ncas-header");
      const nav = document.getElementById("ncademi-nav");
      const mainContent = document.getElementById("ncas-main");

      if (header && nav) {
        // Remove existing responsive classes
        header.classList.remove("ncademi-mobile-header", "ncademi-desktop-header");
        nav.classList.remove("ncademi-mobile-nav", "ncademi-desktop-nav");
        document.body.classList.remove("ncademi-mobile-body", "ncademi-desktop-body");

        if (isMobile) {
          header.classList.add("ncademi-mobile-header");
          nav.classList.add("ncademi-mobile-nav");
          document.body.classList.add("ncademi-mobile-body");
        } else {
          header.classList.add("ncademi-desktop-header");
          nav.classList.add("ncademi-desktop-nav");
          document.body.classList.add("ncademi-desktop-body");
        }

        // CSS handles margin-top via responsive classes
      }
    }

    // Initial call
    handleResize();

    // Add event listener
    window.addEventListener("resize", handleResize);
    log("Responsive design setup complete");
  }

  // Add debugging helpers (v1, now v2)
  function addDebugHelpers() {
    window.ncademiDebug = {
      getPageStructure: () => {
        return {
          header: document.getElementById("ncas-header"),
          main: document.getElementById("ncas-main"),
          navigation: document.getElementById("ncademi-nav"),
          courseId: getCurrentCourseId(),
          timestamp: new Date().toISOString(),
        };
      },
      getCurrentCourseId: getCurrentCourseId,
      recreateStructure: () => {
        createPageStructure();
        handleResponsive();
        log("Page structure recreated");
      },
      hideRightSide: hideRightSideColumn,
      checkRightSideElements: () => {
        const selectors = [
          "#right-side-wrapper",
          ".ic-app-main-content__secondary",
          "div#right-side-wrapper.ic-app-main-content__secondary",
          "#right-side",
          "#application #right-side-wrapper",
          "body #right-side-wrapper",
        ];
        const results = {};
        selectors.forEach((selector) => {
          const element = document.querySelector(selector);
          results[selector] = {
            exists: !!element,
            hidden: element ? element.classList.contains("ncademi-hidden") : false,
            visible: element ? element.offsetWidth > 0 : false,
          };
        });
        log("Right-side element check results:", results);
        return results;
      },
      expandMainContent: expandMainContentToFullWidth,
      checkMainContentWidth: () => {
        const containers = [
          "#not_right_side",
          "#content-wrapper",
          "#main",
          ".dp-wrapper",
        ];
        const results = {};
        containers.forEach((selector) => {
          const element = document.querySelector(selector);
          results[selector] = {
            exists: !!element,
            expanded: element ? element.classList.contains("ncademi-expanded") : false,
            offsetWidth: element ? element.offsetWidth : 0,
          };
        });
        log("Main content width check results:", results);
        return results;
      },
      hideStickyElements: hideStickyElements,
      ensureLayout: ensureProperPageLayout,
      checkHeaderStatus: () => {
        const header = document.getElementById("ncas-header");
        const h1 = header ? header.querySelector("h1") : null;
        const nav = document.getElementById("ncademi-nav");

        return {
          headerExists: !!header,
          h1Text: h1 ? h1.textContent : "N/A",
          isMobile: header ? header.classList.contains("ncademi-mobile-header") : false,
          isDesktop: header ? header.classList.contains("ncademi-desktop-header") : false,
        };
      },
    };
    log("Debug helpers added to window.ncademiDebug");
  }

  // V2: Prevent multiple initializations
  if (window.ncademiInitialized) {
    log("NCADEMI navigation already initialized, skipping duplicate");
    return;
  }

  // Initialize the enhanced structure (v1, now v2)
  function init() {
    try {
      // V2: Mark as initialized to prevent duplicates
      if (window.ncademiInitialized) {
        log("NCADEMI navigation already initialized, skipping");
        return;
      }
      
      // V14: Add exclusion class for pages that should not have NCADEMI enhancements
      addExclusionClass();
      
      if (!isCoursePage() || isAccountsPage()) {
        console.log(
          "NCADEMI navigation: Not on a course page or on accounts page during init, skipping"
        );
        return;
      }

      createPageStructure();
      handleResponsive();
      addDebugHelpers();

      // V2: Mark as initialized
      window.ncademiInitialized = true;

      logSuccess("NCADEMI navigation v2 initialized successfully");
    } catch (error) {
      logError("Error in NCADEMI navigation v2:", error);
    }
  }

  // Start the initialization (v1, now v2 with multiple calls and observer)
  waitForDOM(() => {
    // V2: Check if already initialized
    if (window.ncademiInitialized) {
      log("NCADEMI navigation already initialized, skipping duplicate initialization");
      return;
    }
    
    // V2: Check for exclusion first, before any other initialization
    addExclusionClass();
    if (isAccountsPage()) {
      log("On accounts page or pages/home - skipping all NCADEMI enhancements");
      return;
    }
    
    init();

    // V2: Skip utility functions on accounts pages
    if (isAccountsPage()) {
      log("On accounts page, skipping utility functions");
      return;
    }

    // Additional right-side hiding with delays to catch dynamic content
    setTimeout(hideRightSideColumn, 100);
    setTimeout(hideRightSideColumn, 500);
    setTimeout(hideRightSideColumn, 1000);

    // Additional main content expansion with delays
    setTimeout(expandMainContentToFullWidth, 150);
    setTimeout(expandMainContentToFullWidth, 600);
    setTimeout(expandMainContentToFullWidth, 1100);

    // Additional sticky elements hiding with delays
    setTimeout(hideStickyElements, 120);
    setTimeout(hideStickyElements, 620);
    setTimeout(hideStickyElements, 1120);

    // V2: Enforce overflow after delays to catch late mutations
    setTimeout(forceMainOverflow, 200);
    setTimeout(forceMainOverflow, 700);
    setTimeout(forceMainOverflow, 1200);

    // Monitor for DOM changes and apply fixes
    const observer = new MutationObserver(function (mutations) {
      // V2: Skip mutation observer on accounts pages
      if (isAccountsPage()) {
        return;
      }

      let shouldCheck = false;
      mutations.forEach(function (mutation) {
        if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
          shouldCheck = true;
        }
      });

      if (shouldCheck) {
        setTimeout(hideRightSideColumn, 50);
        setTimeout(expandMainContentToFullWidth, 100);
        setTimeout(hideStickyElements, 120); // V2: Also hide sticky elements on DOM changes
        setTimeout(enforceMainOverflow, 150); // V2: Enforce overflow after mutations
        // Removed ensureProperPageLayout to prevent scrolling issues
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });


    log("DOM mutation observer started for comprehensive monitoring");
  });

  // ============================================
  // CUSTOM LAYOUT SUPPORT
  // ============================================

  /**
   * Initialize custom layout enhancements
   * Adds keyboard navigation and accessibility features
   */
  function initCustomLayout() {
    log("Initializing custom layout enhancements");
    
    // Add keyboard navigation support
    const customLinks = document.querySelectorAll('.custom-link');
    customLinks.forEach((link, index) => {
      // Add tabindex for better keyboard navigation
      if (!link.hasAttribute('tabindex')) {
        link.setAttribute('tabindex', '0');
      }
      
      // Add ARIA labels for better accessibility
      const title = link.getAttribute('title');
      if (title && !link.getAttribute('aria-label')) {
        link.setAttribute('aria-label', `Navigate to ${title} course module`);
      }
      
      // Add keyboard event listeners
      link.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.click();
        }
      });
      
      // Focus styles handled by CSS classes
    });
    
    log(`Enhanced ${customLinks.length} custom links with accessibility features`);
  }

  /**
   * Check if current page uses custom layout
   */
  function isCustomLayout() {
    return document.querySelector('.custom-container') !== null;
  }

  /**
   * Enhanced initialization that supports both layouts
   */
  function enhancedInit() {
    // Check if we're on an accounts page first
    addExclusionClass();
    if (isAccountsPage()) {
      log("On accounts page or pages/home - skipping all NCADEMI enhancements");
      return;
    }

    // Initialize based on layout type
    if (isCustomLayout()) {
      log("Detected custom layout - initializing custom layout support");
      initCustomLayout();
    } else {
      log("Detected standard layout - initializing standard NCADEMI navigation");
      init();
    }

    // Common functionality for both layouts
    handleResponsive();
    addDebugHelpers();
  }

  // Override the original init function
  window.ncademiInit = enhancedInit;

  log("Custom layout support loaded successfully");
})();