import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { of, throwError } from "rxjs";

import { CartPage } from "./cart.page";
import { CartService } from "@core/services/cart.service";
import { Cart } from "@core/models/cart.model";
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";

describe("CartPage", () => {
  let component: CartPage;
  let fixture: ComponentFixture<CartPage>;
  let cartSvcSpy: jasmine.SpyObj<CartService>;

  const mockCart: Cart = {
    id: "c1",
    userId: "u1",
    items: [
      {
        productId: "p1",
        productName: "Wireless Mouse",
        price: 29.99,
        quantity: 2,
        imageUrl: "http://example.com/mouse.jpg",
        availableStock: 10,
      },
      {
        productId: "p2",
        productName: "Mechanical Keyboard",
        price: 79.99,
        quantity: 1,
        imageUrl: "http://example.com/keyboard.jpg",
        availableStock: 5,
      },
    ],
  };

  beforeEach(async () => {
    cartSvcSpy = jasmine.createSpyObj("CartService", [
      "getCart",
      "clearCart",
    ]);
    cartSvcSpy.getCart.and.returnValue(of(mockCart));
    cartSvcSpy.clearCart.and.returnValue(of(undefined));

    await TestBed.configureTestingModule({
      imports: [CartPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: CartService, useValue: cartSvcSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CartPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create and load the cart on init", () => {
    expect(component).toBeTruthy();
    expect(cartSvcSpy.getCart).toHaveBeenCalled();
    expect(component.cart()).toEqual(mockCart);
  });

  it("should compute itemCount as the sum of all item quantities", () => {
    // 2 + 1 = 3
    expect(component.itemCount()).toBe(3);
  });

  it("should compute cartTotal as sum of (price × quantity) for all items", () => {
    // (29.99 * 2) + (79.99 * 1) = 59.98 + 79.99 = 139.97
    expect(component.cartTotal()).toBeCloseTo(139.97, 2);
  });

  it("should show loading spinner while cart is undefined", () => {
    // Reset to undefined before detectChanges
    component.cart.set(undefined);
    fixture.detectChanges();
    const spinner = fixture.nativeElement.querySelector("app-loading-spinner");
    expect(spinner).toBeTruthy();
  });

  it("should show empty state when cart has no items", () => {
    component.cart.set({ ...mockCart, items: [] });
    fixture.detectChanges();
    const emptyState = fixture.nativeElement.querySelector(".empty-state");
    expect(emptyState).toBeTruthy();
  });

  it("should render one app-cart-item per cart item", () => {
    const items = fixture.nativeElement.querySelectorAll("app-cart-item");
    expect(items.length).toBe(2);
  });

  it("should display the total price in the summary", () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const totalPriceEl = compiled.querySelector(".total-price");
    expect(totalPriceEl?.textContent).toContain("139.97");
  });

  it("should update quantity for a specific item via updateItemQuantity", () => {
    component.updateItemQuantity("p1", 5);
    const updatedItem = component.cart()!.items.find((i) => i.productId === "p1");
    expect(updatedItem?.quantity).toBe(5);
    // Other item should be unchanged
    const otherItem = component.cart()!.items.find((i) => i.productId === "p2");
    expect(otherItem?.quantity).toBe(1);
  });

  it("should remove a specific item via removeItem", () => {
    component.removeItem("p1");
    const remaining = component.cart()!.items;
    expect(remaining.length).toBe(1);
    expect(remaining[0].productId).toBe("p2");
  });

  it("should clear cart items and call cartSvc.clearCart", () => {
    component.clearCart();
    expect(cartSvcSpy.clearCart).toHaveBeenCalled();
    expect(component.cart()!.items.length).toBe(0);
  });

  it("should keep cart items intact when clearCart call errors", () => {
    cartSvcSpy.clearCart.and.returnValue(throwError(() => new Error("err")));
    component.clearCart();
    expect(component.cart()!.items.length).toBe(2);
  });

  it("should compute itemCount as 0 for an empty cart", () => {
    component.cart.set({ ...mockCart, items: [] });
    expect(component.itemCount()).toBe(0);
  });

  it("should compute cartTotal as 0 for an empty cart", () => {
    component.cart.set({ ...mockCart, items: [] });
    expect(component.cartTotal()).toBe(0);
  });

  it("should not crash updateItemQuantity when cart is null", () => {
    component.cart.set(null);
    expect(() => component.updateItemQuantity("p1", 3)).not.toThrow();
    expect(component.cart()).toBeNull();
  });

  it("should not crash removeItem when cart is null", () => {
    component.cart.set(null);
    expect(() => component.removeItem("p1")).not.toThrow();
    expect(component.cart()).toBeNull();
  });
});
