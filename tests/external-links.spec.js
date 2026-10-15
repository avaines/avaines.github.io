const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');

test('external links and images report @external', async ({ page, request, baseURL }, testInfo) => {
  test.setTimeout(9 * 60 * 1000);
  const root = path.join(__dirname, '../.test-site');
  const htmlFiles = fs.readdirSync(root, { recursive: true }).filter(file => file.endsWith('.html'));
  const sources = new Map();
  for (const file of htmlFiles) {
    const html = fs.readFileSync(path.join(root, file), 'utf8');
    // Parse without loading the page or executing third-party scripts.
    const links = await page.evaluate(html => {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      return [...doc.querySelectorAll('a[href], img[src]')].map(el => el.getAttribute('href') || el.getAttribute('src'));
    }, html);
    for (const href of links) {
      const url = new URL(href, baseURL);
      if (!['http:', 'https:'].includes(url.protocol)) continue;
      if ([new URL(baseURL).origin, 'https://www.vaines.org', 'https://vaines.org'].includes(url.origin)) continue;
      url.hash = '';
      const key = url.href;
      if (!sources.has(key)) sources.set(key, new Set());
      sources.get(key).add(file);
    }
  }
  expect(sources.size).toBeGreaterThan(0);
  const queue = [...sources.keys()];
  const failures = [];
  await Promise.all(Array.from({ length: 6 }, async () => {
    while (queue.length) {
      const url = queue.shift();
      try {
        const response = await request.get(url, { timeout: 10000 });
        const status = response.status();
        await response.dispose();
        if (status >= 400) failures.push({ url, status, pages: [...sources.get(url)] });
      } catch (error) {
        failures.push({ url, error: error.message, pages: [...sources.get(url)] });
      }
    }
  }));
  const reportPath = testInfo.outputPath('external-links.json');
  fs.writeFileSync(reportPath, JSON.stringify({ checked: sources.size, failures }, null, 2));
  await testInfo.attach('external-links.json', { path: reportPath, contentType: 'application/json' });
  console.log(`Checked ${sources.size} unique external URLs; ${failures.length} need review.`);
  expect(failures.length, 'External links need review; see attached report (403/429 may be bot protection)').toBe(0);
});
