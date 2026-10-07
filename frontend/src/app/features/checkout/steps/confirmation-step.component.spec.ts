import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { ConfirmationStepComponent } from "./confirmation-step.component";

describe("ConfirmationStepComponent", () => {
  let component: ConfirmationStepComponent;
  let fixture: ComponentFixture<ConfirmationStepComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmationStepComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmationStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should have a null order id by default", () => {
    expect(component.orderId).toBeNull();
  });

  it("should accept an order id", () => {
    component.orderId = "order-123";
    fixture.detectChanges();

    expect(component.orderId).toBe("order-123");
  });

  it("should display the order placed message", () => {
    const element: HTMLElement = fixture.nativeElement;

    expect(element.querySelector("h2")?.textContent).toContain("Order placed!");
  });

  it("should display the payment information", () => {
    const element: HTMLElement = fixture.nativeElement;

    expect(element.textContent).toContain(
      "Payment will be collected on delivery.",
    );
  });

  it("should display the order id when provided", () => {
    component.orderId = "order-123";
    fixture.detectChanges();

    const orderIdElement = fixture.nativeElement.querySelector(".order-id");

    expect(orderIdElement).toBeTruthy();
    expect(orderIdElement.textContent).toContain("Order #order-123");
  });

  it("should not display the order id when it is null", () => {
    component.orderId = null;
    fixture.detectChanges();

    const orderIdElement = fixture.nativeElement.querySelector(".order-id");

    expect(orderIdElement).toBeNull();
  });

  it("should render the view orders link", () => {
    const links = fixture.nativeElement.querySelectorAll(".actions a");

    expect(links.length).toBe(2);
    expect(links[0].textContent).toContain("View my orders");
  });

  it("should render the continue shopping link", () => {
    const links = fixture.nativeElement.querySelectorAll(".actions a");

    expect(links[1].textContent).toContain("Continue shopping");
  });

  it("should link the view orders link to the orders page", () => {
    const link = fixture.nativeElement.querySelector(
      'a[routerLink="/orders"]',
    ) as HTMLAnchorElement;

    expect(link).toBeTruthy();
    expect(link.getAttribute("href")).toBe("/orders");
  });

  it("should link the continue shopping link to the products page", () => {
    const link = fixture.nativeElement.querySelector(
      'a[routerLink="/products"]',
    ) as HTMLAnchorElement;

    expect(link).toBeTruthy();
    expect(link.getAttribute("href")).toBe("/products");
  });

  it("should not render any action buttons", () => {
    expect(fixture.nativeElement.querySelectorAll("button").length).toBe(0);
  });

  it("should render the confirmation icon", () => {
    const icon = fixture.nativeElement.querySelector(".check-icon");

    expect(icon).toBeTruthy();
    expect(icon.textContent.trim()).toBe("check_circle");
  });
});
