import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { toSignal } from "@angular/core/rxjs-interop";
import { shareReplay, switchMap } from "rxjs";
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
    <section class="container details-section animate-fade-in">
      @if (product(); as p) {
        <a mat-button class="back-btn" routerLink="/products">
          <mat-icon>arrow_back</mat-icon>
          <span>Back to products</span>
        </a>

        <div class="grid">
          <!-- Image Gallery Column -->
          <div class="gallery app-card delay-1">
            <div
              class="main-image-wrap"
              (click)="previewOpen.set(true)"
              title="Click to expand view"
            >
              @if (activeImage(); as img) {
                <img [src]="img | safeUrl" [alt]="p.name" />
                <div class="expand-overlay">
                  <mat-icon>zoom_in</mat-icon>
                  <span>Click to view full image</span>
                </div>
              } @else {
                <div class="ph">
                  <mat-icon>storefront</mat-icon>
                  <span>No image available</span>
                </div>
              }
            </div>

            @if (p.images.length > 1) {
              <div class="thumbs">
                @for (image of p.images; track image.id) {
                  <button
                    type="button"
                    class="thumb"
                    (click)="active.set($index)"
                    [class.on]="active() === $index"
                    [attr.aria-label]="'View image ' + ($index + 1)"
                  >
                    <img [src]="image.url | safeUrl" alt="" />
                  </button>
                }
              </div>
            }
          </div>

          <!-- Product Details Column -->
          <div class="info-card app-card stack delay-2">
            <div class="header-area">
              <!-- Pill Group for Stock and Category -->
              <div class="pill-group">
                <span class="stock-pill" [class.out-of-stock]="p.quantity <= 0">
                  <mat-icon>inventory_2</mat-icon>
                  <span>{{
                    p.quantity > 0 ? "In Stock: " + p.quantity : "Out of Stock"
                  }}</span>
                </span>

                @if (p.categoryName) {
                  <span class="category-pill">
                    <mat-icon>category</mat-icon>
                    <span>{{ p.categoryName }}</span>
                  </span>
                }

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

              <h1 class="title">{{ p.name }}</h1>

              <div class="price-box">
                <span class="currency">$</span>
                <span class="amount">{{ p.price | number: "1.2-2" }}</span>
              </div>
            </div>

            <!-- Seller Information Badge -->
            @if (seller(); as seller) {
              <div class="seller-card">
                <app-user-avatar [user]="seller" [size]="44" />

                <div class="seller-details">
                  <span class="seller-role">
                    <mat-icon class="verified-icon">verified</mat-icon>
                    Verified Seller
                  </span>
                  <strong class="seller-name">{{ seller.name }}</strong>
                </div>
              </div>
            }

            <p class="description excerpt">{{ p.description }}</p>

            @if (ableToBuy() && cartQuantity() == 0) {
              <div class="purchase-action-box">
                <div class="quantity-selector">
                  <label>Quantity</label>
                  <div class="pro-stepper">
                    <button
                      type="button"
                      class="stepper-btn"
                      (click)="quantity.set(quantity() - 1)"
                      [disabled]="quantity() <= 1"
                      aria-label="Decrease quantity"
                    >
                      <mat-icon>remove</mat-icon>
                    </button>
                    <span class="quantity-value">{{ quantity() }}</span>
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
                <!-- Desktop quick add to cart inside the box -->
                <button
                  class="btn btn-primary buy-btn-large"
                  (click)="addToCart()"
                >
                  <mat-icon>add_shopping_cart</mat-icon>
                  <span>Add to cart</span>
                </button>
              </div>
            }

            <div class="divider"></div>

            <!-- Description Block -->
            <div class="description-block">
              <h3>Product Description</h3>
              <p class="description-text">
                {{
                  p.description ||
                    "No detailed description provided by the seller."
                }}
              </p>
            </div>

            <!-- Main Action Controls -->
            <div class="actions-group">
              @if (!ownedByMe() && (!ableToBuy() || cartQuantity() > 0)) {
                <button
                  type="button"
                  class="btn btn-primary buy-btn"
                  [disabled]="p.quantity <= 0"
                  (click)="addToCart()"
                >
                  <mat-icon>shopping_bag</mat-icon>
                  <span>{{ p.quantity > 0 ? "Buy Now" : "Out of Stock" }}</span>
                </button>
              }

              @if (!currentUser.user()) {
                <div class="auth-prompt">
                  <div class="auth-text">
                    <mat-icon>lock</mat-icon>
                    <span class="muted">Sign in to purchase</span>
                  </div>
                  <a
                    routerLink="/auth/register"
                    class="btn btn-outline connect-btn"
                  >
                    Create account
                  </a>
                </div>
              }

              @if (cartQuantity() > 0) {
                <div class="in-cart-card">
                  <div class="in-cart-header">
                    <mat-icon class="check-icon">check_circle</mat-icon>
                    <span
                      ><strong>{{ cartQuantity() }}</strong> in your cart</span
                    >
                  </div>

                  <div class="in-cart-body">
                    <div class="pro-stepper small-stepper">
                      <button
                        type="button"
                        class="stepper-btn"
                        (click)="quantity.set(quantity() - 1)"
                        [disabled]="quantity() <= 1"
                        aria-label="Decrease quantity"
                      >
                        <mat-icon>remove</mat-icon>
                      </button>
                      <span class="quantity-value">{{ quantity() }}</span>
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

                    <button
                      type="button"
                      class="btn btn-secondary update-btn"
                      (click)="updateCart()"
                      [disabled]="quantity() == cartQuantity()"
                    >
                      Update
                    </button>
                  </div>

                  <a class="btn btn-primary checkout-btn" routerLink="/cart">
                    <mat-icon>shopping_cart_checkout</mat-icon> Proceed to
                    Checkout
                  </a>
                </div>
              }
            </div>
          </div>
        </div>

        <app-image-preview
          [open]="previewOpen()"
          [imageUrl]="activeImage() ?? ''"
          [title]="product()?.name ?? 'Image Preview'"
          (closed)="previewOpen.set(false)"
        />
      } @else {
        <app-loading-spinner label="Loading product details…" />
      }
    </section>
  `,
  styles: [
    `
      .details-section {
        padding-top: 24px;
        padding-bottom: 80px;
      }

      .back-btn {
        margin-bottom: 24px;
        font-weight: 600;
        color: var(--app-muted) !important;
        transition: color var(--transition-fast) !important;
      }
      .back-btn:hover {
        color: var(--app-fg-heading) !important;
      }
      .back-btn mat-icon {
        margin-right: 6px;
        transition: transform var(--transition-fast);
      }
      .back-btn:hover mat-icon {
        transform: translateX(-4px);
      }

      .grid {
        display: grid;
        grid-template-columns: 1.15fr 1fr;
        gap: 32px;
        align-items: start;
      }

      /* Adding baseline opacity for animations */
      .gallery,
      .info-card {
        opacity: 0;
        animation: fadeInUp 0.4s var(--ease-out) forwards;
      }

      @media (max-width: 960px) {
        .grid {
          grid-template-columns: 1fr;
          gap: 24px;
        }
      }

      .gallery {
        padding: 20px;
        background: var(--app-surface);
      }
      .info-card {
        padding: 32px;
        background: var(--app-surface);
      }

      /* ==========================================================================
         Image Gallery
         ========================================================================== */
      .main-image-wrap {
        position: relative;
        border-radius: var(--app-radius);
        overflow: hidden;
        aspect-ratio: 4 / 3;
        background: var(--app-bg-alt);
        cursor: zoom-in;
        border: 1px solid var(--app-border);
        box-shadow: var(--app-shadow-sm);
      }

      .main-image-wrap img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.5s var(--ease-out);
      }

      .main-image-wrap:hover img {
        transform: scale(1.03);
      }

      /* Premium glassmorphism overlay */
      .expand-overlay {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.2);
        backdrop-filter: blur(4px);
        -webkit-backdrop-filter: blur(4px);
        color: #ffffff;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 12px;
        font-size: 14px;
        font-weight: 600;
        opacity: 0;
        transition: opacity var(--transition-normal);
      }

      .expand-overlay mat-icon {
        font-size: 32px;
        width: 32px;
        height: 32px;
      }

      .main-image-wrap:hover .expand-overlay {
        opacity: 1;
      }

      .ph {
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 12px;
        color: var(--app-muted-light);
      }
      .ph mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
      }

      .thumbs {
        display: flex;
        gap: 12px;
        margin-top: 16px;
        flex-wrap: wrap;
      }

      .thumb {
        padding: 0;
        background: var(--app-bg-alt);
        border-radius: var(--app-radius-sm);
        border: 2px solid transparent;
        overflow: hidden;
        cursor: pointer;
        transition: all var(--transition-fast);
        opacity: 0.7;
      }
      .thumb:hover {
        opacity: 1;
      }

      .thumb img {
        width: 72px;
        height: 72px;
        object-fit: cover;
        display: block;
      }

      /* Vercel-style focus ring */
      .thumb.on {
        opacity: 1;
        border-color: var(--app-surface);
        box-shadow: 0 0 0 2px var(--app-primary);
      }

      /* ==========================================================================
         Product Info & Pills
         ========================================================================== */
      .pill-group {
        display: flex;
        gap: 10px;
        margin-bottom: 16px;
        flex-wrap: wrap;
        align-items: center;
      }

      .stock-pill {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 4px 12px;
        border-radius: var(--app-radius-full);
        background: var(--app-success-light);
        color: var(--app-success);
        border: 1px solid rgba(16, 185, 129, 0.2);
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.02em;
      }
      .stock-pill.out-of-stock {
        background: var(--app-danger-light);
        color: var(--app-danger);
        border-color: rgba(239, 68, 68, 0.2);
      }
      .stock-pill mat-icon {
        font-size: 14px;
        width: 14px;
        height: 14px;
      }

      .category-pill {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 12px;
        border-radius: var(--app-radius-full);
        background: var(--app-bg-alt);
        border: 1px solid var(--app-border);
        color: var(--app-fg);
        font-size: 12px;
        font-weight: 600;
      }
      .category-pill mat-icon {
        font-size: 14px;
        width: 14px;
        height: 14px;
        color: var(--app-primary);
      }

      .edit-pill-btn {
        height: 28px !important;
        padding: 0 12px !important;
        font-size: 12px !important;
        font-weight: 600 !important;
        border-radius: var(--app-radius-full) !important;
      }

      .title {
        font-size: clamp(1.75rem, 3.5vw, 2.25rem);
        font-weight: 800;
        letter-spacing: -0.03em;
        line-height: 1.15;
        overflow-wrap: anywhere;
        margin: 0 0 16px;
        color: var(--app-fg-heading);
      }

      .price-box {
        display: flex;
        align-items: flex-start;
        gap: 4px;
        margin-bottom: 24px;
      }
      .price-box .currency {
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--app-muted);
        margin-top: 6px;
      }
      .price-box .amount {
        font-size: 2.75rem;
        font-weight: 800;
        letter-spacing: -0.04em;
        color: var(--app-fg-heading);
        line-height: 1;
      }

      /* ==========================================================================
         Seller Card
         ========================================================================== */
      .seller-card {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 14px 16px;
        background: var(--app-bg-alt);
        border: 1px solid var(--app-border);
        border-radius: var(--app-radius-sm);
        margin-bottom: 20px;
        transition: background-color var(--transition-fast);
      }
      .seller-card:hover {
        background: var(--app-surface-hover);
      }

      .seller-details {
        display: flex;
        flex-direction: column;
        line-height: 1.4;
      }
      .seller-role {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        font-weight: 600;
        color: var(--app-primary);
      }
      .verified-icon {
        font-size: 14px;
        width: 14px;
        height: 14px;
      }
      .seller-name {
        font-size: 15px;
        font-weight: 700;
        color: var(--app-fg-heading);
      }

      .description.excerpt {
        font-size: 15px;
        color: var(--app-muted);
        line-height: 1.6;
        margin-bottom: 24px;
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .divider {
        height: 1px;
        background: var(--app-border);
        margin: 24px 0;
      }

      .description-block h3 {
        font-size: 16px;
        font-weight: 700;
        margin: 0 0 12px;
        color: var(--app-fg-heading);
      }
      .description-text {
        font-size: 15px;
        line-height: 1.7;
        color: var(--app-muted);
        margin: 0;
        white-space: pre-line;
      }

      /* ==========================================================================
         Actions & Unified Stepper
         ========================================================================== */
      .actions-group {
        display: flex;
        flex-direction: column;
        gap: 16px;
        margin-top: 32px;
        width: 100%;
      }

      .buy-btn {
        width: 100%;
        height: 48px;
        font-size: 15px;
        font-weight: 600;
      }

      .purchase-action-box {
        display: flex;
        align-items: center;
        gap: 20px;
        background: var(--app-bg-alt);
        padding: 16px;
        border-radius: var(--app-radius-sm);
        border: 1px solid var(--app-border);
      }

      .buy-btn-large {
        flex: 1;
        height: 44px;
        font-size: 15px;
      }

      .auth-prompt {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px;
        background: var(--app-bg-alt);
        border-radius: var(--app-radius-sm);
        border: 1px solid var(--app-border);
      }

      .auth-text {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        font-weight: 500;
        color: var(--app-muted);
      }
      .auth-text mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      /* Pro Pill Stepper */
      .quantity-selector {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .quantity-selector label {
        font-size: 13px;
        font-weight: 600;
        color: var(--app-muted);
      }

      .pro-stepper {
        display: inline-flex;
        align-items: center;
        background: var(--app-surface);
        border: 1px solid var(--app-border);
        border-radius: var(--app-radius-full);
        padding: 4px;
      }

      .stepper-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: none;
        background: transparent;
        color: var(--app-fg);
        cursor: pointer;
        transition: background-color var(--transition-fast);
      }

      .stepper-btn mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      .stepper-btn:hover:not(:disabled) {
        background: var(--app-surface-hover);
      }

      .stepper-btn:disabled {
        opacity: 0.3;
        cursor: not-allowed;
      }

      .quantity-value {
        min-width: 32px;
        text-align: center;
        font-size: 15px;
        font-weight: 700;
        color: var(--app-fg-heading);
      }

      /* ==========================================================================
         In-Cart Banner
         ========================================================================== */
      .in-cart-card {
        display: flex;
        flex-direction: column;
        gap: 16px;
        padding: 20px;
        background: var(--app-primary-lighter);
        border: 1px solid var(--app-primary-light);
        border-radius: var(--app-radius-sm);
      }

      .dark-theme .in-cart-card {
        background: rgba(250, 250, 250, 0.03);
        border-color: rgba(250, 250, 250, 0.1);
      }

      .in-cart-header {
        display: flex;
        align-items: center;
        gap: 8px;
        color: var(--app-primary);
        font-size: 15px;
      }

      .in-cart-header span {
        color: var(--app-fg-heading);
      }

      .check-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      .in-cart-body {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .small-stepper {
        padding: 2px;
      }

      .small-stepper .stepper-btn {
        width: 28px;
        height: 28px;
      }
      .small-stepper mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }

      .update-btn {
        height: 36px;
        padding: 0 16px;
      }

      .checkout-btn {
        width: 100%;
        height: 48px;
        font-size: 15px;
      }
    `,
  ],
})
export class ProductDetailsPage {
  private readonly route = inject(ActivatedRoute);
  private readonly svc = inject(ProductService);
  private readonly userService = inject(UserService);
  private readonly cartService = inject(CartService);
  private readonly toast = inject(NotificationService);
  readonly currentUser = inject(CurrentUserService);

  private readonly product$ = this.route.paramMap.pipe(
    switchMap((params) => this.svc.get(params.get("id")!)),
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

      console.log(this.product());

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
