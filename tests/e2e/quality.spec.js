const { test, expect, openSite, productCard } = require('./fixtures');

/** Bundled (non-Unsplash) images that are in the DOM but failed to decode. */
const brokenImages = (page) =>
  page.locator('img').evaluateAll((imgs) =>
    imgs.filter((i) => !/unsplash\.com/.test(i.src) && i.complete && i.naturalWidth === 0).map((i) => i.alt || i.src.slice(0, 60))
  );

const horizontalOverflow = (page) =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

test.describe('front-end quality', () => {
  test('bundled images load on home and product pages', async ({ page }) => {
    await openSite(page);
    await expect.poll(() => brokenImages(page)).toEqual([]);
    await productCard(page, 'Naga Weave').click();
    await expect(page.getByRole('heading', { level: 1, name: 'Naga Weave' })).toBeVisible();
    await expect.poll(() => brokenImages(page)).toEqual([]);
  });

  test('no horizontal scrolling on any view', async ({ page }) => {
    await openSite(page);
    expect(await horizontalOverflow(page), 'home').toBeLessThanOrEqual(1);

    await page.getByRole('button', { name: 'Shop bracelets →' }).click();
    await expect(page.getByText('3 pieces · Sort')).toBeVisible();
    expect(await horizontalOverflow(page), 'collection').toBeLessThanOrEqual(1);

    await productCard(page, 'Sisik Curb').click();
    await expect(page.getByRole('heading', { level: 1, name: 'Sisik Curb' })).toBeVisible();
    expect(await horizontalOverflow(page), 'product').toBeLessThanOrEqual(1);
  });

  test('sections fade in as they scroll into view', async ({ page }) => {
    await openSite(page);
    const bali = page.getByRole('heading', { name: /From Bali/ });
    const block = page.locator('.m-reveal').filter({ has: bali });
    await expect(block).toHaveCount(1);
    await bali.scrollIntoViewIfNeeded();
    await expect(block).toHaveClass(/m-in/);
    await expect(block).toHaveCSS('opacity', '1');

    // Cards reveal as each one enters the viewport (on mobile they stack, so scroll to each)
    for (const name of ['Naga Weave', 'Sisik Curb', 'Padi Chain']) {
      const card = productCard(page, name);
      await card.scrollIntoViewIfNeeded();
      await expect(card).toHaveClass(/m-in/);
    }
  });

  test('every image has alt text', async ({ page }) => {
    await openSite(page);
    const missingAlt = await page.locator('img:not([alt])').count();
    expect(missingAlt).toBe(0);
  });
});
