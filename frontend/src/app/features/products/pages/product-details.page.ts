import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { toSignal } from "@angular/core/rxjs-interop";
import { catchError, shareReplay, switchMap, tap, throwError } from "rxjs";
import { ProductService } from "@core/services/product.service";
import { Product } from "@core/models/product.model";
import { LoadingSpinnerComponent } from "@shared/components/loading-spinner.component";
import { SafeUrlPipe } from "@shared/pipes/safe-url.pipe";
import { UserService } from "@core/services/user.service";
import { UserWidget } from "@core/models/user.model";
import { CurrentUserService } from "@core/services/current-user.service";
import { ImagePreviewComponent } from "@shared/components/image-preview.component";
import { NotificationService } from "@core/services/notification.service";
import { CartService } from "@core/services/cart.service";
import { UserAvatarComponent } from "@shared/components/user-avatar.component";

@Component({
  selector: "app-product-details",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    LoadingSpinnerComponent,
    SafeUrlPipe,
    ImagePreviewComponent,
    UserAvatarComponent,
  ],
  template: `
    <section class="container details-section">
      @if (product(); as p) {
        <!-- Back Navigation -->
        <a mat-button class="back-btn" routerLink="/products">
          <mat-icon>arrow_back</mat-icon>
          <span>Back to products</span>
        </a>

        <div class="product-layout">
          <!-- Left Column: Image Gallery -->
          <div class="gallery-card app-card">
            <div
              class="main-image-wrap"
              (click)="previewOpen.set(true)"
              title="Click to zoom image"
            >
              @if (activeImage(); as img) {
                <img [src]="img | safeUrl" [alt]="p.name" />
                <div class="expand-overlay">
                  <mat-icon>zoom_in</mat-icon>
                  <span>Click to expand image</span>
                </div>
              } @else {
                <div class="image-placeholder">
                  <mat-icon>storefront</mat-icon>
                  <span>No image available</span>
                </div>
              }
            </div>

            <!-- Thumbnail Selector -->
            @if (p.images && p.images.length > 1) {
              <div class="thumbs-row">
                @for (image of p.images; track image.id) {
                  <button
                    type="button"
                    class="thumb-btn"
                    (click)="active.set($index)"
                    [class.active]="active() === $index"
                    [attr.aria-label]="'Select image ' + ($index + 1)"
                  >
                    <img [src]="image.url | safeUrl" alt="Thumbnail" />
                  </button>
                }
              </div>
            }
          </div>

          <!-- Right Column: Product Overview & Purchase -->
          <div class="info-card app-card">
            <!-- Header Badges -->
            <div class="product-meta-header">
              <div class="pill-group">
                <span class="stock-pill" [class.out-of-stock]="p.quantity <= 0">
                  <span class="stock-dot"></span>
                  <span>{{
                    p.quantity > 0 ? p.quantity + " in stock" : "Out of Stock"
                  }}</span>
                </span>

                @if (p.categoryName) {
                  <span class="category-pill">
                    <mat-icon>category</mat-icon>
                    <span>{{ p.categoryName }}</span>
                  </span>
                }
              </div>

              @if (ownedByMe()) {
                <a
                  class="btn btn-outline edit-pill-btn"
                  [routerLink]="['/seller/products', p.id, 'edit']"
                >
                  <mat-icon>edit</mat-icon>
                  <span>Edit Product</span>
                </a>
              }
            </div>

            <!-- Title & Pricing -->
            <h1 class="product-title">{{ p.name }}</h1>

            <div class="price-wrap">
              <span class="currency">$</span>
              <span class="amount">{{ p.price | number: "1.2-2" }}</span>
            </div>

            <!-- Seller Card -->
            @if (seller(); as s) {
              <div class="seller-card">
                <app-user-avatar [user]="s" [size]="40" />
                <div class="seller-info">
                  <span class="seller-label">Sold by</span>
                  <span class="seller-name">{{ s.name }}</span>
                </div>
              </div>
            }

            <div class="divider"></div>

            <!-- Description -->
            <div class="description-section">
              <h2 class="section-heading">Description</h2>
              <p class="description-text">
                {{
                  p.description || "No description provided for this product."
                }}
              </p>
            </div>

            <div class="divider"></div>

            <!-- Actions / Buying Flow -->
            <div class="purchase-box">
              @if (ownedByMe()) {
                <!-- Seller View -->
                <div class="owner-notice">
                  <mat-icon>storefront</mat-icon>
                  <span>You are the seller of this product listing.</span>
                </div>
              } @else if (!currentUser.user()) {
                <!-- Unauthenticated View -->
                <div class="auth-prompt">
                  <div class="auth-prompt-text">
                    <mat-icon>lock_outline</mat-icon>
                    <span>Sign in or create an account to purchase</span>
                  </div>
                  <a routerLink="/auth/register" class="btn btn-primary btn-sm">
                    Create Account
                  </a>
                </div>
              } @else if (cartQuantity() === 0) {
                <!-- Not in Cart: Quantity + Add to Cart -->
                <div class="add-to-cart-flow">
                  <div class="stepper-row">
                    <span class="stepper-label">Select Quantity:</span>
                    <div class="quantity-stepper">
                      <button
                        type="button"
                        class="stepper-btn"
                        (click)="quantity.set(quantity() - 1)"
                        [disabled]="quantity() <= 1"
                        aria-label="Decrease quantity"
                      >
                        <mat-icon>remove</mat-icon>
                      </button>
                      <span class="quantity-num">{{ quantity() }}</span>
                      <button
                        type="button"
                        class="stepper-btn"
                        (click)="quantity.set(quantity() + 1)"
                        [disabled]="quantity() >= (p.quantity || 1)"
                        aria-label="Increase quantity"
                      >
                        <mat-icon>add</mat-icon>
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    class="btn btn-primary action-cta-btn"
                    [disabled]="p.quantity <= 0"
                    (click)="addToCart()"
                  >
                    <mat-icon>add_shopping_cart</mat-icon>
                    <span>{{
                      p.quantity > 0 ? "Add to Cart" : "Out of Stock"
                    }}</span>
                  </button>
                </div>
              } @else {
                <!-- Already in Cart: Update / View Cart -->
                <div class="in-cart-box">
                  <div class="in-cart-header">
                    <mat-icon class="check-icon">check_circle</mat-icon>
                    <span class="in-cart-status">
                      <strong>{{ cartQuantity() }}</strong> item{{
                        cartQuantity() > 1 ? "s" : ""
                      }}
                      currently in your cart
                    </span>
                  </div>

                  <div class="stepper-row in-cart-stepper">
                    <span class="stepper-label">Change quantity:</span>
                    <div class="quantity-stepper">
                      <button
                        type="button"
                        class="stepper-btn"
                        (click)="quantity.set(quantity() - 1)"
                        [disabled]="quantity() <= 1"
                        aria-label="Decrease quantity"
                      >
                        <mat-icon>remove</mat-icon>
                      </button>
                      <span class="quantity-num">{{ quantity() }}</span>
                      <button
                        type="button"
                        class="stepper-btn"
                        (click)="quantity.set(quantity() + 1)"
                        [disabled]="quantity() >= (p.quantity || 1)"
                        aria-label="Increase quantity"
                      >
                        <mat-icon>add</mat-icon>
                      </button>
                    </div>
                  </div>

                  <div class="in-cart-actions">
                    <button
                      type="button"
                      class="btn btn-outline"
                      (click)="updateCart()"
                      [disabled]="quantity() === cartQuantity()"
                    >
                      <mat-icon>cached</mat-icon>
                      <span>Update</span>
                    </button>
                    <a class="btn btn-primary" routerLink="/cart">
                      <mat-icon>shopping_cart</mat-icon>
                      <span>View Cart</span>
                    </a>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Fullscreen Image Preview Dialog -->
        <app-image-preview
          [open]="previewOpen()"
          [imageUrl]="activeImage() ?? ''"
          [title]="p.name"
          (closed)="previewOpen.set(false)"
        />
      } @else {
        <div class="loading-state">
          <app-loading-spinner label="Loading product details…" />
        </div>
      }
    </section>
  `,
  styles: [
    `
      .details-section {
        padding-top: 24px;
        padding-bottom: 72px;
      }

      .back-btn {
        margin-bottom: 20px;
        color: var(--app-muted) !important;
        font-size: 13.5px;
      }
      .back-btn mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        margin-right: 4px;
      }

      /* 2-Column Responsive Layout */
      .product-layout {
        display: grid;
        grid-template-columns: 1.15fr 1fr;
        gap: 32px;
        align-items: start;
      }

      /* Gallery Column */
      .gallery-card {
        padding: 16px;
        border-radius: var(--app-radius-lg);
        background: var(--app-surface);
      }

      .main-image-wrap {
        position: relative;
        border-radius: var(--app-radius);
        overflow: hidden;
        aspect-ratio: 4 / 3;
        background: var(--app-bg-alt);
        cursor: pointer;
        border: 1px solid var(--app-border);
      }
      .main-image-wrap img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.3s ease;
      }
      .main-image-wrap:hover img {
        transform: scale(1.02);
      }

      .expand-overlay {
        position: absolute;
        inset: auto 0 0 0;
        padding: 14px;
        background: linear-gradient(to top, rgba(0, 0, 0, 0.65), transparent);
        color: #ffffff;
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        font-weight: 500;
        opacity: 0;
        transition: opacity 0.2s ease;
      }
      .main-image-wrap:hover .expand-overlay {
        opacity: 1;
      }

      .image-placeholder {
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 8px;
        color: var(--app-muted);
      }
      .image-placeholder mat-icon {
        font-size: 44px;
        width: 44px;
        height: 44px;
      }

      .thumbs-row {
        display: flex;
        gap: 12px;
        margin-top: 16px;
        flex-wrap: wrap;
      }

      .thumb-btn {
        width: 64px;
        height: 64px;
        padding: 0;
        background: var(--app-bg-alt);
        border-radius: var(--app-radius-sm);
        border: 1px solid var(--app-border);
        overflow: hidden;
        cursor: pointer;
        transition:
          border-color 0.15s ease,
          box-shadow 0.15s ease;
      }
      .thumb-btn img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .thumb-btn:hover {
        border-color: var(--app-border-hover);
      }
      .thumb-btn.active {
        border-color: var(--app-primary);
        box-shadow:
          0 0 0 2px var(--app-surface),
          0 0 0 4px var(--app-primary);
      }

      /* Product Info Column */
      .info-card {
        padding: 32px;
        border-radius: var(--app-radius-lg);
        background: var(--app-surface);
      }

      .product-meta-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 12px;
        flex-wrap: wrap;
      }

      .pill-group {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }

      .stock-pill {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 3px 10px;
        border-radius: var(--app-radius-full);
        background: var(--app-success-light);
        color: var(--app-success);
        border: 1px solid rgba(34, 197, 94, 0.2);
        font-size: 12px;
        font-weight: 600;
      }
      .stock-pill.out-of-stock {
        background: var(--app-danger-light);
        color: var(--app-danger);
        border-color: rgba(239, 68, 68, 0.2);
      }
      .stock-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: currentColor;
      }

      .category-pill {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 3px 10px;
        border-radius: var(--app-radius-full);
        background: var(--app-bg-alt);
        border: 1px solid var(--app-border);
        color: var(--app-muted);
        font-size: 12px;
        font-weight: 500;
      }
      .category-pill mat-icon {
        font-size: 14px;
        width: 14px;
        height: 14px;
      }

      .edit-pill-btn {
        height: 28px !important;
        padding: 0 10px !important;
        font-size: 12px !important;
        border-radius: var(--app-radius-full) !important;
      }
      .edit-pill-btn mat-icon {
        font-size: 14px !important;
        width: 14px !important;
        height: 14px !important;
      }

      .product-title {
        font-size: 1.75rem;
        font-weight: 800;
        letter-spacing: -0.035em;
        line-height: 1.25;
        color: var(--app-fg-heading);
        margin: 0 0 16px;
      }

      .price-wrap {
        display: flex;
        align-items: baseline;
        gap: 3px;
        margin-bottom: 20px;
      }
      .price-wrap .currency {
        font-size: 1.15rem;
        font-weight: 600;
        color: var(--app-muted);
      }
      .price-wrap .amount {
        font-size: 2.25rem;
        font-weight: 800;
        letter-spacing: -0.04em;
        color: var(--app-fg-heading);
      }

      /* Seller Card */
      .seller-card {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        border-radius: var(--app-radius-sm);
        background: var(--app-bg-alt);
        border: 1px solid var(--app-border);
      }
      .seller-info {
        display: flex;
        flex-direction: column;
        line-height: 1.35;
      }
      .seller-label {
        font-size: 11.5px;
        color: var(--app-muted);
      }
      .seller-name {
        font-size: 13.5px;
        font-weight: 600;
        color: var(--app-fg-heading);
      }

      .divider {
        height: 1px;
        background: var(--app-border);
        margin: 24px 0;
      }

      /* Description */
      .description-section {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .section-heading {
        font-size: 13px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--app-fg-heading);
        margin: 0;
      }
      .description-text {
        font-size: 14px;
        line-height: 1.6;
        color: var(--app-muted);
        margin: 0;
      }

      /* Purchase / Cart Actions */
      .purchase-box {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .stepper-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        margin-bottom: 12px;
      }
      .stepper-label {
        font-size: 13.5px;
        font-weight: 500;
        color: var(--app-fg-heading);
      }

      .quantity-stepper {
        display: flex;
        align-items: center;
        gap: 4px;
        background: var(--app-bg-alt);
        border: 1px solid var(--app-border);
        border-radius: var(--app-radius-sm);
        padding: 2px;
      }

      .stepper-btn {
        width: 32px;
        height: 32px;
        border-radius: var(--app-radius-sm);
        background: transparent;
        border: none;
        color: var(--app-fg);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background-color 0.15s ease;
      }
      .stepper-btn:hover:not(:disabled) {
        background: var(--app-surface);
      }
      .stepper-btn:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }
      .stepper-btn mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }

      .quantity-num {
        min-width: 32px;
        text-align: center;
        font-size: 14px;
        font-weight: 700;
        color: var(--app-fg-heading);
      }

      .action-cta-btn {
        width: 100%;
        height: 44px;
        font-size: 14px;
        gap: 8px;
      }

      /* In Cart Box */
      .in-cart-box {
        display: flex;
        flex-direction: column;
        gap: 14px;
        padding: 20px;
        border-radius: var(--app-radius);
        background: var(--app-bg-alt);
        border: 1px solid var(--app-border);
      }

      .in-cart-header {
        display: flex;
        align-items: center;
        gap: 8px;
        color: var(--app-success);
        font-size: 13.5px;
      }
      .check-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
      .in-cart-status {
        color: var(--app-fg-heading);
      }

      .in-cart-actions {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }

      /* Owner & Auth Alerts */
      .owner-notice {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 14px 16px;
        border-radius: var(--app-radius-sm);
        background: var(--app-primary-lighter);
        border: 1px solid var(--app-border);
        font-size: 13.5px;
        color: var(--app-fg-heading);
      }

      .auth-prompt {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        padding: 14px 16px;
        border-radius: var(--app-radius-sm);
        background: var(--app-bg-alt);
        border: 1px solid var(--app-border);
      }
      .auth-prompt-text {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13.5px;
        color: var(--app-muted);
      }
      .auth-prompt-text mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      .btn-sm {
        height: 34px !important;
        font-size: 13px !important;
        padding: 0 14px !important;
      }

      .loading-state {
        padding: 64px 0;
        display: flex;
        justify-content: center;
      }

      /* Responsive */
      @media (max-width: 900px) {
        .product-layout {
          grid-template-columns: 1fr;
          gap: 24px;
        }

        .info-card {
          padding: 24px;
        }

        .auth-prompt {
          flex-direction: column;
          align-items: stretch;
        }
      }
    `,
  ],
})
export class ProductDetailsPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly svc = inject(ProductService);
  private readonly userService = inject(UserService);
  private readonly cartService = inject(CartService);
  private readonly toast = inject(NotificationService);
  readonly currentUser = inject(CurrentUserService);

  private readonly product$ = this.route.paramMap.pipe(
    switchMap((params) => {
      return this.svc.get(params.get("id")!).pipe(
        catchError((err) => {
          if (err.status === 404) {
            this.router.navigateByUrl("/not-found");
          }

          return throwError(() => err.error);
        }),
      );
    }),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  readonly product = toSignal<Product | undefined>(this.product$, {
    initialValue: undefined,
  });

  readonly seller = toSignal<UserWidget | undefined>(
    this.product$.pipe(
      switchMap((product) => this.userService.getWidget(product.userId)),
    ),
    { initialValue: undefined },
  );

  readonly previewOpen = signal(false);

  readonly active = signal(0);
  readonly quantity = signal(1);
  readonly cartQuantity = signal(0);

  readonly activeImage = computed(
    () => this.product()?.images?.[this.active()]?.url ?? null,
  );

  readonly ownedByMe = computed(() => {
    const p = this.product();
    const u = this.currentUser.user();

    return !!p && !!u && p.userId === u.id;
  });

  readonly ableToBuy = computed(() => {
    const p = this.product();
    const u = this.currentUser.user();

    return !!u && !!p && !this.ownedByMe() && p.quantity > 0;
  });

  constructor() {
    effect(() => {
      const product = this.product();
      const user = this.currentUser.user();

      if (!product || !user) {
        this.quantity.set(1);
        return;
      }

      this.cartService.getItemQuantity(product.id).subscribe({
        next: (qty) => {
          if (qty) {
            this.quantity.set(qty);
            this.cartQuantity.set(qty);
          }
        },
        error: () => this.quantity.set(1),
      });
    });
  }

  addToCart() {
    const p = this.product();
    if (!p?.quantity) return;
    this.cartService
      .addToCart({
        productId: p.id,
        quantity: this.quantity(),
      })
      .subscribe({
        next: () => {
          this.toast.success("Product added! go to cart for checkout");
          this.cartQuantity.set(this.quantity());
        },
        error: (err) => {
          console.error(err);
        },
      });
  }

  updateCart(): void {
    const p = this.product();
    if (!p) return;
    this.cartService.updateItemQuantity(p.id, this.quantity()).subscribe({
      next: () => {
        this.cartQuantity.set(this.quantity());
        this.toast.success("Cart updated!");
      },
      error: (err) => {
        console.error(err);
      },
    });
  }
}
