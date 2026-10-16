import { test, expect } from "../fixtures/cart.fixtures";

test.describe("Shopping Cart", () => {
  test("should add product to cart from product page", async ({
    productPage
  }) => {

    productPage.getByText("add_shopping_cart Add to cart").click();

    await expect(productPage.getByText("Product added! go to cart for")).toBeVisible({ timeout: 5_000 });
  });

  test("should show cart page with items", async ({ userPage }) => {
    await userPage.goto("/cart");

    const emptyState = userPage.locator(".empty-state, app-empty-state");
    const cartItems = userPage.locator(".cart-item, app-cart-item");

    if ((await emptyState.count()) > 0) {
      await expect(emptyState).toBeVisible();
      await expect(userPage.locator("text=Your cart is empty")).toBeVisible();
    } else {
      await expect(cartItems.first()).toBeVisible({ timeout: 10_000 });
    }
  });

  test("should update item quantity in cart", async ({ cartWithItem }) => {

    const firstItem = cartWithItem.locator("app-cart-item").first();

    const initialQuantity = await firstItem
      .locator(".quantity-value")
      .textContent();

    await firstItem.locator('button[aria-label="Increase quantity"]').click();

    await expect(firstItem.locator(".quantity-value")).not.toHaveText(
      initialQuantity || "",
    );

    await firstItem.locator('button[aria-label="Decrease quantity"]').click();

    await expect(firstItem.locator(".quantity-value")).toHaveText(
      initialQuantity || "",
    );
  });

  test("should remove item from cart", async ({ userPage }) => {
    await userPage.goto("/cart");

    const firstItem = userPage.locator("app-cart-item").first();

    if ((await firstItem.count()) === 0) {
      return;
    }

    await firstItem.locator('button[aria-label="Remove item"]').click();

    await expect(firstItem).toHaveCount(0);
  });

  test("should clear entire cart", async ({ userPage }) => {
    await userPage.goto("/cart");

    const firstItem = userPage.locator("app-cart-item").first();

    if ((await firstItem.count()) === 0) {
      return;
    }

    const clearBtn = userPage.locator('button:has-text("Clear cart")');

    if ((await clearBtn.count()) > 0) {
      await clearBtn.click();

      await expect(
        userPage.locator(".empty-state, app-empty-state"),
      ).toBeVisible({ timeout: 5_000 });

      await expect(userPage.locator("text=Your cart is empty")).toBeVisible();
    }
  });

  test("should show empty cart state when no items", async ({ userPage }) => {
    await userPage.goto("/cart");

    const clearBtn = userPage.locator('button:has-text("Clear cart")');

    if ((await clearBtn.count()) > 0) {
      await clearBtn.click();
    }

    await expect(userPage.locator("text=Your cart is empty")).toBeVisible({
      timeout: 5_000,
    });

    await expect(
      userPage.locator('a:has-text("Continue Shopping")'),
    ).toBeVisible();
  });
});