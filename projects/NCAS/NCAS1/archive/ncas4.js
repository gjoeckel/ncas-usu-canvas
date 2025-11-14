/**
 * NCADEMI Navigation JavaScript (v4-min)
 * Goal: Preserve exact visuals with minimal JS.
 * - Keep top nav bar in current location and styling
 * - Avoid DOM rewrites (no body replacement, no content moves)
 * - Rely on CSS for layout/chrome hiding; JS just wires nav and A11Y
 */

(function () {
  "use strict";

  const LOG_PREFIX = "🚀 NCADEMI Navigation v4-min";
  const DEBUG_MODE = true;

  function log(msg, data = null) { if (DEBUG_MODE) console.log(`${LOG_PREFIX}: ${msg}`, data || ""); }
  function logError(msg, err = null) { if (DEBUG_MODE) console.error(`❌ ${LOG_PREFIX}: ${msg}`, err || ""); }
  function logOK(msg, data = null) { if (DEBUG_MODE) console.log(`✅ ${LOG_PREFIX}: ${msg}`, data || ""); }

  function waitForDOM(cb) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", cb);
    else cb();
  }

  function isCoursePage() { return window.location.pathname.includes("/courses/"); }
  function isPagesPage() { return /\/courses\/\d+\/pages/.test(window.location.pathname); }
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
    if (p === `/courses/${courseId}` || p === `/courses/${courseId}/`) return "home";
    if (p.includes("/grades")) return "grades";
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
      nav.appendChild(createLink(`/courses/${courseId}`, "Home", active === "home"));
      nav.appendChild(createLink(`/courses/${courseId}/grades`, "Grades", active === "grades"));

      header.appendChild(nav);

      // Prepend without wiping existing Canvas DOM
      document.body.insertBefore(header, document.body.firstChild);
      logOK("Injected header/nav at top of body");
    } else {
      // Update active state if needed
      const active = getActiveKey(courseId);
      const links = header.querySelectorAll('#ncademi-nav a');
      links.forEach(l => l.classList.remove('active'));
      links.forEach(l => {
        const href = l.getAttribute('href') || '';
        if (active === 'home' && /\/courses\/\d+\/?$/.test(href)) l.classList.add('active');
        if (active === 'grades' && /\/courses\/\d+\/grades/.test(href)) l.classList.add('active');
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

  // Early admin check - if admin detected, add class to body and skip all custom JS/CSS
  if (isAdmin()) {
    waitForDOM(() => {
      document.body.classList.add('ncademi-admin-view');
    });
    log("Admin detected; skipping all NCADEMI customizations");
    return;
  }

  waitForDOM(() => {
    if (!isCoursePage()) { log("Not a course page; skipping"); return; }
    
    // Add class to body if on a pages page (for special styling)
    if (isPagesPage()) {
      document.body.classList.add('ncademi-pages-page');
    }
    
    ensureHeaderNav();
    handleResponsive();
    enhanceCustomLinksA11Y();
    
    // Inject icons into grades table if on grades page
    const courseId = getCourseId();
    const activeKey = courseId ? (window.location.pathname.includes("/grades") ? "grades" : (window.location.pathname === `/courses/${courseId}` || window.location.pathname === `/courses/${courseId}/` ? "home" : null)) : null;
    
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
})();