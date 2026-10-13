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
    <section class="container cart-section animate-fade-in">
      <div class="page-header">
        <h1 class="page-title">Shopping Cart</h1>
        @if (cart()?.items?.length) {
          <span class="item-count-badge animate-pop-in"
            >{{ itemCount() }} items</span
          >
        }
      </div>

      @if (cart(); as c) {
        @if (c.items.length === 0) {
          <!-- Empty State -->
          <div class="empty-state animate-fade-in">
            <div class="empty-icon-wrap">
              <mat-icon>shopping_cart</mat-icon>
            </div>
            <h2>Your cart is empty</h2>
            <p class="muted">
              Looks like you haven't added anything to your cart yet.
            </p>
            <a class="btn btn-primary continue-btn" routerLink="/products">
              <mat-icon>arrow_back</mat-icon>
              <span>Continue Shopping</span>
            </a>
          </div>
        } @else {
          <!-- Pro 2-Column Cart Layout -->
          <div class="cart-grid">
            <!-- Left Column: Items List -->
            <div class="cart-items-column">
              <div class="app-card items-card delay-1">
                <div class="items-header">
                  <h3>Product Details</h3>
                  <button
                    type="button"
                    class="btn btn-ghost clear-btn"
                    (click)="clearCart()"
                  >
                    <mat-icon>remove_shopping_cart</mat-icon>
                    <span class="hide-mobile">Clear cart</span>
                  </button>
                </div>

                <div class="cart-items-list">
                  @for (item of c.items; track item.productId) {
                    <div class="cart-item-wrapper">
                      <app-cart-item
                        [productId]="item.productId"
                        [quantity]="item.quantity"
                        [price]="item.price"
                        [productName]="item.productName"
                        [imageUrl]="item.imageUrl"
                        [availableStock]="item.availableStock"
                        (quantityChange)="
                          updateItemQuantity(item.productId, $event)
                        "
                        (remove)="removeItem(item.productId)"
                      />
                    </div>
                  }
                </div>
              </div>
            </div>

            <!-- Right Column: Order Summary (Sticky) -->
            <div class="summary-column delay-2">
              <div class="app-card summary-card sticky-summary">
                <h3 class="summary-title">Order Summary</h3>

                <div class="summary-body">
                  <div class="summary-row">
                    <span class="muted"
                      >Subtotal ({{ itemCount() }} items)</span
                    >
                    <span class="summary-val">{{
                      cartTotal() | currency
                    }}</span>
                  </div>

                  <div class="summary-row">
                    <span class="muted">Shipping & Taxes</span>
                    <span class="summary-val text-sm"
                      >Calculated at checkout</span
                    >
                  </div>

                  <div class="summary-divider"></div>

                  <div class="summary-row total-row">
                    <span>Total</span>
                    <span class="total-price">{{
                      cartTotal() | currency
                    }}</span>
                  </div>
                </div>

                <div class="summary-actions">
                  <a
                    class="btn btn-primary checkout-btn"
                    routerLink="/checkout"
                  >
                    <span>Proceed to Checkout</span>
                    <mat-icon class="arrow-icon">arrow_forward</mat-icon>
                  </a>

                  <div class="secure-checkout">
                    <mat-icon>lock</mat-icon>
                    <span>Secure Encrypted Checkout</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        }
      } @else {
        <app-loading-spinner label="Loading your cart…" />
      }
    </section>
  `,
  styles: [
    `
      .cart-section {
        padding-top: 40px;
        padding-bottom: 80px;
      }

      /* ==========================================================================
         Page Header
         ========================================================================== */
      .page-header {
        display: flex;
        align-items: baseline;
        gap: 16px;
        margin-bottom: 32px;
      }

      .page-title {
        font-size: clamp(2rem, 4vw, 2.5rem);
        font-weight: 800;
        letter-spacing: -0.03em;
        margin: 0;
        color: var(--app-fg-heading);
      }

      .item-count-badge {
        font-size: 13px;
        font-weight: 700;
        padding: 4px 12px;
        border-radius: var(--app-radius-full);
        background: var(--app-bg-alt);
        color: var(--app-muted);
        border: 1px solid var(--app-border);
      }

      /* ==========================================================================
         Empty State (Redesigned)
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
      }

      /* ==========================================================================
         Pro 2-Column Grid
         ========================================================================== */
      .cart-grid {
        display: grid;
        grid-template-columns: 1fr 380px; /* Golden ratio for checkout screens */
        gap: 32px;
        align-items: start; /* Required for sticky summary to work */
      }

      @media (max-width: 960px) {
        .cart-grid {
          grid-template-columns: 1fr;
        }
      }

      /* Add baseline opacity for sequence loading */
      .cart-items-column,
      .summary-column {
        opacity: 0;
        animation: fadeInUp 0.4s var(--ease-out) forwards;
      }

      /* ==========================================================================
         Items List (Left Column)
         ========================================================================== */
      .items-card {
        padding: 0; /* padding applied to internal elements for full-bleed borders */
        overflow: hidden;
      }

      .items-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px 24px;
        background: var(--app-bg-alt);
        border-bottom: 1px solid var(--app-border);
      }

      .items-header h3 {
        font-size: 1.1rem;
        font-weight: 700;
        margin: 0;
        color: var(--app-fg-heading);
      }

      .clear-btn {
        color: var(--app-danger) !important;
        height: 32px;
        padding: 0 12px;
      }

      .cart-items-list {
        display: flex;
        flex-direction: column;
      }

      .cart-item-wrapper {
        padding: 24px;
        border-bottom: 1px solid var(--app-border);
      }
      .cart-item-wrapper:last-child {
        border-bottom: none;
      }

      /* ==========================================================================
         Order Summary (Right Column - Sticky)
         ========================================================================== */
      .sticky-summary {
        position: sticky;
        top: 24px; /* Sticks 24px from top of viewport when scrolling */
        padding: 28px;
      }

      .summary-title {
        font-size: 1.25rem;
        font-weight: 800;
        margin: 0 0 24px;
        color: var(--app-fg-heading);
      }

      .summary-body {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .summary-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 15px;
      }

      .summary-val {
        font-weight: 600;
        color: var(--app-fg-heading);
      }

      .text-sm {
        font-size: 13px;
        color: var(--app-muted);
      }

      .summary-divider {
        height: 1px;
        background: var(--app-border);
        margin: 8px 0;
      }

      .total-row {
        font-size: 1.1rem;
        font-weight: 700;
        color: var(--app-fg-heading);
        margin-bottom: 8px;
      }

      .total-price {
        font-size: 2rem;
        font-weight: 800;
        letter-spacing: -0.04em;
        color: var(--app-primary);
        line-height: 1;
      }

      .summary-actions {
        margin-top: 32px;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .checkout-btn {
        width: 100%;
        height: 52px;
        font-size: 16px;
        font-weight: 600;
      }

      .checkout-btn .arrow-icon {
        margin-left: 4px;
        transition: transform var(--transition-normal);
      }

      .checkout-btn:hover .arrow-icon {
        transform: translateX(4px);
      }

      .secure-checkout {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        font-size: 12px;
        font-weight: 600;
        color: var(--app-muted);
      }
      .secure-checkout mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }

      /* Mobile Adjustments */
      @media (max-width: 600px) {
        .items-header {
          padding: 16px;
        }
        .cart-item-wrapper {
          padding: 16px;
        }
        .hide-mobile {
          display: none;
        }
        .clear-btn {
          padding: 0 8px;
        }
        .sticky-summary {
          padding: 20px;
        }
        .total-price {
          font-size: 1.5rem;
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
