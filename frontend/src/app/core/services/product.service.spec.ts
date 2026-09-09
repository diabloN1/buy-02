import { TestBed } from "@angular/core/testing";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { provideHttpClient } from "@angular/common/http";

import { ProductService } from "./product.service";
import { Product } from "@core/models/product.model";
import { Paginated } from "@core/models/paginated.model";
import { API } from "@core/config/api.config";

describe("ProductService", () => {
  let service: ProductService;
  let httpMock: HttpTestingController;

  const mockProduct: Product = {
    id: "prod-1",
    name: "Wireless Mouse",
    description: "Ergonomic mouse",
    price: 29.99,
    quantity: 10,
    userId: "seller-1",
    images: [],
    createdAt: "2026-01-01"
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ProductService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(ProductService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it("should list products with pagination", () => {
    const mockResponse: Paginated<Product> = {
      content: [mockProduct],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 10
    };

    service.list(1, 10, "mouse").subscribe((res) => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpMock.expectOne((request) =>
      request.url === API.base + API.products.root &&
      request.params.get("page") === "0" &&
      request.params.get("size") === "10" &&
      request.params.get("q") === "mouse"
    );
    expect(req.request.method).toBe("GET");
    req.flush(mockResponse);
  });

  it("should get product by id", () => {
    service.get("prod-1").subscribe((p) => {
      expect(p).toEqual(mockProduct);
    });

    const req = httpMock.expectOne(API.base + API.products.byId("prod-1"));
    expect(req.request.method).toBe("GET");
    req.flush(mockProduct);
  });

  it("should delete product by id", () => {
    service.delete("prod-1").subscribe();

    const req = httpMock.expectOne(API.base + API.products.byId("prod-1"));
    expect(req.request.method).toBe("DELETE");
    req.flush(null);
  });
});
