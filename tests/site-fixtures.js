const { test: base, expect } = require('@playwright/test');

const test = base.extend({
  page: async ({ page, baseURL }, use) => {
    const errors = [];
    const origin = new URL(baseURL).origin;
    // Analytics are not part of the behaviour being tested and must not send events.
    await page.route(/https:\/\/([^/]+\.)?(google-analytics\.com|googletagmanager\.com)\//,
      route => route.fulfill({ status: 204, body: '' }));
    page.on('pageerror', error => errors.push(`JavaScript: ${error.message}`));
    page.on('console', message => {
      if (message.type() === 'error' && !message.text().includes('Failed to load resource')) {
        errors.push(`Console: ${message.text()}`);
      }
    });
    page.on('response', response => {
      if (new URL(response.url()).origin === origin && response.status() >= 400) {
        errors.push(`Local resource: ${response.status()} ${response.url()}`);
      }
    });
    page.on('requestfailed', request => {
      if (new URL(request.url()).origin === origin && request.failure()?.errorText !== 'net::ERR_ABORTED') {
        errors.push(`Local request: ${request.url()} ${request.failure()?.errorText}`);
      }
    });
    await use(page);
    expect(errors, 'Browser errors and failed local assets').toEqual([]);
  }
});

async function checkImages(page) {
  for (const img of await page.locator('img[src]').all()) {
    const src = await img.getAttribute('src');
    if (!src || src.startsWith('data:')) continue;
    // Remote images are covered by the scheduled report, not the PR gate.
    if (new URL(src, page.url()).origin !== new URL(page.url()).origin) continue;
    await img.evaluate(el => { el.loading = 'eager'; });
    await expect.poll(() => img.evaluate(el => el.complete && el.naturalWidth > 0), {
      message: `Image failed to load: ${src}`, timeout: 10000
    }).toBe(true);
  }
}

async function checkInternalLinks(page, request, baseURL) {
  const origin = new URL(baseURL).origin;
  const urls = await page.locator('a[href]').evaluateAll(links => links.map(link => link.href));
  const checked = new Set();
  for (const href of urls) {
    const url = new URL(href);
    if (![origin, 'https://www.vaines.org', 'https://vaines.org'].includes(url.origin)) continue;
    const target = new URL(url.pathname + url.search, baseURL).href;
    if (checked.has(target)) continue;
    checked.add(target);
    const response = await request.get(target);
    expect(response.status(), `Internal link failed: ${href}`).toBeLessThan(400);
  }
}

module.exports = { test, expect, checkImages, checkInternalLinks };
