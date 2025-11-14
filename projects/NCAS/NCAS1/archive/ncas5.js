/**
 * NCADEMI Navigation JavaScript (v5-min)
 * Goal: Preserve exact visuals with minimal JS.
 * - Keep top nav bar in current location and styling
 * - Avoid DOM rewrites (no body replacement, no content moves)
 * - Rely on CSS for layout/chrome hiding; JS just wires nav and A11Y
 */

(function () {
  "use strict";

  const LOG_PREFIX = "🚀 NCADEMI Navigation v5-min";
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
    if (p === `/courses/${courseId}` || p === `/courses/${courseId}/`) return "home";
    if (p.includes("/pages/about")) return "about";
    if (p.includes("/grades")) return "grades";
    if (p.includes("/pages/survey")) return "survey";
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

    // Reuse if already present
    let header = document.getElementById("ncas-header");
    if (!header) {
      header = document.createElement("header");
      header.id = "ncas-header";
      header.className = "ncademi-header";

      const h1 = document.createElement("h1");
      h1.textContent = "NCADEMI Core Accessibility Skills";
      header.appendChild(h1);

      const nav = document.createElement("div");
      nav.id = "ncademi-nav";

      const active = getActiveKey(courseId);
      // Add navigation links in order: Start Here, Home, About, Grades, Survey
      nav.appendChild(createLink(`/courses/${courseId}/pages/start-here`, "Start Here", active === "start-here"));
      nav.appendChild(createLink(`/courses/${courseId}`, "Home", active === "home"));
      nav.appendChild(createLink(`/courses/${courseId}/pages/about`, "About", active === "about"));
      nav.appendChild(createLink(`/courses/${courseId}/grades`, "Grades", active === "grades"));
      nav.appendChild(createLink(`/courses/${courseId}/pages/survey`, "Survey", active === "survey"));

      header.appendChild(nav);

      // Prepend without wiping existing Canvas DOM
      document.body.insertBefore(header, document.body.firstChild);
      logOK("Injected header/nav at top of body");
      // Header/nav is ready here
    } else {
      // Update active state if needed
      const active = getActiveKey(courseId);
      if (!active) return;
      
      const linkPatterns = {
        'start-here': '/pages/start-here',
        'home': /\/courses\/\d+\/?$/,
        'about': '/pages/about',
        'grades': '/grades',
        'survey': '/pages/survey'
      };
      
      const links = header.querySelectorAll('#ncademi-nav a');
      links.forEach(l => l.classList.remove('active'));
      
      const pattern = linkPatterns[active];
      if (!pattern) return;
      
      links.forEach(l => {
        const href = l.getAttribute('href') || '';
        const matches = typeof pattern === 'string' 
          ? href.includes(pattern) 
          : pattern.test(href);
        if (matches) l.classList.add('active');
      });
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
      const header = document.getElementById('ncas-header');
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
    const courseId = getCourseId();
    if (!courseId) return;

    const gradesTable = document.querySelector('table#grades_summary');
    if (!gradesTable) return;

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
        logOK(`Injected icon for ${assignmentName}`);
      }
    });
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
    
    // Inject overlay into #content-wrapper and wait for images to load
    injectContentWrapperOverlay();
    
    // Inject icons into grades table if on grades page
    const activeKey = getActiveKey(getCourseId());
    
    if (activeKey === "grades") {
      // Use MutationObserver to watch for table content changes
      const observer = new MutationObserver(() => {
        injectGradeIcons();
      });
      
      const gradesTable = document.querySelector('table#grades_summary');
      if (gradesTable) {
        injectGradeIcons();
        observer.observe(gradesTable, { childList: true, subtree: true });
      } else {
        // Table might not be loaded yet, try again after a short delay
        setTimeout(() => {
          injectGradeIcons();
          const table = document.querySelector('table#grades_summary');
          if (table) observer.observe(table, { childList: true, subtree: true });
        }, 500);
      }
    }
    
    window.ncademiInitializedMin = true;
    logOK("Initialized: minimal nav + A11Y without DOM rewrites");
  });

  // Content wrapper overlay handles visual smoothing when images are loaded
})();