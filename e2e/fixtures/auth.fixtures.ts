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

  sellerAuth: [
    async ({ testUsers }, use) => {
      const api = await createApi();

      const { name, email, password } = testUsers.seller;

      let auth = await api.registerUser(name, email, password, "SELLER");

      if (!auth.accessToken) {
        auth = await api.loginUser(email, password);
      }

      if (!auth.accessToken) {
        throw new Error(`Authentication failed for ${email}`);
      }

      await use({
        accessToken: auth.accessToken,
      });
    },
    { scope: "worker" },
  ],
  
  /**
   * Authenticated page as USER.
   */
  userPage: async ({ browser, testUsers }, use) => {
    const context = await browser.newContext({
      ignoreHTTPSErrors: true,
    });

    const page = await context.newPage();

    // Register USER or log in if already registered.
    const api = await createApi();

    const { name, email, password } = testUsers.user;

    let auth = await api.registerUser(name, email, password, "USER");

    if (!auth.accessToken) {
      auth = await api.loginUser(email, password);
    }

    const token = auth.accessToken;

    if (!token) {
      throw new Error(`Authentication failed for ${email}: no access token`);
    }

    // Inject JWT into localStorage before the application loads.
    await page.addInitScript(
      ({ key, value }) => {
        localStorage.setItem(key, value);
      },
      { key: "mp.token", value: token },
    );

    await use(page);

    await context.close();
  },

  /**
   * Authenticated page as SELLER.
   */
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

/**
 * Re-export expect so tests can import everything from this fixture.
 */
export { expect } from "@playwright/test";
