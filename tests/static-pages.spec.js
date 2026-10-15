const { test, expect, checkImages, checkInternalLinks } = require('./site-fixtures');

for (const { path, name } of [
  { path: '/', name: 'Home' },
  { path: '/about/', name: 'About' },
  { path: '/contact/', name: 'Contact' },
  { path: '/privacy/', name: 'Privacy' },
  { path: '/search/', name: 'Search' },
]) {
  test(`${name} page renders without browser errors`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response.status()).toBe(200);
    if (name === 'Search') {
      await expect(page.getByRole('searchbox')).toBeVisible();
    } else {
      await expect(page.locator('h1, h2').first()).toBeVisible();
    }
  });
  test(`${name} page local images load`, async ({ page }) => {
    await page.goto(path);
    await checkImages(page);
  });
  test(`${name} page internal links work`, async ({ page, request, baseURL }) => {
    await page.goto(path);
    await checkInternalLinks(page, request, baseURL);
  });
}

test('search returns a matching post and opens it', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('searchbox').fill('Lambda Web Functions');
  await page.getByRole('searchbox').press('Enter');
  await expect(page).toHaveURL(/\/search\/?\?s=/);
  const result = page.locator('#search-results').getByRole('link', { name: 'AWS News: Lambda Web Functions', exact: true });
  await expect(result).toBeVisible();
  await result.click();
  await expect(page).toHaveURL(/\/posts\/2029-10-15-lambda-web-functions\//);
  await expect(page.locator('.content').first()).toBeVisible();
});

test('mobile navigation expands and opens the posts page', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.locator('#navigation')).not.toBeVisible();
  await page.getByRole('button', { name: 'navigation', exact: true }).click();
  await expect(page.locator('#navigation')).toBeVisible();
  await page.locator('#navigation').getByRole('button', { name: 'Posts', exact: true }).click();
  await page.locator('#navigation').getByRole('link', { name: 'All posts', exact: true }).click();
  await expect(page).toHaveURL(/\/posts\/$/);
  await expect(page.locator('h1, h2').first()).toBeVisible();
});
