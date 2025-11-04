/**
 * NCADEMI Navigation JavaScript (v7-minimal)
 * Minimal version based on production console log analysis
 * Success path: METHOD 3 (readyState === 'complete') found header after 0.919s
 * Removed: METHODS 4-7 (Canvas signals, exponential backoff, MutationObserver, final polling)
 * 
 * Goal: Preserve exact visuals with minimal JS.
 * - Keep top nav bar in current location and styling
 * - Avoid DOM rewrites (no body replacement, no content moves)
 * - Rely on CSS for layout/chrome hiding; JS just wires nav and A11Y
 * - Header structure already exists in HTML; JS only populates nav links
 */

(function () {
  "use strict";

  const LOG_PREFIX = "🚀 NCADEMI Navigation v7-min";
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

  function ensureHeaderNav() {
    const courseId = getCourseId();
    if (!courseId) { 
      log("No course id; skip header/nav"); 
      return; 
    }

    // EARLY REUSE CHECK (adapted from NCAS6)
    // Priority: Check for header at body.firstChild FIRST (persisted header from previous navigation)
    // This prevents reinjection during AJAX navigation when Canvas recreates header in HTML
    const headerAtBodyFirstChild = (document.body.firstChild && 
                                     document.body.firstChild.id === "content-header") 
                                     ? document.body.firstChild : null;
    const existingNav = headerAtBodyFirstChild ? headerAtBodyFirstChild.querySelector("#ncademi-nav") : null;
    
    // If header exists at body.firstChild with nav, reuse it
    if (headerAtBodyFirstChild && existingNav) {
      log("Header already exists at body.firstChild with nav - updating active state only");
      
      // Check if Canvas created a duplicate header in HTML and remove it
      const allHeaders = document.querySelectorAll("#content-header");
      allHeaders.forEach(header => {
        if (header !== headerAtBodyFirstChild) {
          log("Removing duplicate header found in HTML");
          header.remove();
        }
      });
      
      // Update active state
      const active = getActiveKey(courseId);
      if (active) {
        const linkPatterns = {
          'start-here': '/pages/start-here',
          'home': /\/pages\/core-skills|\/courses\/\d+\/?$/,
          'progress': '/grades',
          'feedback': '/pages/feedback'
        };
        const links = existingNav.querySelectorAll('a');
        links.forEach(l => {
          l.classList.remove('active');
          l.removeAttribute('aria-current');
        });
        const pattern = linkPatterns[active];
        if (pattern) {
          links.forEach(l => {
            const href = l.getAttribute('href') || '';
            const matches = typeof pattern === 'string' ? href.includes(pattern) : pattern.test(href);
            if (matches) {
              l.classList.add('active');
              l.setAttribute('aria-current', 'page');
            }
          });
        }
        logOK("Updated active link state on existing header");
      }
      return; // Early return - header already set up correctly
    }
    
    // If header exists but not at body.firstChild, check for duplicates and clean up
    const allHeaders = document.querySelectorAll("#content-header");
    if (allHeaders.length > 1) {
      log(`Found ${allHeaders.length} headers with id="content-header" - cleaning up duplicates`);
      // Keep the first one, remove the rest
      for (let i = 1; i < allHeaders.length; i++) {
        allHeaders[i].remove();
      }
    }

    // Check if header exists
    function checkHeaderExists() {
      const header = document.getElementById("content-header");
      if (header) {
        const headerTitle = header.querySelector(".ncademi-header-title");
        if (headerTitle) {
          return { header, headerTitle, found: true };
        }
      }
        return { header: null, headerTitle: null, found: false };
    }

    // Inject nav once header is found
    function injectNav(header, headerTitle) {
      // Move header to document.body.firstChild (like NCAS6) to persist across AJAX navigations
      // This places it completely outside Canvas's replaceable content areas
      const currentParent = header.parentNode;
      const isAtBodyFirstChild = (currentParent === document.body && header === document.body.firstChild);
      
      if (!isAtBodyFirstChild) {
        log(`Moving header to document.body.firstChild (currently in: ${currentParent ? currentParent.id || currentParent.tagName : 'unknown'})`);
        try {
          // Remove from current location if needed
          if (currentParent && currentParent !== document.body) {
            header.remove();
          }
          // Insert at body.firstChild (NCAS6 approach)
          document.body.insertBefore(header, document.body.firstChild);
          logOK("Header moved to document.body.firstChild");
        } catch (e) {
          logError("Error moving header to body.firstChild", e);
        }
      } else {
        log("Header already at document.body.firstChild");
      }
      
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

    // METHOD 1: Immediate check
    const immediateCheck = checkHeaderExists();
    if (immediateCheck.found) {
      injectNav(immediateCheck.header, immediateCheck.headerTitle);
      return;
    }

    // METHOD 2 & 3: Wait for DOMContentLoaded, then readyState === 'complete'
    async function waitForHeader() {
      // Wait for DOMContentLoaded if needed
      if (document.readyState === 'loading') {
        await new Promise(resolve => {
          document.addEventListener('DOMContentLoaded', resolve, { once: true });
        });
      }

      // Check again after DOMContentLoaded
      const check2 = checkHeaderExists();
      if (check2.found) {
        injectNav(check2.header, check2.headerTitle);
        return;
      }

      // Wait for readyState === 'complete' (this is what worked in production)
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

      // Final check and injection
      const check3 = checkHeaderExists();
      if (check3.found) {
        injectNav(check3.header, check3.headerTitle);
      } else {
        logError("Header not found after all wait methods");
      }
    }

    waitForHeader();
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

  if (window.ncademiInitializedMin) {
    log("Already initialized");
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
      const updateH1Title = () => {
        const h1Heading = document.querySelector('.ic-Action-header__Heading, h1.ic-Action-header__Heading');
        if (h1Heading && h1Heading.textContent.includes('Grades for')) {
            h1Heading.textContent = 'Your Progress';
            return true;
        }
        return false;
      };
      
      if (!updateH1Title()) {
        setTimeout(updateH1Title, 100);
      }
      
      const setupObserver = () => {
        const gradesTable = document.querySelector('table#grades_summary');
        if (!gradesTable) return false;

        const iconsInjected = injectGradeIcons();
        const statusPopulated = populateStatusColumn();
        
        if (iconsInjected && statusPopulated) return true;

        if (typeof MutationObserver !== 'undefined') {
          const observer = new MutationObserver(() => {
            const iconsInjected = injectGradeIcons();
            const statusPopulated = populateStatusColumn();
        if (iconsInjected && statusPopulated) {
            observer.disconnect();
            }
          });
          observer.observe(gradesTable, { childList: true, subtree: true });
          setTimeout(() => observer.disconnect(), 30000); // Cleanup after 30s
        } else {
          // Fallback polling
            const retryInterval = setInterval(() => {
              const iconsInjected = injectGradeIcons();
              const statusPopulated = populateStatusColumn();
              if (iconsInjected && statusPopulated) {
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
    
    window.ncademiInitializedMin = true;
    logOK("Initialized: minimal nav + A11Y");
  });
})();