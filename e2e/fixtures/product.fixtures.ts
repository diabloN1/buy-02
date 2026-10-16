import { test as authTest, expect } from "./auth.fixtures";
import { createApi } from "../helpers/api";

export interface TestProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  categoryId: string;
}

interface ProductFixtures {
  seededProducts: TestProduct[];
}

const CATEGORY_ID = "6acc9c6f9510a9cb21835447";

export const test = authTest.extend<ProductFixtures>({
  seededProducts: [
    async ({ testUsers, sellerAuth }, use) => {
      const api = await createApi(sellerAuth.accessToken);
      const products: TestProduct[] = [];

      try {
        for (let i = 1; i <= 5; i++) {
          const body = {
            name: `E2E Product ${i} ${testUsers.seller.name}`,
            description: `Product ${i} for E2E testing`,
            price: 10 * i,
            quantity: 10,
            categoryId: CATEGORY_ID,
          };

          const id = await api.createProduct(body);

          products.push({ id, ...body });
        }

        await use(products);
      } finally {
        for (const product of products) {
          try {
            await api.deleteProduct(
              testUsers.seller.email,
              testUsers.seller.password,
              product.id,
            );
          } catch (error) {
            console.error(`Failed to delete E2E product ${product.id}:`, error);
          }
        }
      }
    },
    { scope: "worker" },
  ],
});

export { expect };
