/**
 * NCADEMI Navigation JavaScript (NCAS23)
 * Always injects complete header element - no HTML header elements needed
 * 
 * Goal: Preserve exact visuals with minimal JS.
 * - Keep top nav bar in current location and styling
 * - Avoid DOM rewrites (no body replacement, no content moves)
 * - Rely on CSS for layout/chrome hiding; JS just wires nav and A11Y
 * - Header element is created entirely via JavaScript and injected at body.firstChild
 *
 * Structure (NCAS23):
 * - Title floats left (static, independent)
 * - Links wrapper centers on full header width (overlaps title)
 */

(function () {
  "use strict";

  const LOG_PREFIX = "🚀 NCADEMI Navigation NCAS23";
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

  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /* CORE SKILLS PAGE CODE DISABLED - NCAS23
  async function runCoreSkillsStatusUpdate(attempt = 0) {
    if (coreSkillsStatusDisabled) {
      if (!coreSkillsStatusState.skipLogged) {
        log("scheduleCoreSkillsStatusUpdate: status updates disabled for non-signed-in session");
        coreSkillsStatusState.skipLogged = true;
      }
      return true;
    }

    resetCoreSkillsStatusStateForCurrentPath();
    log(`scheduleCoreSkillsStatusUpdate: attempt ${attempt}`);

    // Check if user was redirected from Start Here (flag indicates user is logged in)
    const loggedInRedirect = sessionStorage.getItem('ncademi-logged-in-redirect') === 'true';
    let signedIn;
    
    if (loggedInRedirect) {
      // User was redirected from Start Here, already verified as logged in
      signedIn = true;
      log("runCoreSkillsStatusUpdate: User verified as logged in from Start Here redirect");
    } else {
      signedIn = await ensureSignedInState({ timeout: 3000 });
    }
    
    if (!signedIn) {
      coreSkillsStatusDisabled = true;
      coreSkillsStatusState.suppressed = true;
      if (!coreSkillsStatusState.skipLogged) {
        log("scheduleCoreSkillsStatusUpdate: user not signed in, skipping status updates");
        coreSkillsStatusState.skipLogged = true;
      }
      injectSignInBanner();
      return true;
    }

    const success = await updateCoreSkillsCheckmarks({ signedIn: true });
    if (success) {
      coreSkillsStatusState.suppressed = false;
      coreSkillsStatusState.skipLogged = false;
      log(`scheduleCoreSkillsStatusUpdate: success on attempt ${attempt}`);
      return true;
    }
    if (attempt >= MAX_CORE_SKILLS_STATUS_ATTEMPTS - 1) {
      logError("scheduleCoreSkillsStatusUpdate: reached max attempts without applying statuses");
      return false;
    }
    log(`scheduleCoreSkillsStatusUpdate: retrying in ${CORE_SKILLS_STATUS_RETRY_DELAY}ms (attempt ${attempt + 1})`);
    await delay(CORE_SKILLS_STATUS_RETRY_DELAY);
    return runCoreSkillsStatusUpdate(attempt + 1);
  }

  /* CORE SKILLS PAGE CODE DISABLED - NCAS23
  function scheduleCoreSkillsStatusUpdate(options = {}) {
    const force = options.force === true;
    resetCoreSkillsStatusStateForCurrentPath();
    if ((coreSkillsStatusDisabled || coreSkillsStatusState.suppressed) && !force) {
      return Promise.resolve(false);
    }
    if (!coreSkillsStatusPromise || force) {
      const runPromise = runCoreSkillsStatusUpdate().finally(() => {
        coreSkillsStatusReady = true;
        if (coreSkillsStatusPromise === runPromise) {
          coreSkillsStatusPromise = null;
        }
        log("scheduleCoreSkillsStatusUpdate: finishing");
      });
      coreSkillsStatusReady = false;
      coreSkillsStatusPromise = runPromise;
    }
    return coreSkillsStatusPromise;
  }
  */

  /* CORE SKILLS PAGE CODE DISABLED - NCAS23
  async function waitForCoreSkillsStatusIfNeeded() {
    if (!document.body.classList.contains('ncademi-core-skills-page')) {
      return;
    }
    if (coreSkillsStatusReady) {
      return;
    }
    if (coreSkillsStatusPromise) {
      try {
        await coreSkillsStatusPromise;
      } catch (err) {
        logError("waitForCoreSkillsStatusIfNeeded: status promise rejected", err);
      }
    }
  }
  */

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
    
    // All users on course home default to "Start Here" active state
    // This prevents visual flash when redirect happens
    const isCourseHome = p === `/courses/${courseId}` || p === `/courses/${courseId}/`;
    if (isCourseHome) {
      return "start-here";
    }
    
    if (p.includes("/pages/core-skills")) return "home";
    if (p === `/courses/${courseId}/grades` || p === `/courses/${courseId}/grades/` || p.startsWith(`/courses/${courseId}/grades`)) return "progress";
    if (p.includes("/pages/feedback")) return "feedback";
    return null;
  }

  function createLink(href, text, active) {
    const a = document.createElement("a");
    a.href = href;
    a.textContent = text;
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
  const CORE_SKILL_PATH_STORAGE_KEY = 'ncademi_core_skill_paths';
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

  function getCourseDisplayName() {
    if (window.ENV) {
      const contextName = ENV.current_context && ENV.current_context.name;
      if (contextName) {
        return contextName.trim();
      }
      const course = ENV.course;
      if (course && course.name) {
        return course.name.trim();
      }
    }

    const headerText = document.querySelector('.ncademi-header-title .header-text');
    if (headerText) {
      return headerText.textContent.replace(/\s+/g, ' ').trim();
    }

    const breadcrumb = document.querySelector('#breadcrumbs li:nth-child(2) .ellipsible');
    if (breadcrumb) {
      return breadcrumb.textContent.replace(/\s+/g, ' ').trim();
    }

    return '';
  }

  function applyProgressPageTitles() {
    if (!document.body.classList.contains('ncademi-progress-page')) {
      return;
    }

    const courseName = getCourseDisplayName() || 'Course';
    const desiredTitle = `Progress: ${courseName}`;

    if (document.title !== desiredTitle) {
      document.title = desiredTitle;
      log(`applyProgressPageTitles: document.title set to "${desiredTitle}"`);
    }

    const pageTitle = document.querySelector('h1.page-title');
    if (pageTitle && pageTitle.textContent.trim() !== 'Progress') {
      pageTitle.textContent = 'Progress';
      log("applyProgressPageTitles: page heading normalized to \"Progress\"");
    }
  }

  function normalizePathname(pathname) {
    if (!pathname) return '';
    return String(pathname).replace(/\/+$/, '');
  }

  /**
   * Create or get existing full-body overlay
   * Overlay persists across redirects if possible, or creates new one seamlessly
   */
  function createOrGetOverlay() {
    let overlay = document.getElementById('ncademi-loading-overlay');
    
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'ncademi-loading-overlay';
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
      
      // Create message text container
      const messageText = document.createElement('div');
      messageText.id = 'ncademi-loading-overlay-message';
      messageText.style.cssText = `
        font-size: 2rem;
        text-align: center;
        opacity: 1;
        transition: opacity 400ms ease;
      `;
      
      overlay.appendChild(messageText);
      
      // Append directly to body to ensure it's always on top (covers everything including nav bar)
      if (document.body) {
        document.body.appendChild(overlay);
      } else {
        // If body doesn't exist yet, wait for DOM and then append
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', () => {
            if (document.body) {
              document.body.appendChild(overlay);
            }
          });
        }
      }
    }
    
    return overlay;
  }

  /**
   * Update overlay message text
   */
  function updateOverlayMessage(message) {
    const overlay = document.getElementById('ncademi-loading-overlay');
    if (overlay) {
      const messageText = overlay.querySelector('#ncademi-loading-overlay-message');
      if (messageText) {
        // Ensure opacity is 1 and transition is set
        if (!messageText.style.transition) {
          messageText.style.transition = 'opacity 400ms ease';
        }
        messageText.style.opacity = '1';
        messageText.textContent = message;
      }
    }
  }

  /**
   * Cross-fade overlay message (fade out old, fade in new)
   */
  function crossFadeOverlayMessage(newMessage) {
    const overlay = document.getElementById('ncademi-loading-overlay');
    if (!overlay) return;
    
    const messageText = overlay.querySelector('#ncademi-loading-overlay-message');
    if (!messageText) return;
    
    // Add transition for opacity if not already present
    if (!messageText.style.transition) {
      messageText.style.transition = 'opacity 400ms ease';
    }
    
    // Fade out current message
    messageText.style.opacity = '0';
    
    // After fade out, update text and fade in
    setTimeout(() => {
      messageText.textContent = newMessage;
      messageText.style.opacity = '1';
    }, 400);
  }

  /**
   * Preload Core Skills page assets (HTML and images)
   * Called after Start Here page loads for non-logged-in users
   */
  function preloadCoreSkillsAssets() {
    const courseId = getCourseId();
    if (!courseId) return;
    
    const coreSkillsPath = `/courses/${courseId}/pages/core-skills`;
    
    // Prefetch the Core Skills page HTML
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = coreSkillsPath;
    link.as = 'document';
    document.head.appendChild(link);
    log('Prefetching Core Skills page HTML');
    
    // Preload skill icon images (known file IDs from Core Skills page)
    // These are the skill module icons that appear on the Core Skills page
    const skillImageIds = [
      '1197429', // Alternative Text
      '1197430', // Captions
      '1197431', // Clear Writing
      '1197432', // Color Use
      '1197421', // Headings
      '1197434', // Links
      '1197435', // Lists
      '1197436', // Tables
      '1197433'  // Text Contrast
    ];
    
    skillImageIds.forEach((fileId) => {
      const imgLink = document.createElement('link');
      imgLink.rel = 'preload';
      imgLink.href = `https://usucourses.instructure.com/courses/${courseId}/files/${fileId}/preview`;
      imgLink.as = 'image';
      document.head.appendChild(imgLink);
    });
    
    log(`Preloading ${skillImageIds.length} Core Skills icon images`);
    
    // Inject sign-in banner at the same time (will only inject if on Core Skills page)
    injectSignInBanner();
  }

  /**
   * Programmatically detect when page body is loaded
   * Waits for content-wrapper and its content to be ready
   */
  function waitForPageBodyLoaded() {
    return new Promise((resolve) => {
      // First wait for DOM to be ready
      waitForDOM(() => {
        // Wait for content-wrapper to exist
        const checkContentWrapper = () => {
          const contentWrapper = document.getElementById('content-wrapper');
          if (contentWrapper) {
            // Wait a bit more for content to render
            // Check for any content inside content-wrapper
            const hasContent = contentWrapper.children.length > 0 || 
                              contentWrapper.textContent.trim().length > 0;
            
            if (hasContent) {
              // Additional small delay to ensure rendering is complete
              setTimeout(resolve, 100);
            } else {
              // Content wrapper exists but no content yet, check again
              setTimeout(checkContentWrapper, 100);
            }
          } else {
            // Content wrapper doesn't exist yet, check again
            setTimeout(checkContentWrapper, 100);
          }
        };
        
        checkContentWrapper();
      });
    });
  }

  /**
   * Validate all Core Skills page elements are loaded
   * Checks for: content-wrapper, links, banners, status icons (if Canvas user), images
   * Returns Promise that resolves when all elements are validated as loaded
   */
  function validateCoreSkillsPageLoaded() {
    return new Promise((resolve) => {
      const maxAttempts = 50; // 5 seconds max (50 * 100ms)
      let attempts = 0;
      
      const checkElements = () => {
        attempts++;
        
        // 1. Check content-wrapper exists with content
        const contentWrapper = document.getElementById('content-wrapper');
        if (!contentWrapper || contentWrapper.children.length === 0) {
          if (attempts < maxAttempts) {
            setTimeout(checkElements, 100);
            return;
          }
          log("validateCoreSkillsPageLoaded: Content wrapper not ready after max attempts");
          resolve(); // Resolve anyway to prevent infinite wait
          return;
        }
        
        // 2. Check Core Skills links exist
        const links = document.querySelectorAll('body.ncademi-core-skills-page .custom-link.small, body.ncademi-core-skills-page .custom-link.large');
        if (links.length === 0) {
          if (attempts < maxAttempts) {
            setTimeout(checkElements, 100);
            return;
          }
          log("validateCoreSkillsPageLoaded: Core Skills links not found after max attempts");
          resolve(); // Resolve anyway
          return;
        }
        
        // 3. Check for Canvas user flag
        const usuCanvasUser = sessionStorage.getItem('usu-canvas-user') === 'true';
        
        if (usuCanvasUser) {
          // Canvas user: Check for status icons and status key banner
          // Check if status icons are applied (links have data-status attribute)
          const linksWithStatus = Array.from(links).filter(link => link.hasAttribute('data-status'));
          
          // Check for status key banner
          const statusKeyBanner = document.querySelector('.ncademi-status-key-banner');
          const statusKeyBannerVisible = statusKeyBanner && 
            window.getComputedStyle(statusKeyBanner).display !== 'none';
          
          // If status-enabled class is present, we expect status icons
          const statusEnabled = document.body.classList.contains('ncas-status-enabled');
          
          if (statusEnabled) {
            // Status is enabled, validate status icons and banner
            if (linksWithStatus.length === 0) {
              // Status enabled but no status icons yet, keep checking
              if (attempts < maxAttempts) {
                setTimeout(checkElements, 100);
                return;
              }
              log("validateCoreSkillsPageLoaded: Status enabled but no status icons found after max attempts");
              resolve(); // Resolve anyway to prevent infinite wait
              return;
            }
            
            // Status key banner should exist if status is enabled
            if (!statusKeyBannerVisible) {
              if (attempts < maxAttempts) {
                setTimeout(checkElements, 100);
                return;
              }
              log("validateCoreSkillsPageLoaded: Status enabled but status key banner not visible after max attempts");
              resolve(); // Resolve anyway
              return;
            }
          }
          // If status is not enabled yet, that's OK - validation will continue to image check
        } else {
          // Not Canvas user: Check for sign-in banner
          const signInBanner = document.querySelector('.ncademi-signin-banner');
          const signInBannerVisible = signInBanner && 
            window.getComputedStyle(signInBanner).display !== 'none';
          
          if (!signInBannerVisible) {
            if (attempts < maxAttempts) {
              setTimeout(checkElements, 100);
              return;
            }
            log("validateCoreSkillsPageLoaded: Sign-in banner not visible after max attempts");
            resolve(); // Resolve anyway to prevent infinite wait
            return;
          }
        }
        
        // 4. Check all images are loaded (if any)
        const images = Array.from(contentWrapper.querySelectorAll('img'));
        if (images.length > 0) {
          const imagePromises = images.map(img => {
            if (img.complete) {
              return Promise.resolve();
            }
            return new Promise((imgResolve) => {
              img.addEventListener('load', imgResolve, { once: true });
              img.addEventListener('error', imgResolve, { once: true }); // Count errors as loaded
              // Timeout after 2 seconds per image
              setTimeout(imgResolve, 2000);
            });
          });
          
          Promise.all(imagePromises).then(() => {
            // All images loaded or errored, resolve
            logOK("validateCoreSkillsPageLoaded: All Core Skills page elements validated as loaded");
            resolve();
          });
        } else {
          // No images, resolve immediately
          logOK("validateCoreSkillsPageLoaded: All Core Skills page elements validated as loaded");
          resolve();
        }
      };
      
      // Start checking
      checkElements();
    });
  }

  function handleInitialRedirects() {
    const courseId = getCourseId();
    if (!courseId) {
      // Ensure body is visible if no course ID
      if (document.body && document.body.style.display === 'none') {
        document.body.style.display = '';
      }
      return;
    }

    const currentPath = normalizePathname(window.location.pathname || '');
    const startHerePath = normalizePathname(`/courses/${courseId}/pages/start-here`);
    const courseHomePath = normalizePathname(`/courses/${courseId}`);
    const courseHomePathSlash = normalizePathname(`/courses/${courseId}/`);
    const isOnCourseHome = currentPath === courseHomePath || currentPath === courseHomePathSlash;

    // Redirect course home to Start Here (ALWAYS)
    if (isOnCourseHome) {
      log(`Redirecting course home to Start Here`);
      
      // Show overlay with "Loading the course..." message immediately
      const overlay = createOrGetOverlay();
      updateOverlayMessage('Loading the course...');
      
      // Set flag to indicate overlay is active and store start time
      sessionStorage.setItem('ncademi-overlay-active', 'true');
      sessionStorage.setItem('ncademi-overlay-start-time', Date.now().toString());
      
      // Ensure body is visible so overlay can be shown
      if (document.body) {
        document.body.style.display = '';
      }
      
      // Small delay to ensure overlay is visible before redirect
      setTimeout(() => {
        window.location.replace(startHerePath);
      }, 50);
      return;
    }

    // Ensure body is visible on all other pages (including Start Here)
    if (document.body && document.body.style.display === 'none') {
      document.body.style.display = '';
    }
  }

  /**
   * onCourseLoad: Determines Canvas user status and handles initial flow
   * ALL Canvas user validation happens on Start Here page - this is the ONLY place
   * 
   * Flow:
   * 1. Show "Loading the course..." message immediately
   * 2. Ensure message persists for 1 second minimum
   * 3. Run user detection
   * 4. Based on result:
   *    A. User NOT logged in:
   *       - NOT flagged (usu-canvas-user flag not set)
   *       - Sent to Start Here page
   *       - Overlay fades out after page loads
   *    B. User logged in:
   *       - IS flagged (usu-canvas-user flag set to 'true')
   *       - Redirected to Core Skills page
   *       - loadUsuCanvasUserCoreSkills() triggered
   *       - Overlay fades out after Core Skills setup completes
   */
  function onCourseLoad() {
    const courseId = getCourseId();
    if (!courseId) return;

    const currentPath = normalizePathname(window.location.pathname || '');
    const startHerePath = normalizePathname(`/courses/${courseId}/pages/start-here`);
    const coreSkillsPath = normalizePathname(`/courses/${courseId}/pages/core-skills`);
    const isOnStartHere = currentPath === startHerePath;
    const isOnCoreSkills = currentPath === normalizePathname(coreSkillsPath);

    // Check if overlay should be active (from redirect or Core Skills page)
    const overlayActive = sessionStorage.getItem('ncademi-overlay-active') === 'true';
    const overlayStartTime = sessionStorage.getItem('ncademi-overlay-start-time');
    const elapsedTime = overlayStartTime ? Date.now() - parseInt(overlayStartTime, 10) : 0;
    const minDisplayTime = 1000; // 1 second minimum
    const remainingTime = Math.max(0, minDisplayTime - elapsedTime);

    // Handle Start Here page
    if (isOnStartHere) {
      // Ensure overlay is visible with "Loading the course..." message
      if (overlayActive) {
        const overlay = createOrGetOverlay();
        updateOverlayMessage('Loading the course...');
        log('Overlay active on Start Here page - ensuring 1 second minimum display');
      }

      // Wait for remaining time to ensure 1 second minimum, then run user detection
      setTimeout(async () => {
        // Check if user is admin - admins should not be redirected
        if (isAdmin()) {
          log('Admin detected on Start Here page - skipping redirect to Core Skills');
          // Wait for Start Here page body to load, then fade out overlay
          if (overlayActive) {
            waitForPageBodyLoaded().then(() => {
              const overlay = document.getElementById('ncademi-loading-overlay');
              if (overlay) {
                fadeOutOverlay(overlay);
                sessionStorage.removeItem('ncademi-overlay-active');
                sessionStorage.removeItem('ncademi-overlay-start-time');
                log('Start Here page body loaded for admin, overlay faded out');
              }
            });
          }
          return;
        }
        
        // Check for Canvas user
        const signedIn = await waitForSignedInState({ timeout: 2000 });
        
        // Only redirect if overlay is active (indicating initial course load redirect)
        // If overlay is not active, user navigated directly to Start Here and should stay
        if (signedIn && overlayActive) {
          // User is signed in and this is from initial course load - set flag and cross-fade message, then redirect to Core Skills
          log('USU Canvas user detected on initial course load - setting flag, cross-fading message and redirecting to Core Skills');
          
          // Set flag to indicate USU Canvas user detected
          sessionStorage.setItem('usu-canvas-user', 'true');
          
          // Cross-fade to new message
          crossFadeOverlayMessage('USU Canvas user detected. Retrieving your information...');
          
          // Wait for cross-fade to complete, then redirect
          setTimeout(() => {
            window.location.replace(coreSkillsPath);
          }, 400);
        } else if (signedIn && !overlayActive) {
          // User is signed in but navigated directly to Start Here (not from initial course load)
          // Allow them to stay on Start Here page
          log('USU Canvas user navigated directly to Start Here - allowing them to stay on page');
          
          // Fade out any existing overlay if present
          const overlay = document.getElementById('ncademi-loading-overlay');
          if (overlay) {
            fadeOutOverlay(overlay);
            sessionStorage.removeItem('ncademi-overlay-active');
            sessionStorage.removeItem('ncademi-overlay-start-time');
          }
        } else {
          // User is not logged in - wait for Start Here page body to load, then fade out
          log('User is not logged in, waiting for Start Here page body to load');
          
          if (overlayActive) {
            // Wait for Start Here page body to load, then fade out
            waitForPageBodyLoaded().then(() => {
              const overlay = document.getElementById('ncademi-loading-overlay');
              if (overlay) {
                fadeOutOverlay(overlay);
                sessionStorage.removeItem('ncademi-overlay-active');
                sessionStorage.removeItem('ncademi-overlay-start-time');
                log('Start Here page body loaded, overlay faded out');
                
                // Preload Core Skills assets in the background for faster navigation
                preloadCoreSkillsAssets();
              }
            });
          }
        }
      }, remainingTime);
      return;
    }

    // Handle Core Skills page (if redirected here with overlay active)
    if (isOnCoreSkills && overlayActive) {
      log('Core Skills page loaded with overlay active');
      
      // Ensure overlay is visible with correct message
      const overlay = createOrGetOverlay();
      updateOverlayMessage('USU Canvas user detected. Retrieving your information...');
      
      // Wait for Core Skills page to load completely (all elements)
      waitForPageBodyLoaded().then(async () => {
        // injectSignInBanner() checks for flag and skips injection if Canvas user detected
        await injectSignInBanner();
        
        // Load Core Skills setup for USU Canvas user (if flag exists)
        await loadUsuCanvasUserCoreSkills();
        
        // Validate all page elements are loaded before fading overlay
        await validateCoreSkillsPageLoaded();
        
        // All elements validated, fade out overlay
        if (overlay) {
          fadeOutOverlay(overlay);
          sessionStorage.removeItem('ncademi-overlay-active');
          sessionStorage.removeItem('ncademi-overlay-start-time');
          log('Core Skills page completely loaded and validated, overlay faded out');
        }
      });
    }
  }

  function getStoredCoreSkillPaths() {
    try {
      const raw = sessionStorage.getItem(CORE_SKILL_PATH_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return Array.from(new Set(parsed.map(normalizePathname))).filter(Boolean);
    } catch (err) {
      logError("Unable to read core skill path whitelist", err);
      return [];
    }
  }

  function storeCoreSkillPaths(paths) {
    if (!Array.isArray(paths) || paths.length === 0) {
      return;
    }
    const unique = Array.from(new Set(paths.map(normalizePathname))).filter(Boolean);
    if (unique.length === 0) return;
    try {
      sessionStorage.setItem(CORE_SKILL_PATH_STORAGE_KEY, JSON.stringify(unique));
      log(`Core skill path whitelist stored (${unique.length} entries)`);
    } catch (err) {
      logError("Unable to store core skill path whitelist", err);
    }
  }

  function refreshCoreSkillPathWhitelist() {
    /* CORE SKILLS PAGE CODE DISABLED - NCAS23
    if (!document.body.classList.contains('ncademi-core-skills-page')) {
      return;
    }
    try {
      const links = Array.from(document.querySelectorAll('.custom-link.small, .custom-link.large'));
      const courseId = getCourseId();
      const collected = links.map(link => {
        try {
          const url = new URL(link.getAttribute('href') || '', window.location.origin);
          return normalizePathname(url.pathname);
        } catch (err) {
          return null;
        }
      }).filter(Boolean);
      if (courseId) {
        collected.push(normalizePathname(`/courses/${courseId}/pages/core-skills`));
      }
      if (collected.length > 0) {
        const existing = getStoredCoreSkillPaths();
        const merged = Array.from(new Set([...existing, ...collected]));
        storeCoreSkillPaths(merged);
      }
    } catch (err) {
      logError("Unable to refresh core skill path whitelist", err);
    }
    */
    // Function disabled - Core Skills page code commented out
    return;
  }

  const QUIZ_BUTTON_EXCLUDED_PATH_PATTERNS = Object.freeze([
    /\/pages\/core-skills(?:\/|$)/,
    /\/pages\/start-here(?:\/|$)/,
    /\/pages\/feedback(?:\/|$)/,
    /\/pages\/create-a-free-usu-canvas-account(?:\/|$)/,
    /\/grades(?:\/|$)/,
    /\/modules(?:\/|$)/,
    /\/announcements(?:\/|$)/,
    /\/assignments(?:\/|$)/
  ]);

  function markSkillQuizButtonsSuppressed() {
    skillQuizButtonState.suppressed = true;
    if (!skillQuizButtonState.skipLogged) {
      log("updateSkillPageQuizButtons: skipped (page not eligible for quiz button updates)");
      skillQuizButtonState.skipLogged = true;
    }
    if (skillQuizButtonRetryTimeout) {
      clearTimeout(skillQuizButtonRetryTimeout);
      skillQuizButtonRetryTimeout = null;
    }
  }

  // Helper function to hide quiz buttons (default state for non-logged-in users)
  function hideQuizButtons() {
    // Add class to body - CSS will handle hiding quiz buttons
    document.body.classList.add('ncas-quiz-buttons-hidden');
    document.body.classList.remove('ncas-quiz-enabled');
    log("Quiz buttons hidden (default state)");
  }

  // Helper function to show quiz buttons (for logged-in users)
  function showQuizButtons() {
    // Remove hidden class and add enabled class - CSS will handle showing
    document.body.classList.remove('ncas-quiz-buttons-hidden');
    document.body.classList.add('ncas-quiz-enabled');
    log("Quiz buttons shown (logged-in state)");
  }

  // Helper function to hide sign-in banner (for logged-in users)
  function hideSignInBanner() {
    const banner = document.querySelector('.ncademi-signin-banner');
    if (banner) {
      banner.style.display = 'none';
      log("Sign-in banner hidden (user is logged in)");
    }
  }

  // Initialize dismiss buttons for banners already in HTML (skill pages)
  function initializeSignInBannerDismissButtons() {
    const banners = document.querySelectorAll('.ncademi-signin-banner');
    
    // Check if banner was dismissed in previous session
    const bannerDismissed = sessionStorage.getItem('ncademi-signin-banner-dismissed');
    if (bannerDismissed === 'true') {
      // Hide all banners that were previously dismissed
      banners.forEach(banner => {
        banner.style.display = 'none';
      });
      log("Sign-in banner(s) hidden (previously dismissed)");
      return; // Don't initialize dismiss buttons if banner was dismissed
    }
    
    banners.forEach(banner => {
      const dismissBtn = banner.querySelector('.ncademi-signin-banner-dismiss');
      if (dismissBtn && !dismissBtn.dataset.dismissInitialized) {
        // Mark as initialized to avoid duplicate event listeners
        dismissBtn.dataset.dismissInitialized = 'true';
        
        // Force inline styles to ensure button is in upper right (override any Canvas CSS)
        dismissBtn.style.position = 'absolute';
        dismissBtn.style.top = '8px';
        dismissBtn.style.right = '8px';
        dismissBtn.style.left = 'auto';
        dismissBtn.style.bottom = 'auto';
        dismissBtn.style.margin = '0';
        dismissBtn.style.marginLeft = 'auto';
        dismissBtn.style.marginRight = '0';
        dismissBtn.style.marginTop = '0';
        dismissBtn.style.marginBottom = '0';
        dismissBtn.style.padding = '0';
        dismissBtn.style.zIndex = '10';
        dismissBtn.style.float = 'none';
        dismissBtn.style.clear = 'both';
        dismissBtn.style.transform = 'translateX(0)';
        dismissBtn.style.insetInlineStart = 'auto';
        dismissBtn.style.insetInlineEnd = '8px';
        log("Sign-in banner dismiss button positioning set via inline styles");
        
        // Add dismiss functionality
        dismissBtn.addEventListener('click', function() {
          banner.style.display = 'none';
          sessionStorage.setItem('ncademi-signin-banner-dismissed', 'true');
          log("Sign-in banner dismissed by user (from HTML)");
        });
        
        log("Sign-in banner dismiss button initialized (from HTML)");
      }
    });
  }

  function requestSkillPageQuizButtons(options = {}) {
    log("requestSkillPageQuizButtons: Function called");
    resetSkillQuizButtonStateForCurrentPath();
    const { force = false, bypassEligibility = false } = options;

    log(`requestSkillPageQuizButtons: force=${force}, bypassEligibility=${bypassEligibility}, suppressed=${skillQuizButtonState.suppressed}`);
    
    if (skillQuizButtonState.suppressed && !force) {
      log("requestSkillPageQuizButtons: Suppressed, returning early");
      return;
    }

    if (!bypassEligibility && !shouldRunQuizButtonUpdate()) {
      log("requestSkillPageQuizButtons: shouldRunQuizButtonUpdate returned false, marking as suppressed");
      markSkillQuizButtonsSuppressed();
      return;
    }

    log("requestSkillPageQuizButtons: Proceeding to updateSkillPageQuizButtons");
    skillQuizButtonState.suppressed = false;
    skillQuizButtonState.skipLogged = false;
    return updateSkillPageQuizButtons(options);
  }

  function shouldRunQuizButtonUpdate() {
    const courseId = getCourseId();
    const currentPath = normalizePathname(window.location.pathname || '');

    log(`shouldRunQuizButtonUpdate: courseId=${courseId}, currentPath=${currentPath}`);
    
    if (!currentPath) {
      log("shouldRunQuizButtonUpdate: No current path, returning false");
      return false;
    }

    /* CORE SKILLS PAGE CODE DISABLED - NCAS23
    if (document.body.classList.contains('ncademi-core-skills-page')) {
      return false;
    }

    if (courseId) {
      const coreSkillsPath = normalizePathname(`/courses/${courseId}/pages/core-skills`);
      if (currentPath === coreSkillsPath) {
        return false;
      }
    }
    */

    if (QUIZ_BUTTON_EXCLUDED_PATH_PATTERNS.some(pattern => pattern.test(currentPath))) {
      log(`shouldRunQuizButtonUpdate: Path matches excluded pattern, returning false`);
      return false;
    }

    const whitelist = getStoredCoreSkillPaths();
    log(`shouldRunQuizButtonUpdate: whitelist=${whitelist.length} entries`);
    if (whitelist.includes(currentPath)) {
      log(`shouldRunQuizButtonUpdate: Path in whitelist, returning true`);
      return true;
    }

    if (/\/pages\//.test(currentPath)) {
      log(`shouldRunQuizButtonUpdate: Path matches /pages/ pattern, returning true`);
      return true;
    }

    const hasQuizButton = document.querySelector('a.quiz-button') !== null;
    log(`shouldRunQuizButtonUpdate: hasQuizButton=${hasQuizButton}`);
    if (hasQuizButton) {
      log(`shouldRunQuizButtonUpdate: Quiz button found, returning true`);
      return true;
    }

    log(`shouldRunQuizButtonUpdate: No conditions met, returning false`);
    return false;
  }

  const quizStatusService = (() => {
    let progressPrefetchPromise = null;

    function normalizeAssignmentId(assignmentId) {
      if (assignmentId === null || typeof assignmentId === 'undefined') {
        return null;
      }
      return String(assignmentId);
    }

    function setStatus(assignmentId, status) {
      const id = normalizeAssignmentId(assignmentId);
      if (!id || !status) return;
      cacheAssignmentStatus(id, status);
      return status;
    }

    function getStatus(assignmentId) {
      const id = normalizeAssignmentId(assignmentId);
      if (!id) return null;
      return getCachedAssignmentStatus(id);
    }

    function getStatuses(assignmentIds = []) {
      const result = new Map();
      assignmentIds.forEach(id => {
        const normalized = normalizeAssignmentId(id);
        if (!normalized) return;
        const status = getStatus(normalized);
        if (status) {
          result.set(normalized, status);
        }
      });
      return result;
    }

    function extractScoreDataFromRow(row) {
      if (!row) return null;
      const scoreCell = row.querySelector('td.assignment_score');
      if (!scoreCell) return null;

      const gradeSpan = scoreCell.querySelector('.grade');
      if (!gradeSpan) return null;

      let scoreText = null;
      gradeSpan.childNodes.forEach(node => {
        if (!scoreText && node.nodeType === 3 && node.textContent.trim()) {
          scoreText = node.textContent.trim();
        }
      });

      if (!scoreText) {
        const fallback = gradeSpan.textContent.trim().match(/^(\S+)/);
        scoreText = fallback ? fallback[1] : '';
      }

      const tooltipSpan = scoreCell.querySelector('.tooltip');
      let pointsPossible = 0;
      if (tooltipSpan) {
        const match = tooltipSpan.textContent.match(/\/\s*(\d+(?:\.\d+)?)/);
        if (match && match[1]) {
          pointsPossible = parseFloat(match[1]);
        }
      }

      return {
        score: scoreText,
        pointsPossible
      };
    }

    function loadFromProgressDom(root = document) {
      const scope = root || document;
      const gradesTable = scope.querySelector('table#grades_summary');
      if (!gradesTable) return false;

      let updated = false;
      const rows = gradesTable.querySelectorAll('tbody tr.student_assignment');
      rows.forEach(row => {
        const titleLink = row.querySelector('th.title a');
        const assignmentId = titleLink ? getAssignmentIdFromUrl(titleLink.getAttribute('href') || '') : null;
        if (!assignmentId) return;

        const scoreData = extractScoreDataFromRow(row);
        if (!scoreData) return;

        const status = calculateStatus(scoreData.score, scoreData.pointsPossible);
        setStatus(assignmentId, status);
        updated = true;
      });

      return updated;
    }

    async function ensureStatuses({ courseId = null, assignmentIds = [] } = {}) {
      const ids = assignmentIds.map(normalizeAssignmentId).filter(Boolean);
      let missing = ids.filter(id => !getStatus(id));

      log(`quizStatusService.ensureStatuses: requested=${ids.length}, cached=${ids.length - missing.length}, missing=${missing.length}`);

      if (missing.length === 0) {
        return getStatuses(ids);
      }

      if (loadFromProgressDom()) {
        missing = missing.filter(id => !getStatus(id));
        log(`quizStatusService.ensureStatuses: after Progress DOM load, missing=${missing.length}`);
        if (missing.length === 0) {
          return getStatuses(ids);
        }
      }

      if (!courseId) {
        courseId = getCourseId();
      }

      if (!courseId || !isUserSignedInFast()) {
        log(`quizStatusService.ensureStatuses: cannot fetch (courseId=${courseId}, signedIn=${isUserSignedInFast()})`);
        return getStatuses(ids);
      }

      const prefetched = await prefetchProgressPage(courseId);
      log(`quizStatusService.ensureStatuses: prefetch result=${prefetched}`);

      missing = ids.filter(id => !getStatus(id));
      log(`quizStatusService.ensureStatuses: after prefetch, missing=${missing.length}`);

      const finalStatuses = getStatuses(ids);
      const unresolved = ids.filter(id => !finalStatuses.has(id));
      if (unresolved.length > 0) {
        log(`quizStatusService.ensureStatuses: unresolved assignments after fetch: ${unresolved.join(', ')}`);
      }
      return finalStatuses;
    }

    async function prefetchProgressPage(courseId) {
      if (!courseId) {
        courseId = getCourseId();
      }
      if (!courseId) {
        log("quizStatusService.prefetchProgressPage: no course ID available");
        return false;
      }
      if (progressPrefetchPromise) {
        return progressPrefetchPromise;
      }

      progressPrefetchPromise = (async () => {
        try {
          log(`quizStatusService.prefetchProgressPage: fetching /courses/${courseId}/grades`);
          const response = await fetch(`/courses/${courseId}/grades`, { credentials: 'include' });
          if (!response.ok) {
            log(`quizStatusService.prefetchProgressPage: fetch failed (${response.status})`);
            return false;
          }
          const html = await response.text();
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');
          const updated = loadFromProgressDom(doc);
          log(`quizStatusService.prefetchProgressPage: grades table processed=${updated}`);
          return updated;
        } catch (err) {
          logError("quizStatusService.prefetchProgressPage: error fetching Progress page", err);
          return false;
        } finally {
          progressPrefetchPromise = null;
        }
      })();

      return progressPrefetchPromise;
    }

    return {
      setStatus,
      getStatus,
      getStatuses,
      ensureStatuses,
      loadFromProgressDom,
      prefetchProgressPage
    };
  })();

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

  function normalizeAssignmentHref(href) {
    if (!href) return href;
    return href.replace(/(\/assignments\/\d+)\/submissions\/\d+\/?$/, '$1/');
  }

  function normalizeAssignmentLink(link) {
    if (!link) return;
    const originalHref = link.getAttribute('href');
    if (!originalHref) return;
    const normalizedHref = normalizeAssignmentHref(originalHref);
    if (normalizedHref !== originalHref) {
      link.setAttribute('href', normalizedHref);
    }
  }

  let skillQuizButtonUpdatePromise = null;
  let skillQuizButtonRetryTimeout = null;
  const MAX_QUIZ_BUTTON_ATTEMPTS = 2;
  const QUIZ_BUTTON_RETRY_DELAY = 1500;
  let coreSkillsStatusPromise = null;
  let coreSkillsStatusReady = true;
  let coreSkillsStatusDisabled = false;
  const MAX_CORE_SKILLS_STATUS_ATTEMPTS = 5;
  const CORE_SKILLS_STATUS_RETRY_DELAY = 1500;
  let signedInStatePromise = null;

  const skillQuizButtonState = {
    path: null,
    suppressed: false,
    skipLogged: false
  };

  const coreSkillsStatusState = {
    path: null,
    suppressed: false,
    skipLogged: false
  };

  function getNormalizedCurrentPath() {
    return normalizePathname(window.location.pathname || '');
  }

  function resetSkillQuizButtonStateForCurrentPath() {
    const currentPath = getNormalizedCurrentPath();
    if (skillQuizButtonState.path !== currentPath) {
      skillQuizButtonState.path = currentPath;
      skillQuizButtonState.suppressed = false;
      skillQuizButtonState.skipLogged = false;
    }
    return currentPath;
  }

  function resetCoreSkillsStatusStateForCurrentPath() {
    const currentPath = getNormalizedCurrentPath();
    if (coreSkillsStatusState.path !== currentPath) {
      coreSkillsStatusState.path = currentPath;
      coreSkillsStatusState.suppressed = false;
      coreSkillsStatusState.skipLogged = false;
      coreSkillsStatusDisabled = false;
    }
    return currentPath;
  }

  async function updateSkillPageQuizButtons(options = {}) {
    const attempt = typeof options.attempt === 'number' ? options.attempt : 0;
    const bypassEligibility = options.bypassEligibility === true;

    if (!bypassEligibility) {
      resetSkillQuizButtonStateForCurrentPath();
      if (!shouldRunQuizButtonUpdate()) {
        markSkillQuizButtonsSuppressed();
        return;
      }
    }

    if (attempt === 0 && skillQuizButtonRetryTimeout) {
      clearTimeout(skillQuizButtonRetryTimeout);
      skillQuizButtonRetryTimeout = null;
      log("updateSkillPageQuizButtons: cleared pending retry timeout");
    }

    if (skillQuizButtonUpdatePromise) {
      log("updateSkillPageQuizButtons: existing promise in-flight, returning");
      return skillQuizButtonUpdatePromise;
    }

    log(`updateSkillPageQuizButtons: attempt ${attempt}`);

    skillQuizButtonUpdatePromise = (async () => {
      if (!isCoursePage()) return;

      const quizButtons = Array.from(document.querySelectorAll('a.quiz-button'));
      log(`updateSkillPageQuizButtons: found ${quizButtons.length} quiz buttons`);
      if (quizButtons.length === 0) {
        const hasEmbeddedNewQuiz = document.querySelector('.tool_content_wrapper iframe.tool_launch');
        const isLtiQuizView = typeof ENV !== 'undefined' && ENV && ENV.LTI_TOOL === true;
        if (hasEmbeddedNewQuiz || isLtiQuizView) {
          log("updateSkillPageQuizButtons: embedded quiz view detected, no quiz buttons expected");
          return;
        }
        if (attempt < MAX_QUIZ_BUTTON_ATTEMPTS) {
          log(`updateSkillPageQuizButtons: no quiz buttons yet, retrying in ${QUIZ_BUTTON_RETRY_DELAY}ms (attempt ${attempt + 1})`);
          skillQuizButtonRetryTimeout = setTimeout(() => {
            requestSkillPageQuizButtons({ attempt: attempt + 1 });
          }, QUIZ_BUTTON_RETRY_DELAY);
        } else {
          logError("updateSkillPageQuizButtons: reached max attempts with no quiz buttons detected");
        }
        return;
      }

      // Quiz buttons and text are hidden by default via CSS (for non-logged-in users)
      // Banner is in HTML by default (visible by default)
      // We'll show/hide based on login status

      const courseId = getCourseId();
      if (!courseId) return;

      const buttonDetails = quizButtons.map(button => {
        const assignmentId = button.getAttribute('data-assignment-id') || getAssignmentIdFromUrl(button.getAttribute('href') || '');
        return { button, assignmentId };
      }).filter(detail => detail.assignmentId);

      log(`updateSkillPageQuizButtons: ${buttonDetails.length} buttons with assignment IDs`);
      if (buttonDetails.length === 0) {
        return;
      }

      const assignmentIdList = Array.from(new Set(buttonDetails.map(({ assignmentId }) => String(assignmentId))));
      log(`updateSkillPageQuizButtons: unique assignment IDs ${assignmentIdList.join(', ')}`);
      let statusMap = quizStatusService.getStatuses(assignmentIdList);
      const missingAssignmentIds = assignmentIdList.filter(id => !statusMap.has(id));
      log(`updateSkillPageQuizButtons: cached statuses=${statusMap.size}, missing=${missingAssignmentIds.length}`);
      
      // Check login status first to avoid flickering banner
      log(`updateSkillPageQuizButtons: About to check login status...`);
      const signedIn = await waitForSignedInState();
      log(`updateSkillPageQuizButtons: signedIn=${signedIn}`);
      log(`updateSkillPageQuizButtons: ENV.current_user=${window.ENV?.current_user ? JSON.stringify(window.ENV.current_user) : 'undefined'}`);
      log(`updateSkillPageQuizButtons: sessionStorage usu-canvas-user=${sessionStorage.getItem('usu-canvas-user')}`);

      if (signedIn) {
        // User is logged in: hide banner (via CSS class), show quiz section (via CSS class), update status
        log(`updateSkillPageQuizButtons: User is logged in, hiding banner and showing quiz section`);
        // CSS will handle hiding banner and showing quiz section via .ncas-quiz-enabled class
        showQuizButtons();
        
        if (missingAssignmentIds.length > 0) {
          log(`updateSkillPageQuizButtons: fetching statuses for missing IDs (${missingAssignmentIds.join(', ')})`);
          statusMap = await quizStatusService.ensureStatuses({ courseId, assignmentIds: assignmentIdList });
          log(`updateSkillPageQuizButtons: ensureStatuses returned ${statusMap ? statusMap.size : 0} statuses`);
        }

        buttonDetails.forEach(({ button, assignmentId }) => {
          const status = (statusMap && statusMap.get(String(assignmentId))) || quizStatusService.getStatus(assignmentId) || null;
          applyQuizButtonStatus(button, status);
          log(`updateSkillPageQuizButtons: applied status ${status || 'null'} to assignment ${assignmentId}`);
        });
      } else {
        // User is not logged in: banner is visible by default in HTML, quiz section hidden by default via CSS
        log("updateSkillPageQuizButtons: user not logged in, banner visible in HTML, quiz section hidden via CSS");
        // Ensure quiz buttons are hidden (in case CSS didn't load)
        hideQuizButtons();
        skillQuizButtonRetryTimeout = null;
        return; // No need to retry or update status if user is not logged in
      }

      // Only check for unresolved buttons if user is logged in
      const unresolvedButtons = buttonDetails.filter(({ assignmentId }) => {
        const status = quizStatusService.getStatus(assignmentId);
        return !status;
      });

      if (unresolvedButtons.length > 0 && attempt < MAX_QUIZ_BUTTON_ATTEMPTS) {
        log(`updateSkillPageQuizButtons: unresolved assignments ${unresolvedButtons.map(({ assignmentId }) => assignmentId).join(', ')}`);
        log(`updateSkillPageQuizButtons: scheduling retry ${attempt + 1} in ${QUIZ_BUTTON_RETRY_DELAY}ms`);
        skillQuizButtonRetryTimeout = setTimeout(() => {
          requestSkillPageQuizButtons({ attempt: attempt + 1 });
        }, QUIZ_BUTTON_RETRY_DELAY);
      } else {
        log(`updateSkillPageQuizButtons: completed with ${buttonDetails.length - unresolvedButtons.length}/${buttonDetails.length} resolved (attempt ${attempt})`);
        skillQuizButtonRetryTimeout = null;
      }
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

  // Extract nav click handler attachment to reusable function (accessible to ensureHeaderNav)
  function attachNavClickHandler(nav) {
    // Check if already attached to avoid duplicates
    if (!nav || nav.hasAttribute('data-nav-handler-attached')) {
      return;
    }
    
    nav.setAttribute('data-nav-handler-attached', 'true');
    nav.addEventListener('click', function(e) {
      const link = e.target.closest('a');
      if (!link || !link.closest('#ncademi-nav')) return;
      
      const href = link.getAttribute('href');
      if (!href) return;
      
      try {
        const url = new URL(href, window.location.origin);
        if (url.origin === window.location.origin) {
          // Always prevent default for nav links to handle navigation consistently
          e.preventDefault();
          e.stopPropagation();
          
          // Only navigate if actually different page
          if (window.location.pathname !== url.pathname) {
            // Try Backbone navigation first
            if (window.Backbone && window.Backbone.history) {
              try {
                window.Backbone.history.navigate(url.pathname + (url.search || ''), { trigger: true });
                logOK(`Navigated to ${href} using Canvas Backbone router (event delegation)`);
                return;
              } catch (err) {
                logError("Backbone navigation failed, falling back to window.location", err);
                // Fall through to window.location.href
              }
            }
            
            // Fallback to standard navigation
            window.location.href = href;
            return;
          } else {
            // Same page - just update active state without navigation
            log("Same page navigation detected, updating active state only");
            ensureHeaderNav();
            return;
          }
        }
      } catch (err) {
        logError("URL parsing failed in nav click handler", err);
        // On error, allow default navigation
        return;
      }
    }, true);
    logOK("Event delegation set up on nav container");
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
      
      // Verify handler is attached after nav updates
      // This prevents race conditions where links exist but handler isn't ready
      const nav = existingHeader.querySelector("#ncademi-nav");
      if (nav) {
        attachNavClickHandler(nav);
      }
      
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
      }
      
      // Always ensure handler is attached (whether nav is new or existing)
      attachNavClickHandler(nav);

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
        
        // Ensure handler is attached immediately after link creation
        // This prevents race conditions where links exist but handler isn't ready
        attachNavClickHandler(nav);
        
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
        
        // After updating links, verify handler is still attached
        // This prevents race conditions after navigation updates
        attachNavClickHandler(nav);
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
      normalizeAssignmentLink(link);

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
  /* CORE SKILLS PAGE CODE DISABLED - NCAS23
  function extractAssignmentIdsFromLinks() {
    refreshCoreSkillPathWhitelist();
    const links = document.querySelectorAll('body.ncademi-core-skills-page .custom-link.small, body.ncademi-core-skills-page .custom-link.large');
    const assignmentIds = [];
    const linkMap = new Map(); // Map assignment ID to link element
    const assignmentsMap = new Map(); // Map assignment ID to { id, points_possible }
    
    links.forEach(link => {
      normalizeAssignmentLink(link);

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
  */

  /* CORE SKILLS PAGE CODE DISABLED - NCAS23
  // Apply status to Core Skills links
  function applyStatusToCoreSkillsLinks(statusMap, linkMap) {
    if (!linkMap) return;

    const statuses = statusMap instanceof Map ? statusMap : new Map();
    let appliedCount = 0;

    linkMap.forEach((link, assignmentId) => {
      normalizeAssignmentLink(link);
      const normalizedId = String(assignmentId);
      const status = statuses.get(normalizedId) || quizStatusService.getStatus(normalizedId);
      if (!status) return;

      cacheAssignmentStatus(normalizedId, status);
      link.setAttribute('data-status', status);

      const linkText = link.textContent.trim() || link.getAttribute('title') || 'Link';
      const statusLabels = {
        'pending': 'Pending',
        'active': 'Active',
        'done': 'Done'
      };
      const statusLabel = statusLabels[status] || status;
      link.setAttribute('aria-label', `${linkText}, Status: ${statusLabel}`);
      appliedCount++;
    });

    if (appliedCount > 0) {
      logOK(`Applied status to ${appliedCount} links on Core Skills page`);
    }

    return appliedCount;
  }
  */

  let cachedSignedIn = null;

  function isUserSignedInFast() {
    log(`isUserSignedInFast: cachedSignedIn=${cachedSignedIn}`);
    if (cachedSignedIn === true) {
      log("isUserSignedInFast: Using cached signed-in state (true)");
      return true;
    }

    const hasENVUser = (window.ENV && window.ENV.current_user && window.ENV.current_user.id) ||
                       (window.ENV && window.ENV.current_user_id) ||
                       (window.ENV && window.ENV.student_id);

    log(`isUserSignedInFast: ENV.current_user=${window.ENV?.current_user ? JSON.stringify(window.ENV.current_user) : 'undefined'}`);
    log(`isUserSignedInFast: ENV.current_user_id=${window.ENV?.current_user_id || 'undefined'}`);
    log(`isUserSignedInFast: ENV.student_id=${window.ENV?.student_id || 'undefined'}`);
    log(`isUserSignedInFast: hasENVUser=${hasENVUser}`);

    if (hasENVUser) {
      cachedSignedIn = true;
      log("isUserSignedInFast: ENV user detected, caching signed-in state (true)");
      return true;
    }

    log("isUserSignedInFast: No ENV user detected, returning false");
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

  async function ensureSignedInState(options = {}) {
    const { force = false } = options;

    if (force) {
      cachedSignedIn = null;
      signedInStatePromise = null;
    }

    if (cachedSignedIn === true) {
      return true;
    }

    if (signedInStatePromise) {
      return signedInStatePromise;
    }

    signedInStatePromise = waitForSignedInState(options)
      .then(result => {
        if (result) {
          cachedSignedIn = true;
          coreSkillsStatusDisabled = false;
          coreSkillsStatusState.suppressed = false;
          coreSkillsStatusState.skipLogged = false;
          return true;
        }
        return false;
      })
      .catch(err => {
        logError("ensureSignedInState: error resolving signed-in state", err);
        return false;
      })
      .finally(() => {
        if (cachedSignedIn !== true) {
          signedInStatePromise = null;
        }
      });

    return signedInStatePromise;
  }

  // Inject status key banner for signed-in users on core-skills page
  /* CORE SKILLS PAGE CODE DISABLED - NCAS23
  async function injectStatusKeyBanner() {
    log("Status key banner: Function called");
    
    if (!document.body.classList.contains('ncademi-core-skills-page')) {
      log("Status key banner: Not on Core Skills page");
      return; // Not on Core Skills page
    }

    // Check if user was redirected from Start Here (flag indicates user is logged in)
    const loggedInRedirect = sessionStorage.getItem('ncademi-logged-in-redirect') === 'true';
    let signedIn;
    
    if (loggedInRedirect) {
      // User was redirected from Start Here, already verified as logged in
      signedIn = true;
      log("Status key banner: User verified as logged in from Start Here redirect");
    } else {
      signedIn = isUserSignedInFast();
    }
    
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
  */

  async function injectSignInBanner(retryCount = 0) {
    log("Sign-in banner: Function called");
    log(`Sign-in banner: retryCount=${retryCount}`);
    
    const isCoreSkillsPage = document.body.classList.contains('ncademi-core-skills-page');
    const isSkillPage = !isCoreSkillsPage && document.querySelector('a.quiz-button') !== null;
    
    log(`Sign-in banner: isCoreSkillsPage=${isCoreSkillsPage}, isSkillPage=${isSkillPage}`);
    
    if (isSkillPage) {
      log("Sign-in banner: Skill page detected - banner is in HTML, skipping injection");
      return; // Banner is handled via inline HTML on skill pages
    }
    
    if (isCoreSkillsPage) {
      log("Sign-in banner: Core Skills banner disabled (handled on individual skill pages)");
      return;
    }
    
    log("Sign-in banner: Not on Core Skills page or skill page - skipping injection");
  }

  /**
   * Extract assignment IDs from Core Skills links
   * Returns { assignmentIds, linkMap, assignmentsMap }
   */
  function extractAssignmentIdsFromLinks() {
    const links = document.querySelectorAll('body.ncademi-core-skills-page .custom-link.small, body.ncademi-core-skills-page .custom-link.large');
    const assignmentIds = [];
    const linkMap = new Map(); // Map assignment ID to link element
    const assignmentsMap = new Map(); // Map assignment ID to { id, points_possible }
    
    links.forEach(link => {
      normalizeAssignmentLink(link);

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

  /**
   * Apply status to Core Skills links
   * Updates data-status attribute and aria-label for accessibility
   */
  function applyStatusToCoreSkillsLinks(statusMap, linkMap) {
    if (!linkMap) return 0;

    const statuses = statusMap instanceof Map ? statusMap : new Map();
    let appliedCount = 0;

    linkMap.forEach((link, assignmentId) => {
      normalizeAssignmentLink(link);
      const normalizedId = String(assignmentId);
      const status = statuses.get(normalizedId) || quizStatusService.getStatus(normalizedId);
      if (!status) return;

      cacheAssignmentStatus(normalizedId, status);
      link.setAttribute('data-status', status);

      const linkText = link.textContent.trim() || link.getAttribute('title') || 'Link';
      const statusLabels = {
        'pending': 'Pending',
        'active': 'Active',
        'done': 'Done'
      };
      const statusLabel = statusLabels[status] || status;
      link.setAttribute('aria-label', `${linkText}, Status: ${statusLabel}`);
      appliedCount++;
    });

    if (appliedCount > 0) {
      logOK(`Applied status to ${appliedCount} links on Core Skills page`);
    }

    return appliedCount;
  }

  /**
   * Inject status key banner for signed-in users on Core Skills page
   */
  async function injectStatusKeyBanner() {
    log("Status key banner: Function called");
    
    if (!document.body.classList.contains('ncademi-core-skills-page')) {
      log("Status key banner: Not on Core Skills page");
      return; // Not on Core Skills page
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

  /**
   * loadUsuCanvasUserCoreSkills: Initial Core Skills setup when USU Canvas user is first detected
   * 
   * E2E Process:
   * 1. User navigates to course home → redirected to Start Here (via handleInitialRedirects)
   * 2. onCourseLoad() runs on Start Here page:
   *    - Shows "Loading the course..." overlay
   *    - Waits 1 second minimum
   *    - Detects Canvas user status via waitForSignedInState()
   *    - If Canvas user detected:
   *      a. Sets usu-canvas-user flag to 'true' in sessionStorage
   *      b. Cross-fades overlay message to "USU Canvas user detected. Retrieving your information..."
   *      c. Redirects to Core Skills page
   * 3. Core Skills page loads with overlay active
   * 4. loadUsuCanvasUserCoreSkills() is triggered:
   *    - Validates page is Core Skills
   *    - Checks for usu-canvas-user flag (must exist)
   *    - Validates course ID and student ID
   *    - Hides sign-in banner (user is logged in)
   *    - Extracts assignment IDs from Core Skills links
   *    - Prefetches Progress page data (grades)
   *    - Fetches quiz statuses for all assignments
   *    - Applies status icons to Core Skills links (pending/active/done)
   *    - Adds ncas-status-enabled class to body
   *    - Injects status key banner (legend)
   * 5. Overlay fades out after setup completes
   * 
   * Called after redirect from Start Here page with overlay active
   */
  async function loadUsuCanvasUserCoreSkills() {
    log("loadUsuCanvasUserCoreSkills: Initial setup for USU Canvas user");
    
    if (!document.body.classList.contains('ncademi-core-skills-page')) {
      log("loadUsuCanvasUserCoreSkills: Not on Core Skills page");
      return false;
    }

    // Check for flag
    const usuCanvasUser = sessionStorage.getItem('usu-canvas-user') === 'true';
    if (!usuCanvasUser) {
      log("loadUsuCanvasUserCoreSkills: Flag not found, skipping");
      return false;
    }

    const courseId = getCourseId();
    if (!courseId) {
      log("loadUsuCanvasUserCoreSkills: No course ID found");
      return false;
    }

    const studentId = await resolveStudentId();
    if (!studentId) {
      log("loadUsuCanvasUserCoreSkills: No student ID found");
      return false;
    }

    // Note: Sign-in banner is not injected for Canvas users (injectSignInBanner checks flag and skips)
    // No need to hide banner here since it won't exist

    // Extract assignment IDs from links
    const { assignmentIds, linkMap } = extractAssignmentIdsFromLinks();
    
    if (assignmentIds.length === 0) {
      log("loadUsuCanvasUserCoreSkills: No assignment IDs found in Core Skills links");
      return false;
    }

    log("loadUsuCanvasUserCoreSkills: Prefetching Progress page data");
    await quizStatusService.prefetchProgressPage(courseId);

    const statusMap = await quizStatusService.ensureStatuses({ courseId, assignmentIds });
    const appliedCount = applyStatusToCoreSkillsLinks(statusMap, linkMap);

    if (appliedCount > 0) {
      document.body.classList.add('ncas-status-enabled');
      requestAnimationFrame(() => {
        injectStatusKeyBanner();
      });
      logOK("loadUsuCanvasUserCoreSkills: Status icons enabled and applied");
      return true;
    }

    log("loadUsuCanvasUserCoreSkills: Status map did not contain data for Core Skills links");
    return false;
  }

  /**
   * updateUsuCanvasCoreSkills: Update Core Skills quiz status icons when flag is present (subsequent navigations)
   * Only updates existing visible elements - no sign-in banner hiding (banner already handled by loadUsuCanvasUserCoreSkills)
   * 
   * E2E Process:
   * 1. User navigates directly to Core Skills page (via nav bar or direct URL)
   * 2. applyPageSpecificLogic() runs and detects Core Skills page
   * 3. Sign-in banner is injected (shows by default)
   * 4. updateUsuCanvasCoreSkills() is called:
   *    - Validates page is Core Skills
   *    - Checks for usu-canvas-user flag in sessionStorage
   *    - If flag NOT found: Returns early, does nothing (user treated as not logged in)
   *    - If flag found: Proceeds with status update
   * 5. Waits for page body to be fully loaded (ensures links are in DOM)
   * 6. Extracts assignment IDs from existing Core Skills links
   * 7. Prefetches Progress page data (grades)
   * 8. Fetches quiz statuses for all assignments
   * 9. Applies status icons to existing links (updates data-status attributes)
   * 10. Adds ncas-status-enabled class to body
   * 11. Injects status key banner if it doesn't already exist
   * 
   * Note: This function does NOT hide the sign-in banner - that's only done in loadUsuCanvasUserCoreSkills()
   * during the initial redirect flow. For subsequent navigations, the banner remains visible if user is not logged in.
   */
  async function updateUsuCanvasCoreSkills() {
    log("updateUsuCanvasCoreSkills: Checking for flag");
    
    if (!document.body.classList.contains('ncademi-core-skills-page')) {
      log("updateUsuCanvasCoreSkills: Not on Core Skills page");
      return false; // Not on Core Skills page
    }

    // Check for flag
    const usuCanvasUser = sessionStorage.getItem('usu-canvas-user') === 'true';
    if (!usuCanvasUser) {
      log("updateUsuCanvasCoreSkills: Flag not found, doing nothing (user treated as not logged in)");
      return false; // No flag, do nothing - user is treated as not logged in
    }

    log("updateUsuCanvasCoreSkills: Flag found, updating quiz status icons");

    // Wait for page body to be loaded to ensure links are available
    await waitForPageBodyLoaded();

    const courseId = getCourseId();
    if (!courseId) {
      log("updateUsuCanvasCoreSkills: No course ID found");
      return false;
    }

    // Extract assignment IDs from existing links
    const { assignmentIds, linkMap } = extractAssignmentIdsFromLinks();
    
    if (assignmentIds.length === 0) {
      log("updateUsuCanvasCoreSkills: No assignment IDs found in links");
      return false;
    }

    // Prefetch Progress page data
    await quizStatusService.prefetchProgressPage(courseId);

    // Fetch statuses and apply to existing links
    const statusMap = await quizStatusService.ensureStatuses({ courseId, assignmentIds });
    const appliedCount = applyStatusToCoreSkillsLinks(statusMap, linkMap);

    if (appliedCount > 0) {
      document.body.classList.add('ncas-status-enabled');
      // Only inject status key banner if it doesn't exist
      if (!document.querySelector('.ncademi-status-key-banner')) {
        requestAnimationFrame(() => {
          injectStatusKeyBanner();
        });
      }
      logOK("updateUsuCanvasCoreSkills: Quiz status icons updated");
      return true;
    }

    log("updateUsuCanvasCoreSkills: No statuses applied");
    return false;
  }

  /* CORE SKILLS PAGE CODE DISABLED - NCAS23
  // Main function to update Core Skills checkmarks
  async function updateCoreSkillsCheckmarks(options = {}) {
    const { signedIn } = options;

    if (!document.body.classList.contains('ncademi-core-skills-page')) {
      log("updateCoreSkillsCheckmarks: not on Core Skills page");
      return false; // Not on Core Skills page
    }

    // Check if user was redirected from Start Here (flag indicates user is logged in)
    const loggedInRedirect = sessionStorage.getItem('ncademi-logged-in-redirect') === 'true';
    
    // Check if user is signed in to Canvas
    // If flag is set, skip Canvas check (user is already verified as logged in)
    let resolvedSignedIn;
    if (loggedInRedirect) {
      // User was redirected from Start Here, already verified as logged in
      resolvedSignedIn = true;
      // Clear the flag after using it
      sessionStorage.removeItem('ncademi-logged-in-redirect');
      log("updateCoreSkillsCheckmarks: User verified as logged in from Start Here redirect");
    } else if (typeof signedIn === 'boolean') {
      resolvedSignedIn = signedIn;
    } else {
      resolvedSignedIn = await waitForSignedInState({ timeout: 3000 });
    }

    if (!resolvedSignedIn) {
      log("User not signed in to Canvas, status icons not shown");
      injectSignInBanner();
      return false;
    }

    const courseId = getCourseId();
    if (!courseId) {
      log("No course ID found, cannot fetch submissions");
      return false;
    }

    const studentId = await resolveStudentId();

    if (!studentId) {
      log("No student ID found, cannot fetch submissions");
      return false;
    }

    // Extract assignment IDs from links (hardcoded in HTML)
    const { assignmentIds, linkMap } = extractAssignmentIdsFromLinks();
    
    if (assignmentIds.length === 0) {
      log("No assignment IDs found in Core Skills links");
      return false;
    }

    log("updateCoreSkillsCheckmarks: prefetching Progress page data");
    await quizStatusService.prefetchProgressPage(courseId);

    const statusMap = await quizStatusService.ensureStatuses({ courseId, assignmentIds });
    const appliedCount = applyStatusToCoreSkillsLinks(statusMap, linkMap);

    if (appliedCount > 0) {
      document.body.classList.add('ncas-status-enabled');
      requestAnimationFrame(() => {
        injectStatusKeyBanner();
      });
      logOK("Status icons enabled and applied for signed-in user");
      return true;
    }

    log("Status map did not contain data for Core Skills links");
    return false;
  }
  */

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

  function augmentQuizPageTitle() {
    const path = window.location.pathname || '';
    if (!path.includes('/assignments/')) {
      return;
    }

    const quizIndicator = document.querySelector('[data-course-type="quizzes.next"], a.quiz-button[data-course-type]');
    if (!quizIndicator) {
      return;
    }

    const suffix = ' quiz';
    const suffixLower = suffix.toLowerCase();

    const normalize = (text) => {
      if (!text) return null;
      const trimmed = text.trim();
      if (trimmed.toLowerCase().endsWith(suffixLower)) {
        return trimmed;
      }
      return `${trimmed}${suffix}`;
    };

    const titleElement = document.querySelector('h1');
    if (titleElement) {
      const updated = normalize(titleElement.textContent);
      if (updated) {
        titleElement.textContent = updated;
      }
    }

    if (document.title) {
      const updatedTitle = normalize(document.title);
      if (updatedTitle) {
        document.title = updatedTitle;
      }
    }
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
      const assignmentLink = row.querySelector('th.title a');
      normalizeAssignmentLink(assignmentLink);
      const assignmentId = assignmentLink ? getAssignmentIdFromUrl(assignmentLink.getAttribute('href') || '') : null;                                           
      if (assignmentId) {
        quizStatusService.setStatus(assignmentId, statusValue);
      }
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

  function removeGradesSummaryCaption() {
    const caption = document.querySelector('table#grades_summary caption.screenreader-only');
    if (caption) {
      caption.remove();
      logOK('Removed grades summary caption');
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

  function injectBodyOverlayForRedirect() {
    // CORE SKILLS PAGE CODE DISABLED - NCAS23
    // Body restoration is now handled in handleInitialRedirects()
    // Check if this is a redirect from course home
    const isRedirectFromHome = sessionStorage.getItem('ncademi-redirect-from-home') === 'true';
    if (!isRedirectFromHome) {
      /* CORE SKILLS PAGE CODE DISABLED - NCAS23
      // Ensure body is visible if not a redirect
      if (document.body && document.body.style.display === 'none') {
        document.body.style.display = '';
      }
      */
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
    
    function fadeOverlayWhenReady() {
      // CORE SKILLS PAGE CODE DISABLED - NCAS23
      // waitForCoreSkillsStatusIfNeeded() was commented out, so fade overlay directly
      fadeOutOverlay(overlay);
    }

    if (totalImages === 0) {
      setTimeout(fadeOverlayWhenReady, 300);
      return;
    }
    
    let loadedCount = 0;
    let erroredCount = 0;
    
    function checkComplete() {
      if (loadedCount + erroredCount === totalImages) {
        setTimeout(fadeOverlayWhenReady, 300);
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
        fadeOverlayWhenReady();
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
                  
                  // Verify nav handler is attached after navigation completes
                  // This prevents race conditions where navigation happens but handler isn't ready
                  setTimeout(() => {
                    const nav = document.querySelector('#ncademi-nav');
                    if (nav) {
                      attachNavClickHandler(nav);
                    }
                  }, 100); // Small delay to ensure DOM is fully updated
                  
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
        if (courseId && !isAdmin() && window.ncademiInitializedV23) {
          // Header already exists, just update it
          ensureHeaderNav();
        }
      });
      window.ncademiDOMReadyListenerSet = true;
    }
    
    window.ncademiNavigationListenerSet = true;
  }

  // Initialize only once per page load
  if (window.ncademiInitializedV23) {
    log("Already initialized, updating header for navigation");
    // Header may already exist from previous navigation - update it
    ensureHeaderNav();
    return;
  }

  // Handle redirects: course home always redirects to Start Here
  handleInitialRedirects();

  // onCourseLoad: Determines Canvas user status and handles initial flow
  // ALL Canvas user validation happens on Start Here page - this is the ONLY place
  onCourseLoad();

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
    
    resetSkillQuizButtonStateForCurrentPath();
    resetCoreSkillsStatusStateForCurrentPath();

    augmentQuizPageTitle();

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
    
    // Add Core Skills page class for CSS targeting (e.g., hiding h1.page-title)
    if (isCoreSkillsPage) {
      document.body.classList.add('ncademi-core-skills-page');
      
      // Check if overlay should be shown for subsequent navigations
      // (not from initial redirect - that's handled in onCourseLoad)
      const overlayActive = sessionStorage.getItem('ncademi-overlay-active') === 'true';
      let overlay = null;
      
      if (!overlayActive) {
        // Create overlay for subsequent navigation to Core Skills
        overlay = createOrGetOverlay();
        updateOverlayMessage('Loading Core Skills page...');
        sessionStorage.setItem('ncademi-overlay-active', 'true');
        log('Overlay created for subsequent Core Skills navigation');
      } else {
        // Overlay already exists (from initial redirect)
        overlay = document.getElementById('ncademi-loading-overlay');
      }
      
      // Inject sign-in banner (shows by default, hides if user is logged in)
      waitForDOM(async () => {
        // Wait for page body to load
        await waitForPageBodyLoaded();
        
        await injectSignInBanner();
        
        // Check for flag and update quiz status icons if present (subsequent navigations)
        await updateUsuCanvasCoreSkills();
        
        // Validate all page elements are loaded before fading overlay
        await validateCoreSkillsPageLoaded();
        
        // All elements validated, fade out overlay if it exists
        if (overlay) {
          fadeOutOverlay(overlay);
          sessionStorage.removeItem('ncademi-overlay-active');
          sessionStorage.removeItem('ncademi-overlay-start-time');
          log('Core Skills page (subsequent navigation) completely loaded and validated, overlay faded out');
        }
      });
    } else {
      document.body.classList.remove('ncademi-core-skills-page');
    }
    
    /* CORE SKILLS PAGE CODE DISABLED - NCAS23
    if (isCoreSkillsPage) {
      document.body.classList.add('ncademi-core-skills-page');
      
      // Check if user is signed in and inject appropriate banners
      injectSignInBanner();
      // Ensure status-enabled class is present before injecting banner
      if (document.body.classList.contains('ncas-status-enabled')) {
        requestAnimationFrame(() => {
          injectStatusKeyBanner();
        });
      }
      
      // Update checkmarks with status from API (only if signed in)
      // Only fetches quizzes that are NOT "done" - more efficient
      scheduleCoreSkillsStatusUpdate();
      
      // Also set up observer to handle dynamically loaded links
      if (!window.ncademiCoreSkillsObserverSet) {
        const observer = new MutationObserver(() => {
          // Re-check for links and update status on Core Skills page
          if (document.body.classList.contains('ncademi-core-skills-page')) {
            if (isUserSignedInFast()) {
              scheduleCoreSkillsStatusUpdate();
            }
          }
          // Re-check for banner injection if container appears
          injectSignInBanner();
          if (document.body.classList.contains('ncas-status-enabled')) {
            requestAnimationFrame(() => {
              injectStatusKeyBanner();
            });
          }
          requestSkillPageQuizButtons();
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
              scheduleCoreSkillsStatusUpdate();
            }
          }
          injectSignInBanner();
          if (document.body.classList.contains('ncas-status-enabled')) {
            requestAnimationFrame(() => {
              injectStatusKeyBanner();
            });
          }
          requestSkillPageQuizButtons();
        }, 1000);
      }
    } else {
      document.body.classList.remove('ncademi-core-skills-page');
    }
    */
    
    if (isDefaultCourseHome) {
      document.body.classList.add('ncademi-default-course-home');
    } else {
      document.body.classList.remove('ncademi-default-course-home');
    }

    if (activeKey === "progress") {
      document.body.classList.add('ncademi-progress-page');
    } else {
      document.body.classList.remove('ncademi-progress-page');
    }
    
    // Inject content wrapper overlay (after body classes are set)
    // Inject immediately to prevent layout shift - overlay is positioned absolutely so won't affect layout
    injectContentWrapperOverlay();
    
    // Initialize dismiss buttons for banners already in HTML (skill pages)
    initializeSignInBannerDismissButtons();
    
    requestSkillPageQuizButtons();
    
    // Handle grades page (Progress)
    // Note: H1 heading hiding is now handled by CSS (no inline styles needed)
    if (activeKey === "progress") {
      applyProgressPageTitles();
      removeGradesSummaryCaption();

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

      // Hide "Click to test a different score" title and unread dot
      function hideGradeInteractiveElements() {
        // Remove title attribute from assignment_score cells
        const scoreCells = document.querySelectorAll('.assignment_score');
        scoreCells.forEach(cell => {
          if (cell.getAttribute('title') === 'Click to test a different score') {
            cell.removeAttribute('title');
          }
        });

        // Hide unread dot spans
        const unreadDots = document.querySelectorAll('.assignment_score .unread_dot, .assignment_score .grade_dot');
        unreadDots.forEach(dot => {
          dot.style.display = 'none';
          dot.setAttribute('aria-hidden', 'true');
        });

        // Also hide tooltip text that says "Click to test a different score"
        const tooltipTexts = document.querySelectorAll('.assignment_score .score_teaser');
        tooltipTexts.forEach(tooltip => {
          if (tooltip.textContent.includes('Click to test a different score')) {
            tooltip.style.display = 'none';
            tooltip.setAttribute('aria-hidden', 'true');
          }
        });
      }

      // Remove from keyboard navigation immediately and on DOM changes
      removeFromKeyboardNavigation();
      
      // Hide interactive grade elements immediately and on DOM changes
      hideGradeInteractiveElements();
      
      // Use MutationObserver to catch dynamically added elements
      const keyboardNavObserver = new MutationObserver(() => {
        removeFromKeyboardNavigation();
        hideGradeInteractiveElements();
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
        applyProgressPageTitles();
        const iconsInjected = injectGradeIcons();
        const statusPopulated = populateStatusColumn();
        hideGradeInteractiveElements(); // Hide interactive elements
        
        if (pageTitleInjected && iconsInjected && statusPopulated) return true;

        if (typeof MutationObserver !== 'undefined') {
          const observer = new MutationObserver(() => {
            const pageTitleInjected = injectPageTitle();
            applyProgressPageTitles();
            removeGradesSummaryCaption();
            const iconsInjected = injectGradeIcons();
            const statusPopulated = populateStatusColumn();
            hideGradeInteractiveElements(); // Hide interactive elements on DOM changes
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
              hideGradeInteractiveElements(); // Hide interactive elements
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
    
    window.ncademiInitializedV23 = true;
    logOK("Initialized: v23 nav + A11Y + Container Width Enforcement + Skip Link");
  });
})();