import { test, expect } from "../fixtures/auth.fixtures";

test.describe("404 Not Found", () => {
  test("should show 404 page for unknown route", async ({ page }) => {
    await page.goto("/this-route-does-not-exist-12345");

    await expect(page.getByRole("heading", { name: "404" })).toBeVisible({
      timeout: 5_000,
    });
    await expect(page.getByText("The page you're looking for")).toBeVisible({
      timeout: 5_000,
    });
  });

  test("should have link back to home/products from 404", async ({ page }) => {
    await page.goto("/this-route-does-not-exist-12345");

    await expect(
      page
        .locator(
          'a[routerLink="/"], a[routerLink="/products"], button:has-text("Back")',
        )
        .first(),
    ).toBeVisible();
  });

  test("should show 404 for non-existent product", async ({ page }) => {
    await page.goto("/products/non-existent-product-id-99999");

    await expect(page).toHaveURL(/\/404$/);
    
    await expect(page.getByRole("heading", { name: "404" })).toBeVisible({
      timeout: 5_000,
    });
    await expect(page.getByText("The page you're looking for")).toBeVisible({
      timeout: 5_000,
    });
  });

  test("should show 404 for non-existent order", async ({ userPage }) => {
    await userPage.goto("/orders/non-existent-order-id-99999");

    await expect(userPage.getByText("Order not found")).toBeVisible({
      timeout: 5_000,
    });
  });
});
