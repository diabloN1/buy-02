import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormControl, FormGroup } from "@angular/forms";
import { provideRouter } from "@angular/router";

import { ReviewOrderStepComponent } from "./review-order-step.component";
import { Cart } from "@core/models/cart.model";

describe("ReviewOrderStepComponent", () => {
  let component: ReviewOrderStepComponent;
  let fixture: ComponentFixture<ReviewOrderStepComponent>;

  const cart = {
    id: "cart-1",
    userId: "user-1",
    items: [
      {
        productId: "product-1",
        productName: "Laptop",
        price: 1000,
        quantity: 2,
        imageUrl: "https://example.com/laptop.jpg",
        availableStock: 10,
      },
      {
        productId: "product-2",
        productName: "Mouse",
        price: 50,
        quantity: 3,
        imageUrl: "",
        availableStock: 20,
      },
    ],
  } as Cart;

  const addressForm = new FormGroup({
    fullName: new FormControl("John Doe"),
    street: new FormControl("123 Main Street"),
    city: new FormControl("Oujda"),
    zipCode: new FormControl("60000"),
    country: new FormControl("Morocco"),
    phone: new FormControl("+212600000000"),
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReviewOrderStepComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ReviewOrderStepComponent);
    component = fixture.componentInstance;

    component.cart = cart;
    component.addressForm = addressForm;

    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should display the shipping address", () => {
    const element: HTMLElement = fixture.nativeElement;

    expect(element.querySelector(".review-address")?.textContent).toContain(
      "John Doe",
    );
    expect(element.querySelector(".review-address")?.textContent).toContain(
      "123 Main Street",
    );
    expect(element.querySelector(".review-address")?.textContent).toContain(
      "Oujda",
    );
    expect(element.querySelector(".review-address")?.textContent).toContain(
      "60000",
    );
    expect(element.querySelector(".review-address")?.textContent).toContain(
      "Morocco",
    );
    expect(element.querySelector(".review-address")?.textContent).toContain(
      "+212600000000",
    );
  });

  it("should display all cart items", () => {
    const items = fixture.nativeElement.querySelectorAll(".review-item");

    expect(items.length).toBe(2);

    expect(items[0].textContent).toContain("Laptop");
    expect(items[0].textContent).toContain("Qty: 2");

    expect(items[1].textContent).toContain("Mouse");
    expect(items[1].textContent).toContain("Qty: 3");
  });

  it("should display the product image when imageUrl is available", () => {
    const image = fixture.nativeElement.querySelector(
      ".review-item img",
    ) as HTMLImageElement;

    expect(image).toBeTruthy();
    expect(image.src).toContain("laptop.jpg");
  });

  it("should display the placeholder when imageUrl is missing", () => {
    const placeholders =
      fixture.nativeElement.querySelectorAll(".image-placeholder");

    expect(placeholders.length).toBe(1);
    expect(placeholders[0].textContent.trim()).toBe("inventory_2");
  });

  it("should display the item prices", () => {
    const prices = fixture.nativeElement.querySelectorAll(".review-item-price");

    expect(prices[0].textContent).toContain("$2,000.00");
    expect(prices[1].textContent).toContain("$150.00");
  });

  it("should calculate the cart total", () => {
    expect(component.getCartTotal(cart)).toBe(2150);
  });

  it("should calculate the total item count", () => {
    expect(component.getCartItemCount(cart)).toBe(5);
  });

  it("should display the cart total", () => {
    const total = fixture.nativeElement.querySelector(".total-price");

    expect(total.textContent).toContain("$2,150.00");
  });

  it("should display the total item count", () => {
    const total = fixture.nativeElement.querySelector(".review-total");

    expect(total.textContent).toContain("Total (5)");
  });

  it("should emit previous when Edit address is clicked", () => {
    spyOn(component.previous, "emit");

    const button = fixture.nativeElement.querySelector(
      ".review-section button",
    ) as HTMLButtonElement;

    button.click();

    expect(component.previous.emit).toHaveBeenCalled();
  });

  it("should emit previous when Back is clicked", () => {
    spyOn(component.previous, "emit");

    const buttons = fixture.nativeElement.querySelectorAll(".actions button");

    (buttons[0] as HTMLButtonElement).click();

    expect(component.previous.emit).toHaveBeenCalled();
  });

  it("should emit placeOrder when Place order is clicked", () => {
    spyOn(component.placeOrder, "emit");

    const buttons = fixture.nativeElement.querySelectorAll(".actions button");

    (buttons[1] as HTMLButtonElement).click();

    expect(component.placeOrder.emit).toHaveBeenCalled();
  });

  it("should have a link to the cart", () => {
    const link = fixture.nativeElement.querySelector(
      '.actions a[routerLink="/cart"]',
    ) as HTMLAnchorElement;

    expect(link).toBeTruthy();
    expect(link.textContent).toContain("Modify cart");
    expect(link.getAttribute("href")).toBe("/cart");
  });

  it("should render the correct action buttons", () => {
    const buttons = fixture.nativeElement.querySelectorAll(".actions button");
    const links = fixture.nativeElement.querySelectorAll(".actions a");

    expect(buttons.length).toBe(2);
    expect(buttons[0].textContent).toContain("Back");
    expect(buttons[1].textContent).toContain("Place order");

    expect(links.length).toBe(1);
    expect(links[0].textContent).toContain("Modify cart");
  });
});
