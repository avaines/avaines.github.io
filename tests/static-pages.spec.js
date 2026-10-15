const { test, expect } = require('@playwright/test');

test.describe('Static Pages', () => {
  const pages = [
    { path: '/', name: 'Home' },
    { path: '/about/', name: 'About' },
    { path: '/contact/', name: 'Contact' },
    { path: '/privacy/', name: 'Privacy' },
    { path: '/search/', name: 'Search' },
  ];

  for (const { path, name } of pages) {
    test(`${name} page loads successfully`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response.status()).toBe(200);

      // Check page has content
      await expect(page.locator('body')).not.toBeEmpty();
    });

    test(`${name} page has no console errors`, async ({ page }) => {
      const consoleErrors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          const text = msg.text();
          // Ignore resource loading failures (fonts, analytics, CDN resources)
          if (!text.includes('Failed to load resource')) {
            consoleErrors.push(text);
          }
        }
      });

      await page.goto(path);
      expect(consoleErrors, `Console errors found: ${consoleErrors.join(', ')}`).toHaveLength(0);
    });

    test(`${name} page all images load successfully`, async ({ page }) => {
      await page.goto(path);

      const images = await page.locator('img').all();

      for (const img of images) {
        const src = await img.getAttribute('src');
        if (src && !src.startsWith('data:')) {
          // Load offscreen images too, then wait for the browser to finish decoding.
          await img.evaluate(el => { el.loading = 'eager'; });
          await expect.poll(
            () => img.evaluate(el => el.complete && el.naturalWidth > 0),
            { message: `Image failed to load: ${src}`, timeout: 10000 }
          ).toBe(true);
        }
      }
    });
  }
});
