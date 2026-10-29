const { test, expect, openSite } = require('./fixtures');

const NAMES = ['Naga Weave', 'Sisik Curb', 'Padi Chain'];
/** Product names in on-screen order, one per card. */
const cardNames = (page) =>
  page.locator('main a').filter({ has: page.locator('img') }).evaluateAll(
    (cards, names) => cards.map((c) => names.find((n) => c.textContent.includes(n))),
    NAMES
  );

test.describe('collection filters and sorting', () => {
  test.beforeEach(async ({ page }) => {
    await openSite(page);
    await page.getByRole('button', { name: 'Shop bracelets →' }).click();
    await expect(page.getByText('3 pieces · Sort')).toBeVisible();
  });

  test('sorts by price both ways', async ({ page }) => {
    await page.getByRole('button', { name: 'Price ↑' }).click();
    await expect.poll(() => cardNames(page)).toEqual(['Padi Chain', 'Naga Weave', 'Sisik Curb']);
    await page.getByRole('button', { name: 'Price ↓' }).click();
    await expect.poll(() => cardNames(page)).toEqual(['Sisik Curb', 'Naga Weave', 'Padi Chain']);
  });

  test('filters by style and price, then clears', async ({ page }) => {
    await page.getByRole('button', { name: 'Woven' }).click();
    await expect(page.getByText('1 pieces · Sort')).toBeVisible();
    await expect.poll(() => cardNames(page)).toEqual(['Naga Weave']);

    await page.getByRole('button', { name: 'Under £120' }).click();
    await expect(page.getByText('No pieces match')).toBeVisible();

    await page.getByRole('button', { name: 'Clear all filters' }).click();
    await expect(page.getByText('3 pieces · Sort')).toBeVisible();
  });

  test('filters by length, excluding out-of-stock sizes', async ({ page }) => {
    // Sisik Curb is out of stock in 22 cm
    await page.getByRole('button', { name: '22 cm' }).click();
    await expect(page.getByText('2 pieces · Sort')).toBeVisible();
    await expect.poll(() => cardNames(page)).not.toContain('Sisik Curb');
  });
});
