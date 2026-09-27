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
          <img [src]="imageUrl" alt="product image" />
        } @else {
          <mat-icon>inventory_2</mat-icon>
        }
        <span class="item-name">{{ productName }}</span>
      </div>

      <div class="item-quantity">
        <button
          mat-mini-fab
          class="minifab"
          (click)="updateItemQuantity(quantity - 1)"
          [disabled]="quantity <= 1"
          aria-label="Decrease quantity"
        >
          <mat-icon>remove</mat-icon>
        </button>
        <span class="quantity-value">{{ quantity }}</span>
        <button
          mat-mini-fab
          class="minifab"
          (click)="updateItemQuantity(quantity + 1)"
          [disabled]="quantity >= availableStock"
          aria-label="Increase quantity"
        >
          <mat-icon>add</mat-icon>
        </button>
      </div>
      <span class="item-price">{{ price | currency }}</span>

      <button
        mat-mini-fab
        class="minifab"
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
        padding: 16px 8px;
        border-bottom: 1px solid var(--app-border);
        gap: 16px;
      }

      .cart-item:last-child {
        border-bottom: none;
      }

      .item-details {
        display: flex;
        align-items: center;
        gap: 12px;
        flex: 1;
      }

      .item-details mat-icon {
        width: 24px;
        height: 24px;
        color: var(--app-muted);
      }

      .item-name {
        font-weight: 500;
        color: var(--app-fg);
        font-size: 14px;
      }

      .item-quantity {
        display: flex;
        align-items: center;
        gap: 8px;
        color: var(--app-muted);
        font-size: 13px;
      }

      .item-price {
        color: var(--app-fg);
        font-weight: 500;
        font-size: 14px;
        min-width: 60px;
        text-align: right;
      }

      .minifab {
        box-shadow: none;
        color: var(--app-fg);
        background-color: transparent;
      }

      .minifab:disabled {
        visibility: hidden;
      }

      img {
        width: 48px;
        height: 48px;
        object-fit: cover;
        border-radius: var(--app-radius-sm);
        border: 1px solid var(--app-border);
        display: block;
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
      next: (res) => {
        this.remove.emit();
      },
      error: (err) => {
        console.error(err);
      },
    });
  }
}
