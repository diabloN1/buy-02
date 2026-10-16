import { APIRequestContext, expect, request } from "@playwright/test";

export const API_BASE = "https://localhost:8080/api";

class ApiHelper {
  private context!: APIRequestContext;

  private constructor() {}

  static async create(accessToken?: string): Promise<ApiHelper> {
    const helper = new ApiHelper();

    helper.context = await request.newContext({
      baseURL: API_BASE,
      ignoreHTTPSErrors: true,
      extraHTTPHeaders: accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : {},
    });

    return helper;
  }

  async registerUser(
    name: string,
    email: string,
    password: string,
    role: "USER" | "SELLER" = "USER",
  ) {
    const response = await this.context.post(
      `${API_BASE}/users/auth/register`,
      {
        data: { name, email, password, role },
      },
    );
    const body = await response.json();

    return body;
  }

  async loginUser(email: string, password: string) {
    const response = await this.context.post(`${API_BASE}/users/auth/login`, {
      data: { email, password },
    });
    const body = await response.json();
    expect(
      response.ok(),
      `Login failed: ${body.message || response.statusText()}`,
    ).toBe(true);

    return body;
  }

  async createProduct(payload: {
    name: string;
    description?: string;
    price: number;
    quantity: number;
    categoryId?: string;
  }) {
    const response = await this.context.post(`${API_BASE}/products`, {
      multipart: {
        product: {
          name: "product",
          mimeType: "application/json",
          buffer: Buffer.from(JSON.stringify(payload)),
        },
      },
    });

    const body = await response.json();
    expect(
      response.ok(),
      `Product creation failed: ${body.message || response.statusText()}`,
    ).toBe(true);
    return body.id;
  }

  async deleteProduct(
    sellerEmail: string,
    password: string,
    productId: string,
  ) {
    await this.loginUser(sellerEmail, password);

    const response = await this.context.delete(
      `${API_BASE}/products/${productId}`,
    );

    if (!response.ok()) {
      throw new Error(
        `Product deletion failed: ${response.status()} ${await response.text()}`,
      );
    }
  }
}

export const createApi = ApiHelper.create;
