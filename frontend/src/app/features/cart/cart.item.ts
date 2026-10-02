import { Component, Input, Output, EventEmitter, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { CartService } from "@core/services/cart.service";

@Component({
  selector: "app-cart-item",
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  template: `
    <div class="cart-item">
      <div class="item-details">
        @if (imageUrl) {
          <img [src]="imageUrl" alt="product image" class="thumb" />
        } @else {
          <div class="thumb-placeholder">
            <mat-icon>inventory_2</mat-icon>
          </div>
        }
        <span class="item-name">{{ productName }}</span>
      </div>

      <div class="item-quantity">
        <div class="qty-group">
          <button
            mat-icon-button
            class="qty-btn"
            (click)="updateItemQuantity(quantity - 1)"
            [disabled]="quantity <= 1"
            aria-label="Decrease quantity"
          >
            <mat-icon>remove</mat-icon>
          </button>
          <span class="quantity-value">{{ quantity }}</span>
          <button
            mat-icon-button
            class="qty-btn"
            (click)="updateItemQuantity(quantity + 1)"
            [disabled]="quantity >= availableStock"
            aria-label="Increase quantity"
          >
            <mat-icon>add</mat-icon>
          </button>
        </div>
      </div>

      <span class="item-price">{{ price | currency }}</span>

      <button
        mat-icon-button
        class="remove-btn"
        (click)="deleteItem()"
        aria-label="Remove item"
      >
        <mat-icon>close</mat-icon>
      </button>
    </div>
  `,
  styles: [
    `
      .cart-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 4px;
        border-bottom: 1px solid var(--app-border);
        gap: 16px;
      }

      .cart-item:last-child {
        border-bottom: none;
      }

      .item-details {
        display: flex;
        align-items: center;
        gap: 16px;
        flex: 1;
      }

      .thumb {
        width: 48px;
        height: 48px;
        object-fit: cover;
        border-radius: var(--app-radius-sm);
        border: 1px solid var(--app-border);
        display: block;
        flex-shrink: 0;
      }

      .thumb-placeholder {
        width: 48px;
        height: 48px;
        border-radius: var(--app-radius-sm);
        border: 1px dashed var(--app-border-hover);
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--app-muted);
        background: var(--app-bg-alt);
        flex-shrink: 0;
      }

      .item-name {
        font-weight: 500;
        color: var(--app-fg-heading);
        font-size: 14px;
        overflow-wrap: anywhere;
      }

      /* Unified Shadcn-style Quantity Stepper */
      .qty-group {
        display: inline-flex;
        align-items: center;
        border: 1px solid var(--app-border);
        border-radius: var(--app-radius-sm);
        background: var(--app-surface);
        height: 32px;
      }

      .qty-btn {
        width: 30px !important;
        height: 30px !important;
        padding: 0 !important;
        color: var(--app-muted) !important;
        border-radius: 0 !important;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      .qty-btn:first-child {
        border-top-left-radius: var(--app-radius-sm) !important;
        border-bottom-left-radius: var(--app-radius-sm) !important;
      }

      .qty-btn:last-child {
        border-top-right-radius: var(--app-radius-sm) !important;
        border-bottom-right-radius: var(--app-radius-sm) !important;
      }

      .qty-btn mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
        line-height: 16px;
      }

      .qty-btn:not(:disabled):hover {
        background: var(--app-surface-hover) !important;
        color: var(--app-fg) !important;
      }

      .qty-btn:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }

      .quantity-value {
        width: 32px;
        text-align: center;
        font-size: 13px;
        font-weight: 500;
        color: var(--app-fg);
        font-variant-numeric: tabular-nums;
        border-left: 1px solid var(--app-border);
        border-right: 1px solid var(--app-border);
        line-height: 30px;
      }

      .item-price {
        color: var(--app-fg-heading);
        font-weight: 600;
        font-size: 14px;
        min-width: 70px;
        text-align: right;
        font-variant-numeric: tabular-nums;
      }

      /* Shadcn Ghost Remove Button */
      .remove-btn {
        width: 32px !important;
        height: 32px !important;
        padding: 0 !important;
        color: var(--app-muted) !important;
        border-radius: var(--app-radius-sm) !important;
      }

      .remove-btn mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        line-height: 18px;
      }

      .remove-btn:hover {
        background: var(--app-danger-light) !important;
        color: var(--app-danger) !important;
      }

      @media (max-width: 600px) {
        .cart-item {
          display: grid;
          grid-template-columns: 1fr auto auto;
          grid-template-areas:
            "details details remove"
            "quantity price remove";
          gap: 12px 16px;
          padding: 16px 4px;
        }

        .item-details {
          grid-area: details;
          min-width: 0;
        }

        .item-name {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          overflow-wrap: normal;
        }

        .item-quantity {
          grid-area: quantity;
          justify-self: start;
        }

        .item-price {
          grid-area: price;
          align-self: center;
          min-width: auto;
          text-align: left;
        }

        .remove-btn {
          grid-area: remove;
          align-self: center;
        }
      }
    `,
  ],
})
export class CartItemComponent {
  private readonly cartSvc = inject(CartService);

  @Input() productId!: string;
  @Input() quantity: number = 1;
  @Input() price: number = 0;
  @Input() productName: string = "";
  @Input() imageUrl: string | null = "";
  @Input() availableStock: number = 1;

  @Output() quantityChange = new EventEmitter<number>();
  @Output() remove = new EventEmitter<void>();

  updateItemQuantity(quantity: number): void {
    if (quantity < 1 || quantity > this.availableStock) return;
    this.cartSvc.updateItemQuantity(this.productId, quantity).subscribe({
      next: () => {
        this.quantityChange.emit(quantity);
      },
      error: (err) => {
        console.error(err);
      },
    });
  }

  deleteItem() {
    this.cartSvc.removeCartItem(this.productId).subscribe({
      next: () => {
        this.remove.emit();
      },
      error: (err) => {
        console.error(err);
      },
    });
  }
}
