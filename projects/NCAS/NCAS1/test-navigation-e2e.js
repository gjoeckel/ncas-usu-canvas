/**
 * NCAS Navigation E2E Test Suite
 * 
 * Usage: Copy and paste this entire file into the browser console on a Canvas course page
 * 
 * Or run individual tests:
 *   - runNavigationTests()
 *   - testHeaderStructure()
 *   - testVisualShiftPrevention()
 *   - testNavigationFlow()
 */

(function() {
  'use strict';

  const TEST_PREFIX = '🧪 NCAS E2E Test';
  let testResults = {
    total: 0,
    passed: 0,
    failed: 0,
    errors: []
  };

  function log(message, type = 'info') {
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`${prefix} ${TEST_PREFIX}: ${message}`);
  }

  function assert(testName, condition, message) {
    testResults.total++;
    if (condition) {
      testResults.passed++;
      log(`${testName}: PASS - ${message}`, 'success');
      return true;
    } else {
      testResults.failed++;
      testResults.errors.push({ test: testName, message });
      log(`${testName}: FAIL - ${message}`, 'error');
      return false;
    }
  }

  function testHeaderStructure() {
    log('=== Testing Header Structure ===');
    
    const header = document.querySelector('#content-header.course-content-header');
    assert('Header Exists', header !== null, 
      header ? 'Header element found' : 'Header element not found');
    
    if (!header) return false;

    const wrapper = header.querySelector('.ncademi-header-wrapper');
    assert('Wrapper Exists', wrapper !== null,
      wrapper ? 'Wrapper element found' : 'Wrapper element not found');
    
    if (!wrapper) return false;

    const headerTitle = wrapper.querySelector('.ncademi-header-title');
    assert('Header Title Exists', headerTitle !== null,
      headerTitle ? 'Header title element found' : 'Header title not found');

    const headerText = headerTitle?.querySelector('.header-text');
    assert('Header Text Exists', headerText !== null,
      headerText ? 'Header text element found' : 'Header text not found');

    const nav = wrapper.querySelector('#ncademi-nav');
    assert('Navigation Exists', nav !== null,
      nav ? 'Navigation element found' : 'Navigation element not found');

    // Check header position - should be direct child of body and positioned early
    const isDirectChildOfBody = header.parentNode === document.body;
    const bodyChildren = Array.from(document.body.children);
    const headerIndex = bodyChildren.indexOf(header);
    const isPositionedEarly = headerIndex >= 0 && headerIndex < 5; // Within first 5 children is acceptable
    
    assert('Header Position (Direct Child of Body)', isDirectChildOfBody,
      isDirectChildOfBody ? 'Header is direct child of body' : `Header parent is ${header.parentNode.tagName || 'unknown'}, expected body`);
    
    assert('Header Position (Early in Body)', isPositionedEarly,
      isPositionedEarly ? `Header is positioned early in body (index: ${headerIndex})` : `Header is positioned late in body (index: ${headerIndex})`);

    // Check structure order
    if (wrapper && headerTitle && nav) {
      const titleIndex = Array.from(wrapper.children).indexOf(headerTitle);
      const navIndex = Array.from(wrapper.children).indexOf(nav);
      const correctOrder = titleIndex < navIndex;
      assert('Structure Order', correctOrder,
        correctOrder ? 'Title comes before nav in wrapper' : 'Incorrect order: nav before title');
    }

    return true;
  }

  function testNavigationLinks() {
    log('=== Testing Navigation Links ===');
    
    const nav = document.querySelector('#ncademi-nav');
    assert('Nav Container Exists', nav !== null, 'Nav container found');
    
    if (!nav) return false;

    const links = nav.querySelectorAll('a');
    const expectedLinks = ['Start Here', 'Core Skills', 'Progress', 'Feedback'];
    
    assert('Link Count', links.length === expectedLinks.length,
      `Expected ${expectedLinks.length} links, found ${links.length}`);

    expectedLinks.forEach((expectedText, index) => {
      const link = links[index];
      const hasCorrectText = link && link.textContent.trim() === expectedText;
      assert(`Link "${expectedText}"`, hasCorrectText,
        hasCorrectText ? `Link "${expectedText}" found` : `Link "${expectedText}" not found`);
    });

    return true;
  }

  function testActiveState() {
    log('=== Testing Active State ===');
    
    const nav = document.querySelector('#ncademi-nav');
    if (!nav) return false;

    // Determine if current page should have an active link
    // Only nav-linked pages should have an active state
    const currentPath = window.location.pathname;
    const shouldHaveActiveLink = currentPath.includes('/pages/start-here') ||
                                 currentPath.includes('/pages/core-skills') ||
                                 currentPath.includes('/grades') ||
                                 currentPath.includes('/pages/feedback') ||
                                 /\/courses\/\d+\/?$/.test(currentPath); // Course home page

    const links = nav.querySelectorAll('a');
    const activeLinks = Array.from(links).filter(link => 
      link.classList.contains('active') || 
      link.getAttribute('aria-current') === 'page'
    );
    
    if (shouldHaveActiveLink) {
      // On nav-linked pages, should have exactly one active link
      assert('Active Link Exists', activeLinks.length > 0,
        activeLinks.length > 0 ? `Active link found: "${activeLinks[0].textContent.trim()}"` : 'No active link found on nav-linked page');
      
      assert('Single Active Link', activeLinks.length === 1,
        activeLinks.length === 1 ? 'Exactly one active link' : `Multiple active links: ${activeLinks.length}`);
    } else {
      // On user-created pages (not in nav), no active link is expected
      log(`Current page (${currentPath}) is not a nav-linked page, no active link expected`);
      assert('No Active Link on User Page', activeLinks.length === 0,
        activeLinks.length === 0 ? 'No active link (expected for user-created pages)' : `Found ${activeLinks.length} active link(s) on user-created page (unexpected)`);
    }

    return true;
  }

  function testHeaderPersistence() {
    log('=== Testing Header Persistence Logic ===');
    
    const header = document.querySelector('#content-header');
    if (!header) {
      assert('Header Persistence', false, 'Header not found');
      return false;
    }

    // Check if header is in correct position for persistence
    // Header should be direct child of body and positioned early (within first 5 children)
    const isDirectChildOfBody = header.parentNode === document.body;
    const bodyChildren = Array.from(document.body.children);
    const headerIndex = bodyChildren.indexOf(header);
    const isPositionedEarly = headerIndex >= 0 && headerIndex < 5;
    const isCorrectPosition = isDirectChildOfBody && isPositionedEarly;
    
    assert('Header Position for Persistence', isCorrectPosition,
      isCorrectPosition ? 
        `Header in correct position for updateExistingHeader (index: ${headerIndex})` : 
        `Header not in correct position (parent: ${header.parentNode.tagName}, index: ${headerIndex})`);

    // Check wrapper structure (needed for updateExistingHeader)
    const wrapper = header.querySelector('.ncademi-header-wrapper');
    assert('Wrapper Structure for Updates', wrapper !== null,
      wrapper ? 'Wrapper exists for updateExistingHeader' : 'Wrapper missing - updateExistingHeader will fail');

    return true;
  }

  function testVisualShiftPrevention() {
    log('=== Testing Visual Shift Prevention ===');
    
    const header = document.querySelector('#content-header');
    if (!header) {
      assert('Visual Shift Prevention', false, 'Header not found');
      return false;
    }

    const computedStyle = window.getComputedStyle(header);
    
    // Check min-height
    const minHeight = computedStyle.minHeight;
    const hasMinHeight = minHeight !== '0px' && minHeight !== 'auto' && minHeight !== 'none';
    assert('Header Min-Height', hasMinHeight,
      hasMinHeight ? `Min-height set: ${minHeight}` : `Min-height not set (${minHeight})`);

    // Check contain property
    const contain = computedStyle.contain || '';
    const hasContain = contain.includes('layout') || contain.includes('style');
    assert('CSS Contain Property', hasContain,
      hasContain ? `Contain property set: ${contain}` : 'Contain property not set');

    // Check margin
    const margin = computedStyle.margin;
    assert('Header Margin', margin === '0px',
      margin === '0px' ? 'Margin is 0 (prevents shifts)' : `Margin is not 0: ${margin}`);

    // Check wrapper
    const wrapper = header.querySelector('.ncademi-header-wrapper');
    if (wrapper) {
      const wrapperStyle = window.getComputedStyle(wrapper);
      const wrapperMinHeight = wrapperStyle.minHeight;
      const wrapperHasMinHeight = wrapperMinHeight !== '0px' && wrapperMinHeight !== 'auto';
      assert('Wrapper Min-Height', wrapperHasMinHeight,
        wrapperHasMinHeight ? `Wrapper min-height: ${wrapperMinHeight}` : 'Wrapper min-height not set');
    }

    return true;
  }

  function testProgressPageSpecific() {
    log('=== Testing Progress Page Specific Elements ===');
    
    const currentPath = window.location.pathname;
    const isProgressPage = currentPath.includes('/grades');
    
    if (!isProgressPage) {
      log('Not on Progress page, skipping Progress-specific tests');
      return true;
    }

    // Check page title
    const pageTitle = document.querySelector('h1.page-title');
    assert('Progress Page Title', pageTitle !== null,
      pageTitle ? `Page title found: "${pageTitle.textContent}"` : 'Page title not found');
    
    if (pageTitle) {
      const isCorrectText = pageTitle.textContent.trim() === 'Progress';
      assert('Page Title Text', isCorrectText,
        isCorrectText ? 'Page title text is "Progress"' : `Page title text is "${pageTitle.textContent}"`);
      
      // Check position
      const gradesTable = document.querySelector('table#grades_summary');
      const isBeforeTable = gradesTable && pageTitle.nextElementSibling === gradesTable;
      assert('Page Title Position', isBeforeTable,
        isBeforeTable ? 'Page title is before grades table' : 'Page title not positioned correctly');
    }

    // Check Canvas heading is hidden
    const canvasHeading = document.querySelector('.ic-Action-header__Heading, h1.ic-Action-header__Heading');
    if (canvasHeading) {
      const isHidden = window.getComputedStyle(canvasHeading).display === 'none';
      assert('Canvas Heading Hidden', isHidden,
        isHidden ? 'Canvas heading is hidden' : 'Canvas heading is visible');
    }

    // Check grades table
    const gradesTable = document.querySelector('table#grades_summary');
    assert('Grades Table Exists', gradesTable !== null,
      gradesTable ? 'Grades table found' : 'Grades table not found');

    return true;
  }

  function testNavigationListener() {
    log('=== Testing Navigation Listener ===');
    
    const hasBackbone = typeof window.Backbone !== 'undefined' && 
                       window.Backbone && 
                       window.Backbone.history;
    
    if (hasBackbone) {
      const isWrapped = window.Backbone.history.navigate._ncademiWrapped === true;
      assert('Backbone Navigation Wrapped', isWrapped,
        isWrapped ? 'Backbone navigation is wrapped' : 'Backbone navigation not wrapped');
    } else {
      log('Backbone not available (expected in test environment)');
    }

    const listenerSet = window.ncademiNavigationListenerSet === true;
    assert('Navigation Listener Flag', listenerSet,
      listenerSet ? 'Navigation listener flag is set' : 'Navigation listener flag not set');

    return true;
  }

  function testResponsiveClasses() {
    log('=== Testing Responsive Classes ===');
    
    const header = document.querySelector('#content-header');
    if (!header) return false;

    const isMobile = window.innerWidth <= 850;
    const hasMobileClass = header.classList.contains('ncademi-mobile-header');
    const hasDesktopClass = header.classList.contains('ncademi-desktop-header');
    
    if (isMobile) {
      assert('Mobile Responsive Class', hasMobileClass,
        hasMobileClass ? `Mobile class applied (viewport: ${window.innerWidth}px)` : 
                        `Mobile class not applied (viewport: ${window.innerWidth}px)`);
    } else {
      assert('Desktop Responsive Class', hasDesktopClass,
        hasDesktopClass ? `Desktop class applied (viewport: ${window.innerWidth}px)` : 
                         `Desktop class not applied (viewport: ${window.innerWidth}px)`);
    }

    return true;
  }

  function testHeaderUpdateLogic() {
    log('=== Testing Header Update Logic ===');
    
    const header = document.querySelector('#content-header');
    if (!header) return false;

    // Simulate what updateExistingHeader() does
    const headerTitle = header.querySelector('.ncademi-header-title');
    assert('Header Title for Update', headerTitle !== null,
      headerTitle ? 'Header title found for update logic' : 'Header title not found');

    const wrapper = headerTitle?.parentElement;
    const hasCorrectWrapper = wrapper?.classList.contains('ncademi-header-wrapper');
    assert('Wrapper for Update', hasCorrectWrapper,
      hasCorrectWrapper ? 'Wrapper structure correct for updateExistingHeader' : 
                         'Wrapper structure incorrect - updateExistingHeader will recreate');

    return true;
  }

  function testDOMStability() {
    log('=== Testing DOM Stability ===');
    
    const header = document.querySelector('#content-header');
    if (!header) return false;

    // Check that header doesn't have any inline styles that might conflict
    const hasInlineStyle = header.hasAttribute('style');
    assert('No Inline Styles', !hasInlineStyle,
      hasInlineStyle ? 'Header has inline styles (may conflict with CSS)' : 
                       'Header has no inline styles');

    // Check wrapper doesn't have inline styles
    const wrapper = header.querySelector('.ncademi-header-wrapper');
    if (wrapper) {
      const wrapperHasInlineStyle = wrapper.hasAttribute('style');
      assert('Wrapper No Inline Styles', !wrapperHasInlineStyle,
        wrapperHasInlineStyle ? 'Wrapper has inline styles' : 'Wrapper has no inline styles');
    }

    return true;
  }

  function testContainerWidthEnforcement() {
    log('=== Testing Container Width Enforcement ===');
    
    const containers = [
      { selector: '#not_right_side.ic-app-main-content', name: 'not_right_side', expectedMaxWidth: '100vw', isTopLevel: true },
      { selector: 'div#main.ic-Layout-columns, .ic-Layout-columns', name: 'main/columns', expectedMaxWidth: '100vw', isTopLevel: true },
      { selector: '#content-wrapper', name: 'content-wrapper', expectedMaxWidth: '100%', isTopLevel: false, hasPaddingLeft: true },
      { selector: 'div#content.ic-Layout-contentMain', name: 'content', expectedMaxWidth: '100%', isTopLevel: false, parentPadding: 30 }
    ];

    const viewportWidth = window.innerWidth;
    const tolerance = 20; // Allow 20px tolerance for padding/margins
    const nestedTolerance = 50; // Allow 50px tolerance for nested containers (accounts for parent padding)
    
    containers.forEach(({ selector, name, expectedMaxWidth, isTopLevel, hasPaddingLeft, parentPadding }) => {
      const elements = document.querySelectorAll(selector);
      if (elements.length === 0) {
        log(`Container ${name} not found, skipping`);
        return;
      }
      
      elements.forEach((el, index) => {
        const computedStyle = window.getComputedStyle(el);
        const width = computedStyle.width;
        const maxWidth = computedStyle.maxWidth;
        const paddingRight = computedStyle.paddingRight;
        const paddingLeft = computedStyle.paddingLeft;
        const marginLeft = computedStyle.marginLeft;
        const marginRight = computedStyle.marginRight;
        
        // Parse width from "1064px" format
        const widthPx = parseFloat(width);
        const paddingLeftPx = parseFloat(paddingLeft);
        const paddingRightPx = parseFloat(paddingRight);
        const marginLeftPx = parseFloat(marginLeft);
        const marginRightPx = parseFloat(marginRight);
        
        // Calculate total width including padding and margins
        const totalWidth = widthPx + paddingLeftPx + paddingRightPx + marginLeftPx + marginRightPx;
        
        // For nested containers, account for parent padding
        // For top-level containers, check against viewport width
        // For nested containers, check against viewport width minus expected parent padding
        const expectedWidth = isTopLevel ? viewportWidth : (viewportWidth - (parentPadding || 0));
        const widthDiff = Math.abs(totalWidth - expectedWidth);
        const applicableTolerance = isTopLevel ? tolerance : nestedTolerance;
        const hasValidWidth = widthDiff <= applicableTolerance;
        
        assert(`${name} Width (${index})`, hasValidWidth,
          hasValidWidth ? 
            `Width is ${width} (total: ${totalWidth}px, expected: ${expectedWidth}px, diff: ${widthDiff}px)` : 
            `Width is ${width} (total: ${totalWidth}px, expected: ${expectedWidth}px, diff: ${widthDiff}px) - exceeds tolerance of ${applicableTolerance}px`);
        
        // Check max-width is appropriate
        // For top-level containers, max-width should be 100vw or none
        // For nested containers, max-width should be 100% or 100vw
        const hasValidMaxWidth = maxWidth === '100%' || 
                                 maxWidth === '100vw' || 
                                 maxWidth === 'none' ||
                                 (expectedMaxWidth === '100vw' && maxWidth === viewportWidth + 'px');
        assert(`${name} Max-Width (${index})`, hasValidMaxWidth,
          hasValidMaxWidth ? 
            `Max-width is ${maxWidth} (acceptable)` : 
            `Max-width is ${maxWidth}, expected ${expectedMaxWidth} or 100% or 100vw or none`);
        
        // Check padding-right is 0 (except for content-wrapper which has padding-left)
        if (name !== 'content-wrapper') {
          assert(`${name} Padding-Right (${index})`, paddingRight === '0px',
            paddingRight === '0px' ? 'Padding-right is 0' : `Padding-right is ${paddingRight}, expected 0`);
        }
        
        // Check margins are 0
        assert(`${name} Margin-Left (${index})`, marginLeft === '0px',
          marginLeft === '0px' ? 'Margin-left is 0' : `Margin-left is ${marginLeft}, expected 0`);
        
        assert(`${name} Margin-Right (${index})`, marginRight === '0px',
          marginRight === '0px' ? 'Margin-right is 0' : `Margin-right is ${marginRight}, expected 0`);
        
        // Check box-sizing is set correctly (ensures padding is included in width)
        const boxSizing = computedStyle.boxSizing;
        const hasCorrectBoxSizing = boxSizing === 'border-box';
        assert(`${name} Box-Sizing (${index})`, hasCorrectBoxSizing,
          hasCorrectBoxSizing ? 'Box-sizing is border-box' : `Box-sizing is ${boxSizing}, expected border-box`);
      });
    });

    return true;
  }

  function showSummary() {
    console.log('\n' + '='.repeat(50));
    log(`Test Summary: ${testResults.passed}/${testResults.total} passed, ${testResults.failed} failed`);
    console.log('='.repeat(50));
    
    if (testResults.failed > 0) {
      console.log('\n❌ Failed Tests:');
      testResults.errors.forEach(err => {
        console.log(`  - ${err.test}: ${err.message}`);
      });
    }
    
    if (testResults.failed === 0) {
      console.log('\n✅ All tests passed!');
    }
  }

  // Main test runner
  function runNavigationTests() {
    testResults = { total: 0, passed: 0, failed: 0, errors: [] };
    
    console.log('\n' + '='.repeat(50));
    log('Starting NCAS Navigation E2E Tests');
    console.log('='.repeat(50) + '\n');

    testHeaderStructure();
    testNavigationLinks();
    testActiveState();
    testHeaderPersistence();
    testHeaderUpdateLogic();
    testVisualShiftPrevention();
    testResponsiveClasses();
    testProgressPageSpecific();
    testNavigationListener();
    testDOMStability();
    testContainerWidthEnforcement();

    showSummary();
    
    return testResults.failed === 0;
  }

  // Test navigation flow simulation
  function testNavigationFlow() {
    log('=== Testing Navigation Flow ===');
    
    const nav = document.querySelector('#ncademi-nav');
    if (!nav) {
      assert('Navigation Flow', false, 'Nav container not found');
      return false;
    }

    const links = nav.querySelectorAll('a');
    const currentPath = window.location.pathname;
    
    log(`Current path: ${currentPath}`);
    
    // Find which link should be active
    links.forEach(link => {
      const href = link.getAttribute('href');
      const isActive = link.classList.contains('active');
      const text = link.textContent.trim();
      log(`Link "${text}": ${href} - Active: ${isActive}`);
    });

    // Check if active link matches current page
    const activeLink = Array.from(links).find(link => link.classList.contains('active'));
    if (activeLink) {
      const activeHref = activeLink.getAttribute('href');
      const pathMatches = currentPath.includes(activeHref) || 
                         (currentPath.includes('/grades') && activeHref.includes('/grades')) ||
                         (currentPath.includes('/pages/core-skills') && activeHref.includes('/pages/core-skills'));
      assert('Active Link Matches Page', pathMatches,
        pathMatches ? `Active link matches current page` : 
                     `Active link "${activeHref}" doesn't match current path "${currentPath}"`);
    }

    return true;
  }

  // Monitor navigation for visual shifts
  function monitorNavigation() {
    log('=== Starting Navigation Monitor ===');
    log('Navigate between pages and watch for visual shifts');
    log('This monitor will track header position changes');

    const header = document.querySelector('#content-header');
    if (!header) {
      log('Header not found, cannot monitor', 'error');
      return;
    }

    let lastPosition = header.getBoundingClientRect();
    log(`Initial header position: top=${lastPosition.top}, left=${lastPosition.left}`);

    const observer = new MutationObserver(() => {
      const currentPosition = header.getBoundingClientRect();
      if (currentPosition.top !== lastPosition.top || currentPosition.left !== lastPosition.left) {
        const shift = {
          top: currentPosition.top - lastPosition.top,
          left: currentPosition.left - lastPosition.left
        };
        log(`⚠️ SHIFT DETECTED: top=${shift.top}px, left=${shift.left}px`, 'error');
      }
      lastPosition = currentPosition;
    });

    observer.observe(document.body, { 
      childList: true, 
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style']
    });

    log('Navigation monitor active. Stop with: window._navMonitor.disconnect()');
    window._navMonitor = observer;

    return observer;
  }

  // Expose test functions globally
  window.NCASNavigationTests = {
    runAll: runNavigationTests,
    testHeaderStructure,
    testNavigationLinks,
    testActiveState,
    testHeaderPersistence,
    testVisualShiftPrevention,
    testProgressPageSpecific,
    testNavigationListener,
    testNavigationFlow,
    monitor: monitorNavigation,
    results: () => testResults
  };

  log('Test suite loaded! Run: NCASNavigationTests.runAll()');
  log('Or: NCASNavigationTests.monitor() to watch for visual shifts');

})();
