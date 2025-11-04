/**
 * NCADEMI Navigation JavaScript (v8)
 * Always injects complete header element - no HTML header elements needed
 * 
 * Goal: Preserve exact visuals with minimal JS.
 * - Keep top nav bar in current location and styling
 * - Avoid DOM rewrites (no body replacement, no content moves)
 * - Rely on CSS for layout/chrome hiding; JS just wires nav and A11Y
 * - Header element is created entirely via JavaScript and injected at body.firstChild
 */

(function () {
  "use strict";

  const LOG_PREFIX = "🚀 NCADEMI Navigation v8";
  const DEBUG_MODE = true;

  function log(msg, data = null) { if (DEBUG_MODE) console.log(`${LOG_PREFIX}: ${msg}`, data || ""); }
  function logError(msg, err = null) { if (DEBUG_MODE) console.error(`❌ ${LOG_PREFIX}: ${msg}`, err || ""); }
  function logOK(msg, data = null) { if (DEBUG_MODE) console.log(`✅ ${LOG_PREFIX}: ${msg}`, data || ""); }

  // Critical dependency check
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    logError("CRITICAL: document/window not available");
    return;
  }
  
  function waitForDOM(cb) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", cb);
    } else {
      cb();
    }
  }

  function isCoursePage() {
    return window.location.pathname.includes("/courses/");
  }

  function getCourseId() {
    const m = window.location.pathname.match(/\/courses\/(\d+)/);
    return m ? m[1] : null;
  }

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
    if (p === `/courses/${courseId}` || p === `/courses/${courseId}/` || p.includes("/pages/core-skills")) return "home";
    if (p === `/courses/${courseId}/grades` || p === `/courses/${courseId}/grades/` || p.startsWith(`/courses/${courseId}/grades`)) return "progress";
    if (p.includes("/pages/feedback")) return "feedback";
    return null;
  }

  function createLink(href, text, active) {
    const a = document.createElement("a");
    a.href = href;
    a.textContent = text;
    a.setAttribute("aria-label", text);
    if (active) {
      a.classList.add("active");
      a.setAttribute("aria-current", "page");
    }
    return a;
  }

  // Create and inject the complete header element
  function createHeader() {
    // Make sure body exists before trying to insert
    if (!document.body) {
      log("Body not ready yet, cannot create header");
      return null;
    }
    
    // Remove any existing headers first
    const existingHeaders = document.querySelectorAll("#content-header");
    existingHeaders.forEach(header => header.remove());
    
    log("Creating header element");
    const header = document.createElement("header");
    header.id = "content-header";
    header.className = "course-content-header";
    
    const headerTitle = document.createElement("div");
    headerTitle.className = "ncademi-header-title";
    
    const headerText = document.createElement("span");
    headerText.className = "header-text";
    headerText.innerHTML = "NCADEMI Core<br />Accessibility Skills";
    
    headerTitle.appendChild(headerText);
    header.appendChild(headerTitle);
    
    // Insert at body.firstChild
    try {
      document.body.insertBefore(header, document.body.firstChild);
      logOK("Created and inserted header element");
      return { header, headerTitle };
    } catch (e) {
      logError("Error inserting header into body", e);
      return null;
    }
  }

  function ensureHeaderNav() {
    const courseId = getCourseId();
    if (!courseId) { 
      log("No course id; skip header/nav"); 
      return; 
    }

    // Always create/inject header - no checking for existing
    function injectHeaderAndNav() {
      // Make sure body is ready
      if (!document.body) {
        log("Body not ready yet");
        return false;
      }
      
      const headerData = createHeader();
      if (!headerData) {
        return false;
      }
      
      const { header, headerTitle } = headerData;
      injectNav(header, headerTitle);
      return true;
    }

    // Inject nav into header
    function injectNav(header, headerTitle) {
      
      let nav = header.querySelector("#ncademi-nav");
      if (!nav) {
        nav = document.createElement("div");
        nav.id = "ncademi-nav";
        nav.className = "ncademi-desktop-nav";
        headerTitle.insertAdjacentElement("afterend", nav);
        logOK("Nav container created and injected");
        
        // Set up event delegation on nav container (persists across DOM changes)
        nav.setAttribute('data-nav-handler-attached', 'true');
        nav.addEventListener('click', function(e) {
          const link = e.target.closest('a');
          if (!link || !link.closest('#ncademi-nav')) return;
          
          const href = link.getAttribute('href');
          if (!href) return;
          
          try {
            const url = new URL(href, window.location.origin);
            if (url.origin === window.location.origin && window.location.pathname !== url.pathname) {
              e.preventDefault();
              e.stopPropagation();
              
              if (window.Backbone && window.Backbone.history) {
                window.Backbone.history.navigate(url.pathname + (url.search || ''), { trigger: true });
                logOK(`Navigated to ${href} using Canvas Backbone router (event delegation)`);
        } else {
                window.location.href = href;
              }
              
              return false;
            }
          } catch (err) {
            // URL parsing failed, use default navigation
          }
        }, true);
        logOK("Event delegation set up on nav container");
        } else {
        // Ensure event delegation is set up even if nav already exists
        if (!nav.hasAttribute('data-nav-handler-attached')) {
          nav.setAttribute('data-nav-handler-attached', 'true');
          nav.addEventListener('click', function(e) {
            const link = e.target.closest('a');
            if (!link || !link.closest('#ncademi-nav')) return;
            
            const href = link.getAttribute('href');
            if (!href) return;
            
            try {
              const url = new URL(href, window.location.origin);
              if (url.origin === window.location.origin && window.location.pathname !== url.pathname) {
                e.preventDefault();
                e.stopPropagation();
                
                if (window.Backbone && window.Backbone.history) {
                  window.Backbone.history.navigate(url.pathname + (url.search || ''), { trigger: true });
                  logOK(`Navigated to ${href} using Canvas Backbone router (event delegation)`);
        } else {
                  window.location.href = href;
                }
                
                return false;
              }
            } catch (err) {
              // URL parsing failed, use default navigation
            }
          }, true);
          logOK("Event delegation set up on existing nav container");
        }
      }

      // Inject or update nav links
      const existingLinks = nav.querySelectorAll('a');
      const active = getActiveKey(courseId);
      
      if (existingLinks.length === 0) {
        nav.appendChild(createLink(`/courses/${courseId}/pages/start-here`, "Start Here", active === "start-here"));
        nav.appendChild(createLink(`/courses/${courseId}/pages/core-skills`, "Core Skills", active === "home"));
        nav.appendChild(createLink(`/courses/${courseId}/grades`, "Progress", active === "progress"));
        nav.appendChild(createLink(`/courses/${courseId}/pages/feedback`, "Feedback", active === "feedback"));
        
        // Note: Click handlers are handled by event delegation on nav container
        // (set up in injectNav function above) - no need to attach to individual links

        logOK("Populated nav links");
                  } else {
        // Update active state
        if (active) {
        const linkPatterns = {
          'start-here': '/pages/start-here',
            'home': /\/pages\/core-skills|\/courses\/\d+\/?$/,
          'progress': '/grades',
          'feedback': '/pages/feedback'
        };
        
        existingLinks.forEach(l => {
          l.classList.remove('active');
          l.removeAttribute('aria-current');
        });
        
        const pattern = linkPatterns[active];
          if (pattern) {
        existingLinks.forEach(l => {
          const href = l.getAttribute('href') || '';
              const matches = typeof pattern === 'string' ? href.includes(pattern) : pattern.test(href);
          if (matches) {
            l.classList.add('active');
            l.setAttribute('aria-current', 'page');
          }
        });
          }
        }
      }
    }

    // Try to inject immediately
    if (injectHeaderAndNav()) {
      return;
    }

    // Wait for DOMContentLoaded, then readyState === 'complete'
    async function waitAndInject() {
      // Wait for DOMContentLoaded if needed
      if (document.readyState === 'loading') {
        await new Promise(resolve => {
          document.addEventListener('DOMContentLoaded', resolve, { once: true });
        });
      }

      // Try again after DOMContentLoaded
      if (injectHeaderAndNav()) {
        return;
      }

      // Wait for readyState === 'complete'
      if (document.readyState !== 'complete') {
        await new Promise(resolve => {
          const checkInterval = setInterval(() => {
            if (document.readyState === 'complete') {
              clearInterval(checkInterval);
              resolve();
            }
          }, 50);

          // Safety timeout after 5 seconds
          setTimeout(() => {
            clearInterval(checkInterval);
            resolve();
          }, 5000);
        });
      }

      // Final attempt
      if (!injectHeaderAndNav()) {
        logError("Failed to inject header after all wait methods");
      }
    }

    waitAndInject();
  }

  function enhanceCustomLinksA11Y() {
    const links = document.querySelectorAll('.custom-link.small, .custom-link.large');
    links.forEach(link => {
      if (!link.hasAttribute('tabindex')) link.setAttribute('tabindex', '0');
      const t = link.getAttribute('title');
      if (t && !link.getAttribute('aria-label')) {
        link.setAttribute('aria-label', `Navigate to ${t} course module`);
      }
      link.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          link.click();
        }
      });
    });
    logOK(`Enhanced A11Y for ${links.length} custom links`);
  }

  function handleResponsive() {
    function apply() {
      const isMobile = window.innerWidth <= 850;
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
    if (window.ncademiGradeIconsInjected) return true;

    const courseId = getCourseId();
    if (!courseId) return false;

    const gradesTable = document.querySelector('table#grades_summary');
    if (!gradesTable) return false;

    const existingIcons = gradesTable.querySelectorAll('.ncademi-grade-icon');
    if (existingIcons.length > 0) {
      window.ncademiGradeIconsInjected = true;
      return true;
    }

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

    const assignmentLinks = gradesTable.querySelectorAll('tbody tr th.title a');
    let injectedCount = 0;

    assignmentLinks.forEach(link => {
      const assignmentName = link.textContent.trim();
      const iconInfo = iconMap[assignmentName];
      
      if (iconInfo && (!link.previousElementSibling || !link.previousElementSibling.classList.contains('ncademi-grade-icon'))) {
        const iconImg = document.createElement('img');
        iconImg.src = `https://usucourses.instructure.com/courses/${iconInfo.courseId}/files/${iconInfo.id}/preview`;
        iconImg.alt = `${assignmentName} icon`;
        iconImg.className = 'ncademi-grade-icon';
        iconImg.width = 60;
        iconImg.height = 60;
        iconImg.setAttribute('role', 'presentation');
        link.parentNode.insertBefore(iconImg, link);
        injectedCount++;
      }
    });

    if (injectedCount > 0) {
      window.ncademiGradeIconsInjected = true;
      logOK(`Grade icons injected (${injectedCount} icons)`);
      return true;
    }

    return false;
  }

  function populateStatusColumn() {
    if (window.ncademiStatusPopulated) return true;

    const gradesTable = document.querySelector('table#grades_summary');
    if (!gradesTable) return false;

    const assignmentRows = gradesTable.querySelectorAll('tbody tr.student_assignment');
    if (assignmentRows.length === 0) return false;

    let populatedCount = 0;

    assignmentRows.forEach(row => {
      const scoreCell = row.querySelector('td.assignment_score');
      const statusCell = row.querySelector('td.status');
      if (!scoreCell || !statusCell || statusCell.hasAttribute('data-ncademi-status-populated')) return;

      const gradeSpan = scoreCell.querySelector('.grade');
      if (!gradeSpan) return;

      let scoreText = null;
      for (let node of gradeSpan.childNodes) {
        if (node.nodeType === 3 && node.textContent.trim()) { // TEXT_NODE = 3
          scoreText = node.textContent.trim();
          break;
        }
      }
      
      if (!scoreText) {
        const match = gradeSpan.textContent.trim().match(/^(\S+)/);
        scoreText = match ? match[1] : '';
      }

      const tooltipSpan = scoreCell.querySelector('.tooltip');
      if (!tooltipSpan) return;
      
      const pointsText = tooltipSpan.textContent.match(/\/\s*(\d+)/);
      if (!pointsText || !pointsText[1]) return;

      const Y = scoreText;
      const X = parseInt(pointsText[1], 10);

      let statusText = '';
      let statusStyle = 'font-size: 1.25rem !important;';

      if (Y === '-') {
        statusText = 'Pending';
        statusStyle += ' color: #666 !important; font-style: italic !important;';
      } else {
        const scoreY = parseInt(Y, 10);
        if (isNaN(scoreY)) return;

        if (scoreY < X) {
          statusText = 'Active';
          statusStyle += ' color: #333 !important; font-weight: bold !important;';
        } else {
          statusText = 'Done';
          statusStyle += ' color: #336600 !important; font-weight: bold !important;';
        }
      }

      statusCell.textContent = statusText;
      statusCell.setAttribute('style', statusStyle);
      statusCell.setAttribute('data-ncademi-status-populated', 'true');
      populatedCount++;
    });

    if (populatedCount > 0) {
      window.ncademiStatusPopulated = true;
      logOK(`Status column populated (${populatedCount} rows)`);
      return true;
    }

    return false;
  }

  function injectPageTitle() {
    if (window.ncademiPageTitleInjected) return true;

    const gradesTable = document.querySelector('table#grades_summary');
    if (!gradesTable) return false;

    // Check if h1.page-title already exists
    const existingTitle = document.querySelector('h1.page-title');
    if (existingTitle) {
      window.ncademiPageTitleInjected = true;
      return true;
    }

    // Create the h1.page-title element
    const pageTitle = document.createElement('h1');
    pageTitle.className = 'page-title';
    pageTitle.textContent = 'Progress';

    // Insert before the grades table
    gradesTable.parentNode.insertBefore(pageTitle, gradesTable);
    
    window.ncademiPageTitleInjected = true;
    logOK('Page title "Progress" injected');
    return true;
  }

  function fadeOutOverlay(overlay) {
    if (overlay.classList.contains('fade-out')) return;
    overlay.classList.add('fade-out');
    overlay.addEventListener('transitionend', function() {
      setTimeout(() => {
        overlay.remove();
        logOK("Overlay removed after fade-out");
      }, 400);
    }, { once: true });
  }

  function injectBodyOverlayForRedirect() {
    // Check if this is a redirect from course home
    const isRedirectFromHome = sessionStorage.getItem('ncademi-redirect-from-home') === 'true';
    if (!isRedirectFromHome) {
      // Ensure body is visible if not a redirect
      if (document.body && document.body.style.display === 'none') {
        document.body.style.display = '';
      }
      return;
    }

    // Clear the flag
    sessionStorage.removeItem('ncademi-redirect-from-home');
    log("Redirect detected - showing body and injecting full-body overlay for 2 seconds");

    // Show body (it was hidden before redirect)
    if (document.body) {
      document.body.style.display = '';
    }

    // Create overlay that covers entire body
    const overlay = document.createElement('div');
    overlay.id = 'ncademi-redirect-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: #ffffff;
      z-index: 999999;
      opacity: 1;
      transition: opacity 400ms ease;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    `;
    
    // Create loading text
    const loadingText = document.createElement('div');
    loadingText.textContent = 'Loading the course....';
    loadingText.style.cssText = `
      font-size: 2rem;
      text-align: center;
    `;
    
    // Add text to overlay
    overlay.appendChild(loadingText);
    
    // Insert at body.firstChild (before header)
    document.body.insertBefore(overlay, document.body.firstChild);
    logOK("Injected full-body overlay for redirect with loading message");

    // Fade out after 2 seconds
    setTimeout(() => {
      overlay.style.opacity = '0';
      overlay.addEventListener('transitionend', function() {
        overlay.remove();
        logOK("Redirect overlay removed after fade-out");
      }, { once: true });
    }, 2000);
  }

  function injectContentWrapperOverlay() {
    const contentWrapper = document.getElementById('content-wrapper');
    if (!contentWrapper) return;

    if (document.getElementById('content-wrapper-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'content-wrapper-overlay';
    contentWrapper.appendChild(overlay);
    logOK("Injected overlay into #content-wrapper");

    const images = Array.from(contentWrapper.querySelectorAll('img'));
    const totalImages = images.length;
    
    if (totalImages === 0) {
      setTimeout(() => fadeOutOverlay(overlay), 300);
      return;
    }
    
    let loadedCount = 0;
    let erroredCount = 0;
    
    function checkComplete() {
      if (loadedCount + erroredCount === totalImages) {
        setTimeout(() => fadeOutOverlay(overlay), 300);
      }
    }
    
    images.forEach(function(img) {
      if (img.complete && img.naturalHeight !== 0) {
        loadedCount++;
      } else if (img.complete && img.naturalHeight === 0) {
        if (img.loading === 'lazy') {
          img.addEventListener('load', function() {
            loadedCount++;
            checkComplete();
          }, { once: true });
          img.addEventListener('error', function() {
            erroredCount++;
            checkComplete();
          }, { once: true });
        } else {
          erroredCount++;
        }
      } else {
        img.addEventListener('load', function() {
          loadedCount++;
          checkComplete();
        }, { once: true });
        img.addEventListener('error', function() {
          erroredCount++;
          checkComplete();
        }, { once: true });
      }
    });
    
    if (loadedCount + erroredCount === totalImages && !images.some(img => img.loading === 'lazy')) {
      checkComplete();
    }
    
    setTimeout(function() {
      if (!overlay.classList.contains('fade-out')) {
        fadeOutOverlay(overlay);
      }
    }, 5000);
  }

  if (window.ncademiInitializedV8) {
    log("Already initialized");
    return;
  }

  // Redirect course home page to core-skills
  const courseId = getCourseId();
  const currentPath = window.location.pathname;
  if (courseId && (currentPath === `/courses/${courseId}` || currentPath === `/courses/${courseId}/`)) {
    const redirectUrl = `/courses/${courseId}/pages/core-skills`;
    log(`Redirecting course home to: ${redirectUrl}`);
    // Hide body before redirect to prevent flash
    if (document.body) {
      document.body.style.display = 'none';
      log("Body hidden before redirect");
    }
    // Store flag in sessionStorage to indicate redirect happened
    sessionStorage.setItem('ncademi-redirect-from-home', 'true');
    window.location.replace(redirectUrl);
    return;
  }

  // Early admin check
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
    
    // Inject full-body overlay for redirect (must be before header injection)
    injectBodyOverlayForRedirect();
    
    ensureHeaderNav();
    handleResponsive();
    enhanceCustomLinksA11Y();
    
    // Add body classes for page-specific styling
    const activeKey = getActiveKey(getCourseId());
    const courseId = getCourseId();
    const currentPath = window.location.pathname;
    const isCoreSkillsPage = courseId && currentPath.includes(`/courses/${courseId}/pages/core-skills`);
    const isDefaultCourseHome = courseId && (currentPath === `/courses/${courseId}` || currentPath === `/courses/${courseId}/`);
    
    if (activeKey === "home") {
      document.body.classList.add('ncademi-home-page');
    } else {
      document.body.classList.remove('ncademi-home-page');
    }
    
    if (isCoreSkillsPage) {
      document.body.classList.add('ncademi-core-skills-page');
    } else {
      document.body.classList.remove('ncademi-core-skills-page');
    }
    
    if (isDefaultCourseHome) {
      document.body.classList.add('ncademi-default-course-home');
    } else {
      document.body.classList.remove('ncademi-default-course-home');
    }
    
    injectContentWrapperOverlay();
    
    // Handle grades page
    if (activeKey === "progress") {
      // Hide the "Your Progress" or "Grades for..." heading
      const hideH1Title = () => {
        const h1Heading = document.querySelector('.ic-Action-header__Heading, h1.ic-Action-header__Heading');
        if (h1Heading) {
            h1Heading.style.display = 'none';
            return true;
        }
        return false;
      };
      
      if (!hideH1Title()) {
        setTimeout(hideH1Title, 100);
      }
      
      const setupObserver = () => {
        const gradesTable = document.querySelector('table#grades_summary');
        if (!gradesTable) return false;

        const pageTitleInjected = injectPageTitle();
        const iconsInjected = injectGradeIcons();
        const statusPopulated = populateStatusColumn();
        
        if (pageTitleInjected && iconsInjected && statusPopulated) return true;

        if (typeof MutationObserver !== 'undefined') {
          const observer = new MutationObserver(() => {
            const pageTitleInjected = injectPageTitle();
            const iconsInjected = injectGradeIcons();
            const statusPopulated = populateStatusColumn();
        if (pageTitleInjected && iconsInjected && statusPopulated) {
            observer.disconnect();
            }
          });
          observer.observe(gradesTable, { childList: true, subtree: true });
          setTimeout(() => observer.disconnect(), 30000); // Cleanup after 30s
        } else {
          // Fallback polling
            const retryInterval = setInterval(() => {
              const pageTitleInjected = injectPageTitle();
              const iconsInjected = injectGradeIcons();
              const statusPopulated = populateStatusColumn();
              if (pageTitleInjected && iconsInjected && statusPopulated) {
                clearInterval(retryInterval);
              }
            }, 1000);
            setTimeout(() => clearInterval(retryInterval), 30000);
        }

        return false;
      };

      if (!setupObserver()) {
        setTimeout(setupObserver, 500);
      }
    }
    
    window.ncademiInitializedV8 = true;
    logOK("Initialized: v8 nav + A11Y");
  });
})();