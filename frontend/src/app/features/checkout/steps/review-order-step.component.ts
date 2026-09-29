import { Component, EventEmitter, Input, Output } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatDividerModule } from "@angular/material/divider";
import { Cart } from "@core/models/cart.model";
import { FormGroup } from "@angular/forms";

@Component({
  selector: "app-review-order-step",
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatDividerModule],
  template: `
    <div class="review-section">
      <h3 class="section-title">Shipping to</h3>

      <p class="review-address">
        {{ addressForm.value.fullName }}<br />
        {{ addressForm.value.street }}<br />
        {{ addressForm.value.city }}
        {{ addressForm.value.zipCode }}<br />
        {{ addressForm.value.country }}<br />
        {{ addressForm.value.phone }}
      </p>

      <button mat-stroked-button type="button" (click)="previous.emit()">
        <mat-icon>edit</mat-icon>
        Edit address
      </button>
    </div>

    <mat-divider />

    <h3 class="section-title">Order items</h3>

    <div class="review-items">
      @for (item of cart.items; track item.productId) {
        <div class="review-item">
          @if (item.imageUrl) {
            <img [src]="item.imageUrl" alt="product image" />
          } @else {
            <mat-icon class="image-placeholder"> inventory_2 </mat-icon>
          }

          <span class="review-item-name">
            {{ item.productName }}
          </span>

          <span class="review-item-qty"> Qty: {{ item.quantity }} </span>

          <span class="review-item-price">
            {{ item.price * item.quantity | currency }}
          </span>
        </div>
      }
    </div>

    <mat-divider />

    <div class="review-total">
      <span> Total ({{ getCartItemCount(cart) }}) </span>

      <span class="total-price">
        {{ getCartTotal(cart) | currency }}
      </span>
    </div>

    <div class="actions">
      <button mat-button type="button" (click)="previous.emit()">
        <mat-icon>arrow_back</mat-icon>
        Back
      </button>

      <button mat-button type="button" (click)="previous.emit()">
        <mat-icon>shopping_cart</mat-icon>
        Modify cart
      </button>

      <button
        mat-raised-button
        color="primary"
        type="button"
        (click)="placeOrder.emit()"
      >
        Place order
        <mat-icon>arrow_forward</mat-icon>
      </button>
    </div>
  `,
  styles: `
    .review-section {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 16px;
    }

    .section-title {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--app-fg);
      margin: 8px 0 4px;
    }

    .review-address {
      color: var(--app-muted);
      line-height: 1.6;
      font-size: 0.95rem;
    }

    .review-items {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .review-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid var(--app-border);
    }

    .review-item-name {
      font-weight: 500;
      color: var(--app-fg);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      overflow-wrap: none;
    }

    .review-item-qty {
      color: var(--app-muted);
      font-size: 0.9rem;
    }

    .review-item-price {
      font-weight: 600;
      color: var(--app-fg);
    }

    .review-total {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 1.2rem;
      font-weight: 700;
      padding: 16px 0;
    }

    .total-price {
      color: var(--app-primary);
      font-size: 1.5rem;
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

    mat-divider {
      margin: 8px 0;
    }

    img,
    .image-placeholder {
      width: 48px;
      height: 48px;
      flex-shrink: 0;
      box-sizing: border-box;
    }

    img {
      object-fit: cover;
      border-radius: var(--app-radius-sm);
      border: 1px solid var(--app-border);
      display: block;
    }

    .image-placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--app-muted);
      border: 1px solid var(--app-border);
      border-radius: var(--app-radius-sm);
    }

    @media (max-width: 600px) {
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
export class ReviewOrderStepComponent {
  @Input({ required: true }) cart!: Cart;
  @Input({ required: true }) addressForm!: FormGroup;

  @Output() previous = new EventEmitter<void>();
  @Output() placeOrder = new EventEmitter<void>();

  getCartTotal(cart: Cart): number {
    return cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
  }

  getCartItemCount(cart: Cart): number {
    return cart.items.reduce((sum, item) => sum + item.quantity, 0);
  }
}
