const { test, expect, openSite, bagButton, productCard } = require('./fixtures');

async function addToBag(page, name, length) {
  await productCard(page, name).click();
  await expect(page.getByRole('heading', { level: 1, name })).toBeVisible();
  await page.getByRole('button', { name: length, exact: true }).click();
  await page.getByRole('button', { name: /^Add to bag — / }).click();
}

const drawer = (page) => page.locator('[data-screen-label="Cart"]');

test.describe('bag', () => {
  test.beforeEach(async ({ page }) => openSite(page));

  test('add to bag needs a length, then opens the bag', async ({ page }) => {
    await productCard(page, 'Padi Chain').click();
    const add = page.getByRole('button', { name: 'Select a length' });
    await expect(add).toBeVisible();
    await add.click();
    await expect(drawer(page)).toHaveCount(0);

    await page.getByRole('button', { name: '20 cm', exact: true }).click();
    await page.getByRole('button', { name: 'Add to bag — £95' }).click();

    await expect(drawer(page)).toBeVisible();
    await expect(drawer(page)).toContainText('Padi Chain');
    await expect(drawer(page)).toContainText('20 cm');
    await expect(drawer(page)).toContainText('£55.00 away from free delivery');
    await expect(bagButton(page)).toHaveText('Bag [1]');
  });

  test('out-of-stock lengths cannot be selected', async ({ page }) => {
    await productCard(page, 'Sisik Curb').click();
    await page.getByRole('button', { name: '22 cm', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Select a length' })).toBeVisible();
  });

  test('quantity can be changed and items removed', async ({ page }) => {
    await addToBag(page, 'Padi Chain', '19 cm');
    await drawer(page).getByRole('button', { name: '+' }).click();
    await expect(bagButton(page)).toHaveText('Bag [2]');
    await expect(drawer(page)).toContainText('£190');
    await expect(drawer(page)).toContainText('Your order qualifies for free delivery');

    await drawer(page).getByRole('button', { name: '−' }).click();
    await expect(bagButton(page)).toHaveText('Bag [1]');

    await drawer(page).getByRole('button', { name: 'Remove' }).click();
    await expect(drawer(page)).toContainText('Your bag is empty.');
    await expect(bagButton(page)).toHaveText('Bag [0]');
  });

  test('the bag closes from the Close button and the backdrop', async ({ page }) => {
    await bagButton(page).click();
    await expect(drawer(page)).toBeVisible();
    await drawer(page).getByRole('button', { name: 'Close' }).click();
    await expect(drawer(page)).toHaveCount(0);

    await bagButton(page).click();
    await expect(drawer(page)).toBeVisible();
    await page.mouse.click(10, 300); // backdrop, left of the drawer
    await expect(drawer(page)).toHaveCount(0);
  });
});

test.describe('checkout', () => {
  test('completes an order end to end', async ({ page }) => {
    await openSite(page);
    await addToBag(page, 'Sisik Curb', '19 cm');
    await drawer(page).getByRole('button', { name: 'Checkout →' }).click();

    await expect(page.getByRole('heading', { name: 'Contact' })).toBeVisible();
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Phone (for delivery updates)').fill('07700 900000');
    await page.getByRole('button', { name: 'Continue to shipping →' }).click();

    await expect(page.getByRole('heading', { name: 'Shipping' })).toBeVisible();
    await page.getByLabel('First name').fill('Ada');
    await page.getByLabel('Last name').fill('Lovelace');
    await page.getByLabel('Address').fill('1 Test Street');
    await page.getByLabel('City').fill('London');
    await page.getByLabel('Postcode').fill('N1 1AA');
    await page.getByRole('button', { name: 'Continue to payment →' }).click();

    await expect(page.getByRole('heading', { name: 'Payment' })).toBeVisible();
    await page.getByLabel('Card number').fill('4242 4242 4242 4242');
    await page.getByLabel('Expiry').fill('12 / 30');
    await page.getByLabel('CVC').fill('123');
    await page.getByRole('button', { name: 'Review order →' }).click();

    await expect(page.getByRole('heading', { name: 'Review' })).toBeVisible();
    const main = page.locator('main');
    await expect(main).toContainText('test@example.com · 07700 900000');
    await expect(main).toContainText('Ada Lovelace, 1 Test Street, London, N1 1AA');
    await expect(main).toContainText('Card ending 4242');
    await expect(main).toContainText('£195.00'); // free delivery over £150

    await page.getByRole('button', { name: 'Place order · £195.00 →' }).click();
    await expect(page.getByRole('heading', { name: 'Order placed.' })).toBeVisible();
    await expect(main).toContainText('A confirmation has been sent to test@example.com');
    await expect(bagButton(page)).toHaveText('Bag [0]');
  });

  test('earlier steps can be revisited from the review step', async ({ page }) => {
    await openSite(page);
    await addToBag(page, 'Naga Weave', '18 cm');
    await drawer(page).getByRole('button', { name: 'Checkout →' }).click();
    for (const next of ['Continue to shipping →', 'Continue to payment →', 'Review order →']) {
      await page.getByRole('button', { name: next }).click();
    }
    await page.getByRole('button', { name: 'Edit' }).first().click();
    await expect(page.getByRole('heading', { name: 'Contact' })).toBeVisible();
  });
});
