import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from "@angular/core/testing";
import { provideRouter, ActivatedRoute } from "@angular/router";
import { of } from "rxjs";
import { signal, WritableSignal } from "@angular/core";

import { ProductDetailsPage } from "./product-details.page";
import { ProductService } from "@core/services/product.service";
import { UserService } from "@core/services/user.service";
import { CurrentUserService } from "@core/services/current-user.service";
import { CartService } from "@core/services/cart.service";
import { NotificationService } from "@core/services/notification.service";
import { Product } from "@core/models/product.model";
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";

describe("ProductDetailsPage", () => {
  let component: ProductDetailsPage;
  let fixture: ComponentFixture<ProductDetailsPage>;
  let productSvcSpy: jasmine.SpyObj<ProductService>;
  let userSvcSpy: jasmine.SpyObj<UserService>;
  let currentUserSpy: jasmine.SpyObj<CurrentUserService>;
  let cartSvcSpy: jasmine.SpyObj<CartService>;
  let notificationSvcSpy: jasmine.SpyObj<NotificationService>;

  // Keep a reference to the signal so we can call .set() on it directly
  let mockUserSignal: WritableSignal<any>;

  const mockProduct: Product = {
    id: "p1",
    name: "Smartphone",
    description: "High end smartphone",
    price: 999.99,
    quantity: 5,
    userId: "u1", // Owned by "u1"
    images: [{ id: "i1", url: "http://example.com/phone.jpg", existing: true }],
    createdAt: "2026-01-01",
  };

  // Mock Cart return object
  const mockCart = {
    id: "c1",
    userId: "u1",
    items: [],
  } as any;

  beforeEach(async () => {
    productSvcSpy = jasmine.createSpyObj("ProductService", ["get"]);
    userSvcSpy = jasmine.createSpyObj("UserService", ["getWidget"]);
    cartSvcSpy = jasmine.createSpyObj("CartService", [
      "getItemQuantity",
      "addToCart",
      "updateItemQuantity",
    ]);
    notificationSvcSpy = jasmine.createSpyObj("NotificationService", [
      "success",
      "error",
    ]);

    mockUserSignal = signal({
      id: "u1",
      email: "user@test.com",
      name: "User One",
      role: "USER",
    });

    currentUserSpy = jasmine.createSpyObj("CurrentUserService", ["clear"], {
      user: mockUserSignal, // Provide the signal to the spy
    });

    // Default return values
    productSvcSpy.get.and.returnValue(of(mockProduct));
    userSvcSpy.getWidget.and.returnValue(of({ id: "u1", name: "User One" }));
    cartSvcSpy.getItemQuantity.and.returnValue(of(0));
    cartSvcSpy.addToCart.and.returnValue(of(mockCart));
    cartSvcSpy.updateItemQuantity.and.returnValue(of(mockCart));

    await TestBed.configureTestingModule({
      imports: [ProductDetailsPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(new Map([["id", "p1"]])),
          },
        },
        { provide: ProductService, useValue: productSvcSpy },
        { provide: UserService, useValue: userSvcSpy },
        { provide: CurrentUserService, useValue: currentUserSpy },
        { provide: CartService, useValue: cartSvcSpy },
        { provide: NotificationService, useValue: notificationSvcSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductDetailsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should fetch product details and seller widget", () => {
    expect(component).toBeTruthy();
    expect(productSvcSpy.get).toHaveBeenCalledWith("p1");
    expect(component.product()).toEqual(mockProduct);
  });

  it("should fetch cart quantity on init (via effect) if user and product exist", fakeAsync(() => {
    // Flush pending microtasks because signals/effects resolve asynchronously
    tick();
    expect(cartSvcSpy.getItemQuantity).toHaveBeenCalledWith("p1");
  }));

  it("should determine ownership correctly", () => {
    // Current user is 'u1', Product is 'u1'
    expect(component.ownedByMe()).toBeTrue();
    expect(component.ableToBuy()).toBeFalse(); // Owner cannot buy their own product
  });

  it("should allow buying if product is not owned by the current user and is in stock", () => {
    // Switch the current logged-in user to a buyer ('u2') using our stored writable signal
    mockUserSignal.set({
      id: "u2",
      email: "buyer@test.com",
      name: "Buyer",
      role: "USER",
    });
    fixture.detectChanges();

    expect(component.ownedByMe()).toBeFalse();
    expect(component.ableToBuy()).toBeTrue();
  });

  it("should add item to cart and trigger success toast", () => {
    component.quantity.set(2);
    component.addToCart();

    expect(cartSvcSpy.addToCart).toHaveBeenCalledWith({
      productId: "p1",
      quantity: 2,
    });
    expect(component.cartQuantity()).toBe(2);
    expect(notificationSvcSpy.success).toHaveBeenCalledWith(
      "Product added! go to cart for checkout",
    );
  });

  it("should update item quantity in cart and trigger success toast", () => {
    component.quantity.set(4);
    component.updateCart();

    expect(cartSvcSpy.updateItemQuantity).toHaveBeenCalledWith("p1", 4);
    expect(component.cartQuantity()).toBe(4);
    expect(notificationSvcSpy.success).toHaveBeenCalledWith("Cart updated!");
  });
});
