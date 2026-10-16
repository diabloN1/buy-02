import { randomUUID } from "crypto";
import { test, expect } from "../fixtures/auth.fixtures";

test.describe("Authentication", () => {
  test("should allow user registration", async ({
    userPage,
    testUsers,
  }) => {
    await userPage.goto("/auth/register");

    await userPage.fill('input[formControlName="name"]', testUsers.user.name);
    await userPage.fill('input[formControlName="email"]', `buyer_${randomUUID().substring(0, 6)}@test.com`);
    await userPage.fill('input[formControlName="password"]', testUsers.user.password);
    
    await userPage.getByText("Client — Browse & Buy products").click();
    await userPage
      .getByRole("listbox", { name: "Account role" })
      .getByText("Client — Browse & Buy products")
      .click();

    await userPage.getByRole("button", { name: "Create Account" }).click();

    await expect(userPage).toHaveURL("/");
    await expect(
      userPage.locator("text=Account created successfully!"),
    ).toBeVisible();
  });

  test("should allow login with valid credentials", async ({
    userPage,
    testUsers,
  }) => {
    await userPage.goto("/auth/login");

    await userPage.fill('input[formControlName="email"]', testUsers.user.email);
    await userPage.fill(
      'input[formControlName="password"]',
      testUsers.user.password,
    );

    await expect(userPage.getByRole("button", { name: "Sign in to Marketplace" })).toBeEnabled();
    await userPage.getByRole("button", { name: "Sign in to Marketplace" }).click();

    await expect(userPage).toHaveURL("/");
    await expect(userPage.locator("text=Welcome back!")).toBeVisible();
  });

  test("should show error for invalid login", async ({ userPage }) => {
    await userPage.goto("/auth/login");

    await userPage.fill('input[formControlName="email"]', "wrong@example.com");
    await userPage.fill('input[formControlName="password"]', "wrongpass");

    await userPage.getByRole("button", { name: "Sign in to Marketplace" }).click();

    await expect(userPage.getByText('Invalid email or password')).toBeVisible();
    await expect(userPage).toHaveURL("/auth/login");
  });
});
