/**
 * NCADEMI Navigation JavaScript
 * Version 14: Footer no visible border, content width match main, public-license moved
 * Context-aware: Only runs on course pages (URLs containing "courses")
 * Features: Auto-detects course ID, creates semantic structure with preserved functionality
 */

(function () {
  "use strict";

  // Enhanced logging configuration
  const LOG_PREFIX = "🚀 NCADEMI Navigation v14"; // Updated version
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

  // V14: Check if we're on an accounts page (admin pages) or pages/home
  function isAccountsPage() {
    return window.location.href.includes("/accounts/") || 
           window.location.href.includes("/pages/home");
  }

  // V14: Add exclusion class to body for pages that should not have NCADEMI enhancements
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

  // V10: Function to aggressively hide the right-side column and expand main content
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

  // V11: Function to ensure main content expands to full width
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


  // V14: Function to hide all sticky elements and prevent scrolling issues
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

  // V12: Function to ensure proper page layout
  function ensureProperPageLayout() {
    log("Ensuring proper page layout");

    // Ensure body has proper layout
    document.body.classList.add("ncademi-body-layout");

    // Ensure main content area has proper flex properties
    const mainContent = document.getElementById("ncas-main");
    if (mainContent) {
      mainContent.classList.add("ncademi-main-layout");
      
      // Dynamically set margin-top to account for fixed header
      const header = document.getElementById("ncas-header");
      if (header) {
        const headerHeight = header.offsetHeight;
        mainContent.style.marginTop = `${headerHeight}px`;
        log(`Set main content margin-top to ${headerHeight}px to account for header`);
      }
    }

    // Ensure the Canvas main content area also has proper layout
    const canvasMain = document.getElementById("not_right_side");
    if (canvasMain) {
      canvasMain.classList.add("ncademi-canvas-main");
    }

    logSuccess("Page layout ensured");
  }

  // NEW: Create the two-element page structure (updated for V14)
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

    // Create h1 element with new text
    const h1 = document.createElement("h1");
    h1.textContent = "NCADEMI Core Accessibility Skills"; // V13: Changed text
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

    // Find and move content-wrapper
    const contentWrapper = document.getElementById("content-wrapper");
    if (contentWrapper) {
      main.appendChild(contentWrapper);
      log("Moved content-wrapper to main element");
    } else {
      logError("content-wrapper not found");
    }

    // Set margin-top to account for fixed header and override problematic styles
    main.style.marginTop = "150px"; // Default header height
    main.style.maxHeight = "none"; // Override any max-height constraints
    main.style.overflowY = "visible"; // Override any overflow constraints
    log("Set main content margin-top to 150px and removed scrolling constraints");

    // No footer - Canvas LMS doesn't have one by default
    log("Skipping footer creation - Canvas LMS doesn't have footers by default");

    // Insert the new structure into the page
    const body = document.body;

    // Clear existing content and add new structure (header + main only)
    body.innerHTML = "";
    
    // Ensure no old footer elements remain
    const oldFooters = document.querySelectorAll("footer");
    oldFooters.forEach(footer => footer.remove());
    
    body.appendChild(header);
    body.appendChild(main);

    // Hide the original Canvas navigation and right-side column
    const leftSide = document.getElementById("left-side");
    if (leftSide) {
      leftSide.classList.add("ncademi-left-hidden");
      log("Hidden original Canvas left navigation");
    }

    hideRightSideColumn(); // Call the hiding function
    expandMainContentToFullWidth(); // V11: Call the expansion function
    hideStickyElements(); // V14: Call the sticky elements hiding function
    ensureProperPageLayout(); // V12: Call the layout function

    logSuccess("Two-element page structure created successfully (header + main)", {
      courseId: currentCourseId,
      headerCreated: !!header,
      mainCreated: !!main,
    });
  }

  // Handle responsive design (updated for V14)
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

        // Update main content margin after header height changes
        if (mainContent) {
          const headerHeight = header.offsetHeight;
          mainContent.style.marginTop = `${headerHeight}px`;
          log(`Updated main content margin-top to ${headerHeight}px after resize`);
        }
      }
    }

    // Initial call
    handleResize();

    // Add event listener
    window.addEventListener("resize", handleResize);
    log("Responsive design setup complete");
  }

  // Add debugging helpers (updated for V14)
  function addDebugHelpers() {
    window.ncademiDebug = {
      getPageStructure: () => {
        return {
          header: document.getElementById("ncas-header"),
          main: document.getElementById("ncas-main"),
          footer: document.getElementById("ncas-footer"),
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
      fixFooter: fixFooterPositioning,
      checkFooterStatus: () => {
        const footer = document.getElementById("ncas-footer");
        if (!footer) {
          return { exists: false };
        }

        const publicLicense = footer.querySelector(".public-license");
        const footerWrapper = footer.querySelector(".footer-content-wrapper");
        return {
          exists: true,
          styled: footer.classList.contains("ncademi-footer"),
          publicLicenseExists: !!publicLicense,
          footerWrapperExists: !!footerWrapper,
          footerWrapperStyled: footerWrapper ? footerWrapper.classList.contains("ncademi-footer-wrapper") : false,
        };
      },
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
      // V14: New debug helpers for public-license
      findPublicLicense: () => {
        const selectors = [
          ".public-license",
          "div.public-license",
          "#content .public-license",
          ".show-content .public-license",
          ".user_content .public-license",
        ];
        const results = {};
        selectors.forEach((selector) => {
          const element = document.querySelector(selector);
          results[selector] = {
            exists: !!element,
            location: element ? element.parentElement?.tagName : "N/A",
            text: element
              ? element.textContent.substring(0, 50) + "..."
              : "N/A",
          };
        });
        log("Public license search results:", results);
        return results;
      },
    };
    log("Debug helpers added to window.ncademiDebug");
  }

  // Initialize the enhanced structure (updated for V14)
  function init() {
    try {
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

      logSuccess("NCADEMI navigation v14 initialized successfully");
    } catch (error) {
      logError("Error in NCADEMI navigation v14:", error);
    }
  }

  // Start the initialization (updated for V14 with multiple calls and observer)
  waitForDOM(() => {
    // V14: Check for exclusion first, before any other initialization
    addExclusionClass();
    if (isAccountsPage()) {
      log("On accounts page or pages/home - skipping all NCADEMI enhancements");
      return;
    }
    
    init();

    // V14: Skip utility functions on accounts pages
    if (isAccountsPage()) {
      log("On accounts page, skipping utility functions");
      return;
    }

    // V10: Additional right-side hiding with delays to catch dynamic content
    setTimeout(hideRightSideColumn, 100);
    setTimeout(hideRightSideColumn, 500);
    setTimeout(hideRightSideColumn, 1000);

    // V11: Additional main content expansion with delays
    setTimeout(expandMainContentToFullWidth, 150);
    setTimeout(expandMainContentToFullWidth, 600);
    setTimeout(expandMainContentToFullWidth, 1100);

    // V14: Additional sticky elements hiding with delays
    setTimeout(hideStickyElements, 120);
    setTimeout(hideStickyElements, 620);
    setTimeout(hideStickyElements, 1120);



    // V12: Layout fixes removed to prevent scrolling issues

    // Additional header margin fixes with delays to catch late-loading headers
    setTimeout(() => {
      const header = document.getElementById("ncas-header");
      const mainContent = document.getElementById("ncas-main");
      if (header && mainContent) {
        const headerHeight = header.offsetHeight;
        mainContent.style.marginTop = `${headerHeight}px`;
        mainContent.style.maxHeight = "none"; // Override any max-height constraints
        mainContent.style.overflowY = "visible"; // Override any overflow constraints
        log(`Delayed header margin fix: Set main content margin-top to ${headerHeight}px and removed scrolling constraints`);
      }
    }, 100);

    setTimeout(() => {
      const header = document.getElementById("ncas-header");
      const mainContent = document.getElementById("ncas-main");
      if (header && mainContent) {
        const headerHeight = header.offsetHeight;
        mainContent.style.marginTop = `${headerHeight}px`;
        mainContent.style.maxHeight = "none"; // Override any max-height constraints
        mainContent.style.overflowY = "visible"; // Override any overflow constraints
        log(`Delayed header margin fix (500ms): Set main content margin-top to ${headerHeight}px and removed scrolling constraints`);
      }
    }, 500);

    setTimeout(() => {
      const header = document.getElementById("ncas-header");
      const mainContent = document.getElementById("ncas-main");
      if (header && mainContent) {
        const headerHeight = header.offsetHeight;
        mainContent.style.marginTop = `${headerHeight}px`;
        mainContent.style.maxHeight = "none"; // Override any max-height constraints
        mainContent.style.overflowY = "visible"; // Override any overflow constraints
        log(`Delayed header margin fix (1000ms): Set main content margin-top to ${headerHeight}px and removed scrolling constraints`);
      }
    }, 1000);

    // Monitor for DOM changes and apply fixes
    const observer = new MutationObserver(function (mutations) {
      // V14: Skip mutation observer on accounts pages
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
        setTimeout(hideStickyElements, 120); // V14: Also hide sticky elements on DOM changes
        // Removed ensureProperPageLayout to prevent scrolling issues
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Monitor for style changes on main element and override problematic styles
    const mainObserver = new MutationObserver(function (mutations) {
      const mainContent = document.getElementById("ncas-main");
      if (mainContent) {
        // Override any problematic styles that might be applied
        if (mainContent.style.maxHeight && mainContent.style.maxHeight.includes("calc")) {
          mainContent.style.maxHeight = "none";
          log("Overrode problematic max-height on main element");
        }
        if (mainContent.style.overflowY === "auto") {
          mainContent.style.overflowY = "visible";
          log("Overrode problematic overflow-y on main element");
        }
      }
    });

    mainObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ['style'],
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
      
      // Add focus management
      link.addEventListener('focus', function() {
        this.style.outline = '3px solid #007bff';
        this.style.outlineOffset = '2px';
      });
      
      link.addEventListener('blur', function() {
        this.style.outline = '';
        this.style.outlineOffset = '';
      });
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