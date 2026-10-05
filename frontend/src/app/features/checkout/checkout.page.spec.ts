import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import { CheckoutWizardComponent } from "./checkout.page";
import { CartService } from "@core/services/cart.service";
import { OrderService } from "@core/services/order.service";
import { NotificationService } from "@core/services/notification.service";
import { of } from "rxjs";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { ActivatedRoute } from "@angular/router";

describe("CheckoutWizardComponent", () => {
  let component: CheckoutWizardComponent;
  let fixture: ComponentFixture<CheckoutWizardComponent>;

  let cartService: jasmine.SpyObj<CartService>;
  let orderService: jasmine.SpyObj<OrderService>;
  let notificationService: jasmine.SpyObj<NotificationService>;

  const cart = {
    items: [
      {
        productId: "p1",
        productName: "Product 1",
        price: 100,
        quantity: 2,
      },
      {
        productId: "p2",
        productName: "Product 2",
        price: 50,
        quantity: 1,
      },
    ],
  } as any;

  const validAddress = {
    fullName: "John Doe",
    street: "123 Main Street",
    city: "Oujda",
    zipCode: "60000",
    country: "Morocco",
    phone: "0612345678",
  };

  beforeEach(async () => {
    cartService = jasmine.createSpyObj("CartService", ["getCart"]);
    orderService = jasmine.createSpyObj("OrderService", ["createOrder"]);
    notificationService = jasmine.createSpyObj("NotificationService", [
      "success",
    ]);

    cartService.getCart.and.returnValue(of(cart));
    orderService.createOrder.and.returnValue(of({ id: "order-123" }));

    await TestBed.configureTestingModule({
      imports: [CheckoutWizardComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: CartService, useValue: cartService },
        { provide: OrderService, useValue: orderService },
        { provide: NotificationService, useValue: notificationService },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              data: {},
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CheckoutWizardComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should load the cart on initialization", () => {
    expect(cartService.getCart).toHaveBeenCalled();
    expect(component.cart()).toEqual(cart);
  });

  it("should calculate the cart total", () => {
    expect(component.getCartTotal(cart)).toBe(250);
  });

  it("should calculate the cart item count", () => {
    expect(component.getCartItemCount(cart)).toBe(3);
  });

  it("should not place an order when cart is null", () => {
    component.cart.set(null);

    component.placeOrder({
      next: jasmine.createSpy("next"),
    });

    expect(orderService.createOrder).not.toHaveBeenCalled();
  });

  it("should not place an order when cart is empty", () => {
    component.cart.set({ items: [] } as any);

    component.placeOrder({
      next: jasmine.createSpy("next"),
    });

    expect(orderService.createOrder).not.toHaveBeenCalled();
  });

  it("should create an order with the cart total", () => {
    component.addressForm.setValue(validAddress);

    component.placeOrder({
      next: jasmine.createSpy("next"),
    });

    expect(orderService.createOrder).toHaveBeenCalledWith({
      shippingAddress: validAddress,
      paymentMethod: "pay_on_delivery",
      totalAmount: 250,
    });
  });

  it("should set the order id after placing an order", () => {
    component.addressForm.setValue(validAddress);

    component.placeOrder({
      next: jasmine.createSpy("next"),
    });

    expect(component.orderId()).toBe("order-123");
  });

  it("should show a success notification after placing an order", () => {
    component.addressForm.setValue(validAddress);

    component.placeOrder({
      next: jasmine.createSpy("next"),
    });

    expect(notificationService.success).toHaveBeenCalledWith(
      "Order #order-123 placed successfully!",
    );
  });

  it("should advance the stepper after placing an order", (done) => {
    component.addressForm.setValue(validAddress);

    const stepper = {
      next: jasmine.createSpy("next"),
    };

    component.placeOrder(stepper);

    setTimeout(() => {
      expect(stepper.next).toHaveBeenCalled();
      done();
    }, 600);
  });

  it("should validate required address fields", () => {
    component.addressForm.reset();

    expect(component.addressForm.valid).toBeFalse();
  });

  it("should reject a short full name", () => {
    component.addressForm.patchValue({
      fullName: "A",
    });

    expect(component.addressForm.get("fullName")?.valid).toBeFalse();
  });

  it("should reject an invalid zip code", () => {
    component.addressForm.patchValue({
      zipCode: "@@@",
    });

    expect(component.addressForm.get("zipCode")?.valid).toBeFalse();
  });

  it("should accept a valid zip code", () => {
    component.addressForm.patchValue({
      zipCode: "60000",
    });

    expect(component.addressForm.get("zipCode")?.valid).toBeTrue();
  });
});