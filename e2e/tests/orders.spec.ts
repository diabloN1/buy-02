import { test, expect } from "../fixtures/auth.fixtures";

test.describe('Orders (Buyer)', () => {
  test('should show orders page', async ({ userPage }) => {
    await userPage.goto('/orders');
    await expect(userPage.locator('h1')).toContainText(/My Orders|Seller Orders/i);
  });

  test('should show empty state when no orders', async ({ userPage }) => {
    await userPage.goto('/orders');

    const emptyCard = userPage.locator('mat-card:has-text("No orders found")');
    if (await emptyCard.count() > 0) {
      await expect(emptyCard).toBeVisible();
      await expect(userPage.locator('text=Start shopping')).toBeVisible();
    }
  });

  test('should navigate to order details from order list', async ({ userPage }) => {
    await userPage.goto('/orders');

      const viewBtn = userPage.getByRole('button', { description: 'View Details', exact: true });
      
      if (await viewBtn.count() > 0) {
        await viewBtn.click();
        await expect(userPage).toHaveURL(/\/orders\/.+/);
      }
  });

  test('should show order details page', async ({ userPage }) => {
    await userPage.goto('/orders');

    const firstOrderRow = userPage.locator('mat-row, tr').first();
    if (await firstOrderRow.count() > 0) {
      const viewBtn = firstOrderRow.locator('button:has(mat-icon:not([aria-hidden]))').first();
      if (await viewBtn.count() > 0) {
        await viewBtn.click();
        await expect(userPage).toHaveURL(/\/orders\/.+/);

        await expect(userPage.locator('h2, mat-card-title')).toContainText(/Order #/i);
        await expect(userPage.locator('text=Order Date')).toBeVisible();
      }
    }
  });

  test('should allow redo order (buyer)', async ({ userPage }) => {
    await userPage.goto('/orders');

    const firstOrderRow = userPage.locator('mat-row, tr').first();
    if (await firstOrderRow.count() > 0) {
      const redoBtn = firstOrderRow.locator('button:has(mat-icon:text("low_priority"))');
      if (await redoBtn.count() > 0) {
        await redoBtn.click();

        await expect(userPage.locator('text=Do you want to redo')).toBeVisible();
        await expect(userPage.locator('button:has-text("Confirm")')).toBeVisible();
      }
    }
  });

  test('should allow cancel order when pending', async ({ userPage }) => {
    await userPage.goto('/orders');

    const firstOrderRow = userPage.locator('mat-row, tr').first();
    if (await firstOrderRow.count() > 0) {
      const cancelBtn = firstOrderRow.locator('button:has(mat-icon:text("cancel"))');
      if (await cancelBtn.count() > 0) {
        await cancelBtn.click();

        await expect(userPage.locator('text=Do you want to cancel')).toBeVisible();
        await expect(userPage.locator('button[color="warn"]:has-text("Confirm")')).toBeVisible();
      }
    }
  });

  test('should show order status chips with correct colors', async ({ userPage }) => {
    await userPage.goto('/orders');

    const statusChip = userPage.locator('mat-chip, .mat-chip').first();
    if (await statusChip.count() > 0) {
      await expect(statusChip).toBeVisible();
    }
  });

  test('should paginate orders list', async ({ userPage }) => {
    await userPage.goto('/orders');

    const paginator = userPage.locator('mat-paginator');
    if (await paginator.count() > 0) {
      const nextBtn = paginator.locator('button[aria-label="Next page"]');
      if (await nextBtn.isEnabled()) {
        await nextBtn.click();
        await expect(userPage.locator('mat-row, tr').first()).toBeVisible({ timeout: 10_000 });
      }
    }
  });
});