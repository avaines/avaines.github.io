const { test, expect, checkImages, checkInternalLinks } = require('./site-fixtures');
const fs = require('node:fs');
const path = require('node:path');
const matter = require('gray-matter');

const postsDir = path.join(__dirname, '../content/posts');
const posts = fs.readdirSync(postsDir)
  .filter(dir => /^\d{4}-\d{2}-\d{2}-/.test(dir) && fs.existsSync(path.join(postsDir, dir, 'index.md')))
  .map(dir => ({ dir, data: matter(fs.readFileSync(path.join(postsDir, dir, 'index.md'), 'utf8')).data }))
  .filter(({ data }) => !data.draft && (!data.date || new Date(data.date) <= new Date()));

test('published blog posts exist', () => expect(posts.length).toBeGreaterThan(0));

for (const { dir, data } of posts) {
  const postUrl = data.url ? `/${data.url.replace(/^\/+|\/+$/g, '')}/` : `/posts/${data.slug || dir}/`;
  test.describe(dir, () => {
    test('post renders its content without browser errors', async ({ page }) => {
      const response = await page.goto(postUrl);
      expect(response.status()).toBe(200);
      await expect(page.locator('.content').first()).not.toBeEmpty();
      await expect(page.getByRole('heading', { name: data.title, exact: true }).first()).toBeVisible();
    });

    test('local images load correctly', async ({ page }) => {
      await page.goto(postUrl);
      await checkImages(page);
    });

    test('internal links are valid', async ({ page, request, baseURL }) => {
      await page.goto(postUrl);
      await checkInternalLinks(page, request, baseURL);
    });
  });
}
