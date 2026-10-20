import { test, expect } from "../fixtures/cart.fixtures";

test.describe('Product Details', () => {
  test('should display product details correctly', async ({ productPage }) => {
    await productPage.goto('/products');
    const firstCard = productPage.locator('app-product-card').first();
    await firstCard.waitFor({ state: 'visible', timeout: 10_000 });

    const productUrl = await firstCard.locator('a').getAttribute('href');
    if (!productUrl) {
      test.skip();
      return;
    }

    await firstCard.click();
    await expect(productPage).toHaveURL(/\/products\/.+/);

    await expect(productPage.locator('.product-title, h1, h2').first()).toBeVisible();
  });

  test('should have back to products link', async ({ productPage }) => {
    await productPage.goto('/products');
    const firstCard = productPage.locator('app-product-card').first();
    await firstCard.waitFor({ state: 'visible', timeout: 10_000 });

    await firstCard.click();
    await productPage.waitForURL(/\/products\/.+/);

    await expect(productPage.locator('a:has-text("Back"), a[routerLink]').last()).toBeVisible();
  });

  test('show 404 for non-existent product', async ({ productPage }) => {
    await productPage.goto('/products/non-existent-product-12345');

    await expect(productPage.locator('text=404')).toBeVisible({ timeout: 5000 });
  });

  test('should display inventory status correctly', async ({ productPage }) => {
    await productPage.goto('/products');
    const firstCard = productPage.locator('app-product-card').first();
    await firstCard.waitFor({ state: 'visible', timeout: 10_000 });

    await expect(firstCard.locator('.qty-pill')).toBeVisible();
  });
});