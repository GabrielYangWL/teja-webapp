// Shared fixtures: every test fails on uncaught page errors or console errors,
// except failed loads of third-party stock photos (Unsplash), which are outside our control.
const base = require('@playwright/test');
const { expect } = base;

const EXTERNAL = /unsplash\.com/;
// Known bundle quirk: the unpacker drops the raw x-dc template into the DOM before React renders it,
// so the browser briefly requests literal `src="{{ p.img }}"` URLs and gets 404s. Harmless, but noisy.
const TEMPLATE_PLACEHOLDER = /%7B%7B|\{\{/;
const ignorable = (url) => EXTERNAL.test(url) || TEMPLATE_PLACEHOLDER.test(url);

const test = base.test.extend({
  pageErrors: [async ({ page }, use) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
    page.on('console', (msg) => {
      if (msg.type() !== 'error') return;
      if (ignorable(msg.location().url || '')) return;
      errors.push(`console.error: ${msg.text()}`);
    });
    page.on('requestfailed', (r) => {
      if (!ignorable(r.url())) errors.push(`requestfailed: ${r.url()} ${r.failure()?.errorText}`);
    });
    await use(errors);
    expect(errors, 'front-end errors during the test').toEqual([]);
  }, { auto: true }]
});

/** Load the site and wait until the splash has lifted and the home hero is interactive. */
async function openSite(page) {
  await page.goto('/');
  await expect(page.locator('.m-splash')).toHaveCount(0, { timeout: 15_000 });
  await expect(page.getByRole('heading', { level: 1, name: 'Bracelets.' })).toBeVisible();
}

const bagButton = (page) => page.getByRole('button', { name: /^Bag \[\d+\]$/ });
const productCard = (page, name) => page.locator('main a').filter({ hasText: name });

module.exports = { test, expect, openSite, bagButton, productCard };
