/**
 * CSS Comparison Test Script for Playwright
 * Compares computed styles between ncas16.css and ncas16-optimized.css
 */

const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  cssFiles: {
    original: 'ncas16.css',
    optimized: 'ncas16-optimized.css'
  },
  testPage: 'test-css-comparison.html',
  tolerance: 0.01, // Tolerance for numeric differences (e.g., 0.01px)
  viewports: [
    { width: 1920, height: 1080, name: 'desktop' },
    { width: 1024, height: 768, name: 'tablet' },
    { width: 768, height: 1024, name: 'mobile' }
  ]
};

/**
 * Inject CSS file into HTML page
 */
function injectCSS(htmlContent, cssPath) {
  const cssContent = fs.readFileSync(cssPath, 'utf8');
  const cssTag = `<style id="test-css">${cssContent}</style>`;
  return htmlContent.replace('</head>', `${cssTag}</head>`);
}

/**
 * Extract computed styles from page
 */
async function extractStyles(page) {
  return await page.evaluate(() => {
    return window.extractComputedStyles();
  });
}

/**
 * Compare two style objects
 */
function compareStyleObjects(original, optimized, tolerance = 0.01) {
  const differences = [];
  const allSelectors = new Set([...Object.keys(original), ...Object.keys(optimized)]);

  allSelectors.forEach(selector => {
    const origStyles = original[selector] || {};
    const optStyles = optimized[selector] || {};

    if (!(selector in original)) {
      differences.push({
        selector,
        type: 'added',
        message: `Selector ${selector} found in optimized but not in original`
      });
      return;
    }

    if (!(selector in optimized)) {
      differences.push({
        selector,
        type: 'removed',
        message: `Selector ${selector} found in original but not in optimized`
      });
      return;
    }

    // Compare elements within selector
    const origKeys = Object.keys(origStyles);
    const optKeys = Object.keys(optStyles);

    origKeys.forEach(key => {
      const origProps = origStyles[key];
      const optProps = optStyles[key] || {};

      if (!optStyles[key]) {
        differences.push({
          selector,
          element: key,
          type: 'removed',
          message: `Element ${key} missing in optimized`
        });
        return;
      }

      // Compare properties
      const allProps = new Set([...Object.keys(origProps), ...Object.keys(optProps)]);
      allProps.forEach(prop => {
        const origValue = origProps[prop];
        const optValue = optProps[prop];

        if (!(prop in origProps)) {
          differences.push({
            selector,
            element: key,
            property: prop,
            type: 'added',
            original: null,
            optimized: optValue
          });
          return;
        }

        if (!(prop in optProps)) {
          differences.push({
            selector,
            element: key,
            property: prop,
            type: 'removed',
            original: origValue,
            optimized: null
          });
          return;
        }

        // Compare values with tolerance
        const origNum = parseFloat(origValue);
        const optNum = parseFloat(optValue);

        if (!isNaN(origNum) && !isNaN(optNum)) {
          // Numeric comparison
          if (Math.abs(origNum - optNum) > tolerance) {
            differences.push({
              selector,
              element: key,
              property: prop,
              type: 'changed',
              original: origValue,
              optimized: optValue,
              diff: Math.abs(origNum - optNum)
            });
          }
        } else if (origValue !== optValue) {
          // String comparison
          differences.push({
            selector,
            element: key,
            property: prop,
            type: 'changed',
            original: origValue,
            optimized: optValue
          });
        }
      });
    });
  });

  return differences;
}

/**
 * Generate test report
 */
function generateReport(originalStyles, optimizedStyles, differences, viewport) {
  const report = {
    viewport,
    timestamp: new Date().toISOString(),
    summary: {
      totalSelectors: Object.keys(originalStyles).length,
      totalDifferences: differences.length,
      added: differences.filter(d => d.type === 'added').length,
      removed: differences.filter(d => d.type === 'removed').length,
      changed: differences.filter(d => d.type === 'changed').length
    },
    differences: differences.filter(d => d.type === 'changed'), // Only show actual changes
    passed: differences.length === 0
  };

  return report;
}

/**
 * Main test function (to be called by Playwright)
 */
async function runCSSTest(page, cssOriginalPath, cssOptimizedPath, htmlPath, viewport) {
  // Read HTML template
  let htmlContent = fs.readFileSync(htmlPath, 'utf8');

  // Test with original CSS
  const htmlWithOriginal = injectCSS(htmlContent, cssOriginalPath);
  const dataUriOriginal = `data:text/html;charset=utf-8,${encodeURIComponent(htmlWithOriginal)}`;
  
  await page.setViewportSize({ width: viewport.width, height: viewport.height });
  await page.goto(dataUriOriginal, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500); // Wait for styles to apply
  const originalStyles = await extractStyles(page);

  // Test with optimized CSS
  const htmlWithOptimized = injectCSS(htmlContent, cssOptimizedPath);
  const dataUriOptimized = `data:text/html;charset=utf-8,${encodeURIComponent(htmlWithOptimized)}`;
  
  await page.goto(dataUriOptimized, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500); // Wait for styles to apply
  const optimizedStyles = await extractStyles(page);

  // Compare styles
  const differences = compareStyleObjects(originalStyles, optimizedStyles, TEST_CONFIG.tolerance);

  // Generate report
  const report = generateReport(originalStyles, optimizedStyles, differences, viewport);

  return report;
}

// Export for use in Playwright test
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    runCSSTest,
    TEST_CONFIG
  };
}

