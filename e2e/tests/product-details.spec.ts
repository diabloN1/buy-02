import { test, expect } from "../fixtures/auth.fixtures";

test.describe('Product Details', () => {
  test('should display product details correctly', async ({ userPage }) => {
    await userPage.goto('/products');
    const firstCard = userPage.locator('app-product-card').first();
    await firstCard.waitFor({ state: 'visible', timeout: 10_000 });

    const productUrl = await firstCard.locator('a').getAttribute('href');
    if (!productUrl) {
      test.skip();
      return;
    }

    await firstCard.click();
    await expect(userPage).toHaveURL(/\/products\/.+/);

    await expect(userPage.locator('.product-title, h1, h2').first()).toBeVisible();
  });

  test('should have back to products link', async ({ userPage }) => {
    await userPage.goto('/products');
    const firstCard = userPage.locator('app-product-card').first();
    await firstCard.waitFor({ state: 'visible', timeout: 10_000 });

    await firstCard.click();
    await userPage.waitForURL(/\/products\/.+/);

    await expect(userPage.locator('a:has-text("Back"), a[routerLink]').last()).toBeVisible();
  });

  test('show 404 for non-existent product', async ({ userPage }) => {
    await userPage.goto('/products/non-existent-product-12345');

    await expect(userPage.locator('text=404')).toBeVisible({ timeout: 5000 });
  });

  test('should display inventory status correctly', async ({ userPage }) => {
    await userPage.goto('/products');
    const firstCard = userPage.locator('app-product-card').first();
    await firstCard.waitFor({ state: 'visible', timeout: 10_000 });

    await expect(firstCard.locator('.qty-pill')).toBeVisible();
  });
});