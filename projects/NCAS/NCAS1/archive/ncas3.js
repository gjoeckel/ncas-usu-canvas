/**
 * NCADEMI Navigation JavaScript (v3-min)
 * Goal: Preserve exact visuals with minimal JS.
 * - Keep top nav bar in current location and styling
 * - Avoid DOM rewrites (no body replacement, no content moves)
 * - Rely on CSS for layout/chrome hiding; JS just wires nav and A11Y
 */

(function () {
  "use strict";

  const LOG_PREFIX = "🚀 NCADEMI Navigation v3-min";
  const DEBUG_MODE = true;

  function log(msg, data = null) { if (DEBUG_MODE) console.log(`${LOG_PREFIX}: ${msg}`, data || ""); }
  function logError(msg, err = null) { if (DEBUG_MODE) console.error(`❌ ${LOG_PREFIX}: ${msg}`, err || ""); }
  function logOK(msg, data = null) { if (DEBUG_MODE) console.log(`✅ ${LOG_PREFIX}: ${msg}`, data || ""); }

  function waitForDOM(cb) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", cb);
    else cb();
  }

  function isCoursePage() { return window.location.pathname.includes("/courses/"); }
  function isAccountsPage() { return window.location.pathname.includes("/accounts/"); }
  function isAssignmentsPage() { return /\/courses\/\d+\/assignments/.test(window.location.pathname); }
  function isSettingsPage() { return /\/courses\/\d+\/settings/.test(window.location.pathname); }
  function getCourseId() { const m = window.location.pathname.match(/\/courses\/(\d+)/); return m ? m[1] : null; }

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

  // Constrain public-license width to match widest link row edges and center it
  function alignPublicLicense() {
    const license = document.querySelector('.public-license');
    if (!license) return;

    const rows = Array.from(document.querySelectorAll('.custom-row'));
    if (rows.length === 0) return;

    let bestWidth = 0;
    rows.forEach(row => {
      const boxes = Array.from(row.querySelectorAll('.link-container'))
        .map(el => el.getBoundingClientRect())
        .filter(b => b.width > 0);
      if (boxes.length === 0) return;
      const minLeft = Math.min(...boxes.map(b => b.left));
      const maxRight = Math.max(...boxes.map(b => b.right));
      const w = Math.max(0, Math.round(maxRight - minLeft));
      if (w > bestWidth) bestWidth = w;
    });

    if (bestWidth > 0) {
      license.style.width = `${bestWidth}px`;
      license.style.marginLeft = 'auto';
      license.style.marginRight = 'auto';
    }
  }

  if (window.ncademiInitializedMin) { log("Already initialized"); return; }

  // Exclude assignments and settings pages - add class to body so CSS also excludes
  if (isAssignmentsPage() || isSettingsPage()) {
    waitForDOM(() => {
      document.body.classList.add('ncademi-excluded');
      log("Assignments or settings page; excluded from NCADEMI enhancements");
    });
    return;
  }

  waitForDOM(() => {
    if (!isCoursePage() || isAccountsPage()) { log("Not a course page, or admin page; skipping"); return; }
    ensureHeaderNav();
    enhanceCustomLinksA11Y();
    handleResponsive();
    // alignPublicLicense(); // Disabled to allow CSS 80% width
    // window.addEventListener('resize', () => { alignPublicLicense(); }, { passive: true });
    window.ncademiInitializedMin = true;
    logOK("Initialized minimal nav + A11Y without DOM rewrites");
  });
})();