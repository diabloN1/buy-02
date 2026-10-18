import { test, expect } from "../fixtures/auth.fixtures";

test.describe('Profile & Analytics', () => {
  test('should show user profile page', async ({ userPage }) => {
    await userPage.goto('/profile');

    await expect(userPage.getByText('USER').first()).toBeVisible();
    await expect(userPage.locator('input[formControlName="name"]')).toBeVisible();
    await expect(userPage.locator('input[formControlName="email"]')).toBeVisible();
  });

  test('should allow updating profile name and email', async ({ userPage }) => {
    await userPage.goto('/profile');

    const nameInput = userPage.locator('input[formControlName="name"]');
    const emailInput = userPage.locator('input[formControlName="email"]');

    const originalName = await nameInput.inputValue();
    const originalEmail = await emailInput.inputValue();

    await nameInput.fill(originalName + ' Updated');
    await emailInput.fill(originalEmail);

    await userPage.click('button:has-text("Save Changes")');

    await expect(userPage.locator('text=Profile saved')).toBeVisible({ timeout: 5_000 });
  });

  test('should show analytics toggle button', async ({ userPage }) => {
    await userPage.goto('/profile');

    await expect(userPage.locator('button:has-text("Show Analytics")')).toBeVisible({ timeout: 5_000 });
  });

  test('should load and display analytics', async ({ userPage }) => {
    await userPage.goto('/profile');

    await userPage.click('button:has-text("Show Analytics")');
    await userPage.waitForTimeout(1_000);

    await expect(userPage.locator('app-analytics-display')).toBeVisible({ timeout: 10_000 });
  });

  test('should display show analytics button', async ({ userPage }) => {
    await userPage.goto('/profile');

    await userPage.click('button:has-text("Show Analytics")');
    await userPage.waitForTimeout(1_000);

    await expect(userPage.getByText('shopping analytics')).toBeVisible({ timeout: 10_000 });
  });

  test('should show seller analytics for seller role', async ({ sellerPage }) => {
    await sellerPage.goto('/profile');

    await sellerPage.click('button:has-text("Show Analytics")');
    await sellerPage.waitForTimeout(1_000);

    await expect(sellerPage.getByText('sales Analytics')).toBeVisible();
  });
});