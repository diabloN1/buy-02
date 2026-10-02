import { Component, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";

import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatStepperModule } from "@angular/material/stepper";
import { MatCardModule } from "@angular/material/card";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { RouterModule } from "@angular/router";

import { CartService } from "@core/services/cart.service";
import { OrderService } from "@core/services/order.service";
import { NotificationService } from "@core/services/notification.service";
import { CartItem, Cart } from "@core/models/cart.model";
import { Address, CreateOrderRequest } from "@core/models/checkout.model";

import { ShippingAddressStepComponent } from "./steps/shipping-address-step.component";
import { ReviewOrderStepComponent } from "./steps/review-order-step.component";
import { ConfirmationStepComponent } from "./steps/confirmation-step.component";

@Component({
  selector: "app-checkout-wizard",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatStepperModule,
    MatCardModule,
    MatProgressSpinnerModule,
    RouterModule,

    ShippingAddressStepComponent,
    ReviewOrderStepComponent,
    ConfirmationStepComponent,
  ],
  template: `
    <section class="container">
      <h1 class="page-title">Checkout</h1>

      @if (cart(); as c) {
        @if (c.items.length === 0) {
          <div class="empty-state">
            <mat-icon>shopping_cart</mat-icon>
            <p>Your cart is empty</p>

            <a mat-raised-button color="primary" routerLink="/products">
              Browse products
            </a>
          </div>
        } @else {
          <mat-card class="wizard-card">
            <mat-stepper [linear]="true" #stepper>
              <mat-step [stepControl]="addressForm" label="Shipping Address">
                <app-shipping-address-step
                  [addressForm]="addressForm"
                  (next)="stepper.next()"
                />
              </mat-step>

              <mat-step label="Review Order" [completed]="orderId() !== null">
                <app-review-order-step
                  [cart]="c"
                  [addressForm]="addressForm"
                  (previous)="stepper.previous()"
                  (placeOrder)="placeOrder(stepper)"
                />
              </mat-step>

              <mat-step label="Confirmation">
                <app-confirmation-step [orderId]="orderId()" />
              </mat-step>
            </mat-stepper>
          </mat-card>
        }
      } @else {
        <div class="loading-wrap">
          <mat-spinner [diameter]="40" />
          <span class="muted">Loading cart…</span>
        </div>
      }
    </section>
  `,
  styles: [
    `
      .container {
        max-width: 720px;
        margin: 0 auto;
        padding: 24px 16px;
      }

      .page-title {
        font-size: 1.75rem;
        font-weight: 800;
        margin-bottom: 24px;
        color: var(--app-fg);
      }

      .wizard-card {
        padding: 8px;
        background: var(--app-surface);
        border-radius: var(--app-radius);
        box-shadow: var(--app-shadow);
      }

      mat-card,
      mat-stepper {
        background-color: transparent;
      }

      mat-step-header {
        border-radius: var(--app-radius) !important;
      }

      .empty-state {
        text-align: center;
        padding: 64px 24px;
        color: var(--app-muted);
      }

      .empty-state mat-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        color: var(--app-bg);
        margin-bottom: 16px;
      }

      .loading-wrap {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        padding: 64px 0;
        color: var(--app-muted);
      }

      ::ng-deep .mat-step-header:hover,
      ::ng-deep .mat-step-header[aria-selected="true"] {
        border: 1px solid transparent !important;
        border-radius: 8px !important;
        background-color: rgba(255, 255, 255, 0.1);
      }
    `,
  ],
})
export class CheckoutWizardComponent {
  private readonly cartSvc = inject(CartService);
  private readonly orderSvc = inject(OrderService);
  private readonly notify = inject(NotificationService);
  private readonly fb = inject(FormBuilder);

  readonly cart = signal<Cart | null | undefined>(undefined);
  readonly orderId = signal<string | null>(null);
  addressForm: FormGroup = this.fb.group({
    fullName: [
      "",
      [Validators.required, Validators.minLength(2), Validators.maxLength(50)],
    ],
    street: [
      "",
      [Validators.required, Validators.minLength(3), Validators.maxLength(200)],
    ],
    city: [
      "",
      [Validators.required, Validators.minLength(2), Validators.maxLength(50)],
    ],
    zipCode: [
      "",
      [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(20),
        Validators.pattern(/^[A-Za-z0-9][A-Za-z0-9 -]*$/),
      ],
    ],
    country: [
      "",
      [Validators.required, Validators.minLength(2), Validators.maxLength(50)],
    ],
    phone: ["", Validators.required],
  });

  constructor() {
    this.cartSvc.getCart().subscribe({
      next: (cart) => this.cart.set(cart),
    });
  }

  placeOrder(stepper: any): void {
    const c = this.cart();
    if (!c || c.items.length === 0) return;

    const address = this.addressForm.value as Address;
    const totalAmount = this.getCartTotal(c);

    const body: CreateOrderRequest = {
      shippingAddress: address,
      paymentMethod: 'pay_on_delivery',
      totalAmount: totalAmount
    };

    this.orderSvc.createOrder(body).subscribe({
      next: (res) => {
        this.orderId.set(res.orderId);
        this.notify.success(`Order #${res.orderId} placed successfully!`);
        stepper.next();
      },
      error: (err) => {
        this.notify.error(
          err?.error?.message ?? "Failed to place order. Please try again.",
        );
      },
    });
  }

  getCartTotal(c: Cart): number {
    return c.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  getCartItemCount(c: Cart): number {
    return c.items.reduce((sum, item) => sum + item.quantity, 0);
  }
}
