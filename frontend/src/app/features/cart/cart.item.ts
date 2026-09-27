import { Component, Input, Output, EventEmitter } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";

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
          mat-icon-button
          (click)="decrease.emit()"
          [disabled]="quantity <= 1"
          aria-label="Decrease quantity"
        >
          <mat-icon>remove</mat-icon>
        </button>
        <span>{{ quantity }}</span>
        <button
          mat-icon-button
          (click)="increase.emit()"
          aria-label="Increase quantity"
        >
          <mat-icon>add</mat-icon>
        </button>
      </div>

      <span class="item-price">{{ price | currency }}</span>

      <button mat-icon-button (click)="remove.emit()" aria-label="Remove item">
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

      button.mat-icon-button {
        padding: 4px;
      }
    `,
  ],
})
export class CartItemComponent {
  @Input() productId!: string;
  @Input() quantity: number = 1;
  @Input() price: number = 0;
  @Input() productName: string = "";
  @Input() imageUrl: string | null = "";

  @Output() decrease = new EventEmitter<void>();
  @Output() increase = new EventEmitter<void>();
  @Output() remove = new EventEmitter<void>();
}
