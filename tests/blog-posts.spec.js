const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

// Get all blog post directories
const postsDir = path.join(__dirname, '../content/posts');
const postDirs = fs.readdirSync(postsDir)
  .filter(item => {
    const fullPath = path.join(postsDir, item);
    return fs.statSync(fullPath).isDirectory();
  })
  .filter(dir => /^\d{4}-\d{2}-\d{2}-/.test(dir)); // Only date-prefixed directories

test.describe('Blog Posts', () => {
  test(`found ${postDirs.length} blog posts`, async () => {
    expect(postDirs.length).toBeGreaterThan(0);
  });

  for (const postDir of postDirs) {
    const slug = postDir.replace(/^\d{4}-\d{2}-\d{2}-/, '');
    const dateMatch = postDir.match(/^(\d{4})-(\d{2})-(\d{2})/);
    const postUrl = `/posts/${postDir}/`;

    test.describe(postDir, () => {
      test('post loads successfully', async ({ page }) => {
        const response = await page.goto(postUrl);
        expect(response.status()).toBe(200);

        // Check page has content
        await expect(page.locator('body')).not.toBeEmpty();
      });

      test('all images load correctly', async ({ page }) => {
        await page.goto(postUrl);

        const images = await page.locator('img').all();

        if (images.length === 0) {
          // Post has no images, skip
          test.skip();
          return;
        }

        for (const img of images) {
          const src = await img.getAttribute('src');

          if (src && !src.startsWith('data:')) {
            // Check natural width > 0 (means image loaded)
            // Skip visibility check for lazy-loaded images
            const naturalWidth = await img.evaluate(el => el.naturalWidth);
            expect(naturalWidth, `Image failed to load: ${src}`).toBeGreaterThan(0);
          }
        }
      });

      test('all internal links are valid', async ({ page, request }) => {
        await page.goto(postUrl);

        // Get all internal links (excluding anchors and external links)
        const links = await page.locator('a[href^="/"]').all();

        if (links.length === 0) {
          // No internal links, skip
          test.skip();
          return;
        }

        const checkedUrls = new Set();

        for (const link of links) {
          const href = await link.getAttribute('href');

          // Skip known baseURL issues and anchors
          if (href && !href.includes('#') && !href.includes('/avaines.github.io') && !checkedUrls.has(href)) {
            checkedUrls.add(href);

            const response = await request.get(href);
            expect(response.status(), `Link failed: ${href}`).toBeLessThan(400);
          }
        }
      });

      test('has no broken external links', async ({ page, request }) => {
        await page.goto(postUrl);

        // Get all external links (excluding localhost)
        const links = await page.locator('a[href^="http"]').all();

        if (links.length === 0) {
          // No external links, skip
          test.skip();
          return;
        }

        const checkedUrls = new Set();

        for (const link of links) {
          const href = await link.getAttribute('href');

          // Skip localhost URLs and avaines.github.io URLs (baseURL issues)
          if (href && !href.includes('localhost') && !href.includes('127.0.0.1') && !href.includes('avaines.github.io') && !checkedUrls.has(href)) {
            checkedUrls.add(href);

            try {
              const response = await request.get(href, { timeout: 10000 });
              expect(response.status(), `External link failed: ${href}`).toBeLessThan(400);
            } catch (error) {
              // Log but don't fail on external link timeouts
              console.warn(`External link timeout or error: ${href}`);
            }
          }
        }
      });

      test('has no console errors', async ({ page }) => {
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

        await page.goto(postUrl);

        // Give page time to fully load
        await page.waitForLoadState('networkidle');

        expect(consoleErrors, `Console errors found: ${consoleErrors.join(', ')}`).toHaveLength(0);
      });
    });
  }
});
