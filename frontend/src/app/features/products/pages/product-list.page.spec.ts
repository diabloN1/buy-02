import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { of } from "rxjs";

import { ProductListPage } from "./product-list.page";
import { ProductService } from "@core/services/product.service";
import { Paginated } from "@core/models/paginated.model";
import { Product } from "@core/models/product.model";
import { CategoryService } from "@core/services/category.service";

describe("ProductListPage", () => {
  let component: ProductListPage;
  let fixture: ComponentFixture<ProductListPage>;
  let productSvcSpy: jasmine.SpyObj<ProductService>;
  let categoryServiceSpy: jasmine.SpyObj<CategoryService>;

  const mockPaginated: Paginated<Product> = {
    content: [
      {
        id: "p1",
        name: "Mouse",
        description: "Wireless mouse",
        price: 25,
        quantity: 20,
        userId: "s1",
        categoryId: "c1",
        images: [],
        createdAt: "2026-01-01",
      },
    ],
    number: 0,
    size: 12,
    totalElements: 1,
    totalPages: 1,
  };

  beforeEach(async () => {
    categoryServiceSpy = jasmine.createSpyObj("CategoryService", ["getAll"]);

    productSvcSpy = jasmine.createSpyObj("ProductService", ["list", "search"]);

    productSvcSpy.list.and.returnValue(of(mockPaginated));
    productSvcSpy.search.and.returnValue(of(mockPaginated));
    categoryServiceSpy.getAll.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [ProductListPage],
      providers: [
        provideRouter([]),
        { provide: ProductService, useValue: productSvcSpy },
        { provide: CategoryService, useValue: categoryServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductListPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should load products on init", () => {
    expect(component).toBeTruthy();

    expect(productSvcSpy.search).toHaveBeenCalled();

    expect(component.items().length).toBe(1);
    expect(component.loading()).toBeFalse();
  });
});
