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

  // ============================================
  // DEPENDENCY CHECKS AND POLYFILLS
  // Ensure all required APIs are available before proceeding
  // ============================================
  
  // Critical dependencies - must be available
  if (typeof document === 'undefined') {
    logError("CRITICAL: document object not available - script cannot run");
    return;
  }
  
  if (typeof window === 'undefined') {
    logError("CRITICAL: window object not available - script cannot run");
    return;
  }

  // Performance API - provide fallback if not available
  const perfNow = (function() {
    if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
      return performance.now.bind(performance);
    } else if (typeof Date !== 'undefined' && typeof Date.now === 'function') {
      log("⚠️ Performance API not available, using Date.now() fallback");
      return function() { return Date.now(); };
    } else {
      logError("CRITICAL: No timing API available (performance.now or Date.now)");
      return function() { return 0; }; // Fallback to 0
    }
  })();

  // MutationObserver - check availability and provide graceful degradation
  const hasMutationObserver = typeof MutationObserver !== 'undefined';
  if (!hasMutationObserver) {
    logError("⚠️ MutationObserver not available - METHOD 6 (observer watch) will be skipped");
  }

  // Promise - check availability (should always be available in modern Canvas environment)
  const hasPromise = typeof Promise !== 'undefined';
  if (!hasPromise) {
    logError("CRITICAL: Promise not available - async detection methods will not work");
  }

  // Array.from - check availability and provide fallback
  const safeArrayFrom = (function() {
    if (typeof Array !== 'undefined' && typeof Array.from === 'function') {
      return Array.from;
    } else {
      log("⚠️ Array.from not available, using Array.prototype.slice fallback");
      return function(arrayLike) {
        try {
          return Array.prototype.slice.call(arrayLike);
        } catch (e) {
          logError("Error converting array-like to array", e);
          return [];
        }
      };
    }
  })();

  // insertAdjacentElement - check availability and provide fallback
  const safeInsertAdjacent = (function() {
    if (typeof Element !== 'undefined' && Element.prototype && typeof Element.prototype.insertAdjacentElement === 'function') {
      return function(element, position, target) {
        try {
          return target.insertAdjacentElement(position, element);
        } catch (e) {
          logError(`Error inserting element ${position}`, e);
          // Fallback to appendChild
          if (position === 'afterend' && target.parentNode) {
            if (target.nextSibling) {
              target.parentNode.insertBefore(element, target.nextSibling);
            } else {
              target.parentNode.appendChild(element);
            }
            return element;
          } else if (position === 'beforebegin' && target.parentNode) {
            target.parentNode.insertBefore(element, target);
            return element;
          }
          return null;
        }
      };
    } else {
      log("⚠️ insertAdjacentElement not available, using appendChild fallback");
      return function(element, position, target) {
        try {
          if (position === 'afterend' && target.parentNode) {
            if (target.nextSibling) {
              target.parentNode.insertBefore(element, target.nextSibling);
            } else {
              target.parentNode.appendChild(element);
            }
            return element;
          } else if (position === 'beforebegin' && target.parentNode) {
            target.parentNode.insertBefore(element, target);
            return element;
          }
          return null;
        } catch (e) {
          logError("Error inserting element with fallback method", e);
          return null;
        }
      };
    }
  })();

  // Node.TEXT_NODE constant - provide fallback
  const TEXT_NODE = (typeof Node !== 'undefined' && typeof Node.TEXT_NODE !== 'undefined') 
    ? Node.TEXT_NODE 
    : 3; // Standard value for TEXT_NODE

  // Log dependency status
  log(`Dependency check: Performance=${typeof perfNow === 'function'}, MutationObserver=${hasMutationObserver}, Promise=${hasPromise}, Array.from=${typeof safeArrayFrom === 'function'}, insertAdjacent=${typeof safeInsertAdjacent === 'function'}`);

  // ============================================
  // END DEPENDENCY CHECKS
  // ============================================

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
    if (!courseId) { 
      log("No course id; skip header/nav"); 
      return; 
    }

    // EARLY REUSE CHECK (adapted from NCAS6)
    // Check if header already exists and is properly positioned at body.firstChild
    // This prevents reinjection during AJAX navigation
    const existingHeader = document.getElementById("content-header");
    const existingNav = existingHeader ? existingHeader.querySelector("#ncademi-nav") : null;
    
    // If header exists at body.firstChild with nav, just update active state
    if (existingHeader && existingNav && existingHeader.parentNode === document.body && 
        existingHeader === document.body.firstChild) {
      log("Header already exists and positioned correctly - updating active state only");
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

    const startTime = perfNow();
    log(`=== STARTING HEADER NAV INITIALIZATION at ${new Date().toISOString()} ===`);

    // Helper function to get elapsed time
    function getElapsed() {
      return ((perfNow() - startTime) / 1000).toFixed(3);
    }

    // Helper function to check if header exists with detailed logging
    function checkHeaderExists() {
      const header = document.getElementById("content-header");
      if (header) {
        const headerTitle = header.querySelector(".ncademi-header-title");
        if (headerTitle) {
          log(`✅ Header found at ${getElapsed()}s - Header exists: true, Title exists: true`);
          return { header, headerTitle, found: true };
        } else {
          log(`⚠️ Header found but title missing at ${getElapsed()}s - Header exists: true, Title exists: false`);
          return { header, headerTitle: null, found: false };
        }
      } else {
        log(`❌ Header not found at ${getElapsed()}s - Header exists: false`);
        return { header: null, headerTitle: null, found: false };
      }
    }

    // Helper function to check Canvas signals
    function checkCanvasSignals() {
      const signals = {
        domReady: document.readyState,
        hasENV: typeof ENV !== 'undefined',
        hasApplication: !!document.getElementById('application'),
        hasBackbone: typeof Backbone !== 'undefined',
        hasJQuery: typeof jQuery !== 'undefined',
        bodyChildren: document.body ? document.body.children.length : 0
      };
      log(`Canvas signals at ${getElapsed()}s:`, signals);
      return signals;
    }

    // Function to actually inject nav (called once header is found)
    function injectNav(header, headerTitle) {
      log(`=== INJECTING NAV at ${getElapsed()}s ===`);
      
      // Move header to document.body.firstChild (like NCAS6) to persist across AJAX navigations
      // This places it completely outside Canvas's replaceable content areas
      const currentParent = header.parentNode;
      const isAtBodyFirstChild = (currentParent === document.body && header === document.body.firstChild);
      
      if (!isAtBodyFirstChild) {
        log(`Moving header to document.body.firstChild at ${getElapsed()}s (currently in: ${currentParent ? currentParent.id || currentParent.tagName : 'unknown'})`);
        try {
          // Remove from current location if needed
          if (currentParent && currentParent !== document.body) {
            header.remove();
          }
          // Insert at body.firstChild (NCAS6 approach)
          document.body.insertBefore(header, document.body.firstChild);
          logOK(`Header moved to document.body.firstChild at ${getElapsed()}s`);
        } catch (e) {
          logError("Error moving header to body.firstChild", e);
        }
      } else {
        log(`Header already at document.body.firstChild at ${getElapsed()}s`);
      }
      
      // Check if nav container exists
      let nav = header.querySelector("#ncademi-nav");
      if (!nav) {
        log(`Nav container not found, creating at ${getElapsed()}s`);
        try {
        nav = document.createElement("div");
          if (!nav) {
            logError("Failed to create nav element");
            return;
          }
        nav.id = "ncademi-nav";
        nav.className = "ncademi-desktop-nav";
          const inserted = safeInsertAdjacent(nav, "afterend", headerTitle);
          if (!inserted) {
            logError("Failed to insert nav element after header title");
            return;
          }
          logOK(`Nav container created and injected after header title at ${getElapsed()}s`);
          
          // Set up event delegation on nav container (persists across DOM changes)
          // Use a data attribute to ensure we only set it up once
          if (!nav.hasAttribute('data-nav-handler-attached')) {
            nav.setAttribute('data-nav-handler-attached', 'true');
            nav.addEventListener('click', function(e) {
              // Only handle clicks on anchor tags
              const link = e.target.closest('a');
              if (!link || !link.closest('#ncademi-nav')) return;
              
              const href = link.getAttribute('href');
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
                    if (window.Backbone && window.Backbone.history) {
                      window.Backbone.history.navigate(url.pathname + (url.search || ''), { trigger: true });
                      logOK(`Navigated to ${href} using Canvas Backbone router (event delegation)`);
                    } else {
                      window.location.href = href;
                      log(`Canvas router not available, using default navigation for ${href}`);
                    }
                    
                    return false;
                  }
                }
              } catch (err) {
                log(`Could not parse URL ${href}, using default navigation`);
              }
            }, true); // Use capture phase to intercept before Canvas
            logOK("Event delegation set up on nav container");
          }
        } catch (e) {
          logError("Error creating/injecting nav container", e);
          return;
        }
      } else {
        log(`Nav container already exists at ${getElapsed()}s`);
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
      injectNavLinks();
      log(`=== HEADER NAV INITIALIZATION COMPLETE at ${getElapsed()}s (total: ${getElapsed()}s) ===`);
    }

    // Track if we've already succeeded (to cancel pending operations)
    let headerFoundFlag = false;
    const pendingTimeouts = [];
    const pendingIntervals = [];

    // Track which methods were used and succeeded (for minimal version analysis)
    const methodUsage = {
      method1_immediate: { attempted: false, succeeded: false, time: null },
      method2_domContentLoaded: { attempted: false, succeeded: false, time: null },
      method3_readyStateComplete: { attempted: false, succeeded: false, time: null },
      method4_canvasSignals: { attempted: false, succeeded: false, time: null },
      method5_exponentialBackoff: { attempted: false, succeeded: false, time: null, attempts: 0 },
      method6_mutationObserver: { attempted: false, succeeded: false, time: null },
      method7_finalPolling: { attempted: false, succeeded: false, time: null, attempts: 0 },
      dependencyFallbacks: {
        performanceAPI: typeof performance === 'undefined' || typeof performance.now !== 'function',
        arrayFrom: typeof Array === 'undefined' || typeof Array.from !== 'function',
        insertAdjacent: typeof Element === 'undefined' || !Element.prototype || typeof Element.prototype.insertAdjacentElement !== 'function',
        mutationObserver: !hasMutationObserver
      }
    };

    // Helper to track and cancel timeouts
    function trackTimeout(id) {
      pendingTimeouts.push(id);
      return id;
    }

    // Helper to track and cancel intervals
    function trackInterval(id) {
      pendingIntervals.push(id);
      return id;
    }

    // Cancel all pending operations
    function cancelAllPending() {
      headerFoundFlag = true;
      pendingTimeouts.forEach(id => clearTimeout(id));
      pendingIntervals.forEach(id => clearInterval(id));
      pendingTimeouts.length = 0;
      pendingIntervals.length = 0;
    }

    // Log final summary for minimal version analysis
    function logMethodSummary() {
      const successfulMethods = Object.entries(methodUsage)
        .filter(([key, value]) => key !== 'dependencyFallbacks' && value.succeeded)
        .map(([key]) => key);
      
      const attemptedMethods = Object.entries(methodUsage)
        .filter(([key, value]) => key !== 'dependencyFallbacks' && value.attempted)
        .map(([key]) => key);

      log(`📊 METHOD USAGE SUMMARY (for minimal version analysis):`, {
        successfulMethods,
        attemptedMethods,
        totalTime: getElapsed(),
        dependencyFallbacks: methodUsage.dependencyFallbacks,
        headerFound: headerFoundFlag
      });
      
      // Also log as a single-line summary for easy parsing
      log(`📊 SUMMARY: Header found via ${successfulMethods.join(' -> ') || 'NONE'} after ${getElapsed()}s. Attempted: ${attemptedMethods.join(', ')}`);
    }

    // METHOD 1: Try immediate check
    methodUsage.method1_immediate.attempted = true;
    methodUsage.method1_immediate.time = getElapsed();
    log(`[METHOD 1] Immediate check at ${getElapsed()}s`);
    const immediateCheck = checkHeaderExists();
    if (immediateCheck.found) {
      methodUsage.method1_immediate.succeeded = true;
      injectNav(immediateCheck.header, immediateCheck.headerTitle);
      cancelAllPending();
      logMethodSummary();
      return;
    }
    checkCanvasSignals();

    // METHOD 2: Wait for DOMContentLoaded (if not already loaded)
    function waitForDOMContentLoaded() {
      return new Promise((resolve) => {
        if (headerFoundFlag) {
          resolve();
          return;
        }
        
        if (document.readyState === 'loading') {
          log(`[METHOD 2] DOM still loading, waiting for DOMContentLoaded at ${getElapsed()}s`);
          const domReadyStart = perfNow();
          const handler = () => {
            if (headerFoundFlag) {
              resolve();
              return;
            }
            log(`DOMContentLoaded fired after ${((perfNow() - domReadyStart) / 1000).toFixed(3)}s (total: ${getElapsed()}s)`);
            resolve();
          };
          document.addEventListener('DOMContentLoaded', handler, { once: true });
    } else {
          log(`[METHOD 2] DOM already loaded (readyState: ${document.readyState}) at ${getElapsed()}s`);
          resolve();
        }
      });
    }

    // METHOD 3: Wait for readyState === 'complete'
    function waitForComplete() {
      return new Promise((resolve) => {
        if (headerFoundFlag) {
          resolve();
          return;
        }
        
        if (document.readyState !== 'complete') {
          log(`[METHOD 3] Waiting for readyState === 'complete' (current: ${document.readyState}) at ${getElapsed()}s`);
          const completeStart = perfNow();
          const checkComplete = trackInterval(setInterval(() => {
            if (headerFoundFlag) {
              clearInterval(checkComplete);
              resolve();
          return;
        }
            if (document.readyState === 'complete') {
              clearInterval(checkComplete);
              log(`readyState === 'complete' reached after ${((perfNow() - completeStart) / 1000).toFixed(3)}s (total: ${getElapsed()}s)`);
              resolve();
            }
          }, 50));
          
          // Safety timeout after 5 seconds
          trackTimeout(setTimeout(() => {
            if (headerFoundFlag) {
              clearInterval(checkComplete);
              resolve();
              return;
            }
            clearInterval(checkComplete);
            log(`[METHOD 3] Timeout: readyState still ${document.readyState} after 5s, proceeding anyway at ${getElapsed()}s`);
            resolve();
          }, 5000));
        } else {
          log(`[METHOD 3] readyState already 'complete' at ${getElapsed()}s`);
          resolve();
        }
      });
    }

    // METHOD 4: Wait for Canvas signals (ENV, #application, etc.)
    function waitForCanvasSignals() {
      return new Promise((resolve) => {
        if (headerFoundFlag) {
          resolve();
          return;
        }
        
        log(`[METHOD 4] Waiting for Canvas signals at ${getElapsed()}s`);
        const signalsStart = perfNow();
        const requiredSignals = {
          hasApplication: () => !!document.getElementById('application'),
          hasENV: () => typeof ENV !== 'undefined'
        };
        
        const checkSignals = trackInterval(setInterval(() => {
          if (headerFoundFlag) {
            clearInterval(checkSignals);
            resolve();
            return;
          }
          const signals = checkCanvasSignals();
          const allReady = Object.values(requiredSignals).every(check => check());
          
          if (allReady) {
            clearInterval(checkSignals);
            log(`All Canvas signals ready after ${((perfNow() - signalsStart) / 1000).toFixed(3)}s (total: ${getElapsed()}s)`);
            resolve();
          }
        }, 100));
        
        // Safety timeout after 10 seconds
        trackTimeout(setTimeout(() => {
          if (headerFoundFlag) {
            clearInterval(checkSignals);
            resolve();
            return;
          }
          clearInterval(checkSignals);
          log(`[METHOD 4] Timeout: Some Canvas signals may not be ready after 10s, proceeding anyway at ${getElapsed()}s`);
          resolve();
        }, 10000));
      });
    }

    // METHOD 5: Exponential backoff polling
    function pollWithExponentialBackoff() {
      return new Promise((resolve) => {
        if (headerFoundFlag) {
          resolve({ found: false });
          return;
        }
        
        methodUsage.method5_exponentialBackoff.attempted = true;
        methodUsage.method5_exponentialBackoff.time = getElapsed();
        log(`[METHOD 5] Starting exponential backoff polling at ${getElapsed()}s`);
        const delays = [50, 100, 200, 500, 1000, 2000]; // ms
        let attempt = 0;
        
        function tryPoll() {
          if (headerFoundFlag) {
            resolve({ found: false });
            return;
          }
          
          const check = checkHeaderExists();
          if (check.found) {
            methodUsage.method5_exponentialBackoff.attempted = true;
            methodUsage.method5_exponentialBackoff.succeeded = true;
            methodUsage.method5_exponentialBackoff.attempts = attempt + 1;
            methodUsage.method5_exponentialBackoff.time = getElapsed();
            log(`Header found via polling on attempt ${attempt + 1} at ${getElapsed()}s`);
            resolve({ found: true, header: check.header, headerTitle: check.headerTitle });
            return;
          }
          
          attempt++;
          if (attempt < delays.length) {
            const delay = delays[attempt - 1];
            log(`Poll attempt ${attempt} failed, waiting ${delay}ms before next attempt (elapsed: ${getElapsed()}s)`);
            trackTimeout(setTimeout(tryPoll, delay));
          } else {
            log(`[METHOD 5] All ${delays.length} polling attempts exhausted at ${getElapsed()}s`);
            methodUsage.method5_exponentialBackoff.attempts = delays.length;
            resolve({ found: false });
          }
        }
        
        tryPoll();
      });
    }

    // METHOD 6: MutationObserver watching body subtree
    function watchWithMutationObserver() {
      return new Promise((resolve) => {
        if (headerFoundFlag) {
          resolve({ found: false });
          return;
        }
        
        // Check if MutationObserver is available
        if (!hasMutationObserver) {
          log(`[METHOD 6] MutationObserver not available, skipping observer watch at ${getElapsed()}s`);
          resolve({ found: false });
          return;
        }
        
        methodUsage.method6_mutationObserver.attempted = true;
        methodUsage.method6_mutationObserver.time = getElapsed();
        log(`[METHOD 6] Starting MutationObserver watch at ${getElapsed()}s`);
        const observerStart = perfNow();
        let observerDisconnected = false;
        
        let observer;
        try {
          observer = new MutationObserver((mutations) => {
            if (observerDisconnected || headerFoundFlag) {
              if (!observerDisconnected) {
                observer.disconnect();
            observerDisconnected = true;
              }
            return;
          }
          
            const check = checkHeaderExists();
            if (check.found) {
              methodUsage.method6_mutationObserver.attempted = true;
              methodUsage.method6_mutationObserver.succeeded = true;
              methodUsage.method6_mutationObserver.time = getElapsed();
              observer.disconnect();
              observerDisconnected = true;
              log(`Header found via MutationObserver after ${((perfNow() - observerStart) / 1000).toFixed(3)}s (total: ${getElapsed()}s)`);
              resolve({ found: true, header: check.header, headerTitle: check.headerTitle });
              return;
            }
            
            // Log mutations for debugging (limit to avoid spam)
            if (mutations.length > 0 && Math.random() < 0.1) { // Log 10% of mutations
              log(`MutationObserver detected changes: ${mutations.length} mutations (elapsed: ${getElapsed()}s)`);
            }
          });
        } catch (e) {
          logError("Error creating MutationObserver", e);
          resolve({ found: false });
          return;
        }
        
        // Watch body and all descendants
        if (document.body && observer) {
          try {
            observer.observe(document.body, {
              childList: true,
              subtree: true
            });
            log(`MutationObserver watching document.body with subtree at ${getElapsed()}s`);
          } catch (e) {
            logError("Error setting up MutationObserver watch", e);
            resolve({ found: false });
            return;
          }
        } else {
          log(`document.body not available for MutationObserver at ${getElapsed()}s`);
          resolve({ found: false });
          return;
        }
        
        // Safety timeout after 15 seconds
        trackTimeout(setTimeout(() => {
          if (headerFoundFlag || observerDisconnected) {
            if (!observerDisconnected && observer) {
              try {
            observer.disconnect();
              } catch (e) {
                logError("Error disconnecting observer in timeout", e);
              }
              observerDisconnected = true;
            }
            resolve({ found: false });
            return;
          }
          if (observer) {
            try {
              observer.disconnect();
            } catch (e) {
              logError("Error disconnecting observer on timeout", e);
            }
          }
          observerDisconnected = true;
          log(`[METHOD 6] MutationObserver timeout after 15s, stopping watch at ${getElapsed()}s`);
          resolve({ found: false });
        }, 15000));
      });
    }

    // METHOD 7: Final extended polling as last resort
    function finalExtendedPoll() {
      return new Promise((resolve) => {
        if (headerFoundFlag) {
          resolve({ found: false });
          return;
        }
        
        methodUsage.method7_finalPolling.attempted = true;
        methodUsage.method7_finalPolling.time = getElapsed();
        log(`[METHOD 7] Starting final extended polling at ${getElapsed()}s`);
        const pollStart = perfNow();
        let attempt = 0;
        const maxAttempts = 30; // 30 attempts × 500ms = 15 seconds max
        const pollInterval = 500;
        
        const pollTimer = trackInterval(setInterval(() => {
          if (headerFoundFlag) {
            clearInterval(pollTimer);
            resolve({ found: false });
            return;
          }
          
          attempt++;
          const check = checkHeaderExists();
          
          if (check.found) {
            methodUsage.method7_finalPolling.attempted = true;
            methodUsage.method7_finalPolling.succeeded = true;
            methodUsage.method7_finalPolling.attempts = attempt;
            methodUsage.method7_finalPolling.time = getElapsed();
            clearInterval(pollTimer);
            log(`Header found via final polling on attempt ${attempt} after ${((perfNow() - pollStart) / 1000).toFixed(3)}s (total: ${getElapsed()}s)`);
            resolve({ found: true, header: check.header, headerTitle: check.headerTitle });
            return;
          }
          
          if (attempt >= maxAttempts) {
            clearInterval(pollTimer);
            methodUsage.method7_finalPolling.attempts = maxAttempts;
            log(`[METHOD 7] Final polling exhausted after ${maxAttempts} attempts (${((perfNow() - pollStart) / 1000).toFixed(3)}s, total: ${getElapsed()}s)`);
            logError(`❌ FAILED: Header not found after ALL methods exhausted at ${getElapsed()}s`);
            checkCanvasSignals();
            resolve({ found: false });
            return;
          }
          
          if (attempt % 5 === 0) { // Log every 5th attempt
            log(`Final polling attempt ${attempt}/${maxAttempts} (elapsed: ${getElapsed()}s)`);
          }
        }, pollInterval));
      });
    }

    // Execute all methods in sequence until header is found
    async function executeDetectionSequence() {
      // Check if Promise/async is available
      if (!hasPromise) {
        logError("Promise not available - cannot execute async detection sequence");
        // Fallback to immediate check only
        const check = checkHeaderExists();
        if (check.found) {
          injectNav(check.header, check.headerTitle);
          cancelAllPending();
        }
        return;
      }
      
      log(`=== EXECUTING DETECTION SEQUENCE at ${getElapsed()}s ===`);
      
      // Step 1: Wait for DOMContentLoaded
      methodUsage.method2_domContentLoaded.attempted = true;
      methodUsage.method2_domContentLoaded.time = getElapsed();
      await waitForDOMContentLoaded();
      if (headerFoundFlag) {
        logMethodSummary();
        return;
      }
      let check = checkHeaderExists();
      if (check.found) {
        methodUsage.method2_domContentLoaded.succeeded = true;
        injectNav(check.header, check.headerTitle);
        cancelAllPending();
        logMethodSummary();
        return;
      }

      // Step 2: Wait for complete
      methodUsage.method3_readyStateComplete.attempted = true;
      methodUsage.method3_readyStateComplete.time = getElapsed();
      await waitForComplete();
      if (headerFoundFlag) {
        logMethodSummary();
        return;
      }
      check = checkHeaderExists();
      if (check.found) {
        methodUsage.method3_readyStateComplete.succeeded = true;
        injectNav(check.header, check.headerTitle);
        cancelAllPending();
        logMethodSummary();
        return;
      }

      // Step 3: Wait for Canvas signals (with timeout)
      methodUsage.method4_canvasSignals.attempted = true;
      methodUsage.method4_canvasSignals.time = getElapsed();
      await waitForCanvasSignals();
      if (headerFoundFlag) {
        logMethodSummary();
        return;
      }
      check = checkHeaderExists();
      if (check.found) {
        methodUsage.method4_canvasSignals.succeeded = true;
        injectNav(check.header, check.headerTitle);
        cancelAllPending();
        logMethodSummary();
        return;
      }

      // Step 4: Additional safety delay (let Canvas/DesignPlus finish)
      log(`[SAFETY DELAY] Waiting additional 1s for Canvas/DesignPlus at ${getElapsed()}s`);
      await new Promise(resolve => {
        const timeoutId = trackTimeout(setTimeout(resolve, 1000));
        if (headerFoundFlag) {
          clearTimeout(timeoutId);
          resolve();
        }
      });
      if (headerFoundFlag) return;
      check = checkHeaderExists();
      if (check.found) {
        injectNav(check.header, check.headerTitle);
        cancelAllPending();
        return;
      }

      // Step 5: Exponential backoff polling (runs in parallel with observer)
      log(`Starting parallel methods: exponential polling + MutationObserver at ${getElapsed()}s`);
      const pollPromise = pollWithExponentialBackoff();
      const observerPromise = hasMutationObserver ? watchWithMutationObserver() : Promise.resolve({ found: false });
      
      // Race the two methods
      let winner;
      try {
        winner = await Promise.race([
          pollPromise.then(r => ({ type: 'poll', result: r })).catch(e => {
            logError("Poll promise rejected", e);
            return { type: 'poll', result: { found: false } };
          }),
          observerPromise.then(r => ({ type: 'observer', result: r })).catch(e => {
            logError("Observer promise rejected", e);
            return { type: 'observer', result: { found: false } };
          })
        ]);
      } catch (e) {
        logError("Error in Promise.race", e);
        // Fall back to polling only
        const pollResult = await pollPromise.catch(e => {
          logError("Poll promise failed", e);
          return { found: false };
        });
        if (pollResult.found) {
          injectNav(pollResult.header, pollResult.headerTitle);
          cancelAllPending();
        }
        return;
      }
      
      if (headerFoundFlag) return;
      log(`Winner: ${winner.type} at ${getElapsed()}s`);
      
      if (winner.result.found) {
        injectNav(winner.result.header, winner.result.headerTitle);
        cancelAllPending();
        logMethodSummary();
        return;
      }
      
      // Winner didn't find it, wait for the other one
      log(`Winner (${winner.type}) didn't find header, waiting for other method at ${getElapsed()}s`);
      const loser = winner.type === 'poll' 
        ? await observerPromise
        : await pollPromise;
      
      if (headerFoundFlag) return;
      if (loser.found) {
        injectNav(loser.header, loser.headerTitle);
        cancelAllPending();
        logMethodSummary();
        return;
      }
      
      log(`Both parallel methods failed at ${getElapsed()}s`);

      // Step 6: Final extended polling as absolute last resort
      const finalResult = await finalExtendedPoll();
      if (headerFoundFlag) return;
      if (finalResult.found) {
        injectNav(finalResult.header, finalResult.headerTitle);
        cancelAllPending();
        logMethodSummary();
        return;
      }

      // If we get here, we've exhausted all methods
      logError(`❌ CRITICAL: All detection methods failed. Header never appeared after ${getElapsed()}s`);
      logMethodSummary();
    }

    // Start the detection sequence
    executeDetectionSequence();

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
        
        // Note: Click handlers are handled by event delegation on nav container
        // (set up in injectNav function above) - no need to attach to individual links
        
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
        
        // Remove active state from all links
        existingLinks.forEach(l => {
          l.classList.remove('active');
          l.removeAttribute('aria-current');
        });
        
        const pattern = linkPatterns[active];
        if (!pattern) return;
        
        // Add active state to matching link
        existingLinks.forEach(l => {
          const href = l.getAttribute('href') || '';
          const matches = typeof pattern === 'string' 
            ? href.includes(pattern) 
            : pattern.test(href);
          if (matches) {
            l.classList.add('active');
            l.setAttribute('aria-current', 'page');
          }
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
        if (node.nodeType === TEXT_NODE && node.textContent.trim()) {
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
    const images = safeArrayFrom(contentWrapper.querySelectorAll('img'));
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
          if (!hasMutationObserver) {
            log("MutationObserver not available - grade table will use polling fallback");
            // Fallback: retry periodically without observer
            const retryInterval = setInterval(() => {
              const iconsInjected = injectGradeIcons();
              const statusPopulated = populateStatusColumn();
              if (iconsInjected && statusPopulated) {
                clearInterval(retryInterval);
                log("Grade icons injection and status population complete (polling fallback)");
              }
            }, 1000);
            // Stop retrying after 30 seconds
            setTimeout(() => clearInterval(retryInterval), 30000);
            return false;
          }
          
          log("Creating MutationObserver to watch for grade table changes");
          try {
          observer = new MutationObserver(() => {
            // Check if icons and status are now present
            const iconsInjected = injectGradeIcons();
            const statusPopulated = populateStatusColumn();
            if (iconsInjected && statusPopulated) {
                if (observer) {
              observer.disconnect();
              observer = null;
                }
              log("Grade icons injection and status population complete, observer disconnected");
            }
          });
            if (observer && gradesTable) {
          observer.observe(gradesTable, { childList: true, subtree: true });
          log("MutationObserver set up for grade icons injection and status population");
            }
          } catch (e) {
            logError("Error creating MutationObserver for grades table", e);
            observer = null;
          }
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