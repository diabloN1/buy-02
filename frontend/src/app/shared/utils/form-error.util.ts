import { FormGroup } from "@angular/forms";

/**
 * Maps backend field validation errors (from ErrorResponse `details`)
 * directly onto Angular Reactive Form controls.
 */
export function applyFormErrors(form: FormGroup, details: any): void {
  if (!details || typeof details !== "object") return;

  Object.keys(details).forEach((field) => {
    const control = form.get(field);
    if (control) {
      const errorMsg = typeof details[field] === "string" ? details[field] : "Invalid value";
      control.setErrors({ serverError: errorMsg });
      control.markAsTouched();
      control.markAsDirty();
    }
  });
}
