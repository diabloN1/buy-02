import { test as base, expect } from "./product.fixtures";

type CartFixtures = {
  productPage: import("@playwright/test").Page;
  cartWithItem: import("@playwright/test").Page;
};

export const test = base.extend<CartFixtures>({
  productPage: async ({ userPage, seededProducts }, use) => {
    await userPage.goto("/products");

    const firstCard = userPage.locator("app-product-card").first();

    await expect(firstCard).toBeVisible({ timeout: 10_000 });

    await firstCard.click();

    await expect(userPage).toHaveURL(/\/products\/.+/);

    await use(userPage);
  },

  cartWithItem: async ({ productPage }, use) => {
    const addToCartBtn = productPage.getByText("Add to cart");
    const inCartIndicator = productPage.getByText("View Cart");

    let inCart = false;
    const deadline = Date.now() + 10_000;
    while (Date.now() < deadline) {
      if (await inCartIndicator.isVisible()) {
        inCart = true;
        break;
      }
      if (await addToCartBtn.isVisible()) {
        await productPage.waitForTimeout(150);
        if (await addToCartBtn.isVisible()) {
          break; // stable: cart is empty
        }
      }
      await productPage.waitForTimeout(100);
    }

    if (!inCart) {
      await addToCartBtn.click();
      await expect(
        productPage.getByText("Product added! go to cart for checkout"),
      ).toBeVisible({ timeout: 10_000 });
    }

    await productPage.goto("/cart");
    await expect(productPage.locator("app-cart-item").first()).toBeVisible({
      timeout: 10_000,
    });
    await use(productPage);
  },
});

export { expect } from "@playwright/test";
