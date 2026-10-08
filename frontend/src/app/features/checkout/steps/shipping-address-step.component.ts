import { Component, EventEmitter, Input, Output } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormGroup, ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { RouterModule } from "@angular/router";
import { NgxMaterialIntlTelInputComponent } from "ngx-material-intl-tel-input";

@Component({
  selector: "app-shipping-address-step",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    RouterModule,
    NgxMaterialIntlTelInputComponent,
  ],
  template: `
    <form [formGroup]="addressForm" (ngSubmit)="next.emit()">
      <div class="form-grid">
        <mat-form-field appearance="outline" class="full">
          <mat-label>Full name</mat-label>
          <input
            matInput
            formControlName="fullName"
            placeholder="Full Name"
            autocomplete="name"
          />
          @if (
            addressForm.get("fullName")?.touched &&
            addressForm.get("fullName")?.errors
          ) {
            <mat-error
              *ngIf="addressForm.get('fullName')?.errors?.['required']"
            >
              Full name is required
            </mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full">
          <mat-label>Street address</mat-label>
          <input
            matInput
            formControlName="street"
            placeholder="Street Address"
            autocomplete="street-address"
          />
          @if (
            addressForm.get("street")?.touched &&
            addressForm.get("street")?.errors
          ) {
            <mat-error *ngIf="addressForm.get('street')?.errors?.['required']">
              Street address is required
            </mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="half">
          <mat-label>City</mat-label>
          <input
            matInput
            formControlName="city"
            placeholder="Oujda"
            autocomplete="address-level2"
          />
          @if (
            addressForm.get("city")?.touched && addressForm.get("city")?.errors
          ) {
            <mat-error *ngIf="addressForm.get('city')?.errors?.['required']">
              City is required
            </mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="half">
          <mat-label>ZIP code</mat-label>
          <input
            matInput
            formControlName="zipCode"
            placeholder="10001"
            autocomplete="postal-code"
          />
          @if (
            addressForm.get("zipCode")?.touched &&
            addressForm.get("zipCode")?.errors
          ) {
            <mat-error *ngIf="addressForm.get('zipCode')?.errors?.['required']">
              ZIP code is required
            </mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="half">
          <mat-label>Country</mat-label>
          <input
            matInput
            formControlName="country"
            placeholder="Morocco"
            autocomplete="country"
          />

          @if (
            addressForm.get("country")?.touched &&
            addressForm.get("country")?.errors
          ) {
            <mat-error>Country is required</mat-error>
          }
        </mat-form-field>

        <div class="full phone-field">
          <ngx-material-intl-tel-input
            class="phone-number"
            fieldControlName="phone"
            [required]="true"
            [autoIpLookup]="false"
            autoSelectedCountry="ma"
            placeholder="Phone number"
            [hidePhoneIcon]="true"
          />
        </div>
      </div>

      <div class="actions">
        <a class="btn btn-outline" routerLink="/cart">
          <mat-icon>arrow_back</mat-icon>
          Back to cart
        </a>

        <button class="btn btn-primary" type="submit">
          Review order
          <mat-icon>arrow_forward</mat-icon>
        </button>
      </div>
    </form>
  `,
  styles: `
    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-top: 24px;
      margin-bottom: 24px;
    }

    .form-grid .half {
      grid-column: span 1;
    }

    .form-grid .full {
      grid-column: span 2;
    }

    .actions {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
      margin-top: 16px;
    }

    .actions button {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    @media (max-width: 600px) {
      .form-grid {
        grid-template-columns: 1fr;
      }

      .form-grid .half,
      .form-grid .full {
        grid-column: span 1;
      }

      .actions {
        flex-direction: column;
      }

      .actions button {
        width: 100%;
        justify-content: center;
      }
    }
  `,
})
export class ShippingAddressStepComponent {
  @Input({ required: true }) addressForm!: FormGroup;

  @Output() next = new EventEmitter<void>();
}
