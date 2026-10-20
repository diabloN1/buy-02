import { test as base, Page } from "@playwright/test";
import { createApi } from "../helpers/api";
import { randomUUID } from "crypto";
import { TestProduct } from "./product.fixtures";

interface AuthFixtures {
  userPage: Page;

  sellerPage: Page;
}

export interface AuthWorkerFixtures {
  testUsers: {
    user: {
      email: string;
      password: string;
      name: string;
    };
    seller: {
      email: string;
      password: string;
      name: string;
    };
  };

  userAuth: {
    accessToken: string;
  };

  sellerAuth: {
    accessToken: string;
  };

  seededProducts: TestProduct[];
}

export const test = base.extend<AuthFixtures, AuthWorkerFixtures>({
  testUsers: [
    async ({}, use) => {
      const runId = randomUUID().substring(0, 6);

      await use({
        user: {
          email: `buyer_${runId}@test.com`,
          password: "Test123!",
          name: `Buyer ${runId}`,
        },

        seller: {
          email: `seller_${runId}@test.com`,
          password: "Test123!",
          name: `Seller ${runId}`,
        },
      });
    },

    {
      scope: "worker",
    },
  ],

  userAuth: [
    async ({ testUsers }, use) => {
      const auth = await authenticate(testUsers, "USER");

      await use({ accessToken: auth.accessToken });
    },
    { scope: "worker" },
  ],

  sellerAuth: [
    async ({ testUsers }, use) => {
      const auth = await authenticate(testUsers, "SELLER");

      await use({ accessToken: auth.accessToken });
    },
    { scope: "worker" },
  ],

  // Authenticated page as USER.
  userPage: async ({ browser, userAuth }, use) => {
    const context = await browser.newContext({
      ignoreHTTPSErrors: true,
    });

    const page = await context.newPage();

    await page.addInitScript(
      ({ key, value }) => {
        localStorage.setItem(key, value);
      },
      { key: "mp.token", value: userAuth.accessToken },
    );

    await use(page);

    await context.close();
  },

  // Authenticated page as SELLER.
  sellerPage: async ({ browser, sellerAuth }, use) => {
    const context = await browser.newContext({
      ignoreHTTPSErrors: true,
    });

    const page = await context.newPage();

    const token = sellerAuth.accessToken;

    await page.addInitScript(
      ({ key, value }) => {
        localStorage.setItem(key, value);
      },
      {
        key: "mp.token",
        value: token,
      },
    );

    await use(page);

    await context.close();
  },
});

type UserRole = "USER" | "SELLER";

async function authenticate(
  testUsers: AuthWorkerFixtures["testUsers"],
  role: UserRole,
) {
  const api = await createApi();

  const credentials = role === "SELLER" ? testUsers.seller : testUsers.user;

  const { name, email, password } = credentials;

  let auth = await api.registerUser(name, email, password, role);

  if (!auth.accessToken) {
    console.warn("Couldn't register user and got response: ", auth);
    auth = await api.loginUser(email, password);
  }

  if (!auth.accessToken) {
    throw new Error(`Authentication failed for ${email}`);
  }

  return auth;
}

export { expect } from "@playwright/test";
