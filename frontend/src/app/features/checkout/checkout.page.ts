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
import { Cart } from "@core/models/cart.model";
import { Address, CreateOrderRequest } from "@core/models/order.model";

import { ShippingAddressStepComponent } from "./steps/shipping-address-step.component";
import { ReviewOrderStepComponent } from "./steps/review-order-step.component";
import { ConfirmationStepComponent } from "./steps/confirmation-step.component";
import { LoadingSpinnerComponent } from "@shared/components/loading-spinner.component";

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
    LoadingSpinnerComponent,
    ShippingAddressStepComponent,
    ReviewOrderStepComponent,
    ConfirmationStepComponent,
  ],
  template: `
    <section class="container checkout-section animate-fade-in">
      <div class="page-header">
        <h1 class="page-title">Checkout</h1>
        <div class="trust-badge animate-pop-in delay-1">
          <mat-icon>lock</mat-icon>
          <span>Secure Encrypted Connection</span>
        </div>
      </div>

      @if (cart(); as c) {
        @if (c.items.length === 0) {
          <!-- Premium Empty State -->
          <div class="empty-state animate-fade-in">
            <div class="empty-icon-wrap">
              <mat-icon>remove_shopping_cart</mat-icon>
            </div>
            <h2>Your cart is empty</h2>
            <p class="muted">
              You need items in your cart to proceed to checkout.
            </p>
            <a class="btn btn-primary continue-btn" routerLink="/products">
              <mat-icon>arrow_back</mat-icon>
              <span>Browse products</span>
            </a>
          </div>
        } @else {
          <!-- Wizard Container -->
          <div class="app-card wizard-card animate-fade-in delay-1">
            <mat-stepper [linear]="true" #stepper class="pro-stepper">
              <mat-step [stepControl]="addressForm" label="Shipping Address">
                <div class="step-content-wrap">
                  <app-shipping-address-step
                    [addressForm]="addressForm"
                    (next)="stepper.next()"
                  />
                </div>
              </mat-step>

              <mat-step label="Review Order" [completed]="orderId() !== null">
                <div class="step-content-wrap">
                  <app-review-order-step
                    [cart]="c"
                    [addressForm]="addressForm"
                    (previous)="stepper.previous()"
                    (placeOrder)="placeOrder(stepper)"
                  />
                </div>
              </mat-step>

              <mat-step label="Confirmation">
                <div class="step-content-wrap">
                  <app-confirmation-step [orderId]="orderId()" />
                </div>
              </mat-step>
            </mat-stepper>
          </div>
        }
      } @else {
        <!-- Consistent App Loading State -->
        <app-loading-spinner label="Initializing secure checkout…" />
      }
    </section>
  `,
  styles: [
    `
      .checkout-section {
        max-width: 800px; /* Perfect width for focused checkout forms */
        margin: 0 auto;
        padding-top: 40px;
        padding-bottom: 80px;
      }

      /* ==========================================================================
         Header & Trust Badge
         ========================================================================== */
      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        flex-wrap: wrap;
        gap: 16px;
        margin-bottom: 32px;
        padding-bottom: 16px;
        border-bottom: 1px solid var(--app-border);
      }

      .page-title {
        font-size: clamp(1.75rem, 4vw, 2.25rem);
        font-weight: 800;
        letter-spacing: -0.03em;
        margin: 0;
        color: var(--app-fg-heading);
      }

      .trust-badge {
        display: flex;
        align-items: center;
        gap: 6px;
        color: var(--app-success);
        background: var(--app-success-light);
        padding: 6px 12px;
        border-radius: var(--app-radius-full);
        font-size: 13px;
        font-weight: 600;
        border: 1px solid rgba(34, 197, 94, 0.2);
      }
      .trust-badge mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }

      /* ==========================================================================
         Wizard Card
         ========================================================================== */
      .wizard-card {
        padding: 24px;
      }

      .pro-stepper {
        background-color: transparent !important;
      }

      /* Adds nice breathing room inside the active steps */
      .step-content-wrap {
        padding-top: 32px;
        padding-bottom: 16px;
      }

      @media (max-width: 600px) {
        .wizard-card {
          padding: 16px 8px;
        }
        .step-content-wrap {
          padding-top: 24px;
        }
      }

      /* ==========================================================================
         Premium Empty State
         ========================================================================== */
      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        padding: 80px 24px;
        background: var(--app-surface);
        border: 1px dashed var(--app-border-hover);
        border-radius: var(--app-radius-lg);
      }

      .empty-icon-wrap {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        background: var(--app-bg-alt);
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 24px;
        border: 1px solid var(--app-border);
        box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.02);
      }

      .empty-icon-wrap mat-icon {
        font-size: 36px;
        width: 36px;
        height: 36px;
        color: var(--app-muted-light);
      }

      .empty-state h2 {
        font-size: 1.5rem;
        font-weight: 700;
        margin: 0 0 8px;
        color: var(--app-fg-heading);
      }

      .empty-state p {
        font-size: 15px;
        margin: 0 0 32px;
        color: var(--app-muted);
      }

      .continue-btn {
        height: 48px;
        padding: 0 28px;
        font-size: 15px;
      }
      .continue-btn mat-icon {
        margin-right: 4px;
        transition: transform var(--transition-fast);
      }
      .continue-btn:hover mat-icon {
        transform: translateX(-4px);
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
      paymentMethod: "pay_on_delivery",
      totalAmount: totalAmount,
    };

    this.orderSvc.createOrder(body).subscribe({
      next: (res) => {
        this.orderId.set(res.id);
        this.notify.success(`Order #${res.id} placed successfully!`);
        setTimeout(() => {
          stepper.next();
        }, 500);
      },
      error: () => {},
    });
  }

  getCartTotal(c: Cart): number {
    return c.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  getCartItemCount(c: Cart): number {
    return c.items.reduce((sum, item) => sum + item.quantity, 0);
  }
}
