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
    <section class="container details-section">
      @if (product(); as p) {
        <a mat-button class="back-btn" routerLink="/products">
          <mat-icon>arrow_back</mat-icon>
          <span>Back to products</span>
        </a>

        <div class="grid">
          <!-- Image Gallery Column -->
          <div class="gallery app-card">
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
          <div class="info-card app-card stack">
            <div class="header-area">
              <!-- ADDED: Pill Group for Stock and Category -->
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
                <app-user-avatar
                  [user]="seller"
                  [size]="40"
                />

                <div class="seller-details">
                  <span class="seller-role">Verified Seller</span>
                  <strong class="seller-name">{{ seller.name }}</strong>
                </div>
              </div>
            }
            <p class="description">{{ p.description }}</p>
            <div class="stock-tag">
              @if (p.quantity > 0) {
                <mat-icon
                  style="font-size: 18px; width: 18px; height: 18px; margin-right: 4px;"
                >
                  inventory_2
                </mat-icon>
                In stock: {{ p.quantity }}
              } @else {
                <span class="out-of-stock">
                  <mat-icon>outlined_flag</mat-icon>
                  Out of stock
                </span>
              }
            </div>

            @if (ableToBuy() && cartQuantity() == 0) {
              <div class="in-cart-card">
                <div class="quantity-selector">
                  <label>Quantity:</label>
                  <div class="quantity-stepper">
                    <button
                      matMiniFab
                      class="minifab"
                      (click)="quantity.set(quantity() - 1)"
                      [disabled]="quantity() <= 1"
                      aria-label="Decrease quantity"
                    >
                      <mat-icon>remove</mat-icon>
                    </button>
                    <span class="quantity-value">{{ quantity() }}</span>
                    <button
                      matMiniFab
                      class="minifab"
                      (click)="quantity.set(quantity() + 1)"
                      [disabled]="quantity() >= (p.quantity || 1)"
                      aria-label="Increase quantity"
                    >
                      <mat-icon>add</mat-icon>
                    </button>
                  </div>
                </div>
                <a mat-flat-button color="primary" (click)="addToCart()">
                  <mat-icon>add_shopping_cart</mat-icon> Add to cart
                </a>
              </div>
            }
            <div class="divider"></div>

            <!-- Description -->
            <div class="description-block">
              <h3>Product Description</h3>
              <p class="description-text">
                {{
                  p.description ||
                    "No detailed description provided by the seller."
                }}
              </p>
            </div>

            <!-- Action Controls -->
            <div class="actions-group">
              @if (!ownedByMe()) {
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
                  <span class="muted">Want to buy?</span>
                  <a
                    routerLink="/auth/register"
                    class="btn btn-outline connect-btn"
                  >
                    <mat-icon>login</mat-icon> Create account!
                  </a>
                </div>
              }

              @if (cartQuantity() > 0) {
                <div class="in-cart-card">
                  <div class="quantity-display">
                    <span>Update quantity:</span>
                    <div class="quantity-stepper">
                      <button
                        type="button"
                        class="btn btn-outline stepper-btn"
                        (click)="quantity.set(quantity() - 1)"
                        [disabled]="quantity() <= 1"
                        aria-label="Decrease quantity"
                      >
                        <mat-icon>remove</mat-icon>
                      </button>
                      <span class="quantity-value">{{ quantity() }}</span>
                      <button
                        type="button"
                        class="btn btn-outline stepper-btn"
                        (click)="quantity.set(quantity() + 1)"
                        [disabled]="quantity() >= (p.quantity || 1)"
                        aria-label="Increase quantity"
                      >
                        <mat-icon>add</mat-icon>
                      </button>
                    </div>
                  </div>
                  <div class="in-cart-message">
                    <mat-icon class="check-icon">check_circle</mat-icon>
                    <span>{{ cartQuantity() }} already in cart</span>
                  </div>
                  <div class="in-cart-actions">
                    <button
                      type="button"
                      class="btn btn-outline"
                      (click)="updateCart()"
                      [disabled]="quantity() == cartQuantity()"
                    >
                      <mat-icon>cached</mat-icon> Update quantity
                    </button>
                    <a class="btn btn-primary" routerLink="/cart">
                      <mat-icon>shopping_cart</mat-icon> View Cart
                    </a>
                  </div>
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
        padding-bottom: 64px;
      }

  
      .back-btn {
        margin-bottom: 24px;
        font-weight: 500;
        color: var(--app-muted) !important;
        border-radius: var(--app-radius-sm);
      }
      .back-btn:hover {
        color: var(--app-primary) !important;
        background: var(--app-primary-lighter) !important;
      }

      .grid {
        display: grid;
        grid-template-columns: 1.1fr 1fr;
        gap: 32px;
        align-items: start;
      }
      @media (max-width: 860px) {
        .grid {
          grid-template-columns: 1fr;
          gap: 24px;
        }
      }

      .gallery {
        padding: 20px;
        background: var(--app-surface);
      }

      .main-image-wrap {
        position: relative;
        border-radius: var(--app-radius-sm);
        overflow: hidden;
        aspect-ratio: 4 / 3;
        background: var(--app-bg-alt);
        cursor: pointer;
      }
      .main-image-wrap img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.4s ease;
      }
      .main-image-wrap:hover img {
        transform: scale(1.03);
      }

      .expand-overlay {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        padding: 12px;
        background: linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent);
        color: #ffffff;
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        font-weight: 500;
        opacity: 0;
        transition: opacity 0.3s ease;
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
        gap: 8px;
        color: var(--app-muted);
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
        border: 2px solid transparent;
        padding: 0;
        background: none;
        border-radius: var(--app-radius-sm);
        overflow: hidden;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: var(--app-shadow-sm);
      }
      .thumb.on {
        border-color: var(--app-primary);
        transform: translateY(-2px);
        box-shadow: var(--app-glow);
      }
      .thumb img {
        width: 72px;
        height: 72px;
        object-fit: cover;
        display: block;
      }

      .info-card {
        padding: 28px;
        background: var(--app-surface);
      }


      .pill-group {
        display: flex;
        gap: 8px;
        margin-bottom: 12px;
        flex-wrap: wrap;
      }

      /* Typography & Badges */
      .stock-pill {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 12px;
        border-radius: var(--app-radius-full);
        background: var(--app-success-light);
        color: var(--app-success);
        font-size: 12px;
        font-weight: 700;
      }
      .stock-pill.out-of-stock {
        background: var(--app-danger-light);
        color: var(--app-danger);
      }
      .stock-pill mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
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
        font-size: 16px;
        width: 16px;
        height: 16px;
        color: var(--app-primary);
      }

      .edit-pill-btn {
        height: 28px !important;
        padding: 0 10px !important;
        font-size: 12px !important;
        font-weight: 500 !important;
        border-radius: var(--app-radius-full) !important;
        display: inline-flex !important;
        align-items: center !important;
        gap: 4px !important;
        color: var(--app-fg) !important;
        border: 1px solid var(--app-border) !important;
        text-decoration: none !important;
        transition: all 0.15s ease !important;
      }
      .edit-pill-btn mat-icon {
        font-size: 14px !important;
        width: 14px !important;
        height: 14px !important;
        line-height: 14px !important;
      }
      .edit-pill-btn:hover {
        background: var(--app-surface-hover) !important;
        border-color: var(--app-border-hover) !important;
        color: var(--app-fg-heading) !important;
      }

      .title {
        font-size: clamp(1.8rem, 3.5vw, 2.4rem);
        font-weight: 800;
        letter-spacing: -0.025em;
        line-height: 1.2;
        overflow-wrap: anywhere;
        letter-spacing: -0.03em;
        line-height: 1.25;
        margin: 0 0 16px;
        color: var(--app-fg-heading);
      }

      .price-box {
        display: flex;
        align-items: baseline;
        gap: 2px;
        color: var(--app-primary);
        font-weight: 800;
        margin-bottom: 20px;
      }
      .price-box .currency {
        font-size: 1.2rem;
      }
      .actions {
        margin-top: 24px;
        display: flex;
        gap: 12px;
        align-items: center;
        flex-wrap: wrap;
      }
      .actions a {
        margin: 0;
      }

      .quantity-stepper {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        color: var(--app-fg);
      }

      .quantity-stepper mat-icon {
        width: 20px;
        height: 20px;
        color: var(--app-muted);
      }

      .quantity-value {
        min-width: 24px;
        text-align: center;
        font-size: 16px;
      }

      .quantity-selector {
        margin: 16px 0;
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        color: var(--app-fg);
      }

      .connect-btn {
        border-color: var(--app-primary);
        color: var(--app-primary);
      }
      .connect-btn:hover {
        background-color: var(--app-primary);
        color: var(--app-primary-contrast, #fff);
      }
      .out-of-stock {
        color: var(--app-muted);
        font-size: 14px;
        display: inline-flex;
        align-items: center;
        gap: 4px;
      }
      .price-box .amount {
        font-size: 2.2rem;
        letter-spacing: -0.02em;
      }


      .seller-card {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 12px 16px;
        background: var(--app-bg-alt);
        border: 1px solid var(--app-border);
        border-radius: var(--app-radius-sm);
      }
      .seller-avatar {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        object-fit: cover;
      }
      .seller-avatar-placeholder {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: var(--app-gradient-primary);
        color: #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
      }
      .seller-details {
        display: flex;
        flex-direction: column;
      }
      .seller-role {
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        color: var(--app-primary);
        letter-spacing: 0.05em;
      }
      .seller-name {
        font-size: 14px;
        color: var(--app-fg-heading);
      }

      .description {
        font-size: 14px;
        color: var(--app-muted);
        line-height: 1.6;
        margin-bottom: 16px;
      }

      .stock-tag {
        display: flex;
        align-items: center;
        font-size: 14px;
        color: var(--app-fg);
        font-weight: 500;
      }
      .out-of-stock {
        color: var(--app-muted);
      }

      .divider {
        height: 1px;
        background: var(--app-border);
        margin: 16px 0;
      }

      .description-block h3 {
        font-size: 15px;
        font-weight: 700;
        margin: 0 0 8px;
        color: var(--app-fg-heading);
      }
      .description-text {
        font-size: 14px;
        line-height: 1.6;
        color: var(--app-muted);
        margin: 0;
      }


      .actions-group {
        display: flex;
        flex-direction: column;
        gap: 16px;
        margin-top: 24px;
      }
      .edit-btn,
      .buy-btn {
        width: 100%;
        max-width: 100%;
        height: 44px;
        box-sizing: border-box;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 0 16px;
      }

      .auth-prompt {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
      }

      .minifab {
        box-shadow: none;
        color: var(--app-fg);
        background-color: transparent;
      }
      
      .connect-btn {
        height: 32px !important;
        padding: 0 12px !important;
      }

      .quantity-selector,
      .quantity-display {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 14px;
        font-weight: 500;
        color: var(--app-fg-heading);
        margin-bottom: 12px;
      }

      .quantity-stepper {
        display: flex;
        align-items: center;
        gap: 12px;
        background: var(--app-surface);
        border: 1px solid var(--app-border);
        padding: 4px;
        border-radius: var(--app-radius-sm);
      }
      .quantity-value {
        min-width: 24px;
        text-align: center;
        font-size: 14px;
        font-weight: 600;
      }

      .minifab {
        width: 28px !important;
        height: 28px !important;
        border-radius: 4px !important;
        background: transparent !important;
        color: var(--app-fg) !important;
        box-shadow: none !important;
        border: 1px solid transparent !important;
        transition: background 0.15s ease !important;
      }
      .minifab mat-icon {
        font-size: 16px !important;
        width: 16px !important;
        height: 16px !important;
        line-height: 16px !important;
      }
      .minifab:hover:not(:disabled) {
        background: var(--app-surface-hover) !important;
        border-color: var(--app-border) !important;
      }
      .minifab:disabled {
        visibility: hidden;
      }

      .in-cart-card {
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding: 16px;
        background: var(--app-primary-lighter);
        border: 1px solid var(--app-primary-light);
        border-radius: var(--app-radius-sm);
      }
      .dark-theme .in-cart-card {
        background: rgba(99, 102, 241, 0.05); 
      }

      .in-cart-message {
        display: flex;
        align-items: center;
        gap: 6px;
        color: var(--app-primary);
        font-weight: 600;
        font-size: 14px;
      }

      .check-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
        color: var(--app-primary);
      }

      .in-cart-actions {
        display: flex;
        gap: 10px;
        align-items: center;
        flex-wrap: wrap;
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
