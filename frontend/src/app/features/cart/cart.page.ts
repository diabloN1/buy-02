import { Component, computed, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";

import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { MatDividerModule } from "@angular/material/divider";

import { CartService } from "@core/services/cart.service";
import { LoadingSpinnerComponent } from "@shared/components/loading-spinner.component";
import { CartItemComponent } from "./cart.item";
import { Cart } from "@core/models/cart.model";
import { RouterModule } from "@angular/router";

@Component({
  selector: "app-cart",
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatDividerModule,
    LoadingSpinnerComponent,
    CartItemComponent,
    RouterModule,
  ],
  template: `
    <section class="container">
      <h1 class="page-title">Cart</h1>

      @if (cart(); as c) {
        @if (c.items.length === 0) {
          <div class="empty-state">
            <mat-icon>shopping_cart</mat-icon>
            <p>Your cart is empty</p>
            <a class="btn btn-primary" routerLink="/products">
              Continue Shopping
            </a>
          </div>
        } @else {
          <div class="card">
            <div class="cart-items">
              @for (item of c.items; track item.productId) {
                <app-cart-item
                  [productId]="item.productId"
                  [quantity]="item.quantity"
                  [price]="item.price"
                  [productName]="item.productName"
                  [imageUrl]="item.imageUrl"
                  [availableStock]="item.availableStock"
                  (quantityChange)="updateItemQuantity(item.productId, $event)"
                  (remove)="removeItem(item.productId)"
                />
              }
            </div>

            <mat-divider class="divider" />

            <div class="summary">
              <div class="total">
                <span>Total ({{ itemCount() }})</span>
                <span class="total-price">{{ cartTotal() | currency }}</span>
              </div>

              <div class="actions">
                <button type="button" class="btn btn-outline" (click)="clearCart()">
                  <mat-icon>delete</mat-icon> Clear cart
                </button>

                <a class="btn btn-primary" routerLink="/checkout">
                  Proceed to checkout
                </a>
              </div>
            </div>
          </div>
        }
      } @else {
        <app-loading-spinner label="Loading cart…" />
      }
    </section>
  `,
  styles: [
    `
      .page-title {
        font-size: 1.75rem;
        font-weight: 800;
        margin-bottom: 24px;
        color: var(--app-fg);
      }

      .card {
        background: var(--app-surface);
        border-radius: var(--app-radius);
        padding: 24px;
        box-shadow: var(--app-shadow);
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

      .empty-state p {
        margin-top: 8px;
        font-size: 1.1rem;
      }

      .empty-state a {
        margin-top: 24px;
      }

      .cart-items {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .divider {
        margin: 16px 0;
      }

      .summary {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .total {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 1.25rem;
        font-weight: 600;
      }

      .total-price {
        color: var(--app-primary);
        font-size: 1.5rem;
        font-weight: 800;
      }

      .actions {
        display: flex;
        gap: 8px;
        margin-top: 8px;
      }

      @media (max-width: 600px) {
        .summary, .total-price, .total {
          font-size: 0.8rem;
        }
        
        .actions {
          flex-direction: column;
        }

        .actions button {
          width: 100%;
        }
      }
    `,
  ],
})
export class CartPage {
  private readonly cartSvc = inject(CartService);

  readonly cart = signal<Cart | null | undefined>(undefined);

  readonly itemCount = computed(() => {
    const c = this.cart();
    return c?.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  });

  readonly cartTotal = computed(() => {
    const c = this.cart();
    return (
      c?.items?.reduce((sum, item) => sum + item.price * item.quantity, 0) ?? 0
    );
  });

  constructor() {
    this.cartSvc.getCart().subscribe({
      next: (cart) => this.cart.set(cart),
    });
  }

  updateItemQuantity(productId: string, quantity: number): void {
    this.cart.update((currentCart) => {
      if (!currentCart) return null;
      return {
        ...currentCart,
        items: currentCart.items.map((item) =>
          item.productId === productId ? { ...item, quantity } : item,
        ),
      };
    });
  }

  removeItem(productId: string) {
    this.cart.update((currentCart) => {
      if (!currentCart) return null;
      return {
        ...currentCart,
        items: currentCart.items.filter((item) => item.productId != productId),
      };
    });
  }

  clearCart(): void {
    this.cartSvc.clearCart().subscribe({
      next: () => {
        const currentCart = this.cart();

        if (currentCart) {
          this.cart.set({
            ...currentCart,
            items: [],
          });
        }
      },
      error: () => {},
    });
  }
}
