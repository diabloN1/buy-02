import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormControl, Validators } from "@angular/forms";
import { FieldErrorComponent } from "./field-error.component";

describe("FieldErrorComponent", () => {
  let component: FieldErrorComponent;
  let fixture: ComponentFixture<FieldErrorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FieldErrorComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(FieldErrorComponent);
    component = fixture.componentInstance;
  });

  it("should not render error text if control is untouched or has no errors", () => {
    const control = new FormControl("", [Validators.required]);
    component.control = control;
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector(".error-text")).toBeNull();
  });

  it("should render required error when control is touched and invalid", () => {
    const control = new FormControl("", [Validators.required]);
    control.markAsTouched();
    component.control = control;
    fixture.detectChanges();

    const errorEl = fixture.nativeElement.querySelector(".error-text");
    expect(errorEl).not.toBeNull();
    expect(errorEl.textContent).toContain("This field is required.");
  });

  it("should render email error message", () => {
    const control = new FormControl("invalid-email", [Validators.email]);
    control.markAsTouched();
    component.control = control;
    fixture.detectChanges();

    const errorEl = fixture.nativeElement.querySelector(".error-text");
    expect(errorEl.textContent).toContain("Enter a valid email.");
  });

  it("should render weakPassword error message", () => {
    const control = new FormControl("123");
    control.setErrors({ weakPassword: true });
    control.markAsTouched();
    component.control = control;
    fixture.detectChanges();

    const errorEl = fixture.nativeElement.querySelector(".error-text");
    expect(errorEl.textContent).toContain("Use 8+ chars with a number and a letter.");
  });
});
