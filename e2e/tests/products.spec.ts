import { test, expect } from "../fixtures/auth.fixtures";

test.describe('Products', () => {
  test('home page loads with featured products', async ({ userPage }) => {
    await userPage.goto('/');

    await expect(userPage.locator('h1')).toContainText('Discover & Trade Products');
    await expect(userPage.locator('app-product-card').first()).toBeVisible({ timeout: 10_000 });
  });

  test('should navigate to products page and show catalog', async ({ userPage }) => {
    await userPage.goto('/products');

    await expect(userPage.locator('h1')).toContainText('All Products');
    await expect(userPage.locator('.search-field input')).toBeVisible();
    await expect(userPage.locator('app-product-card').first()).toBeVisible({ timeout: 10_000 });
  });

  test('should search products by keyword', async ({ userPage }) => {
    await userPage.goto('/products');

    await expect(userPage.locator('app-product-card').first()).toBeVisible({ timeout: 10_000 });

    await userPage.fill('.search-field input', 'test');
    await userPage.waitForTimeout(500); // debounceTime(300)

    await expect(userPage.locator('.search-field input')).toHaveValue('test');
  });

  test('should clear search when clicking close button', async ({ userPage }) => {
    await userPage.goto('/products');

    await userPage.fill('.search-field input', 'test');
    await userPage.waitForTimeout(500);

    await userPage.click('.search-field button[aria-label="Clear search"]');
    await expect(userPage.locator('.search-field input')).toHaveValue('');
  });

  test('should navigate to product details on card click', async ({ userPage }) => {
    await userPage.goto('/products');
    await expect(userPage.locator('app-product-card').first()).toBeVisible({ timeout: 10_000 });

    const firstCard = userPage.locator('app-product-card').first();
    const productName = await firstCard.locator('.product-title').textContent();

    await firstCard.click();

    await expect(userPage).toHaveURL(/\/products\/.+/);
    await expect(userPage.locator('h1, h2')).toContainText(productName || '');
  });

  test('should paginate product list', async ({ userPage }) => {
    await userPage.goto('/products');
    await expect(userPage.locator('app-product-card').first()).toBeVisible({ timeout: 10_000 });

    const paginator = userPage.locator('mat-paginator');
    if (await paginator.count() > 0) {
      const nextButton = paginator.locator('button[aria-label="Next page"]');
      if (await nextButton.isEnabled()) {
        await nextButton.click();
        await expect(userPage.locator('app-product-card').first()).toBeVisible({ timeout: 10_000 });
      }
    }
  });

  test('should show empty state when no results', async ({ userPage }) => {
    await userPage.goto('/products');

    await userPage.fill('.search-field input', 'xxyyzz_nonexistent_xxyyzz');
    await userPage.waitForTimeout(500);

    await expect(userPage.locator('app-empty-state')).toBeVisible();
    await expect(userPage.locator('app-empty-state')).toContainText('No matching products found');
  });
});