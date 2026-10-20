import { test, expect } from "../fixtures/cart.fixtures";

/**
 * Checkout wizard tests (Pay on Delivery)
 * - Shipping address form validation
 * - Review order step
 * - Place order with Pay on Delivery
 * - Order confirmation
 */
test.describe("Checkout - Pay on Delivery", () => {
  test("should complete checkout with pay on delivery", async ({
    cartWithItem,
  }) => {
    await cartWithItem.goto("/checkout");

    // Step 1: Shipping address
    await cartWithItem.fill('[formControlName="fullName"]', "Test Buyer");
    await cartWithItem.fill('[formControlName="street"]', "123 Test Street");
    await cartWithItem.fill('[formControlName="city"]', "Test City");
    await cartWithItem.fill('[formControlName="zipCode"]', "10001");
    await cartWithItem.fill('[formControlName="country"]', "Morocco");

    await cartWithItem.getByRole('textbox', { name: 'Number' }).fill("0682618907");

    await cartWithItem.locator('button:has-text("Review order")').click();

    // Step 2: Review order
    await expect(cartWithItem.locator('h3:has-text("Order items")')).toBeVisible();
    await expect(cartWithItem.locator("text=Shipping to")).toBeVisible();

    await cartWithItem.locator('button:has-text("Place order")').click();

    // Step 3: Confirmation
    await expect(cartWithItem.locator(".confirmation")).toBeVisible();
    await expect(cartWithItem.locator("h2")).toContainText(/placed|success/i);
  });

  test("should navigate back between steps", async ({ cartWithItem }) => {
    await cartWithItem.goto("/checkout");

    await cartWithItem.fill('[formControlName="fullName"]', "Test");
    await cartWithItem.fill('[formControlName="street"]', "123 Test St");
    await cartWithItem.fill('[formControlName="city"]', "Test");
    await cartWithItem.fill('[formControlName="zipCode"]', "10001");
    await cartWithItem.fill('[formControlName="country"]', "Morocco");
    await cartWithItem.getByRole('textbox', { name: 'Number' }).fill("0682618907");


    await cartWithItem.click('button:has-text("Review order")');

    await expect(
      cartWithItem.locator('button:has-text("Edit address")'),
    ).toBeVisible();
    await cartWithItem.click('button:has-text("Edit address")');

    await expect(cartWithItem.locator('[formControlName="fullName"]')).toHaveValue(
      "Test",
    );
  });

  test("should show back to cart from checkout", async ({ cartWithItem }) => {
    await cartWithItem.goto("/checkout");

    const backBtn = cartWithItem.getByRole('link', { name: 'Back to cart' });
    await expect(backBtn).toBeVisible();
    await backBtn.click();

    await expect(cartWithItem.locator("h1")).toContainText(/cart/i);
  });

  test("should show empty cart state at checkout", async ({ userPage }) => {
    await userPage.goto("/cart");
    const clearBtn = userPage.locator('button:has-text("Clear cart")');
    if ((await clearBtn.count()) > 0) {
      await clearBtn.click();
    }

    await userPage.goto("/checkout");

    await expect(userPage.locator("text=Your cart is empty")).toBeVisible();
    await expect(
      userPage.locator('a:has-text("Browse products")'),
    ).toBeVisible();
  });
});
