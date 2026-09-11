import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter, ActivatedRoute } from "@angular/router";
import { of } from "rxjs";
import { signal } from "@angular/core";

import { ProductDetailsPage } from "./product-details.page";
import { ProductService } from "@core/services/product.service";
import { UserService } from "@core/services/user.service";
import { CurrentUserService } from "@core/services/current-user.service";
import { Product } from "@core/models/product.model";

describe("ProductDetailsPage", () => {
  let component: ProductDetailsPage;
  let fixture: ComponentFixture<ProductDetailsPage>;
  let productSvcSpy: jasmine.SpyObj<ProductService>;
  let userSvcSpy: jasmine.SpyObj<UserService>;
  let currentUserSpy: jasmine.SpyObj<CurrentUserService>;

  const mockProduct: Product = {
    id: "p1",
    name: "Smartphone",
    description: "High end smartphone",
    price: 999.99,
    quantity: 5,
    userId: "u1",
    images: [{ id: "i1", url: "http://example.com/phone.jpg", existing: true }],
    createdAt: "2026-01-01"
  };

  beforeEach(async () => {
    productSvcSpy = jasmine.createSpyObj("ProductService", ["get"]);
    userSvcSpy = jasmine.createSpyObj("UserService", ["getWidget"]);
    currentUserSpy = jasmine.createSpyObj("CurrentUserService", ["clear"], {
      user: signal({ id: "u1", email: "user@test.com", name: "User One", role: "USER" })
    });

    productSvcSpy.get.and.returnValue(of(mockProduct));
    userSvcSpy.getWidget.and.returnValue(of({ id: "u1", name: "User One" }));

    await TestBed.configureTestingModule({
      imports: [ProductDetailsPage],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(new Map([["id", "p1"]]))
          }
        },
        { provide: ProductService, useValue: productSvcSpy },
        { provide: UserService, useValue: userSvcSpy },
        { provide: CurrentUserService, useValue: currentUserSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProductDetailsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should fetch product details and seller widget", () => {
    expect(component).toBeTruthy();
    expect(productSvcSpy.get).toHaveBeenCalledWith("p1");
    expect(component.product()).toEqual(mockProduct);
    expect(component.ownedByMe()).toBeTrue();
  });
});
