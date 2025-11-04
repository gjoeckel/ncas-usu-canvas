/**
 * NCADEMI Navigation JavaScript (v7)
 * Goal: Preserve exact visuals with minimal JS.
 * - Keep top nav bar in current location and styling
 * - Avoid DOM rewrites (no body replacement, no content moves)
 * - Rely on CSS for layout/chrome hiding; JS just wires nav and A11Y
 * - Header structure already exists in HTML; JS only populates nav links
 */

(function () {
  "use strict";

  const LOG_PREFIX = "🚀 NCADEMI Navigation v7";
  const DEBUG_MODE = true;

  function log(msg, data = null) { if (DEBUG_MODE) console.log(`${LOG_PREFIX}: ${msg}`, data || ""); }
  function logError(msg, err = null) { if (DEBUG_MODE) console.error(`❌ ${LOG_PREFIX}: ${msg}`, err || ""); }
  function logOK(msg, data = null) { if (DEBUG_MODE) console.log(`✅ ${LOG_PREFIX}: ${msg}`, data || ""); }

  function waitForDOM(cb) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", cb);
    else cb();
  }

  function isCoursePage() { return window.location.pathname.includes("/courses/"); }
  function getCourseId() { const m = window.location.pathname.match(/\/courses\/(\d+)/); return m ? m[1] : null; }
  function isAdmin() { 
    try {
      return (typeof ENV !== 'undefined' && ENV.current_user_is_admin === true);
    } catch (e) {
      return false;
    }
  }

  function getActiveKey(courseId) {
    const p = window.location.pathname;
    if (!courseId) return null;
    if (p.includes("/pages/start-here")) return "start-here";
    // Home page: either the Canvas default home (/courses/{id}) or our core-skills page
    if (p === `/courses/${courseId}` || p === `/courses/${courseId}/` || p.includes("/pages/core-skills")) return "home";
    // Check for grades page: /courses/{courseId}/grades or /courses/{courseId}/grades/
    if (p === `/courses/${courseId}/grades` || p === `/courses/${courseId}/grades/` || p.startsWith(`/courses/${courseId}/grades`)) return "progress";
    if (p.includes("/pages/feedback")) return "feedback";
    return null;
  }

  function createLink(href, text, active) {
    const a = document.createElement("a");
    a.href = href; a.textContent = text; a.setAttribute("aria-label", text);
    if (active) { a.classList.add("active"); a.setAttribute("aria-current", "page"); }
    return a;
  }

  function ensureHeaderNav() {
    const courseId = getCourseId();
    if (!courseId) { log("No course id; skip header/nav"); return; }

    // Try to find existing header - may not exist yet if Canvas adds it dynamically
    function tryInjectNav() {
      const header = document.getElementById("content-header");
      if (!header) {
        log("Header element not found yet, will retry");
        return false;
      }

      // Check if nav container exists, if not create and inject it
      let nav = document.getElementById("ncademi-nav");
      if (!nav) {
        // Find the header title div (always present in HTML)
        const headerTitle = header.querySelector(".ncademi-header-title");
        if (!headerTitle) {
          log("Header title div not found in HTML");
          return false;
        }

        // Create nav container
        nav = document.createElement("div");
        nav.id = "ncademi-nav";
        nav.className = "ncademi-desktop-nav";
        
        // Insert nav AFTER header title div
        headerTitle.insertAdjacentElement("afterend", nav);
        logOK("Created and injected nav container after header title");
      }

      // Return true to indicate success
      return true;
    }

    // Fallback: Create entire header structure if it doesn't exist (like ncas6-h1.js pattern)
    function createEntireHeader() {
      // Check if header already exists
      if (document.getElementById("content-header")) {
        return false; // Header exists, don't create
      }

      log("Creating entire header structure (fallback)");
      const header = document.createElement("header");
      header.id = "content-header";
      header.className = "course-content-header";

      // Determine if this is the core-skills page (home page)
      const currentPath = window.location.pathname;
      const isCoreSkillsPage = courseId && currentPath.includes(`/courses/${courseId}/pages/core-skills`);

      // Create header title div
      const titleElement = document.createElement("div");
      titleElement.className = "ncademi-header-title";
      
      // Use h1 for core-skills page, span for others
      const headerText = isCoreSkillsPage 
        ? document.createElement("h1")
        : document.createElement("span");
      headerText.className = "header-text";
      headerText.innerHTML = "NCADEMI Core<br>Accessibility Skills";
      titleElement.appendChild(headerText);
      header.appendChild(titleElement);

      // Create nav container
      const nav = document.createElement("div");
      nav.id = "ncademi-nav";
      nav.className = "ncademi-desktop-nav";
      header.appendChild(nav);

      // Inject at top of body (like ncas6-h1.js pattern)
      document.body.insertBefore(header, document.body.firstChild);
      logOK("Created and injected entire header structure at top of body");
      return true;
    }

    // Try immediately
    if (tryInjectNav()) {
      // Header found and nav injected, continue with link population
      injectNavLinks();
    } else {
      // If header not found, give Canvas a brief moment, then try fallback creation
      // This handles cases where header doesn't exist in HTML (like courses/2803)
      setTimeout(() => {
        // Try again to find existing header first
        if (tryInjectNav()) {
          injectNavLinks();
          return;
        }
        
        // If still not found after brief delay, create entire header (fallback)
        log("Header not found after initial delay, creating header structure");
        if (createEntireHeader()) {
          injectNavLinks();
          return;
        }
        
        // If creation failed (header exists but no title div), wait with MutationObserver
        log("Waiting for header element to appear or become ready...");
        let observerDisconnected = false;
        const observer = new MutationObserver((mutations, obs) => {
          // Check if nav already exists (might have been injected by another call)
          const nav = document.getElementById("ncademi-nav");
          if (nav) {
            logOK("Nav container found, disconnecting observer");
            obs.disconnect();
            observerDisconnected = true;
            injectNavLinks();
            return;
          }
          
          const header = document.getElementById("content-header");
          if (header) {
            logOK("Header element found, attempting to inject nav");
            if (tryInjectNav()) {
              obs.disconnect();
              observerDisconnected = true;
              injectNavLinks();
            }
          }
        });
        
        // Observe document body for changes
        observer.observe(document.body, { childList: true, subtree: true });
        
        // Final fallback timeout - stop observing after 5 seconds
        setTimeout(() => {
          if (!observerDisconnected) {
            observer.disconnect();
            log("Final timeout - attempting fallback creation one more time");
            if (tryInjectNav()) {
              injectNavLinks();
            } else if (createEntireHeader()) {
              injectNavLinks();
            } else {
              log("Failed to create or find header element after all attempts");
            }
          }
        }, 5000);
      }, 100); // Short delay to let Canvas/DesignPlus initialize
    }

    function injectNavLinks() {
      const header = document.getElementById("content-header");
      const nav = document.getElementById("ncademi-nav");
      if (!header || !nav) {
        log("Header or nav not found for link injection");
        return;
      }

      // Check if links already exist
      const existingLinks = nav.querySelectorAll('a');
      const active = getActiveKey(courseId);
      
      if (existingLinks.length === 0) {
        // Links don't exist yet - create and add them
        // Add navigation links in order: Start Here, Core Skills, Progress, Feedback
        nav.appendChild(createLink(`/courses/${courseId}/pages/start-here`, "Start Here", active === "start-here"));
        // Core Skills links to /pages/core-skills to use AJAX navigation (no page reload)
        nav.appendChild(createLink(`/courses/${courseId}/pages/core-skills`, "Core Skills", active === "home"));
        nav.appendChild(createLink(`/courses/${courseId}/grades`, "Progress", active === "progress"));
        nav.appendChild(createLink(`/courses/${courseId}/pages/feedback`, "Feedback", active === "feedback"));
        
        // Add click handlers to intercept navigation and prevent full page reloads
        // This ensures the nav bar persists across navigation (especially for home page)
        const navLinks = nav.querySelectorAll('a');
        navLinks.forEach(link => {
          link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (!href) return;
            
            // Check if this is a same-origin navigation
            try {
              const url = new URL(href, window.location.origin);
              if (url.origin === window.location.origin) {
                // Only intercept if we're not already on this page
                if (window.location.pathname !== url.pathname) {
                  e.preventDefault();
                  e.stopPropagation();
                  
                  // Try to use Canvas's built-in navigation if available
                  // Canvas uses Backbone router for navigation
                  if (window.Backbone && window.Backbone.history) {
                    // Navigate using Canvas's router (AJAX navigation)
                    window.Backbone.history.navigate(url.pathname + (url.search || ''), { trigger: true });
                    logOK(`Navigated to ${href} using Canvas Backbone router`);
                  } else {
                    // If Canvas router not available, fall back to default navigation
                    // (This will cause a page reload, but at least the header will be recreated correctly)
                    window.location.href = href;
                    log(`Canvas router not available, using default navigation for ${href}`);
                  }
                  
                  return false;
                }
              }
            } catch (err) {
              // If URL parsing fails, let default behavior handle it
              log(`Could not parse URL ${href}, using default navigation`);
            }
          }, true); // Use capture phase to intercept before Canvas
        });
        
        logOK("Populated nav links in existing header");
      } else {
        // Links already exist - just update active state
        if (!active) return;
        
        const linkPatterns = {
          'start-here': '/pages/start-here',
          'home': /\/pages\/core-skills|\/courses\/\d+\/?$/, // Match both /pages/core-skills and /courses/{id}
          'progress': '/grades',
          'feedback': '/pages/feedback'
        };
        
        existingLinks.forEach(l => l.classList.remove('active'));
        
        const pattern = linkPatterns[active];
        if (!pattern) return;
        
        existingLinks.forEach(l => {
          const href = l.getAttribute('href') || '';
          const matches = typeof pattern === 'string' 
            ? href.includes(pattern) 
            : pattern.test(href);
          if (matches) l.classList.add('active');
        });
        
        logOK("Updated active link state");
      }
    }
  }

  function enhanceCustomLinksA11Y() {
    const links = document.querySelectorAll('.custom-link.small, .custom-link.large');
    links.forEach(link => {
      if (!link.hasAttribute('tabindex')) link.setAttribute('tabindex', '0');
      const t = link.getAttribute('title');
      if (t && !link.getAttribute('aria-label')) link.setAttribute('aria-label', `Navigate to ${t} course module`);
      link.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); link.click(); } });
    });
    logOK(`Enhanced A11Y for ${links.length} custom links`);
  }

  function handleResponsive() {
    function apply() {
      const isMobile = window.innerWidth <= 768;
      const header = document.getElementById('content-header');
      const nav = document.getElementById('ncademi-nav');
      if (!header || !nav) return;
      header.classList.remove('ncademi-mobile-header', 'ncademi-desktop-header');
      nav.classList.remove('ncademi-mobile-nav', 'ncademi-desktop-nav');
      document.body.classList.remove('ncademi-mobile-body', 'ncademi-desktop-body');
      if (isMobile) {
        header.classList.add('ncademi-mobile-header');
        nav.classList.add('ncademi-mobile-nav');
        document.body.classList.add('ncademi-mobile-body');
      } else {
        header.classList.add('ncademi-desktop-header');
        nav.classList.add('ncademi-desktop-nav');
        document.body.classList.add('ncademi-desktop-body');
      }
    }
    apply();
    window.addEventListener('resize', apply, { passive: true });
  }

  function injectGradeIcons() {
    // Check if icons have already been injected to prevent duplicate injection
    if (window.ncademiGradeIconsInjected) {
      log("Grade icons already injected, skipping");
      return true; // Return true to indicate icons are already present
    }

    const courseId = getCourseId();
    if (!courseId) return false;

    const gradesTable = document.querySelector('table#grades_summary');
    if (!gradesTable) return false;

    // Check if any icons are already present in the table
    const existingIcons = gradesTable.querySelectorAll('.ncademi-grade-icon');
    if (existingIcons.length > 0) {
      log("Grade icons already present in table, marking as injected");
      window.ncademiGradeIconsInjected = true;
      return true;
    }

    // Icon mapping: assignment name -> image file ID
    const iconMap = {
      'Alternative Text': { id: '1197429', courseId: courseId },
      'Captions': { id: '1197430', courseId: courseId },
      'Clear Writing': { id: '1197431', courseId: courseId },
      'Color Use': { id: '1197432', courseId: courseId },
      'Headings': { id: '1197421', courseId: courseId },
      'Links': { id: '1197434', courseId: courseId },
      'Lists': { id: '1197435', courseId: courseId },
      'Tables': { id: '1197436', courseId: courseId },
      'Text Contrast': { id: '1197433', courseId: courseId }
    };

    // Find all assignment name links in the grades table
    const assignmentLinks = gradesTable.querySelectorAll('tbody tr th.title a');
    
    let injectedCount = 0;
    assignmentLinks.forEach(link => {
      const assignmentName = link.textContent.trim();
      const iconInfo = iconMap[assignmentName];
      
      // Check if icon already injected
      if (link.previousElementSibling && link.previousElementSibling.classList.contains('ncademi-grade-icon')) {
        return;
      }

      if (iconInfo) {
        const iconImg = document.createElement('img');
        iconImg.src = `https://usucourses.instructure.com/courses/${iconInfo.courseId}/files/${iconInfo.id}/preview`;
        iconImg.alt = `${assignmentName} icon`;
        iconImg.className = 'ncademi-grade-icon';
        iconImg.width = 60;
        iconImg.height = 60;
        iconImg.setAttribute('role', 'presentation');
        
        // Insert icon before the link
        link.parentNode.insertBefore(iconImg, link);
        injectedCount++;
        logOK(`Injected icon for ${assignmentName}`);
      }
    });

    // Mark as injected if any icons were added
    if (injectedCount > 0) {
      window.ncademiGradeIconsInjected = true;
      logOK(`Grade icons injection complete (${injectedCount} icons injected)`);
      return true;
    }

    return false;
  }

  function populateStatusColumn() {
    // Check if status has already been populated to prevent duplicate updates
    if (window.ncademiStatusPopulated) {
      log("Status column already populated, skipping");
      return true;
    }

    const gradesTable = document.querySelector('table#grades_summary');
    if (!gradesTable) return false;

    // Find all assignment rows (exclude group totals)
    const assignmentRows = gradesTable.querySelectorAll('tbody tr.student_assignment');
    if (assignmentRows.length === 0) return false;

    let populatedCount = 0;
    assignmentRows.forEach(row => {
      // Find the Score column
      const scoreCell = row.querySelector('td.assignment_score');
      if (!scoreCell) return;

      // Find the Status column
      const statusCell = row.querySelector('td.status');
      if (!statusCell) return;

      // Check if status is already populated (has our custom content)
      if (statusCell.hasAttribute('data-ncademi-status-populated')) {
        return; // Skip if already populated
      }

      // Extract score from Score column
      const gradeSpan = scoreCell.querySelector('.grade');
      if (!gradeSpan) return;

      // Get the score text (Y value) - could be a number or "-"
      // Need to get text content excluding tooltips and screenreader-only text
      let scoreText = null;
      // Try to get the first text node (the actual score number)
      for (let node of gradeSpan.childNodes) {
        if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
          scoreText = node.textContent.trim();
          break;
        }
      }
      
      // Fallback: parse from textContent if no direct text node found
      if (!scoreText) {
        const allText = gradeSpan.textContent.trim();
        // Extract first non-whitespace token (the score number or "-")
        const match = allText.match(/^(\S+)/);
        scoreText = match ? match[1] : allText.split(/\s+/)[0] || '';
      }
      
      const Y = scoreText;
      
      // Get points possible (X value) - look for "/ X" pattern in the tooltip span
      const tooltipSpan = scoreCell.querySelector('.tooltip');
      if (!tooltipSpan) return;
      
      // The points possible is in a span after the grade span, text like "/ 3" or "/ 4"
      const pointsText = tooltipSpan.textContent.match(/\/\s*(\d+)/);
      if (!pointsText || !pointsText[1]) return;

      const X = parseInt(pointsText[1], 10);

      // Determine status based on Y and X
      let statusText = '';
      let statusStyle = 'font-size: 1.25rem !important;';

      if (Y === '-') {
        // Pending: Y = "-"
        statusText = 'Pending';
        statusStyle += ' color: #666 !important; font-style: italic !important;';
      } else {
        const scoreY = parseInt(Y, 10);
        if (isNaN(scoreY)) return; // Invalid score format

        if (scoreY < X) {
          // Active: Y < X
          statusText = 'Active';
          statusStyle += ' color: #333 !important; font-weight: bold !important;';
        } else if (scoreY === X) {
          // Done: Y = X
          statusText = 'Done';
          statusStyle += ' color: #336600 !important; font-weight: bold !important;';
        } else {
          // Edge case: score exceeds points possible (shouldn't happen, but handle gracefully)
          statusText = 'Done';
          statusStyle += ' color: #336600 !important; font-weight: bold !important;';
        }
      }

      // Set status text and styling
      statusCell.textContent = statusText;
      statusCell.setAttribute('style', statusStyle);
      statusCell.setAttribute('data-ncademi-status-populated', 'true');
      populatedCount++;
      
      logOK(`Status populated: ${statusText} for score ${Y}/${X}`);
    });

    // Mark as populated if any statuses were set
    if (populatedCount > 0) {
      window.ncademiStatusPopulated = true;
      logOK(`Status column population complete (${populatedCount} rows updated)`);
      return true;
    }

    return false;
  }

  if (window.ncademiInitializedMin) { log("Already initialized"); return; }

  // ============================================
  // CONTENT WRAPPER OVERLAY (Inject overlay and wait for images to load)
  // ============================================
  function fadeOutOverlay(overlay) {
    if (overlay.classList.contains('fade-out')) return;
    overlay.classList.add('fade-out');
    overlay.addEventListener('transitionend', function() {
      // Add minimum visibility delay to ensure overlay is visible before removal
      setTimeout(() => {
        overlay.remove();
        logOK("Overlay removed after fade-out");
      }, 400); // Wait for transition + small buffer
    }, { once: true });
  }

  function injectContentWrapperOverlay() {
    const contentWrapper = document.getElementById('content-wrapper');
    if (!contentWrapper) {
      log("No #content-wrapper element found");
      return;
    }

    // Check if overlay already exists to prevent duplicate injection
    if (document.getElementById('content-wrapper-overlay')) {
      log("Overlay already exists, skipping injection");
      return;
    }

    // Inject overlay div
    const overlay = document.createElement('div');
    overlay.id = 'content-wrapper-overlay';
    contentWrapper.appendChild(overlay);
    logOK("Injected overlay into #content-wrapper");

    // Find all images within #content-wrapper
    const images = Array.from(contentWrapper.querySelectorAll('img'));
    const totalImages = images.length;
    
    if (totalImages === 0) {
      log("No images found in #content-wrapper, fading out overlay after minimum delay");
      setTimeout(() => fadeOutOverlay(overlay), 300); // Minimum visibility time
      return;
    }

    log(`Waiting for ${totalImages} images to load in #content-wrapper...`);
    
    let loadedCount = 0;
    let erroredCount = 0;
    let hasLazyImages = false;
    
    function checkComplete() {
      if (loadedCount + erroredCount === totalImages) {
        log(`All images loaded (${loadedCount} loaded, ${erroredCount} errors). Fading out overlay.`);
        // Minimum visibility delay to ensure overlay is seen
        setTimeout(() => fadeOutOverlay(overlay), 300);
      }
    }
    
    // Process all images in single loop with improved lazy loading detection
    images.forEach(function(img) {
      const isLazy = img.loading === 'lazy';
      if (isLazy) hasLazyImages = true;
      
      // For lazy-loaded images: complete might be true but naturalHeight still 0 (not yet loaded)
      if (img.complete && img.naturalHeight !== 0) {
        // Image is actually loaded and has dimensions
        loadedCount++;
        log(`Image already loaded: ${img.src} ${isLazy ? '(lazy)' : ''}`);
      } else if (img.complete && img.naturalHeight === 0) {
        // Image marked complete but has no dimensions - likely failed or lazy placeholder
        if (isLazy) {
          // Lazy image placeholder - wait for actual load event
          log(`Lazy image placeholder detected: ${img.src}, waiting for load event`);
          img.addEventListener('load', function() {
            loadedCount++;
            log(`Lazy image loaded: ${img.src} (${loadedCount}/${totalImages})`);
            checkComplete();
          }, { once: true });
          
          img.addEventListener('error', function() {
            erroredCount++;
            log(`Lazy image error: ${img.src} (errors: ${erroredCount})`);
            checkComplete();
          }, { once: true });
        } else {
          // Non-lazy image with no dimensions = error
          erroredCount++;
          log(`Image failed to load: ${img.src}`);
        }
      } else {
        // Not yet loaded - attach listeners
        img.addEventListener('load', function() {
          loadedCount++;
          log(`Image loaded: ${img.src} (${loadedCount}/${totalImages}) ${isLazy ? '(lazy)' : ''}`);
          checkComplete();
        }, { once: true });
        
        img.addEventListener('error', function() {
          erroredCount++;
          log(`Image error: ${img.src} (errors: ${erroredCount})`);
          checkComplete();
        }, { once: true });
      }
    });
    
    // Log lazy loading status
    if (hasLazyImages) {
      log("Lazy-loaded images detected - using improved detection logic");
    }
    
    // Check if all were already complete (only for non-lazy images)
    if (loadedCount + erroredCount === totalImages && !hasLazyImages) {
      checkComplete();
      return;
    }
    
    // Fallback timeout: fade out after 5 seconds regardless
    setTimeout(function() {
      if (!overlay.classList.contains('fade-out')) {
        log("Timeout reached, forcing overlay fade-out");
        fadeOutOverlay(overlay);
      }
    }, 5000);
  }

  // Early admin check - if admin detected, add class to body and skip all custom JS/CSS
  if (isAdmin()) {
    waitForDOM(() => {
      document.body.classList.add('ncademi-admin-view');
    });
    log("Admin detected; skipping all NCADEMI customizations");
    return;
  }

  waitForDOM(() => {
    if (!isCoursePage()) { 
      log("Not a course page; skipping");
      return;
    }
    
    // Priority: Nav bar must be visible immediately
    ensureHeaderNav();
    handleResponsive();
    enhanceCustomLinksA11Y();
    
    // Add body class for home page detection (to hide hero box)
    const activeKey = getActiveKey(getCourseId());
    const courseId = getCourseId();
    const currentPath = window.location.pathname;
    const isCoreSkillsPage = courseId && currentPath.includes(`/courses/${courseId}/pages/core-skills`);
    // Detect default course home page (/courses/{courseId} or /courses/{courseId}/)
    const isDefaultCourseHome = courseId && (currentPath === `/courses/${courseId}` || currentPath === `/courses/${courseId}/`);
    
    if (activeKey === "home") {
      document.body.classList.add('ncademi-home-page');
      logOK("Home page detected - hero box will be hidden");
    } else {
      document.body.classList.remove('ncademi-home-page');
    }
    
    // Add specific class for core-skills page (to hide h1.page-title)
    if (isCoreSkillsPage) {
      document.body.classList.add('ncademi-core-skills-page');
      logOK("Core Skills page detected");
    } else {
      document.body.classList.remove('ncademi-core-skills-page');
    }
    
    // Add specific class for default course home page (to hide div.public-license)
    if (isDefaultCourseHome) {
      document.body.classList.add('ncademi-default-course-home');
      logOK("Default course home page detected");
    } else {
      document.body.classList.remove('ncademi-default-course-home');
    }
    
    // Inject overlay into #content-wrapper and wait for images to load
    injectContentWrapperOverlay();
    
    // Inject icons into grades table if on progress page
    
    if (activeKey === "progress") {
      log("Progress page detected, setting up grade icons injection and status population");
      
      // Update h1 title from "Grades for [user name]" to "Your Progress"
      const updateH1Title = () => {
        const h1Heading = document.querySelector('.ic-Action-header__Heading, h1.ic-Action-header__Heading');
        if (h1Heading) {
          if (h1Heading.textContent.includes('Grades for')) {
            h1Heading.textContent = 'Your Progress';
            logOK("Updated h1 heading to 'Your Progress'");
            return true;
          }
        }
        return false;
      };
      
      // Try to update h1 immediately
      if (!updateH1Title()) {
        // If not found, retry after a short delay
        setTimeout(() => {
          updateH1Title();
        }, 100);
      }
      
      // Reset flags on page navigation (in case of SPA-style navigation)
      // Full page reloads will naturally reset this
      const gradesTable = document.querySelector('table#grades_summary');
      if (!gradesTable) {
        // If table doesn't exist yet, check if flags should be reset
        // If we're on a fresh page load, the flags will be undefined
        if (typeof window.ncademiGradeIconsInjected === 'undefined') {
          window.ncademiGradeIconsInjected = false;
        }
        if (typeof window.ncademiStatusPopulated === 'undefined') {
          window.ncademiStatusPopulated = false;
        }
      } else {
        // Table exists - check if icons are already present from previous load
        const existingIcons = gradesTable.querySelectorAll('.ncademi-grade-icon');
        if (existingIcons.length === 0) {
          // No icons present, reset flag to allow injection
          window.ncademiGradeIconsInjected = false;
        }
        // Check if status is already populated
        const existingStatusCells = gradesTable.querySelectorAll('td.status[data-ncademi-status-populated]');
        if (existingStatusCells.length === 0) {
          // No status populated, reset flag to allow population
          window.ncademiStatusPopulated = false;
        }
      }

      // Use MutationObserver to watch for table content changes
      let observer = null;
      
      const setupObserver = () => {
        const gradesTable = document.querySelector('table#grades_summary');
        if (!gradesTable) {
          log("Grades table not found yet, will retry");
          return false;
        }

        log("Grades table found, attempting icon injection and status population");
        
        // Try to inject icons
        const iconsInjected = injectGradeIcons();
        
        // Try to populate status column
        const statusPopulated = populateStatusColumn();
        
        // If both icons and status are injected/populated, disconnect observer
        if (iconsInjected && statusPopulated) {
          if (observer) {
            observer.disconnect();
            observer = null;
            log("Grade icons injection and status population complete, observer disconnected");
          }
          return true;
        }

        // If observer not yet created, create it
        if (!observer) {
          log("Creating MutationObserver to watch for grade table changes");
          observer = new MutationObserver(() => {
            // Check if icons and status are now present
            const iconsInjected = injectGradeIcons();
            const statusPopulated = populateStatusColumn();
            if (iconsInjected && statusPopulated) {
              observer.disconnect();
              observer = null;
              log("Grade icons injection and status population complete, observer disconnected");
            }
          });
          observer.observe(gradesTable, { childList: true, subtree: true });
          log("MutationObserver set up for grade icons injection and status population");
        }

        return false;
      };

      // Try immediately
      if (!setupObserver()) {
        // Table might not be loaded yet, try again after a short delay
        log("Retrying grade icons injection and status population after delay");
        setTimeout(() => {
          setupObserver();
        }, 500);
      }
    }
    
    window.ncademiInitializedMin = true;
    logOK("Initialized: minimal nav + A11Y without DOM rewrites");
  });

  // Content wrapper overlay handles visual smoothing when images are loaded
})();