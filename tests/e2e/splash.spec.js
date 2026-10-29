const { test, expect } = require('./fixtures');

test.describe('splash screen', () => {
  test('welcomes the visitor with the téja logo, then reveals the site', async ({ page }) => {
    await page.goto('/');

    const splash = page.getByRole('status', { name: 'Welcome to téja' });
    await expect(splash).toBeVisible();
    await expect(splash).toContainText('Welcome to');

    const logo = splash.getByRole('img', { name: 'téja' });
    await expect(logo).toBeVisible();
    await expect.poll(() => logo.evaluate((img) => img.naturalWidth)).toBeGreaterThan(0);

    // Page scroll is locked while the splash is up
    await expect(page.locator('html')).toHaveClass(/m-splash-on/);

    await expect(page.locator('.m-splash')).toHaveCount(0, { timeout: 15_000 });
    await expect(page.locator('html')).not.toHaveClass(/m-splash-on/);
    await expect(page.getByRole('heading', { level: 1, name: 'Bracelets.' })).toBeVisible();
  });

  test('is shown only once per page load, not on in-app navigation', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.m-splash')).toHaveCount(0, { timeout: 15_000 });
    await page.getByRole('button', { name: 'Shop bracelets →' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Bracelets' })).toBeVisible();
    await expect(page.locator('.m-splash')).toHaveCount(0);
  });

  test('still appears, and clears quickly, with reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await expect(page.getByRole('status', { name: 'Welcome to téja' })).toBeVisible();
    await expect(page.locator('.m-splash')).toHaveCount(0, { timeout: 5_000 });
    // No scroll-reveal hiding when motion is reduced
    await expect(page.locator('.m-reveal')).toHaveCount(0);
  });
});
