import { ComponentFixture, TestBed } from "@angular/core/testing";
import { of, throwError } from "rxjs";

import { CartItemComponent } from "./cart.item";
import { CartService } from "@core/services/cart.service";
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";

describe("CartItemComponent", () => {
  let component: CartItemComponent;
  let fixture: ComponentFixture<CartItemComponent>;
  let cartSvcSpy: jasmine.SpyObj<CartService>;

  const mockCart = { id: "c1", userId: "u1", items: [] } as any;

  beforeEach(async () => {
    cartSvcSpy = jasmine.createSpyObj("CartService", [
      "updateItemQuantity",
      "removeCartItem",
    ]);
    cartSvcSpy.updateItemQuantity.and.returnValue(of(mockCart));
    cartSvcSpy.removeCartItem.and.returnValue(of(mockCart));

    await TestBed.configureTestingModule({
      imports: [CartItemComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: CartService, useValue: cartSvcSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CartItemComponent);
    component = fixture.componentInstance;

    // Provide required inputs
    component.productId = "p1";
    component.productName = "Wireless Mouse";
    component.price = 29.99;
    component.quantity = 2;
    component.availableStock = 10;
    component.imageUrl = "http://example.com/mouse.jpg";

    fixture.detectChanges();
  });

  it("should create and display product details", () => {
    expect(component).toBeTruthy();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector(".item-name")?.textContent?.trim()).toBe(
      "Wireless Mouse"
    );
  });

  it("should render the product image when imageUrl is provided", () => {
    const img = fixture.nativeElement.querySelector("img.thumb") as HTMLImageElement;
    expect(img).toBeTruthy();
    expect(img.src).toBe("http://example.com/mouse.jpg");
  });

  it("should render the placeholder icon when imageUrl is null", () => {
    component.imageUrl = null;
    fixture.detectChanges();
    const placeholder = fixture.nativeElement.querySelector(".thumb-placeholder");
    expect(placeholder).toBeTruthy();
    const img = fixture.nativeElement.querySelector("img.thumb");
    expect(img).toBeNull();
  });

  it("should disable the decrease button when quantity is 1", () => {
    component.quantity = 1;
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll(".qty-btn") as NodeListOf<HTMLButtonElement>;
    const decreaseBtn = buttons[0];
    expect(decreaseBtn.disabled).toBeTrue();
  });

  it("should disable the increase button when quantity equals availableStock", () => {
    component.quantity = 10;
    component.availableStock = 10;
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll(".qty-btn") as NodeListOf<HTMLButtonElement>;
    const increaseBtn = buttons[1];
    expect(increaseBtn.disabled).toBeTrue();
  });

  it("should call cartSvc.updateItemQuantity and emit quantityChange on increase", () => {
    const quantityChangeSpy = jasmine.createSpy("quantityChange");
    component.quantityChange.subscribe(quantityChangeSpy);

    component.updateItemQuantity(3);

    expect(cartSvcSpy.updateItemQuantity).toHaveBeenCalledWith("p1", 3);
    expect(quantityChangeSpy).toHaveBeenCalledWith(3);
  });

  it("should call cartSvc.updateItemQuantity and emit quantityChange on decrease", () => {
    const quantityChangeSpy = jasmine.createSpy("quantityChange");
    component.quantityChange.subscribe(quantityChangeSpy);

    component.updateItemQuantity(1);

    expect(cartSvcSpy.updateItemQuantity).toHaveBeenCalledWith("p1", 1);
    expect(quantityChangeSpy).toHaveBeenCalledWith(1);
  });

  it("should not call updateItemQuantity when quantity < 1", () => {
    component.updateItemQuantity(0);
    expect(cartSvcSpy.updateItemQuantity).not.toHaveBeenCalled();
  });

  it("should not call updateItemQuantity when quantity > availableStock", () => {
    component.availableStock = 10;
    component.updateItemQuantity(11);
    expect(cartSvcSpy.updateItemQuantity).not.toHaveBeenCalled();
  });

  it("should call cartSvc.removeCartItem and emit remove on deleteItem", () => {
    const removeSpy = jasmine.createSpy("remove");
    component.remove.subscribe(removeSpy);

    component.deleteItem();

    expect(cartSvcSpy.removeCartItem).toHaveBeenCalledWith("p1");
    expect(removeSpy).toHaveBeenCalled();
  });

  it("should not emit quantityChange when updateItemQuantity call errors", () => {
    cartSvcSpy.updateItemQuantity.and.returnValue(throwError(() => new Error("err")));
    const quantityChangeSpy = jasmine.createSpy("quantityChange");
    component.quantityChange.subscribe(quantityChangeSpy);

    component.updateItemQuantity(3);

    expect(quantityChangeSpy).not.toHaveBeenCalled();
  });

  it("should not emit remove when removeCartItem call errors", () => {
    cartSvcSpy.removeCartItem.and.returnValue(throwError(() => new Error("err")));
    const removeSpy = jasmine.createSpy("remove");
    component.remove.subscribe(removeSpy);

    component.deleteItem();

    expect(removeSpy).not.toHaveBeenCalled();
  });
});
