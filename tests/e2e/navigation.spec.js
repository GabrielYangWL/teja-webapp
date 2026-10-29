const { test, expect, openSite, productCard } = require('./fixtures');

test.describe('navigation', () => {
  test.beforeEach(async ({ page }) => openSite(page));

  test('home lists the three bracelets with prices', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'The bracelets' })).toBeVisible();
    for (const [name, price] of [['Naga Weave', '£165'], ['Sisik Curb', '£195'], ['Padi Chain', '£95']]) {
      const card = productCard(page, name);
      await expect(card).toHaveCount(1);
      await expect(card).toContainText(price);
    }
    await expect(page.getByRole('heading', { name: /From Bali\s*to the World\./ })).toBeVisible();
  });

  test('"Shop bracelets" opens the collection', async ({ page }) => {
    await page.getByRole('button', { name: 'Shop bracelets →' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Bracelets' })).toBeVisible();
    await expect(page.getByText('3 pieces · Sort')).toBeVisible();
    await expect(page.locator('main a').filter({ has: page.locator('img') })).toHaveCount(3);
  });

  test('a product card opens its product page, breadcrumbs lead back', async ({ page }) => {
    await productCard(page, 'Sisik Curb').click();
    await expect(page.getByRole('heading', { level: 1, name: 'Sisik Curb' })).toBeVisible();
    await expect(page.getByText('£195', { exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Reviews' })).toBeVisible();

    await page.getByRole('link', { name: 'Bracelets', exact: true }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Bracelets' })).toBeVisible();
  });

  test('the header logo returns home and resets scroll', async ({ page }) => {
    await productCard(page, 'Padi Chain').click();
    await expect(page.getByRole('heading', { level: 1, name: 'Padi Chain' })).toBeVisible();
    await page.mouse.wheel(0, 800);
    await page.getByRole('link', { name: 'téja home' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Bracelets.' })).toBeVisible();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  });
});
