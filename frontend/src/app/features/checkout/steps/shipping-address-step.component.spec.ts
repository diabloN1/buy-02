import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { provideRouter } from "@angular/router";

import { ShippingAddressStepComponent } from "./shipping-address-step.component";
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";

describe("ShippingAddressStepComponent", () => {
  let component: ShippingAddressStepComponent;
  let fixture: ComponentFixture<ShippingAddressStepComponent>;

  let addressForm: FormGroup;

  beforeEach(async () => {
    addressForm = new FormGroup({
      fullName: new FormControl("", Validators.required),
      street: new FormControl("", Validators.required),
      city: new FormControl("", Validators.required),
      zipCode: new FormControl("", Validators.required),
      country: new FormControl("", Validators.required),
      phone: new FormControl("", Validators.required),
    });

    await TestBed.configureTestingModule({
      imports: [ShippingAddressStepComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ShippingAddressStepComponent);
    component = fixture.componentInstance;

    component.addressForm = addressForm;

    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should use the provided address form", () => {
    expect(component.addressForm).toBe(addressForm);
  });

  it("should render all address fields", () => {
    const element: HTMLElement = fixture.nativeElement;

    expect(
      element.querySelector('input[formControlName="fullName"]'),
    ).toBeTruthy();

    expect(
      element.querySelector('input[formControlName="street"]'),
    ).toBeTruthy();

    expect(
      element.querySelector('input[formControlName="city"]'),
    ).toBeTruthy();

    expect(
      element.querySelector('input[formControlName="zipCode"]'),
    ).toBeTruthy();

    expect(
      element.querySelector('input[formControlName="country"]'),
    ).toBeTruthy();
  });

  it("should display the form values", () => {
    addressForm.patchValue({
      fullName: "John Doe",
      street: "123 Main Street",
      city: "Oujda",
      zipCode: "60000",
      country: "Morocco",
      phone: "+212600000000",
    });

    fixture.detectChanges();

    const fullName = fixture.nativeElement.querySelector(
      'input[formControlName="fullName"]',
    ) as HTMLInputElement;

    const street = fixture.nativeElement.querySelector(
      'input[formControlName="street"]',
    ) as HTMLInputElement;

    const city = fixture.nativeElement.querySelector(
      'input[formControlName="city"]',
    ) as HTMLInputElement;

    expect(fullName.value).toBe("John Doe");
    expect(street.value).toBe("123 Main Street");
    expect(city.value).toBe("Oujda");
  });

  it("should have required validators on address fields", () => {
    expect(addressForm.get("fullName")?.hasError("required")).toBeTrue();
    expect(addressForm.get("street")?.hasError("required")).toBeTrue();
    expect(addressForm.get("city")?.hasError("required")).toBeTrue();
    expect(addressForm.get("zipCode")?.hasError("required")).toBeTrue();
    expect(addressForm.get("country")?.hasError("required")).toBeTrue();
    expect(addressForm.get("phone")?.hasError("required")).toBeTrue();
  });

  it("should make the form valid when all fields are filled", () => {
    addressForm.patchValue({
      fullName: "John Doe",
      street: "123 Main Street",
      city: "Oujda",
      zipCode: "60000",
      country: "Morocco",
      phone: "+212600000000",
    });

    expect(addressForm.valid).toBeTrue();
  });

  it("should emit next when the form is submitted", () => {
    spyOn(component.next, "emit");

    addressForm.patchValue({
      fullName: "John Doe",
      street: "123 Main Street",
      city: "Oujda",
      zipCode: "60000",
      country: "Morocco",
      phone: "+212600000000",
    });

    const form = fixture.nativeElement.querySelector("form");

    form.dispatchEvent(new Event("submit"));

    expect(component.next.emit).toHaveBeenCalled();
  });

  it("should render the Back to cart button", () => {
    const button = fixture.nativeElement.querySelector(
      'button[routerlink="/cart"]',
    );

    expect(button).toBeTruthy();
    expect(button.textContent).toContain("Back to cart");
  });

  it("should render the Review order button", () => {
    const buttons = fixture.nativeElement.querySelectorAll(
      ".actions button",
    );

    expect(buttons.length).toBe(2);
    expect(buttons[1].textContent).toContain("Review order");
  });

  it("should render the phone input", () => {
    const phoneInput = fixture.nativeElement.querySelector(
      "ngx-material-intl-tel-input",
    );

    expect(phoneInput).toBeTruthy();
  });
});