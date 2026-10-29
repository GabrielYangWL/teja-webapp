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

  test('announcement bar stays on one line and rotates on small screens', async ({ page }) => {
    await openSite(page);
    const bar = page.locator('header').locator('xpath=preceding-sibling::div[1]');
    const messages = bar.locator(':scope > span');
    await expect(messages).toHaveCount(3);

    const box = await bar.boundingBox();
    if ((page.viewportSize()?.width ?? 0) > 760) {
      // Desktop: all three messages visible side by side
      for (let i = 0; i < 3; i++) await expect(messages.nth(i)).toBeVisible();
      expect(box.height).toBeLessThan(40);
      return;
    }
    expect(box.height, 'bar is a single slim line').toBeLessThanOrEqual(36);
    const visible = () => messages.evaluateAll((els) => els.filter((e) => getComputedStyle(e).opacity === '1').map((e) => e.textContent));
    await expect.poll(visible).toEqual(['Free UK delivery over £150']);
    await expect.poll(visible, { timeout: 8_000 }).toEqual(['Handmade in Bali · 925 sterling silver']);
  });

  test('every image has alt text', async ({ page }) => {
    await openSite(page);
    const missingAlt = await page.locator('img:not([alt])').count();
    expect(missingAlt).toBe(0);
  });
});
