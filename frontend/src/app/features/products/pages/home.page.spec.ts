import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { of } from "rxjs";
import { signal } from "@angular/core";

import { HomePage } from "./home.page";
import { ProductService } from "@core/services/product.service";
import { AuthService } from "@core/services/auth.service";
import { Paginated } from "@core/models/paginated.model";
import { Product } from "@core/models/product.model";

describe("HomePage", () => {
  let component: HomePage;
  let fixture: ComponentFixture<HomePage>;
  let productSvcSpy: jasmine.SpyObj<ProductService>;
  let authSvcSpy: jasmine.SpyObj<AuthService>;

  const mockPaginated: Paginated<Product> = {
    content: [
      { id: "p1", name: "Keyboard", description: "Mechanical keyboard", price: 80, quantity: 10, userId: "s1", images: [], createdAt: "2026-01-01" }
    ],
    number: 0,
    size: 8,
    totalElements: 1,
    totalPages: 1
  };

  beforeEach(async () => {
    productSvcSpy = jasmine.createSpyObj("ProductService", ["list"]);
    authSvcSpy = jasmine.createSpyObj("AuthService", [], {
      isAuthenticated: signal(false)
    });

    productSvcSpy.list.and.returnValue(of(mockPaginated));

    await TestBed.configureTestingModule({
      imports: [HomePage],
      providers: [
        provideRouter([]),
        { provide: ProductService, useValue: productSvcSpy },
        { provide: AuthService, useValue: authSvcSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HomePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should load products on init", () => {
    expect(component).toBeTruthy();
    expect(productSvcSpy.list).toHaveBeenCalledWith(1, 8);
    expect(component.items().length).toBe(1);
    expect(component.loading()).toBeFalse();
  });
});
