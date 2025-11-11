/**
 * NCADEMI Navigation JavaScript (v15)
 * Always injects complete header element - no HTML header elements needed
 * 
 * Goal: Preserve exact visuals with minimal JS.
 * - Keep top nav bar in current location and styling
 * - Avoid DOM rewrites (no body replacement, no content moves)
 * - Rely on CSS for layout/chrome hiding; JS just wires nav and A11Y
 * - Header element is created entirely via JavaScript and injected at body.firstChild
 * 
 * Structure (v15):
 * - Title floats left (static, independent)
 * - Links wrapper centers on full header width (overlaps title)
 */

(function () {
  "use strict";

  const LOG_PREFIX = "🚀 NCADEMI Navigation v15";
  const DEBUG_MODE = true;

  function log(msg, data = null) { if (DEBUG_MODE) console.log(`${LOG_PREFIX}: ${msg}`, data || ""); }
  function logError(msg, err = null) { if (DEBUG_MODE) console.error(`❌ ${LOG_PREFIX}: ${msg}`, err || ""); }
  function logOK(msg, data = null) { if (DEBUG_MODE) console.log(`✅ ${LOG_PREFIX}: ${msg}`, data || ""); }

  // Critical dependency check
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    logError("CRITICAL: document/window not available");
    return;
  }
  
  // Ensure Canvas ENV.current_user_roles is always an array to prevent third-party scripts
  // (e.g., course_tracking.js) from crashing when they call .indexOf on anonymous views.
  if (window.ENV) {
    const roles = window.ENV.current_user_roles;
    if (roles == null) {
      window.ENV.current_user_roles = [];
    } else if (!Array.isArray(roles)) {
      try {
        window.ENV.current_user_roles = Array.from(roles);
      } catch (e) {
        window.ENV.current_user_roles = [];
      }
    }
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
      a.setAttribute("tabindex", "-1"); // Remove from keyboard navigation
    } else {
      a.setAttribute("tabindex", "0"); // Ensure keyboard accessible
    }
    return a;
  }

  const ASSIGNMENT_STATUS_STORAGE_KEY = 'ncademi_assignment_statuses';
  let assignmentStatusCache = null;
  let cachedStudentId = null;
  let studentIdPromise = null;

  function getAssignmentStatusCache() {
    if (assignmentStatusCache) {
      return assignmentStatusCache;
    }

    assignmentStatusCache = new Map();
    try {
      const stored = sessionStorage.getItem(ASSIGNMENT_STATUS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        Object.entries(parsed).forEach(([id, status]) => {
          assignmentStatusCache.set(String(id), status);
        });
      }
    } catch (e) {
      logError("Unable to load assignment status cache", e);
    }

    return assignmentStatusCache;
  }

  function persistAssignmentStatusCache() {
    if (!assignmentStatusCache) {
      return;
    }

    try {
      const obj = Object.fromEntries(assignmentStatusCache.entries());
      sessionStorage.setItem(ASSIGNMENT_STATUS_STORAGE_KEY, JSON.stringify(obj));
    } catch (e) {
      logError("Unable to persist assignment status cache", e);
    }
  }

  function cacheAssignmentStatus(assignmentId, status) {
    if (!assignmentId || typeof status === 'undefined' || status === null) {
      return;
    }
    const cache = getAssignmentStatusCache();
    const key = String(assignmentId);
    if (cache.get(key) === status) {
      return;
    }
    cache.set(key, status);
    persistAssignmentStatusCache();
  }

  function getCachedAssignmentStatus(assignmentId) {
    if (!assignmentId) {
      return null;
    }
    const cache = getAssignmentStatusCache();
    return cache.get(String(assignmentId)) || null;
  }

  async function resolveStudentId() {
    if (cachedStudentId) {
      return cachedStudentId;
    }
    if (studentIdPromise) {
      return studentIdPromise;
    }

    studentIdPromise = (async () => {
      let studentId = null;
      try {
        if (window.ENV && window.ENV.student_id) {
          studentId = window.ENV.student_id;
        } else if (window.ENV && window.ENV.current_user && window.ENV.current_user.id) {
          studentId = window.ENV.current_user.id;
        } else {
          const userResponse = await fetch('/api/v1/users/self', { credentials: 'include' });
          if (userResponse.ok) {
            const userData = await userResponse.json();
            studentId = userData.id;
          }
        }
      } catch (e) {
        logError("Could not determine student ID", e);
      } finally {
        studentIdPromise = null;
      }

      if (studentId) {
        cachedStudentId = studentId;
      }
      return studentId;
    })();

    return studentIdPromise;
  }

  function resetStudentIdCache() {
    cachedStudentId = null;
    cachedSignedIn = null;
  }

  const quizButtonDoneClickHandler = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  function rememberOriginalQuizButtonState(button) {
    if (!button.dataset.originalQuizButtonHtml) {
      button.dataset.originalQuizButtonHtml = button.innerHTML;
    }
    if (!button.dataset.originalQuizButtonHref && button.hasAttribute('href')) {
      button.dataset.originalQuizButtonHref = button.getAttribute('href');
    }
    if (!button.dataset.originalQuizButtonTabindex && button.hasAttribute('tabindex')) {
      button.dataset.originalQuizButtonTabindex = button.getAttribute('tabindex');
    }
    if (!button.dataset.originalQuizButtonAriaLabel && button.hasAttribute('aria-label')) {
      button.dataset.originalQuizButtonAriaLabel = button.getAttribute('aria-label');
    }
  }

  function applyQuizButtonDoneState(button) {
    rememberOriginalQuizButtonState(button);
    button.classList.add('quiz-button--done');
    button.innerHTML = 'Quiz Done <span aria-hidden="true">✓</span>';
    button.setAttribute('aria-disabled', 'true');
    button.setAttribute('tabindex', '-1');
    if (button.dataset.originalQuizButtonHref) {
      button.removeAttribute('href');
    }
    button.removeEventListener('click', quizButtonDoneClickHandler);
    button.addEventListener('click', quizButtonDoneClickHandler);
  }

  function resetQuizButtonState(button) {
    button.classList.remove('quiz-button--done');
    if (button.dataset.originalQuizButtonHtml) {
      button.innerHTML = button.dataset.originalQuizButtonHtml;
    }
    if (button.dataset.originalQuizButtonHref) {
      button.setAttribute('href', button.dataset.originalQuizButtonHref);
    }
    if (button.dataset.originalQuizButtonTabindex) {
      button.setAttribute('tabindex', button.dataset.originalQuizButtonTabindex);
    } else {
      button.removeAttribute('tabindex');
    }
    if (button.dataset.originalQuizButtonAriaLabel) {
      button.setAttribute('aria-label', button.dataset.originalQuizButtonAriaLabel);
    } else {
      button.removeAttribute('aria-label');
    }
    button.removeAttribute('aria-disabled');
    button.removeEventListener('click', quizButtonDoneClickHandler);
  }

  function applyQuizButtonStatus(button, status) {
    if (!button) return;

    if (status === 'done') {
      applyQuizButtonDoneState(button);
    } else {
      resetQuizButtonState(button);
    }
  }

  function getAssignmentIdFromUrl(url) {
    if (!url) return null;
    try {
      const match = url.match(/assignments\/(\d+)/);
      if (match && match[1]) {
        return match[1];
      }
    } catch (e) {
      logError("Error parsing assignment ID from URL", e);
    }
    return null;
  }

  let skillQuizButtonUpdatePromise = null;

  async function updateSkillPageQuizButtons() {
    if (skillQuizButtonUpdatePromise) {
      return skillQuizButtonUpdatePromise;
    }

    skillQuizButtonUpdatePromise = (async () => {
      if (!isCoursePage()) return;
      if (document.body.classList.contains('ncademi-core-skills-page')) return;

      const quizButtons = Array.from(document.querySelectorAll('a.quiz-button'));
      if (quizButtons.length === 0) return;

      const courseId = getCourseId();
      if (!courseId) return;

      const buttonDetails = quizButtons.map(button => {
        const assignmentId = button.getAttribute('data-assignment-id') || getAssignmentIdFromUrl(button.getAttribute('href') || '');
        return { button, assignmentId };
      }).filter(detail => detail.assignmentId);

      if (buttonDetails.length === 0) {
        return;
      }

      const statusMap = new Map();
      const missingAssignmentIds = [];

      buttonDetails.forEach(({ assignmentId }) => {
        const cachedStatus = getCachedAssignmentStatus(assignmentId);
        if (cachedStatus) {
          statusMap.set(assignmentId, cachedStatus);
        } else {
          missingAssignmentIds.push(assignmentId);
        }
      });

      const uniqueMissingIds = Array.from(new Set(missingAssignmentIds));
      const signedIn = await waitForSignedInState();

      if (!signedIn) {
        injectSignInBanner();
      }

      if (uniqueMissingIds.length > 0 && signedIn) {
        const studentId = await resolveStudentId();
        if (studentId) {
          const submissions = await fetchSubmissions(courseId, studentId, uniqueMissingIds);
          if (submissions && submissions.length > 0) {
            submissions.forEach(submission => {
              const assignmentId = String(submission.assignment_id);
              const assignment = submission.assignment || {};
              const pointsPossible = typeof assignment.points_possible !== 'undefined'
                ? assignment.points_possible
                : (typeof submission.points_possible !== 'undefined' ? submission.points_possible : 0);
              const status = calculateStatus(submission.score, pointsPossible, submission);
              cacheAssignmentStatus(assignmentId, status);
              statusMap.set(assignmentId, status);
            });
          }
        }
      }

      buttonDetails.forEach(({ button, assignmentId }) => {
        const status = statusMap.get(assignmentId) || null;
        applyQuizButtonStatus(button, status);
      });
    })().catch(err => {
      logError("Error updating skill page quiz button", err);
    }).finally(() => {
      skillQuizButtonUpdatePromise = null;
    });

    return skillQuizButtonUpdatePromise;
  }

  // Inject skip link for accessibility (skip to main content)
  function injectSkipLink() {
    // Find the main content target in priority order:
    // 1. main element (preferred)
    // 2. div#wrapper (if no main element)
    // 3. #content-wrapper (fallback)
    // 4. #content (fallback)
    let mainTarget = document.querySelector('main');
    if (!mainTarget) {
      mainTarget = document.querySelector('div#wrapper');
    }
    if (!mainTarget) {
      mainTarget = document.querySelector('#content-wrapper');
    }
    if (!mainTarget) {
      mainTarget = document.querySelector('#content');
    }
    
    if (!mainTarget) {
      return; // No target found, skip link won't work
    }

    // Ensure target has an ID for the skip link to target
    if (!mainTarget.id) {
      mainTarget.id = 'ncademi-main-content';
    }
    const targetId = mainTarget.id;

    // Check if skip link already exists
    let skipLink = document.querySelector('#ncademi-skip-link');
    if (skipLink) {
      // Update existing skip link href to point to current main target
      skipLink.href = `#${targetId}`;
      return;
    }

    // Create skip link
    skipLink = document.createElement('a');
    skipLink.id = 'ncademi-skip-link';
    skipLink.href = `#${targetId}`;
    skipLink.className = 'ncademi-skip-link';
    skipLink.textContent = 'Skip to main content';
    skipLink.setAttribute('aria-label', 'Skip to main content');

    // Insert as first child of body (before header)
    try {
      document.body.insertBefore(skipLink, document.body.firstChild);
      logOK("Skip link injected");
    } catch (e) {
      logError("Error injecting skip link", e);
    }
  }

  // Check if header exists and is correctly positioned
  function getExistingHeader() {
    const existingHeader = document.querySelector("#content-header");
    if (!existingHeader) return null;
    
    // Check if header is at body.firstChild (correct position)
    // Skip link may be first child, so check if header is first or second
    const bodyChildren = Array.from(document.body.children);
    const headerIndex = bodyChildren.indexOf(existingHeader);
    if (existingHeader.parentNode === document.body && headerIndex >= 0 && headerIndex < 2) {
      return existingHeader;
    }
    
    // Header exists but in wrong position - will need to recreate
    return null;
  }

  // Create the complete header element structure (before DOM insertion)
  function createHeader() {
    // Make sure body exists before trying to insert
    if (!document.body) {
      log("Body not ready yet, cannot create header");
      return null;
    }
    
    // Only remove existing headers if they're in wrong position
    // (getExistingHeader already checked for correct position)
    const existingHeaders = document.querySelectorAll("#content-header");
    existingHeaders.forEach(header => {
      if (header.parentNode !== document.body || header !== document.body.firstChild) {
        header.remove();
      }
    });
    
    log("Creating header element structure");
    const header = document.createElement("header");
    header.id = "content-header";
    header.className = "course-content-header";
    
    // Create and build header-title structure (floated left, static)
    const headerTitle = document.createElement("div");
    headerTitle.className = "ncademi-header-title";
    
    const headerText = document.createElement("span");
    headerText.className = "header-text";
    headerText.innerHTML = "NCADEMI Core<br />Accessibility Skills";
    
    // Build structure: headerText -> headerTitle -> header
    headerTitle.appendChild(headerText);
    header.appendChild(headerTitle);
    
    // Return header structure without inserting into DOM yet
    // This allows nav to be added before DOM insertion to prevent visual shift
    return { header, headerTitle };
  }

  function ensureHeaderNav() {
    const courseId = getCourseId();
    if (!courseId) { 
      log("No course id; skip header/nav"); 
      return; 
    }

    // Update existing header without removing it (prevents visual shift)
    function updateExistingHeader() {
      const existingHeader = getExistingHeader();
      if (!existingHeader) return false;
      
      log("Header exists in correct position, updating active states");
      const headerTitle = existingHeader.querySelector(".ncademi-header-title");
      if (!headerTitle) {
        // If header exists but structure is wrong, need to recreate
        log("Header exists but missing title structure, will recreate");
        return false;
      }
      
      // Check if old wrapper structure exists - if so, recreate with new structure
      const oldWrapper = existingHeader.querySelector(".ncademi-header-wrapper");
      if (oldWrapper) {
        log("Header has old wrapper structure, will recreate with new structure");
        return false;
      }
      
      // Update nav links first (ensures nav exists for responsive classes)
      // These updates are batched - all DOM changes happen before next paint
      injectNav(existingHeader, headerTitle);
      
      // Apply responsive classes immediately (after nav is ready)
      // Apply synchronously to prevent flash of unstyled content
      applyResponsiveClasses(existingHeader);
      
      logOK("Updated existing header without removal");
      return true;
    }

    // Create and inject new header (only if doesn't exist)
    function injectHeaderAndNav() {
      // Make sure body is ready
      if (!document.body) {
        log("Body not ready yet");
        return false;
      }
      
      // Check if header already exists and update it instead
      if (updateExistingHeader()) {
        return true;
      }
      
      // Create complete header structure (not yet in DOM)
      const headerData = createHeader();
      if (!headerData) {
        return false;
      }
      
      const { header, headerTitle } = headerData;
      
      // Build nav structure and add it to header BEFORE DOM insertion
      // This prevents visual shift by ensuring everything is ready at once
      injectNav(header, headerTitle);
      
      // Apply responsive classes BEFORE DOM insertion to prevent layout shift
      // Done synchronously before DOM insertion to avoid any flash
      applyResponsiveClasses(header);
      
      // Ensure header dimensions are locked before insertion
      // This prevents any layout shifts during insertion
      header.style.height = '70px';
      header.style.minHeight = '70px';
      
      // Inject skip link before header (for accessibility)
      injectSkipLink();

      // Now insert the complete header (with title and nav) into DOM in one operation
      // Skip link should be first, so insert header after skip link if it exists
      try {
        const skipLink = document.querySelector('#ncademi-skip-link');
        if (skipLink) {
          // Insert header after skip link
          skipLink.parentNode.insertBefore(header, skipLink.nextSibling);
        } else {
          // No skip link, insert as first child
          document.body.insertBefore(header, document.body.firstChild);
        }
        logOK("Created and inserted complete header element (title + nav)");
        return true;
      } catch (e) {
        logError("Error inserting header into body", e);
        return false;
      }
    }

    // Inject nav into header
    function injectNav(header, headerTitle) {
      // Find or create links wrapper (centered container for nav)
      let linksWrapper = header.querySelector(".ncademi-links-wrapper");
      if (!linksWrapper) {
        linksWrapper = document.createElement("div");
        linksWrapper.className = "ncademi-links-wrapper";
        // Set stable dimensions immediately to prevent layout shift
        // 65px to account for 5px border (70px header - 5px border = 65px)
        linksWrapper.style.height = '65px';
        linksWrapper.style.minHeight = '65px';
        // Insert links wrapper after title (or as first child if no title)
        if (headerTitle && headerTitle.parentNode === header) {
          headerTitle.insertAdjacentElement("afterend", linksWrapper);
        } else {
          header.appendChild(linksWrapper);
        }
        logOK("Links wrapper created");
      }
      
      let nav = header.querySelector("#ncademi-nav");
      if (!nav) {
        nav = document.createElement("div");
        nav.id = "ncademi-nav";
        nav.className = "ncademi-desktop-nav";
        // Insert nav inside links wrapper
        linksWrapper.appendChild(nav);
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

      ensureExternalLoginLink(header);

      // Inject or update nav links
      const existingLinks = nav.querySelectorAll('a');
      const active = getActiveKey(courseId);
      
      if (existingLinks.length === 0) {
        nav.appendChild(createLink(`/courses/${courseId}/pages/start-here`, "Start Here", active === "start-here"));
        nav.appendChild(createLink(`/courses/${courseId}/pages/core-skills`, "Core Skills", active === "home"));
        
        // Always create Progress link, but hide it if user is not signed in
        // This ensures consistent link order (Progress before Feedback)
        const progressLink = createLink(`/courses/${courseId}/grades`, "Progress", active === "progress");
        progressLink.style.display = 'none';
        progressLink.setAttribute('hidden', 'true');
        nav.appendChild(progressLink);
        
        // Check sign-in status and show/hide Progress link accordingly
        if (isUserSignedInFast()) {
          progressLink.style.display = '';
          progressLink.removeAttribute('hidden');
        }
        
        nav.appendChild(createLink(`/courses/${courseId}/pages/feedback`, "Feedback", active === "feedback"));
        
        // Note: Click handlers are handled by event delegation on nav container
        // (set up in injectNav function above) - no need to attach to individual links

        logOK("Populated nav links");
                  } else {
        // Check sign-in status and show/hide Progress link accordingly
        const progressLink = nav.querySelector('a[href*="/grades"]');
        if (progressLink) {
          if (isUserSignedInFast()) {
            progressLink.style.display = '';
            progressLink.removeAttribute('hidden');
          } else {
            progressLink.style.display = 'none';
            progressLink.setAttribute('hidden', 'true');
          }
        }
        
        // Update active state - batch all DOM changes to prevent reflows
        if (active) {
        const linkPatterns = {
          'start-here': '/pages/start-here',
            'home': /\/pages\/core-skills|\/courses\/\d+\/?$/,
          'progress': '/grades',
          'feedback': '/pages/feedback'
        };
        
        // Batch all class/attribute removals first (single reflow)
        existingLinks.forEach(l => {
          l.classList.remove('active');
          l.removeAttribute('aria-current');
          l.setAttribute('tabindex', '0'); // Restore keyboard navigation for inactive links
        });
        
        // Then batch all additions (single reflow)
        const pattern = linkPatterns[active];
          if (pattern) {
        existingLinks.forEach(l => {
          const href = l.getAttribute('href') || '';
              const matches = typeof pattern === 'string' ? href.includes(pattern) : pattern.test(href);
          if (matches) {
            l.classList.add('active');
            l.setAttribute('aria-current', 'page');
            l.setAttribute('tabindex', '-1'); // Remove from keyboard navigation
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
      // Don't set aria-label here - visible link text will be read by screen readers by default
      // Status will be added via aria-label when applyStatusToCoreSkillsLinks runs
      link.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          link.click();
        }
      });
    });
    logOK(`Enhanced A11Y for ${links.length} custom links`);
  }

  // Apply responsive classes to header (can be called before or after DOM insertion)
  function applyResponsiveClasses(header) {
    if (!header) return;
    
    const isMobile = window.innerWidth <= 900;
    const nav = header.querySelector('#ncademi-nav');
    if (!nav) return;

    // Only update classes if they need to change (prevents unnecessary reflows)
    const headerIsMobile = header.classList.contains('ncademi-mobile-header');
    const navIsMobile = nav.classList.contains('ncademi-mobile-nav');
    const bodyIsMobile = document.body.classList.contains('ncademi-mobile-body');
    
    if (isMobile) {
      // Only update if not already mobile
      if (!headerIsMobile) {
        header.classList.remove('ncademi-desktop-header');
        header.classList.add('ncademi-mobile-header');
      }
      if (!navIsMobile) {
        nav.classList.remove('ncademi-desktop-nav');
        nav.classList.add('ncademi-mobile-nav');
      }
      if (!bodyIsMobile) {
        document.body.classList.remove('ncademi-desktop-body');
        document.body.classList.add('ncademi-mobile-body');
      }
    } else {
      // Only update if not already desktop
      if (headerIsMobile) {
        header.classList.remove('ncademi-mobile-header');
        header.classList.add('ncademi-desktop-header');
      }
      if (navIsMobile) {
        nav.classList.remove('ncademi-mobile-nav');
        nav.classList.add('ncademi-desktop-nav');
      }
      if (bodyIsMobile) {
        document.body.classList.remove('ncademi-mobile-body');
        document.body.classList.add('ncademi-desktop-body');
      }
    }
  }

  function handleResponsive() {
    function apply() {
      const header = document.getElementById('content-header');
      if (header) {
        applyResponsiveClasses(header);
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

  function submissionIndicatesCompletion(submission) {
    if (!submission) return false;

    const workflowState = (submission.workflow_state || '').toString().toLowerCase();
    const postedAt = submission.posted_at || submission.graded_at || submission.submitted_at;
    const quizSubmissionState = submission.quiz_submission && submission.quiz_submission.workflow_state
      ? submission.quiz_submission.workflow_state.toString().toLowerCase()
      : '';

    const completeStates = ['complete', 'completed', 'graded', 'finished', 'posted', 'published'];

    if (completeStates.includes(workflowState)) {
      return true;
    }

    if (quizSubmissionState && completeStates.includes(quizSubmissionState)) {
      return true;
    }

    if (postedAt) {
      return true;
    }

    return false;
  }

  // Calculate status using same logic as grades page
  function calculateStatus(score, pointsPossible, submissionContext = null) {
    // Y = score, X = pointsPossible
    if (score === null || score === undefined || score === '-') {
      return submissionIndicatesCompletion(submissionContext) ? 'done' : 'pending'; // Y === '-'
    }
    
    const scoreNum = typeof score === 'string' ? parseFloat(score) : score;
    const pointsNum = typeof pointsPossible === 'string' ? parseFloat(pointsPossible) : pointsPossible;
    
    if (isNaN(scoreNum) || isNaN(pointsNum)) {
      return submissionIndicatesCompletion(submissionContext) ? 'done' : 'pending';
    }
    
    if (scoreNum < pointsNum) {
      return submissionIndicatesCompletion(submissionContext) ? 'done' : 'active'; // Y < X
    } else if (scoreNum === pointsNum && pointsNum > 0) {
      return 'done'; // Y === X
    }
    
    if (submissionIndicatesCompletion(submissionContext)) {
      return 'done';
    }

    return 'pending';
  }

  // Extract assignment IDs and points_possible from Core Skills links
  function extractAssignmentIdsFromLinks() {
    const links = document.querySelectorAll('body.ncademi-core-skills-page .custom-link.small, body.ncademi-core-skills-page .custom-link.large');
    const assignmentIds = [];
    const linkMap = new Map(); // Map assignment ID to link element
    const assignmentsMap = new Map(); // Map assignment ID to { id, points_possible }
    
    links.forEach(link => {
      // First, try to get assignment ID from data-assignment-id attribute (static, preferred)
      let assignmentId = link.getAttribute('data-assignment-id');
      
      // If not found, try to extract from href (fallback for dynamic links)
      if (!assignmentId) {
        const href = link.getAttribute('href') || '';
        // Match pattern: /courses/{courseId}/assignments/{assignmentId}
        const match = href.match(/\/courses\/\d+\/assignments\/(\d+)/);
        if (match && match[1]) {
          assignmentId = match[1];
        }
      }
      
      if (assignmentId) {
        if (!assignmentIds.includes(assignmentId)) {
          assignmentIds.push(assignmentId);
        }
        linkMap.set(assignmentId, link);
        
        // Extract points_possible from data-points-possible attribute (hardcoded in HTML)
        const pointsPossible = link.getAttribute('data-points-possible');
        if (pointsPossible) {
          assignmentsMap.set(assignmentId, {
            id: assignmentId,
            points_possible: parseFloat(pointsPossible) || 0
          });
        }
      }
    });
    
    return { assignmentIds, linkMap, assignmentsMap };
  }


  // Fetch submissions from Canvas API
  async function fetchSubmissions(courseId, studentId, assignmentIds) {
    if (!assignmentIds || assignmentIds.length === 0) {
      log("No assignment IDs to fetch");
      return null;
    }

    // Check cache first (per unique assignment set)
    const assignmentKey = assignmentIds.map(id => String(id)).sort().join('_');
    const cacheKey = `ncademi_submissions_${courseId}_${studentId}_${assignmentKey}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      try {
        const data = JSON.parse(cached);
        const cacheTime = data.timestamp || 0;
        const now = Date.now();
        // Cache for 5 minutes
        if (now - cacheTime < 300000) {
          log("Using cached submissions data");
          return data.submissions;
        }
      } catch (e) {
        logError("Error parsing cached submissions", e);
      }
    }

    try {
      // Build API URL with assignment IDs
      const assignmentParams = assignmentIds.map(id => `assignment_ids[]=${id}`).join('&');
      const url = `/api/v1/courses/${courseId}/students/submissions?student_ids[]=${studentId}&${assignmentParams}&per_page=100&include[]=assignment`;
      
      log(`Fetching submissions from Canvas API: ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        credentials: 'include' // Use Canvas session cookies
      });

      if (!response.ok) {
        logError(`API request failed: ${response.status} ${response.statusText}`);
        return null;
      }

      const submissions = await response.json();
      
      // Cache the results
      sessionStorage.setItem(cacheKey, JSON.stringify({
        submissions: submissions,
        timestamp: Date.now()
      }));
      
      logOK(`Fetched ${submissions.length} submissions from API`);
      return submissions;
    } catch (error) {
      logError("Error fetching submissions from Canvas API", error);
      return null;
    }
  }

  // Apply status to Core Skills links
  function applyStatusToCoreSkillsLinks(submissions, assignmentsMap, linkMap) {
    if (!submissions || !linkMap) return;

    let appliedCount = 0;

    submissions.forEach(submission => {
      const assignmentId = String(submission.assignment_id);
      const link = linkMap.get(assignmentId);
      
      if (!link) return;

      const score = submission.score;
      // Get points_possible from assignments map (not from submission object)
      const assignment = assignmentsMap.get(assignmentId);
      const pointsPossible = assignment ? (assignment.points_possible || 0) : 0;
      const status = calculateStatus(score, pointsPossible, submission);
      
      // Apply data-status attribute
      link.setAttribute('data-status', status);
      cacheAssignmentStatus(assignmentId, status);
      
      // Update aria-label to include status for screen readers
      const linkText = link.textContent.trim() || link.getAttribute('title') || 'Link';
      const statusLabels = {
        'pending': 'Pending',
        'active': 'Active',
        'done': 'Done'
      };
      const statusLabel = statusLabels[status] || status;
      
      // Add aria-label with status - link text will be read, but we need to include status for accessibility
      // (CSS icon is not accessible to screen readers)
      link.setAttribute('aria-label', `${linkText}, Status: ${statusLabel}`);
      
      appliedCount++;
      
      log(`Applied status "${status}" to assignment ${assignmentId} (score: ${score}/${pointsPossible})`);
    });

    if (appliedCount > 0) {
      logOK(`Applied status to ${appliedCount} links on Core Skills page`);
    }
    
    // Only set default pending status for links that have submissions but no status yet
    // Don't set default pending for all links - only show status when user is signed in
    linkMap.forEach((link, assignmentId) => {
      if (!link.hasAttribute('data-status')) {
        // Link has no submission data - don't set default status
        // Status icons will only show for links with actual submission data
      }
    });
  }

  let cachedSignedIn = null;

  function isUserSignedInFast() {
    if (cachedSignedIn === true) {
      return true;
    }

    const hasENVUser = (window.ENV && window.ENV.current_user && window.ENV.current_user.id) ||
                       (window.ENV && window.ENV.current_user_id) ||
                       (window.ENV && window.ENV.student_id);

    if (hasENVUser) {
      cachedSignedIn = true;
      return true;
    }

    return false;
  }

  async function waitForSignedInState(options = {}) {
    const {
      timeout = 2500,
      interval = 200
    } = options;

    if (isUserSignedInFast()) {
      return true;
    }

    const start = Date.now();

    while (Date.now() - start < timeout) {
      await new Promise(resolve => setTimeout(resolve, interval));
      if (isUserSignedInFast()) {
        return true;
      }
    }

    return isUserSignedInFast();
  }

  // Inject status key banner for signed-in users on core-skills page
  async function injectStatusKeyBanner() {
    log("Status key banner: Function called");
    
    if (!document.body.classList.contains('ncademi-core-skills-page')) {
      log("Status key banner: Not on Core Skills page");
      return; // Not on Core Skills page
    }

    // Check if user is signed in
    const signedIn = isUserSignedInFast();
    if (!signedIn) {
      log("Status key banner: User not signed in");
      return; // User not signed in, don't show banner
    }

    // Check if banner was dismissed
    const bannerDismissed = localStorage.getItem('ncademi-status-key-banner-dismissed');
    if (bannerDismissed === 'true') {
      log("Status key banner: Banner was previously dismissed");
      return; // Banner was dismissed
    }

    // Check if banner already exists and is visible
    const existingBanner = document.querySelector('.ncademi-status-key-banner');
    if (existingBanner) {
      const isVisible = window.getComputedStyle(existingBanner).display !== 'none';
      if (isVisible) {
        log("Status key banner: Banner already exists and is visible");
        return; // Banner already injected and visible
      } else {
        // Banner exists but is hidden (dismissed), remove it and continue
        log("Status key banner: Removing hidden banner before re-injecting");
        existingBanner.remove();
      }
    }

    // Find the links container (same logic as sign-in banner)
    let linksContainer = document.querySelector('.course-modules');
    if (!linksContainer) {
      linksContainer = document.querySelector('.custom-container');
    }
    if (!linksContainer) {
      const firstLink = document.querySelector('body.ncademi-core-skills-page .custom-link');
      if (firstLink) {
        linksContainer = firstLink.closest('.custom-row') || firstLink.closest('.custom-container');
      }
    }

    if (!linksContainer) {
      log("Could not find links container for status key banner");
      return;
    }

    // Create banner element
    const banner = document.createElement('div');
    banner.className = 'ncademi-status-key-banner';
    banner.setAttribute('role', 'region');
    banner.setAttribute('aria-label', 'Status icon legend');
    
    // Create label text "Quiz status:"
    const labelText = document.createElement('span');
    labelText.className = 'ncademi-status-key-label';
    labelText.textContent = 'Quiz status:';
    banner.appendChild(labelText);
    
    // Create status items
    const statuses = [
      { status: 'pending', label: 'Pending', icon: 'pending' },
      { status: 'active', label: 'Active', icon: 'active' },
      { status: 'done', label: 'Done', icon: 'done' }
    ];

    statuses.forEach((item, index) => {
      // Create status item
      const statusItem = document.createElement('div');
      statusItem.className = 'ncademi-status-key-item';
      
      // Create icon
      const icon = document.createElement('span');
      icon.className = `ncademi-status-key-icon ${item.icon}`;
      icon.setAttribute('aria-hidden', 'true');
      
      // Create text
      const text = document.createElement('span');
      text.className = 'ncademi-status-key-text';
      text.textContent = item.label;
      
      statusItem.appendChild(icon);
      statusItem.appendChild(text);
      banner.appendChild(statusItem);
    });
    
    // Create dismiss button
    const dismissBtn = document.createElement('button');
    dismissBtn.className = 'ncademi-status-key-banner-dismiss';
    dismissBtn.setAttribute('aria-label', 'Dismiss status key');
    dismissBtn.innerHTML = '×';
    dismissBtn.type = 'button';
    
    // Add dismiss functionality
    dismissBtn.addEventListener('click', function() {
      banner.style.display = 'none';
      localStorage.setItem('ncademi-status-key-banner-dismissed', 'true');
      log("Status key banner dismissed by user");
    });
    
    banner.appendChild(dismissBtn);
    
    // Insert banner directly below the links container
    if (linksContainer.nextSibling) {
      linksContainer.parentNode.insertBefore(banner, linksContainer.nextSibling);
    } else {
      linksContainer.parentNode.appendChild(banner);
    }
    
    // Match banner width to container width (up to 640px max-width)
    const updateBannerWidth = () => {
      const containerWidth = linksContainer.offsetWidth || linksContainer.getBoundingClientRect().width;
      if (containerWidth > 0) {
        const bannerWidth = Math.min(containerWidth, 640);
        banner.style.width = `${bannerWidth}px`;
      }
    };
    
    requestAnimationFrame(() => {
      updateBannerWidth();
      
      const resizeHandler = () => {
        if (banner.style.display !== 'none') {
          updateBannerWidth();
        }
      };
      
      window.addEventListener('resize', resizeHandler, { passive: true });
      banner._resizeHandler = resizeHandler;
    });
    
    logOK("Status key banner injected for signed-in user");
  }

  // Inject sign-in banner for users not signed in on core-skills page
  async function injectSignInBanner() {
    if (!document.body.classList.contains('ncademi-core-skills-page')) {
      return; // Not on Core Skills page
    }

    // Check if banner was already dismissed this session
    const bannerDismissed = sessionStorage.getItem('ncademi-signin-banner-dismissed');
    if (bannerDismissed === 'true') {
      return; // Banner already dismissed
    }

    // Check if user is signed in
    const signedIn = isUserSignedInFast();
    if (signedIn) {
      return; // User is signed in, don't show banner
    }

    // Check if banner already exists
    if (document.querySelector('.ncademi-signin-banner')) {
      return; // Banner already injected
    }

    // Find the links container (course-modules or first custom-container)
    let linksContainer = document.querySelector('.course-modules');
    if (!linksContainer) {
      linksContainer = document.querySelector('.custom-container');
    }
    if (!linksContainer) {
      // Fallback: find first container with custom-link elements
      const firstLink = document.querySelector('body.ncademi-core-skills-page .custom-link');
      if (firstLink) {
        linksContainer = firstLink.closest('.custom-row') || firstLink.closest('.custom-container');
      }
    }

    if (!linksContainer) {
      log("Could not find links container for sign-in banner");
      return;
    }

    // Create banner element
    const banner = document.createElement('div');
    banner.className = 'ncademi-signin-banner';
    banner.setAttribute('role', 'alert');
    banner.setAttribute('aria-live', 'polite');
    
    // Create message text with link
    const message = document.createElement('p');
    message.className = 'ncademi-signin-banner-message';
    message.innerHTML = 'Create a <a href="https://usucourses.instructure.com/enroll/G87RJM" target="_blank" rel="noopener noreferrer">free USU Canvas account</a> to take quizzes.';
    
    // Create dismiss button (X)
    const dismissBtn = document.createElement('button');
    dismissBtn.className = 'ncademi-signin-banner-dismiss';
    dismissBtn.setAttribute('aria-label', 'Dismiss sign-in message');
    dismissBtn.innerHTML = '×'; // × symbol
    dismissBtn.type = 'button';
    
    // Add dismiss functionality
    dismissBtn.addEventListener('click', function() {
      banner.style.display = 'none';
      sessionStorage.setItem('ncademi-signin-banner-dismissed', 'true');
      log("Sign-in banner dismissed by user");
    });
    
    // Build structure
    banner.appendChild(message);
    banner.appendChild(dismissBtn);
    
    // Insert banner directly above the links container
    linksContainer.parentNode.insertBefore(banner, linksContainer);
    
    // Match banner width to container width after insertion (up to 640px max-width)
    // Use requestAnimationFrame to ensure layout is complete
    const updateBannerWidth = () => {
      const containerWidth = linksContainer.offsetWidth || linksContainer.getBoundingClientRect().width;
      if (containerWidth > 0) {
        // Use container width but respect max-width of 640px
        const bannerWidth = Math.min(containerWidth, 640);
        banner.style.width = `${bannerWidth}px`;
      }
    };
    
    requestAnimationFrame(() => {
      updateBannerWidth();
      
      // Update width on window resize to keep banner aligned with container
      const resizeHandler = () => {
        if (banner.style.display !== 'none') {
          updateBannerWidth();
        }
      };
      
      window.addEventListener('resize', resizeHandler, { passive: true });
      
      // Store resize handler for cleanup if needed
      banner._resizeHandler = resizeHandler;
    });
    
    logOK("Sign-in banner injected for non-signed-in user");
  }

  // Main function to update Core Skills checkmarks
  async function updateCoreSkillsCheckmarks() {
    if (!document.body.classList.contains('ncademi-core-skills-page')) {
      return; // Not on Core Skills page
    }

    // Check if user is signed in to Canvas
    // If not signed in, do not show status icons
    const signedIn = await waitForSignedInState({ timeout: 3000 });
    if (!signedIn) {
      log("User not signed in to Canvas, status icons not shown");
      injectSignInBanner();
      return;
    }

    const courseId = getCourseId();
    if (!courseId) {
      log("No course ID found, cannot fetch submissions");
      return;
    }

    const studentId = await resolveStudentId();

    if (!studentId) {
      log("No student ID found, cannot fetch submissions");
      return;
    }

    // Extract assignment IDs and points_possible from links (hardcoded in HTML)
    const { assignmentIds, linkMap, assignmentsMap } = extractAssignmentIdsFromLinks();
    
    if (assignmentIds.length === 0) {
      log("No assignment IDs found in Core Skills links");
      return;
    }

    // Filter out assignments that already have status "done" - only fetch those that might have changed
    const assignmentsToCheck = assignmentIds.filter(assignmentId => {
      const link = linkMap.get(assignmentId);
      if (!link) return true; // Include if link not found (shouldn't happen)
      
      const currentStatus = link.getAttribute('data-status');
      if (currentStatus === 'done') {
        log(`Skipping assignment ${assignmentId} - already marked as done`);
        return false; // Skip "done" assignments
      }
      return true; // Include pending/active/missing assignments
    });

    if (assignmentsToCheck.length === 0) {
      log("All assignments are already marked as done, no API calls needed");
      // Still enable status icons display if not already enabled
      document.body.classList.add('ncademi-status-enabled');
      return;
    }

    log(`Found ${assignmentIds.length} total assignment IDs, checking ${assignmentsToCheck.length} that are not done`);

    // assignmentsMap is already populated from HTML data-points-possible attributes
    if (assignmentsMap.size === 0) {
      log("No points_possible data found in link attributes");
      return;
    }

    // Fetch submissions only for assignments that are not "done"
    const submissions = await fetchSubmissions(courseId, studentId, assignmentsToCheck);
    
    if (!submissions || submissions.length === 0) {
      log("No submissions data available for non-done assignments");
      // Still enable status icons display if not already enabled
      document.body.classList.add('ncademi-status-enabled');
      return;
    }

    // Apply status to links (with assignments data for points_possible from HTML)
    applyStatusToCoreSkillsLinks(submissions, assignmentsMap, linkMap);
    
    // Enable status icons display - add class to body to show status icons
    document.body.classList.add('ncademi-status-enabled');
    
    // Inject status key banner now that status is enabled
    // Use requestAnimationFrame to ensure DOM and CSS are ready
    requestAnimationFrame(() => {
      injectStatusKeyBanner();
    });
    
    logOK("Status icons enabled and applied for signed-in user");
  }

  function updateExternalLoginLinkState(link, loginMarkup) {
    if (!link) return;

    const signedIn = isUserSignedInFast();
    const wrapper = link.parentElement;

    if (signedIn) {
      link.style.display = 'none';
      link.setAttribute('hidden', 'true');
      if (wrapper) wrapper.style.display = 'none';
    } else {
      link.innerHTML = loginMarkup;
      link.href = 'https://usucourses.instructure.com/';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.setAttribute('aria-label', 'Log in to USU Canvas (opens in a new window)');
      link.removeAttribute('hidden');
      link.style.display = '';
      if (wrapper) wrapper.style.display = '';
    }
  }

  function ensureExternalLoginLink(header) {
    const resolvedHeader = header || document.getElementById('content-header');
    if (!resolvedHeader) return;

    let externalWrapper = resolvedHeader.querySelector('.ncademi-external-link-wrapper');
    if (!externalWrapper) {
      externalWrapper = document.createElement('div');
      externalWrapper.className = 'ncademi-external-link-wrapper';
      resolvedHeader.appendChild(externalWrapper);
      logOK("External login wrapper created");
    }

    const externalLinkMarkup = 'Log in to USU Canvas <span class="external_link_icon" role="presentation"><svg viewBox="0 0 1920 1920" xmlns="http://www.w3.org/2000/svg"><path d="M1226.667 267c88.213 0 160 71.787 160 160v426.667H1280v-160H106.667v800C106.667 1523 130.56 1547 160 1547h1066.667c29.44 0 53.333-24 53.333-53.333v-213.334h106.667v213.334c0 88.213-71.787 160-160 160H160c-88.213 0-160-71.787-160-160V427c0-88.213 71.787-160 160-160Zm357.706 442.293 320 320c20.8 20.8 20.8 54.614 0 75.414l-320 320-75.413-75.414 228.907-228.906H906.613V1013.72h831.254L1508.96 784.707l75.413-75.414Zm-357.706-335.626H160c-29.44 0-53.333 24-53.333 53.333v160H1280V427c0-29.333-23.893-53.333-53.333-53.333Z" fill-rule="evenodd"></path></svg><span class="screenreader-only">Links to an external site.</span></span>';
    let externalLink = externalWrapper.querySelector('.ncademi-external-link');
    if (!externalLink) {
      externalLink = document.createElement('a');
      externalLink.className = 'ncademi-external-link';
      externalWrapper.appendChild(externalLink);
      logOK("External login link injected");
    }

    updateExternalLoginLinkState(externalLink, externalLinkMarkup);
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
      let statusValue = '';

      if (Y === '-') {
        statusText = 'Pending';
        statusValue = 'pending';
      } else {
        const scoreY = parseInt(Y, 10);
        if (isNaN(scoreY)) return;

        if (scoreY < X) {
          statusText = 'Active';
          statusValue = 'active';
        } else {
          statusText = 'Done';
          statusValue = 'done';
        }
      }

      // Structure: icon first (via ::before), then 20px space, then text
      // Icon is decorative (nearby text provides alternative text) - CSS ::before pseudo-element
      // Styles are now handled by CSS using data-status attribute (no inline styles needed)
      statusCell.innerHTML = `<span class="ncademi-status-text">${statusText}</span>`;
      statusCell.setAttribute('data-status', statusValue);
      statusCell.classList.add('ncademi-status');
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
    // Reset flag on navigation to allow re-injection if needed
    // But check if title already exists in DOM to prevent duplicates
    const existingTitle = document.querySelector('h1.page-title');
    if (existingTitle) {
      // Title exists, check if it's in the right place
      const gradesTable = document.querySelector('table#grades_summary');
      if (gradesTable && existingTitle.nextElementSibling === gradesTable) {
        // Title is correctly positioned, no need to re-inject
        return true;
      }
    }

    const gradesTable = document.querySelector('table#grades_summary');
    if (!gradesTable) return false;

    // Remove existing title if it's in wrong position
    if (existingTitle) {
      existingTitle.remove();
    }

    // Create the h1.page-title element
    const pageTitle = document.createElement('h1');
    pageTitle.className = 'page-title';
    pageTitle.textContent = 'Progress';

    // Insert before the grades table (ensures correct order)
    gradesTable.parentNode.insertBefore(pageTitle, gradesTable);
    
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

    // Remove existing overlay if it exists (prevents duplicate overlays during navigation)
    const existingOverlay = document.getElementById('content-wrapper-overlay');
    if (existingOverlay) {
      existingOverlay.remove();
    }

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

  // Setup Canvas navigation listener (for AJAX navigation)
  function setupCanvasNavigationListener() {
    // Prevent multiple wraps
    if (window.ncademiNavigationListenerSet) {
      return;
    }
    
    // Listen for Canvas route changes (Backbone router events)
    if (window.Backbone && window.Backbone.history) {
      // Only wrap if not already wrapped
      if (!window.Backbone.history.navigate._ncademiWrapped) {
        const originalNavigate = window.Backbone.history.navigate;
        window.Backbone.history.navigate = function(fragment, options) {
          const result = originalNavigate.apply(this, arguments);
          
          // After navigation, update header without removing it
          // Use requestAnimationFrame to ensure update happens after Canvas's DOM changes
          if (options && options.trigger) {
            // Use double RAF to ensure we're after Canvas's layout changes
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                const courseId = getCourseId();
                if (courseId && !isAdmin()) {
                  log("Canvas navigation detected, updating header and page logic");
                  ensureHeaderNav();
                  // Apply page-specific logic after header is updated
                  applyPageSpecificLogic();
                }
              });
            });
          }
          
          return result;
        };
        window.Backbone.history.navigate._ncademiWrapped = true;
        logOK("Canvas navigation listener set up");
      }
    }
    
    // Also listen for DOM ready events that Canvas fires after AJAX navigation
    // (only set up once)
    if (!window.ncademiDOMReadyListenerSet) {
      document.addEventListener('DOMContentLoaded', function() {
        const courseId = getCourseId();
        if (courseId && !isAdmin() && window.ncademiInitializedV13) {
          // Header already exists, just update it
          ensureHeaderNav();
        }
      });
      window.ncademiDOMReadyListenerSet = true;
    }
    
    window.ncademiNavigationListenerSet = true;
  }

  // Initialize only once per page load
  if (window.ncademiInitializedV13) {
    log("Already initialized, updating header for navigation");
    // Header may already exist from previous navigation - update it
    ensureHeaderNav();
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

  // Ensure container widths remain consistent across pages to prevent visual shifts
  function enforceContainerWidths() {
    const containers = [
      { selector: '#not_right_side.ic-app-main-content', props: ['width', 'maxWidth', 'paddingLeft', 'paddingRight', 'marginLeft', 'marginRight'] },
      { selector: 'div#main.ic-Layout-columns, .ic-Layout-columns', props: ['width', 'maxWidth', 'paddingRight', 'marginLeft', 'marginRight'] },
      { selector: '#content-wrapper', props: ['width', 'maxWidth', 'paddingLeft', 'paddingRight', 'marginLeft', 'marginRight'] },
      { selector: 'div#content.ic-Layout-contentMain', props: ['width', 'maxWidth', 'paddingRight', 'marginLeft', 'marginRight'] }
    ];

    containers.forEach(({ selector, props }) => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        if (!el) return;
        
        // Ensure width is set to 100%
        if (props.includes('width')) {
          const computedWidth = window.getComputedStyle(el).width;
          if (computedWidth !== '100%' && computedWidth !== window.innerWidth + 'px') {
            el.style.width = '100%';
          }
        }
        
        // Ensure max-width is set correctly
        if (props.includes('maxWidth')) {
          const computedMaxWidth = window.getComputedStyle(el).maxWidth;
          if (selector.includes('#not_right_side') || selector.includes('#main')) {
            if (computedMaxWidth !== '100vw' && computedMaxWidth !== 'none') {
              el.style.maxWidth = '100vw';
            }
          } else {
            if (computedMaxWidth !== '100%') {
              el.style.maxWidth = '100%';
            }
          }
        }
        
        // Ensure padding-right is 0
        if (props.includes('paddingRight')) {
          const computedPaddingRight = window.getComputedStyle(el).paddingRight;
          if (computedPaddingRight !== '0px') {
            el.style.paddingRight = '0';
          }
        }
        
        // Ensure margin-left and margin-right are 0
        if (props.includes('marginLeft')) {
          const computedMarginLeft = window.getComputedStyle(el).marginLeft;
          if (computedMarginLeft !== '0px') {
            el.style.marginLeft = '0';
          }
        }
        
        if (props.includes('marginRight')) {
          const computedMarginRight = window.getComputedStyle(el).marginRight;
          if (computedMarginRight !== '0px') {
            el.style.marginRight = '0';
          }
        }
      });
    });
  }

  // Setup MutationObserver to monitor container size changes and enforce consistent widths
  function setupContainerWidthMonitor() {
    // Prevent multiple observers
    if (window.ncademiContainerWidthMonitor) {
      return;
    }

    const observer = new MutationObserver((mutations) => {
      let shouldEnforce = false;
      
      mutations.forEach((mutation) => {
        // Check if containers were added or modified
        if (mutation.type === 'childList' || mutation.type === 'attributes') {
          const target = mutation.target;
          if (target && (
            target.id === 'not_right_side' || 
            target.id === 'main' || 
            target.id === 'content-wrapper' || 
            target.id === 'content' ||
            target.classList.contains('ic-Layout-columns') ||
            target.classList.contains('ic-app-main-content') ||
            target.classList.contains('ic-Layout-contentMain')
          )) {
            shouldEnforce = true;
          }
        }
      });
      
      if (shouldEnforce) {
        // Use requestAnimationFrame to batch enforcement
        requestAnimationFrame(() => {
          enforceContainerWidths();
        });
      }
    });

    // Observe container elements and their style changes
    const observeTargets = () => {
      const targets = [
        document.querySelector('#not_right_side'),
        document.querySelector('#main'),
        document.querySelector('#content-wrapper'),
        document.querySelector('#content')
      ].filter(Boolean);
      
      targets.forEach(target => {
        observer.observe(target, {
          attributes: true,
          attributeFilter: ['style', 'class'],
          childList: true,
          subtree: true
        });
      });
    };

    // Start observing
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', observeTargets);
    } else {
      observeTargets();
    }

    // Re-observe after navigation (when DOM changes)
    window.ncademiContainerWidthMonitor = observer;
    
    // Also observe document body for container additions
    const bodyObserver = new MutationObserver(() => {
      observeTargets();
    });
    bodyObserver.observe(document.body, { childList: true, subtree: true });
    
    window.ncademiContainerWidthMonitorBody = bodyObserver;
  }

  function applyPageSpecificLogic() {
    const activeKey = getActiveKey(getCourseId());
    const courseId = getCourseId();
    const currentPath = window.location.pathname;
    const isCoreSkillsPage = courseId && currentPath.includes(`/courses/${courseId}/pages/core-skills`);
    const isDefaultCourseHome = courseId && (currentPath === `/courses/${courseId}` || currentPath === `/courses/${courseId}/`);
    
    // Ensure skip link exists and targets correct element
    injectSkipLink();
    
    // Enforce consistent container widths first to prevent visual shifts
    enforceContainerWidths();
    
    // Reset page-specific flags on navigation to allow re-injection if needed
    // This ensures page-specific elements can be re-injected during AJAX navigation
    if (activeKey !== "progress") {
      window.ncademiPageTitleInjected = false;
      window.ncademiGradeIconsInjected = false;
      window.ncademiStatusPopulated = false;
    }
    
    // Update body classes synchronously (before any layout-affecting operations)
    if (activeKey === "home") {
      document.body.classList.add('ncademi-home-page');
    } else {
      document.body.classList.remove('ncademi-home-page');
    }
    
    if (isCoreSkillsPage) {
      document.body.classList.add('ncademi-core-skills-page');
      
      // Check if user is signed in and inject appropriate banners
      injectSignInBanner();
      // Ensure status-enabled class is present before injecting banner
      if (document.body.classList.contains('ncademi-status-enabled')) {
        requestAnimationFrame(() => {
          injectStatusKeyBanner();
        });
      }
      
      // Update checkmarks with status from API (only if signed in)
      // Only fetches quizzes that are NOT "done" - more efficient
      updateCoreSkillsCheckmarks();
      
      // Also set up observer to handle dynamically loaded links
      if (!window.ncademiCoreSkillsObserverSet) {
        const observer = new MutationObserver(() => {
          // Re-check for links and update status on Core Skills page
          if (document.body.classList.contains('ncademi-core-skills-page')) {
            if (isUserSignedInFast()) {
              updateCoreSkillsCheckmarks();
            }
          }
          // Re-check for banner injection if container appears
          injectSignInBanner();
          if (document.body.classList.contains('ncademi-status-enabled')) {
            requestAnimationFrame(() => {
              injectStatusKeyBanner();
            });
          }
          updateSkillPageQuizButtons();
        });
        observer.observe(document.body, {
          childList: true,
          subtree: true
        });
        window.ncademiCoreSkillsObserverSet = true;
        
        // Also try after a short delay to catch any late-loading content
        setTimeout(() => {
          if (document.body.classList.contains('ncademi-core-skills-page')) {
            if (isUserSignedInFast()) {
              updateCoreSkillsCheckmarks();
            }
          }
          injectSignInBanner();
          if (document.body.classList.contains('ncademi-status-enabled')) {
            requestAnimationFrame(() => {
              injectStatusKeyBanner();
            });
          }
          updateSkillPageQuizButtons();
        }, 1000);
      }
    } else {
      document.body.classList.remove('ncademi-core-skills-page');
    }
    
    if (isDefaultCourseHome) {
      document.body.classList.add('ncademi-default-course-home');
    } else {
      document.body.classList.remove('ncademi-default-course-home');
    }
    
    // Inject content wrapper overlay (after body classes are set)
    // Inject immediately to prevent layout shift - overlay is positioned absolutely so won't affect layout
    injectContentWrapperOverlay();
    updateSkillPageQuizButtons();
    
    // Handle grades page (Progress)
    // Note: H1 heading hiding is now handled by CSS (no inline styles needed)
    if (activeKey === "progress") {

      // Remove editable elements from keyboard navigation (minimal JS, just sets tabindex)
      function removeFromKeyboardNavigation() {
        // Score column grade elements (the clickable "3" or score value) - PRIMARY TARGET
        const gradeElements = document.querySelectorAll('.assignment_score .grade');
        gradeElements.forEach(el => {
          el.setAttribute('tabindex', '-1');
        });

        // Score column inputs and editable elements
        const scoreInputs = document.querySelectorAll('.assignment_score input, .assignment_score [contenteditable="true"], .assignment_score [contenteditable]');
        scoreInputs.forEach(el => {
          el.setAttribute('tabindex', '-1');
        });

        // Sorting dropdown
        const sortMenu = document.querySelector('#assignment_sort_order_select_menu');
        if (sortMenu) {
          sortMenu.setAttribute('tabindex', '-1');
        }

        // Apply button
        const applyButton = document.querySelector('#apply_select_menus');
        if (applyButton) {
          applyButton.setAttribute('tabindex', '-1');
        }

        // What-If inputs in sidebar
        const whatIfInputs = document.querySelectorAll('#student-grades-whatif input');
        whatIfInputs.forEach(input => {
          input.setAttribute('tabindex', '-1');
        });

        // Revert button
        const revertButton = document.querySelector('#student-grades-revert button, .revert_all_scores_link');
        if (revertButton) {
          revertButton.setAttribute('tabindex', '-1');
        }
      }

      // Remove from keyboard navigation immediately and on DOM changes
      removeFromKeyboardNavigation();
      
      // Use MutationObserver to catch dynamically added elements
      const keyboardNavObserver = new MutationObserver(() => {
        removeFromKeyboardNavigation();
      });
      keyboardNavObserver.observe(document.body, { 
        childList: true, 
        subtree: true,
        attributes: true,
        attributeFilter: ['class']
      });
      // Store for potential cleanup
      window.ncademiKeyboardNavObserver = keyboardNavObserver;
      
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

      // Use requestAnimationFrame to ensure setup happens after DOM is ready
      requestAnimationFrame(() => {
        if (!setupObserver()) {
          requestAnimationFrame(() => {
            setupObserver();
          });
        }
      });
    }
  }


  waitForDOM(() => {
    if (!isCoursePage()) { 
      log("Not a course page; skipping");
      return;
    }
    
    // Inject skip link early (for accessibility)
    injectSkipLink();
    
    // Inject full-body overlay for redirect (must be before header injection)
    injectBodyOverlayForRedirect();
    
    // Setup container width monitor to prevent visual shifts (must be early)
    setupContainerWidthMonitor();
    
    // Setup listener for Canvas AJAX navigation (must be before ensureHeaderNav)
    setupCanvasNavigationListener();
    
    // Ensure header/nav exists or is updated (checks for existing header first)
    ensureHeaderNav();
    
    // Ensure skip link is in correct position (should be first child)
    const skipLink = document.querySelector('#ncademi-skip-link');
    if (skipLink && skipLink !== document.body.firstChild) {
      document.body.insertBefore(skipLink, document.body.firstChild);
    }
    
    // Setup responsive handler (will update existing header immediately)
    handleResponsive();
    enhanceCustomLinksA11Y();
    
    // Apply page-specific logic (body classes, overlays, page-specific enhancements)
    applyPageSpecificLogic();
    
    window.ncademiInitializedV13 = true;
    logOK("Initialized: v13 nav + A11Y + Container Width Enforcement + Skip Link");
  });
})();