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
    <!-- Added subtle fade-in for list rendering -->
    <div class="cart-item animate-fade-in">
      <!-- Product Details (Image & Title) -->
      <div class="item-details">
        <div class="image-wrapper">
          @if (imageUrl) {
            <img [src]="imageUrl" alt="product image" class="thumb" />
          } @else {
            <div class="thumb-placeholder">
              <mat-icon>inventory_2</mat-icon>
            </div>
          }
        </div>
        <span class="item-name" [title]="productName">{{ productName }}</span>
      </div>

      <!-- Pro Unified Stepper (Matches Product Details Page) -->
      <div class="item-quantity">
        <div class="pro-stepper">
          <button
            type="button"
            class="stepper-btn"
            (click)="updateItemQuantity(quantity - 1)"
            [disabled]="quantity <= 1"
            aria-label="Decrease quantity"
          >
            <mat-icon>remove</mat-icon>
          </button>
          <span class="quantity-value">{{ quantity }}</span>
          <button
            type="button"
            class="stepper-btn"
            (click)="updateItemQuantity(quantity + 1)"
            [disabled]="quantity >= availableStock"
            aria-label="Increase quantity"
          >
            <mat-icon>add</mat-icon>
          </button>
        </div>
      </div>

      <!-- Price & Actions -->
      <div class="item-actions">
        <span class="item-price">{{ price | currency }}</span>

        <button
          type="button"
          class="remove-btn"
          (click)="deleteItem()"
          aria-label="Remove item"
          title="Remove from cart"
        >
          <mat-icon>delete_outline</mat-icon>
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      /* ==========================================================================
         Row Layout & Interactions
         ========================================================================== */
      .cart-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 20px 16px;
        border-bottom: 1px solid var(--app-border);
        gap: 24px;
        background: transparent;
        transition:
          background-color var(--transition-fast),
          border-radius var(--transition-fast);
      }

      /* Premium subtle row highlight on hover */
      .cart-item:hover {
        background: var(--app-surface-hover);
        border-radius: var(--app-radius-sm);
      }

      .cart-item:last-child {
        border-bottom: none;
      }

      /* ==========================================================================
         Image & Title
         ========================================================================== */
      .item-details {
        display: flex;
        align-items: center;
        gap: 16px;
        flex: 1;
        min-width: 0; /* Enables text truncation */
      }

      .image-wrapper {
        width: 56px;
        height: 56px;
        flex-shrink: 0;
        border-radius: var(--app-radius-sm);
        border: 1px solid var(--app-border);
        overflow: hidden;
        box-shadow: var(--app-shadow-sm);
        background: var(--app-bg-alt);
      }

      .thumb {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
        transition: transform var(--transition-normal);
      }

      /* Micro-interaction: Slight image zoom on row hover */
      .cart-item:hover .thumb {
        transform: scale(1.05);
      }

      .thumb-placeholder {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--app-muted-light);
      }

      .item-name {
        font-weight: 600;
        color: var(--app-fg-heading);
        font-size: 15px;
        line-height: 1.4;

        /* Premium line-clamp for multiline support */
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      /* ==========================================================================
         Pro Unified Quantity Stepper 
         ========================================================================== */
      .item-quantity {
        display: flex;
        align-items: center;
      }

      .pro-stepper {
        display: inline-flex;
        align-items: center;
        background: var(--app-surface);
        border: 1px solid var(--app-border);
        border-radius: var(--app-radius-full);
        padding: 4px;
        box-shadow: var(--app-shadow-sm);
      }

      .stepper-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        border: none;
        background: transparent;
        color: var(--app-fg);
        cursor: pointer;
        transition: all var(--transition-fast);
      }

      .stepper-btn mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      .stepper-btn:hover:not(:disabled) {
        background: var(--app-bg-alt);
        color: var(--app-fg-heading);
      }

      .stepper-btn:disabled {
        opacity: 0.3;
        cursor: not-allowed;
      }

      .quantity-value {
        min-width: 32px;
        text-align: center;
        font-size: 14px;
        font-weight: 600;
        color: var(--app-fg-heading);
        font-variant-numeric: tabular-nums;
      }

      /* ==========================================================================
         Price & Actions
         ========================================================================== */
      .item-actions {
        display: flex;
        align-items: center;
        gap: 24px;
      }

      .item-price {
        color: var(--app-fg-heading);
        font-weight: 700;
        font-size: 16px;
        min-width: 80px;
        text-align: right;
        font-variant-numeric: tabular-nums;
        letter-spacing: -0.02em;
      }

      .remove-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border: none;
        background: transparent;
        color: var(--app-muted);
        border-radius: var(--app-radius-sm);
        cursor: pointer;
        transition: all var(--transition-fast);
      }

      .remove-btn mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      .remove-btn:hover {
        background: var(--app-danger-light);
        color: var(--app-danger);
        transform: scale(0.95);
      }

      /* ==========================================================================
         Responsive Mobile Grid
         ========================================================================== */
      @media (max-width: 640px) {
        .cart-item {
          display: grid;
          grid-template-columns: 1fr auto;
          grid-template-areas:
            "details remove"
            "quantity actions";
          gap: 16px 12px;
          padding: 16px 12px;
        }

        .item-details {
          grid-area: details;
        }

        .item-quantity {
          grid-area: quantity;
          /* Align stepper to match the image padding above it */
          padding-left: 72px;
        }

        .item-actions {
          grid-area: actions;
          gap: 12px;
          justify-content: flex-end;
        }

        .remove-btn {
          grid-area: remove;
          justify-self: end;
          align-self: start;
          /* Move the button slightly up so it perfectly aligns with title text */
          margin-top: -4px;
          margin-right: -8px;
        }

        /* Adjust price to sit nicely next to the stepper on mobile */
        .item-price {
          min-width: auto;
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
