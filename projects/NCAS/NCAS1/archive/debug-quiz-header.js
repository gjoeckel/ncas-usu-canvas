// Debug script to identify why quiz header isn't being hidden
// Run this in the browser console on a quiz page

console.log('=== QUIZ HEADER DEBUG ===\n');

// 1. Check if header element exists
const header = document.querySelector('header.header[aria-label="Quiz header"]');
console.log('1. Header element found:', header ? '✅ YES' : '❌ NO');
if (header) {
  console.log('   Element:', header);
  console.log('   Classes:', header.className);
  console.log('   aria-label:', header.getAttribute('aria-label'));
  console.log('   Current display:', window.getComputedStyle(header).display);
  console.log('   Inline style display:', header.style.display);
}

// 2. Check all header.header elements
const allHeaders = document.querySelectorAll('header.header');
console.log('\n2. All header.header elements:', allHeaders.length);
allHeaders.forEach((h, i) => {
  console.log(`   Header ${i + 1}:`, {
    ariaLabel: h.getAttribute('aria-label'),
    classes: h.className,
    display: window.getComputedStyle(h).display
  });
});

// 3. Check if CSS rule is being applied
const testHeader = document.querySelector('header.header[aria-label="Quiz header"]');
if (testHeader) {
  const computedStyle = window.getComputedStyle(testHeader);
  console.log('\n3. Computed styles for header:');
  console.log('   display:', computedStyle.display);
  console.log('   visibility:', computedStyle.visibility);
  console.log('   opacity:', computedStyle.opacity);
  console.log('   height:', computedStyle.height);
  console.log('   width:', computedStyle.width);
}

// 4. Check if our CSS file is loaded
const styleSheets = Array.from(document.styleSheets);
const ncas13Style = styleSheets.find(sheet => {
  try {
    return sheet.href && sheet.href.includes('ncas13.css');
  } catch (e) {
    return false;
  }
});
console.log('\n4. NCAS13 CSS file loaded:', ncas13Style ? '✅ YES' : '❌ NO');
if (ncas13Style) {
  console.log('   CSS file URL:', ncas13Style.href);
  
  // Try to find our specific rule
  try {
    const rules = Array.from(ncas13Style.cssRules || ncas13Style.rules || []);
    const quizHeaderRule = rules.find(rule => 
      rule.selectorText && rule.selectorText.includes('aria-label="Quiz header"')
    );
    console.log('   Quiz header rule found:', quizHeaderRule ? '✅ YES' : '❌ NO');
    if (quizHeaderRule) {
      console.log('   Rule selector:', quizHeaderRule.selectorText);
      console.log('   Rule style:', quizHeaderRule.style.cssText);
    }
  } catch (e) {
    console.log('   Error reading CSS rules:', e.message);
  }
}

// 5. Check if JavaScript is running
console.log('\n5. JavaScript status:');
console.log('   window.ncademiInitializedV13:', window.ncademiInitializedV13 ? '✅ YES' : '❌ NO');
console.log('   hideReturnButtonOnQuizPages function exists:', typeof window.hideReturnButtonOnQuizPages !== 'undefined' ? '✅ YES' : '❌ NO');

// 6. Test manual hiding
console.log('\n6. Testing manual hide:');
if (header) {
  console.log('   Attempting to hide manually...');
  header.style.display = 'none';
  header.classList.add('ncademi-quiz-page-header');
  const afterHide = window.getComputedStyle(header).display;
  console.log('   Display after manual hide:', afterHide);
  console.log('   Manual hide successful:', afterHide === 'none' ? '✅ YES' : '❌ NO');
  
  // Restore for testing
  header.style.display = '';
}

// 7. Check for CSS specificity issues
if (header) {
  console.log('\n7. CSS Specificity check:');
  const allRules = [];
  styleSheets.forEach(sheet => {
    try {
      const rules = Array.from(sheet.cssRules || sheet.rules || []);
      rules.forEach(rule => {
        if (rule.selectorText && header.matches(rule.selectorText)) {
          allRules.push({
            selector: rule.selectorText,
            display: rule.style.display,
            specificity: rule.style.display && rule.style.display.includes('!important') ? 'HIGH' : 'NORMAL'
          });
        }
      });
    } catch (e) {
      // Cross-origin stylesheet, skip
    }
  });
  console.log('   Rules matching header:', allRules.length);
  allRules.forEach((rule, i) => {
    console.log(`   Rule ${i + 1}:`, rule.selector, '->', rule.display, `(${rule.specificity})`);
  });
}

// 8. Check MutationObserver
console.log('\n8. MutationObserver check:');
const observerSet = window.ncademiQuizPageObserverSet;
console.log('   Observer set:', observerSet ? '✅ YES' : '❌ NO');

// 9. Test selector variations
console.log('\n9. Testing selector variations:');
const selectors = [
  'header.header[aria-label="Quiz header"]',
  'header[aria-label="Quiz header"]',
  'header.header',
  '[aria-label="Quiz header"]'
];
selectors.forEach(selector => {
  const element = document.querySelector(selector);
  console.log(`   "${selector}":`, element ? '✅ Found' : '❌ Not found');
});

// 10. Check if element is inside iframe
console.log('\n10. Iframe check:');
const iframes = document.querySelectorAll('iframe');
console.log('   Number of iframes:', iframes.length);
if (header && iframes.length > 0) {
  const headerInIframe = Array.from(iframes).some(iframe => {
    try {
      return iframe.contentDocument && iframe.contentDocument.contains(header);
    } catch (e) {
      return false;
    }
  });
  console.log('   Header inside iframe:', headerInIframe ? '⚠️ YES (may cause issues)' : '✅ NO');
}

console.log('\n=== END DEBUG ===');
console.log('\n💡 Try running this manually:');
console.log('   document.querySelector(\'header.header[aria-label="Quiz header"]\').style.display = "none";');

