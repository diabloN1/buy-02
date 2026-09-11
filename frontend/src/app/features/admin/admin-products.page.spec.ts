import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { of } from "rxjs";

import { AdminProductsPage } from "./admin-products.page";
import { ProductService } from "@core/services/product.service";
import { NotificationService } from "@core/services/notification.service";
import { MediaService } from "@core/services/media.service";
import { Paginated } from "@core/models/paginated.model";
import { Product } from "@core/models/product.model";

describe("AdminProductsPage", () => {
  let component: AdminProductsPage;
  let fixture: ComponentFixture<AdminProductsPage>;
  let productSvcSpy: jasmine.SpyObj<ProductService>;
  let notifySpy: jasmine.SpyObj<NotificationService>;
  let mediaSvcSpy: jasmine.SpyObj<MediaService>;

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
    productSvcSpy = jasmine.createSpyObj("ProductService", ["list", "delete"]);
    notifySpy = jasmine.createSpyObj("NotificationService", ["success", "error"]);
    mediaSvcSpy = jasmine.createSpyObj("MediaService", ["getImageUrl"]);

    productSvcSpy.list.and.returnValue(of(mockPaginated));

    await TestBed.configureTestingModule({
      imports: [AdminProductsPage],
      providers: [
        provideRouter([]),
        { provide: ProductService, useValue: productSvcSpy },
        { provide: NotificationService, useValue: notifySpy },
        { provide: MediaService, useValue: mediaSvcSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminProductsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should load products on init", () => {
    expect(component).toBeTruthy();
    expect(productSvcSpy.list).toHaveBeenCalledWith(1, 10);
    expect(component.items().length).toBe(1);
  });
});
