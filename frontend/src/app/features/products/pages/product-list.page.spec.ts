import { ComponentFixture, TestBed, fakeAsync, tick } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { of } from "rxjs";

import { ProductListPage } from "./product-list.page";
import { ProductService } from "@core/services/product.service";
import { Paginated } from "@core/models/paginated.model";
import { Product } from "@core/models/product.model";

describe("ProductListPage", () => {
  let component: ProductListPage;
  let fixture: ComponentFixture<ProductListPage>;
  let productSvcSpy: jasmine.SpyObj<ProductService>;

  const mockPaginated: Paginated<Product> = {
    content: [
      { id: "p1", name: "Mouse", description: "Wireless mouse", price: 25, quantity: 20, userId: "s1", images: [], createdAt: "2026-01-01" }
    ],
    number: 0,
    size: 12,
    totalElements: 1,
    totalPages: 1
  };

  beforeEach(async () => {
    productSvcSpy = jasmine.createSpyObj("ProductService", ["list"]);
    productSvcSpy.list.and.returnValue(of(mockPaginated));

    await TestBed.configureTestingModule({
      imports: [ProductListPage],
      providers: [
        provideRouter([]),
        { provide: ProductService, useValue: productSvcSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProductListPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should load products on init", () => {
    expect(component).toBeTruthy();
    expect(productSvcSpy.list).toHaveBeenCalledWith(1, 12, undefined);
    expect(component.items().length).toBe(1);
    expect(component.loading()).toBeFalse();
  });

  it("should trigger search on query change with debounce", fakeAsync(() => {
    component.q.setValue("Mouse");
    tick(300);
    expect(productSvcSpy.list).toHaveBeenCalledWith(1, 12, "Mouse");
  }));
});
