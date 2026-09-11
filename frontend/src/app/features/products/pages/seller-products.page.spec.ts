import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { provideRouter } from "@angular/router";
import { of } from "rxjs";

import { signal } from "@angular/core";
import { SellerProductsPage } from "./seller-products.page";
import { ProductService } from "@core/services/product.service";
import { NotificationService } from "@core/services/notification.service";
import { MediaService } from "@core/services/media.service";
import { CurrentUserService } from "@core/services/current-user.service";
import { Paginated } from "@core/models/paginated.model";
import { Product } from "@core/models/product.model";

describe("SellerProductsPage", () => {
  let component: SellerProductsPage;
  let fixture: ComponentFixture<SellerProductsPage>;
  let productSvcSpy: jasmine.SpyObj<ProductService>;
  let notifySpy: jasmine.SpyObj<NotificationService>;
  let mediaSvcSpy: jasmine.SpyObj<MediaService>;
  let currentUserSpy: jasmine.SpyObj<CurrentUserService>;

  const mockPaginated: Paginated<Product> = {
    content: [
      { id: "p1", name: "Prod 1", description: "Desc", price: 10, quantity: 5, userId: "s1", images: [] }
    ],
    number: 0,
    size: 10,
    totalElements: 1,
    totalPages: 1
  };

  beforeEach(async () => {
    productSvcSpy = jasmine.createSpyObj("ProductService", ["listBySeller", "delete"]);
    notifySpy = jasmine.createSpyObj("NotificationService", ["success", "error"]);
    mediaSvcSpy = jasmine.createSpyObj("MediaService", ["getImageUrl"]);
    currentUserSpy = jasmine.createSpyObj("CurrentUserService", ["clear", "load"]);
    (currentUserSpy as any).user = signal({
      id: "s1",
      email: "seller@test.com",
      name: "Seller",
      role: "SELLER"
    });

    productSvcSpy.listBySeller.and.returnValue(of(mockPaginated));

    await TestBed.configureTestingModule({
      imports: [SellerProductsPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ProductService, useValue: productSvcSpy },
        { provide: NotificationService, useValue: notifySpy },
        { provide: MediaService, useValue: mediaSvcSpy },
        { provide: CurrentUserService, useValue: currentUserSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SellerProductsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should load seller products on init", () => {
    expect(component).toBeTruthy();
    expect(productSvcSpy.listBySeller).toHaveBeenCalledWith(1, 10, "s1");
    expect(component.items().length).toBe(1);
  });
});
