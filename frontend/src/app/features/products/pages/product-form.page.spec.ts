import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ActivatedRoute, provideRouter } from "@angular/router";

import { ProductFormPage } from "./product-form.page";
import { ProductService } from "@core/services/product.service";
import { NotificationService } from "@core/services/notification.service";
import { MediaService } from "@core/services/media.service";
import { CurrentUserService } from "@core/services/current-user.service";

describe("ProductFormPage", () => {
  let component: ProductFormPage;
  let fixture: ComponentFixture<ProductFormPage>;
  let productSvcSpy: jasmine.SpyObj<ProductService>;
  let notifySpy: jasmine.SpyObj<NotificationService>;
  let mediaSvcSpy: jasmine.SpyObj<MediaService>;
  let currentUserSpy: jasmine.SpyObj<CurrentUserService>;

  beforeEach(async () => {
    productSvcSpy = jasmine.createSpyObj("ProductService", ["get", "create", "update"]);
    notifySpy = jasmine.createSpyObj("NotificationService", ["success", "error"]);
    mediaSvcSpy = jasmine.createSpyObj("MediaService", ["getImageUrl"]);
    currentUserSpy = jasmine.createSpyObj("CurrentUserService", ["clear", "load"]);

    mediaSvcSpy.getImageUrl.and.callFake((id: string) => `http://example.com/${id}`);

    await TestBed.configureTestingModule({
      imports: [ProductFormPage],
      providers: [
        provideRouter([]),
        { provide: ProductService, useValue: productSvcSpy },
        { provide: NotificationService, useValue: notifySpy },
        { provide: MediaService, useValue: mediaSvcSpy },
        { provide: CurrentUserService, useValue: currentUserSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: { get: () => null } }
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProductFormPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should initialize empty form in create mode", () => {
    expect(component).toBeTruthy();
    expect(component.id()).toBeNull();
    expect(component.form.valid).toBeFalse();
  });
});
