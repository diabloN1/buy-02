import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { provideRouter } from "@angular/router";
import { of } from "rxjs";
import { signal } from "@angular/core";

import { SellerDashboardPage } from "./seller-dashboard.page";
import { ProductService } from "@core/services/product.service";
import { CurrentUserService } from "@core/services/current-user.service";
import { Paginated } from "@core/models/paginated.model";
import { Product } from "@core/models/product.model";

describe("SellerDashboardPage", () => {
  let component: SellerDashboardPage;
  let fixture: ComponentFixture<SellerDashboardPage>;
  let productSvcSpy: jasmine.SpyObj<ProductService>;
  let currentUserSpy: jasmine.SpyObj<CurrentUserService>;

  const mockPaginated: Paginated<Product> = {
    content: [
      {
        id: "p1",
        categoryId: "c1",
        name: "Product",
        description: "Desc",
        price: 10,
        quantity: 5,
        userId: "s1",
        images: [],
        createdAt: "2026-01-01",
      },
    ],
    number: 0,
    size: 5,
    totalElements: 1,
    totalPages: 1,
  };

  beforeEach(async () => {
    productSvcSpy = jasmine.createSpyObj("ProductService", ["listBySeller"]);
    currentUserSpy = jasmine.createSpyObj(
      "CurrentUserService",
      ["clear", "load"],
      {
        user: signal({
          id: "s1",
          email: "seller@test.com",
          name: "Seller One",
          role: "SELLER",
        }),
      },
    );

    productSvcSpy.listBySeller.and.returnValue(of(mockPaginated));

    await TestBed.configureTestingModule({
      imports: [SellerDashboardPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ProductService, useValue: productSvcSpy },
        { provide: CurrentUserService, useValue: currentUserSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SellerDashboardPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should load seller statistics and recent products", () => {
    expect(component).toBeTruthy();
    expect(productSvcSpy.listBySeller).toHaveBeenCalledWith(1, 50, "s1");
    expect(component.items().length).toBe(1);
    expect(component.loading()).toBeFalse();
  });
});
