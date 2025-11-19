#!/usr/bin/env node
/**
 * Canvas Health Check
 *
 * Fetches key Canvas pages and verifies required UI dependencies exist.
 * Outputs JSON + Markdown summaries under docs/health-results/.
 */

import fs from 'node:fs/promises';

const COURSE_ID = 2803;
const CANVAS_BASE_URL = 'https://usucourses.instructure.com';
const TOKEN = process.env.CANVAS_API_TOKEN || process.env.CANVAS_API_SECRET;

if (!TOKEN) {
  console.error('[ERROR] Missing CANVAS_API_TOKEN environment variable');
  process.exit(1);
}

// Load CSS and JS dependency lists
let cssDeps = [];
let jsDeps = [];
try {
  const cssData = await fs.readFile('scripts/canvas-css-deps.json', 'utf8');
  cssDeps = JSON.parse(cssData);
} catch (error) {
  console.error('[WARN] Could not load CSS dependencies:', error.message);
}

try {
  const jsData = await fs.readFile('scripts/canvas-js-deps.json', 'utf8');
  jsDeps = JSON.parse(jsData);
} catch (error) {
  console.error('[WARN] Could not load JS dependencies:', error.message);
}

const pages = [
  {
    slug: 'core-skills',
    description: 'Core Skills overview',
    checks: [
      { description: 'Contains course-modules container', match: /course-modules/ },
      { description: 'Contains at least one custom-link', match: /class="custom-link/ }
    ]
  },
  {
    slug: 'start-here',
    description: 'Start Here page',
    checks: [
      { description: 'Mentions "Check Your Understanding"', match: /Check Your Understanding/i }
    ]
  },
  {
    slug: 'feedback',
    description: 'Feedback page',
    checks: [
      { description: 'Contains feedback content', match: /Feedback/i }
    ]
  },
  {
    slug: 'create-a-free-usu-canvas-account',
    description: 'Create account instructions',
    checks: [
      { description: 'Mentions enrollment dialog', match: /Enroll in NCADEMI/i }
    ]
  },
  // Individual skill pages
  ...[
    'alternative-text',
    'captions',
    'clear-writing',
    'color-use',
    'headings',
    'links',
    'lists',
    'tables',
    'text-contrast'
  ].map((slug) => ({
    slug,
    description: `Skill page: ${slug}`,
    checks: [
      { description: 'Has sign-in banner markup', match: /ncademi-signin-banner/ },
      { description: 'Has quiz section', match: /ncas-quiz-section/ }
    ]
  }))
];

const headers = {
  Authorization: `Bearer ${TOKEN}`,
  Accept: 'application/json'
};

// Function to check if selectors exist in HTML
function checkSelectorsInHTML(html, selectors) {
  const checks = [];
  for (const selector of selectors) {
    // Convert CSS selector to regex pattern for HTML matching
    // Simple approach: look for id="..." or class="..." attributes
    let pattern;
    if (selector.startsWith('#')) {
      const id = selector.slice(1);
      pattern = new RegExp(`id=["']${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`, 'i');
    } else if (selector.startsWith('.')) {
      const className = selector.slice(1);
      pattern = new RegExp(`class=["'][^"']*\\b${className.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b[^"']*["']`, 'i');
    } else {
      // For complex selectors, try to match as-is
      pattern = new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    }
    const passed = pattern.test(html);
    checks.push({
      description: `Selector exists: ${selector}`,
      passed
    });
  }
  return checks;
}

// Function to fetch rendered HTML page
async function fetchRenderedPage(slug) {
  try {
    const url = `${CANVAS_BASE_URL}/courses/${COURSE_ID}/pages/${slug}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        Accept: 'text/html'
      }
    });
    if (!response.ok) {
      return null;
    }
    return await response.text();
  } catch (error) {
    console.error(`[WARN] Could not fetch rendered page ${slug}:`, error.message);
    return null;
  }
}

// Function to fetch grades page HTML
async function fetchGradesPage() {
  try {
    const url = `${CANVAS_BASE_URL}/courses/${COURSE_ID}/grades`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        Accept: 'text/html'
      }
    });
    if (!response.ok) {
      return null;
    }
    return await response.text();
  } catch (error) {
    console.error(`[WARN] Could not fetch grades page:`, error.message);
    return null;
  }
}

const results = [];

// Add CSS and JS dependency checks at the top
if (cssDeps.length > 0 || jsDeps.length > 0) {
  // Fetch multiple pages to cover all Canvas elements
  // - core-skills: general Canvas layout and course content
  // - grades: grade-related selectors (#grades_summary, .grade, .assignment_score, etc.)
  const [coreSkillsHtml, gradesHtml] = await Promise.all([
    fetchRenderedPage('core-skills'),
    fetchGradesPage()
  ]);
  
  // Combine HTML from all pages for comprehensive validation
  const combinedHtml = [coreSkillsHtml, gradesHtml].filter(Boolean).join('\n');
  
  if (combinedHtml) {
    // Check CSS dependencies
    if (cssDeps.length > 0) {
      const cssChecks = checkSelectorsInHTML(combinedHtml, cssDeps);
      const cssPassed = cssChecks.filter(c => c.passed).length;
      // Only include failed checks in output to keep dashboard manageable
      const failedChecks = cssChecks.filter(c => !c.passed).slice(0, 20); // Limit to first 20 failures
      results.push({
        slug: 'ncas23-css',
        description: 'CSS dependency validation',
        status: cssPassed === cssDeps.length ? 'pass' : 'fail',
        message: `${cssPassed}/${cssDeps.length} CSS selectors found${failedChecks.length > 0 ? ` (${failedChecks.length} missing shown)` : ''}`,
        checks: failedChecks.length > 0 ? failedChecks : [{ description: 'All CSS selectors found', passed: true }]
      });
    }
    
    // Check JS dependencies
    if (jsDeps.length > 0) {
      const jsChecks = checkSelectorsInHTML(combinedHtml, jsDeps);
      const jsPassed = jsChecks.filter(c => c.passed).length;
      // Only include failed checks in output to keep dashboard manageable
      const failedChecks = jsChecks.filter(c => !c.passed).slice(0, 20); // Limit to first 20 failures
      results.push({
        slug: 'ncas23-js',
        description: 'JavaScript dependency validation',
        status: jsPassed === jsDeps.length ? 'pass' : 'fail',
        message: `${jsPassed}/${jsDeps.length} JS selectors found${failedChecks.length > 0 ? ` (${failedChecks.length} missing shown)` : ''}`,
        checks: failedChecks.length > 0 ? failedChecks : [{ description: 'All JS selectors found', passed: true }]
      });
    }
  } else {
    // If we can't fetch HTML, mark as failed but don't fail the whole workflow
    if (cssDeps.length > 0) {
      results.push({
        slug: 'ncas23-css',
        description: 'CSS dependency validation',
        status: 'fail',
        message: 'Could not fetch rendered pages for validation',
        checks: []
      });
    }
    if (jsDeps.length > 0) {
      results.push({
        slug: 'ncas23-js',
        description: 'JavaScript dependency validation',
        status: 'fail',
        message: 'Could not fetch rendered pages for validation',
        checks: []
      });
    }
  }
}

for (const page of pages) {
  const url = `${CANVAS_BASE_URL}/api/v1/courses/${COURSE_ID}/pages/${page.slug}`;
  const result = {
    slug: page.slug,
    description: page.description,
    status: 'pass',
    message: '',
    checks: []
  };

  try {
    const response = await fetch(url, { headers });
    if (!response.ok) {
      result.status = 'fail';
      result.message = `HTTP ${response.status}`;
    } else {
      const data = await response.json();
      const body = data.body || '';
      for (const check of page.checks) {
        const passed = check.match.test(body);
        result.checks.push({
          description: check.description,
          passed
        });
      }
      if (result.checks.some((c) => !c.passed)) {
        result.status = 'fail';
        result.message = 'One or more dependency checks failed';
      } else {
        result.message = 'All checks passed';
      }
    }
  } catch (error) {
    result.status = 'fail';
    result.message = error.message;
  }

  results.push(result);
}

// Calculate overall status - exclude CSS/JS dependency checks from failure calculation
// (they're informational - Canvas DOM may vary by page)
const pageResults = results.filter(r => !r.slug.startsWith('ncas23-'));
const overallStatus = pageResults.every((r) => r.status === 'pass') ? 'pass' : 'fail';

// Format timestamp as MM-DD-YY HH:MM in Mountain Time
function formatMountainTime(date) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Denver',
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  
  const parts = formatter.formatToParts(date);
  const month = parts.find(p => p.type === 'month').value;
  const day = parts.find(p => p.type === 'day').value;
  const year = parts.find(p => p.type === 'year').value;
  const hour = parts.find(p => p.type === 'hour').value;
  const minute = parts.find(p => p.type === 'minute').value;
  
  return `${month}-${day}-${year} ${hour}:${minute}`;
}

const timestamp = formatMountainTime(new Date());

const summary = {
  timestamp,
  overallStatus,
  results
};

results.forEach((result) => {
  console.log(`[${result.status.toUpperCase()}] ${result.slug} - ${result.message || 'Completed'}`);
  result.checks.forEach((check) => {
    console.log(`   ${check.passed ? '✅' : '❌'} ${check.description}`);
  });
});

const outputDir = 'docs/health-results';
await fs.mkdir(outputDir, { recursive: true });
await fs.writeFile(`${outputDir}/latest.json`, JSON.stringify(summary, null, 2), 'utf8');

const markdownLines = [
  `# Canvas Health Check`,
  ``,
  `**Timestamp:** ${timestamp}`,
  `**Overall Status:** ${overallStatus.toUpperCase()}`,
  ``,
  `| Page | Status | Details |`,
  `| --- | --- | --- |`
];

for (const result of results) {
  const detail = result.checks
    .map((c) => `${c.passed ? '✅' : '❌'} ${c.description}`)
    .join('<br>');
  markdownLines.push(`| ${result.slug} | ${result.status.toUpperCase()} | ${detail} |`);
}

await fs.writeFile(`${outputDir}/latest.md`, markdownLines.join('\n'), 'utf8');

if (overallStatus === 'fail') {
  console.error('[ERROR] Canvas health check failed');
  process.exit(1);
} else {
  console.log('[INFO] Canvas health check passed');
}

