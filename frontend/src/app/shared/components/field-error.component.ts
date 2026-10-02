import { Component, Input } from '@angular/core';
import { AbstractControl } from '@angular/forms';

@Component({
  selector: 'app-field-error',
  standalone: true,
  template: `
    @if (control && (control.touched || control.dirty) && control.errors) {
      <div class="error-text">
        @if (control.errors['serverError']) { {{ control.errors['serverError'] }} }
        @else if (control.errors['required']) { This field is required. }
        @else if (control.errors['email']) { Enter a valid email. }
        @else if (control.errors['minlength']) { Too short (min {{ control.errors['minlength'].requiredLength }}). }
        @else if (control.errors['maxlength']) { Too long. }
        @else if (control.errors['min']) { Must be at least {{ control.errors['min'].min }}. }
        @else if (control.errors['weakPassword']) { Use 8+ chars with a number and a letter. }
        @else { Invalid value. }
      </div>
    }
  `,
})
export class FieldErrorComponent {
  @Input() control: AbstractControl | null = null;
}
