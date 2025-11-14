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

const results = [];

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

const overallStatus = results.every((r) => r.status === 'pass') ? 'pass' : 'fail';
const timestamp = new Date().toISOString();

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

