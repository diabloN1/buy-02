import { test, expect } from "../fixtures/auth.fixtures";

test.describe('Orders (Seller)', () => {
  test('should show seller orders page', async ({ sellerPage }) => {
    await sellerPage.goto('/suborders');
    await expect(sellerPage.locator('h1')).toContainText(/Seller Orders|My Orders/i);
  });

  test('should list seller orders with actions', async ({ sellerPage }) => {
    await sellerPage.goto('/suborders');

    const firstOrderRow = sellerPage.locator('mat-row, tr').first();
    if (await firstOrderRow.count() > 0) {
      await expect(firstOrderRow.locator('button, mat-icon')).toBeVisible({ timeout: 10_000 });
    }
  });

  test('should update suborder status', async ({ sellerPage }) => {
    await sellerPage.goto('/suborders');

    const firstOrderRow = sellerPage.locator('mat-row, tr').first();
    if (await firstOrderRow.count() === 0) {
      return;
    }

    const statusBtn = firstOrderRow.locator('button:has(mat-icon)').first();
    if (await statusBtn.count() > 0) {
      await statusBtn.click();
      await expect(sellerPage.locator('text=Status updated')).toBeVisible({ timeout: 5_000 });
    }
  });

  test('should view order details from seller perspective', async ({ sellerPage }) => {
    await sellerPage.goto('/suborders');

    const firstOrderRow = sellerPage.locator('mat-row, tr').first();
    if (await firstOrderRow.count() > 0) {
      const viewBtn = firstOrderRow.locator('button[aria-label="View Details"]').first();
      if (await viewBtn.count() > 0) {
        await viewBtn.click();
        await expect(sellerPage).toHaveURL(/\/suborders\/.+/);
      }
    }
  });

  test('should show seller order status timeline', async ({ sellerPage }) => {
    await sellerPage.goto('/suborders');

    const firstOrderRow = sellerPage.locator('mat-row, tr').first();
    if (await firstOrderRow.count() > 0) {
      await firstOrderRow.click();
      await expect(sellerPage.locator('mat-accordion, mat-expansion-panel')).toBeVisible({ timeout: 5_000 });
    }
  });

  test('should allow delete suborder when enabled', async ({ sellerPage }) => {
    await sellerPage.goto('/suborders');

    const firstOrderRow = sellerPage.locator('mat-row, tr').first();
    if (await firstOrderRow.count() > 0) {
      const deleteBtn = firstOrderRow.locator('button[color="warn"]:has-text("Delete")').first();
      if (await deleteBtn.count() > 0) {
        await expect(deleteBtn).toBeEnabled({ timeout: 5_000 });
      }
    }
  });

  test('should show order status timeline with available transitions', async ({ sellerPage }) => {
    await sellerPage.goto('/suborders');

    const firstOrderRow = sellerPage.locator('mat-row, tr').first();
    if (await firstOrderRow.count() > 0) {
      await firstOrderRow.locator('button:has(mat-icon:first-child)').first().click();
      await expect(sellerPage).toHaveURL(/\/suborders\/.+/);
    }
  });
});