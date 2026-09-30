import {
  ChangeDetectionStrategy,
  Component,
  computed,
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
            <div class="main-image-wrap" (click)="previewOpen.set(true)" title="Click to expand view">
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
              <span class="stock-pill" [class.out-of-stock]="p.quantity <= 0">
                <mat-icon>inventory_2</mat-icon>
                <span>{{ p.quantity > 0 ? ('In Stock: ' + p.quantity) : 'Out of Stock' }}</span>
              </span>

              <h1 class="title">{{ p.name }}</h1>

              <div class="price-box">
                <span class="currency">$</span>
                <span class="amount">{{ p.price | number:'1.2-2' }}</span>
              </div>
            </div>

            <!-- Seller Information Badge -->
            @if (seller(); as seller) {
              <div class="seller-card">
                @if (seller.avatar) {
                  <img
                    class="seller-avatar"
                    [src]="seller.avatar.url | safeUrl"
                    [alt]="seller.name"
                  />
                } @else {
                  <div class="seller-avatar-placeholder">
                    <span>{{ (seller.name || 'S').charAt(0).toUpperCase() }}</span>
                  </div>
                }

                <div class="seller-details">
                  <span class="seller-role">Verified Seller</span>
                  <strong class="seller-name">{{ seller.name }}</strong>
                </div>
              </div>
            }

            <div class="divider"></div>

            <!-- Description -->
            <div class="description-block">
              <h3>Product Description</h3>
              <p class="description-text">{{ p.description || 'No detailed description provided by the seller.' }}</p>
            </div>

            <!-- Action Controls -->
            <div class="actions-group">
              @if (ownedByMe()) {
                <a
                  mat-flat-button
                  color="primary"
                  class="edit-btn"
                  [routerLink]="['/seller/products', p.id, 'edit']"
                >
                  <mat-icon>edit</mat-icon>
                  <span>Edit Product Details</span>
                </a>
              } @else {
                <button mat-flat-button color="primary" class="buy-btn" [disabled]="p.quantity <= 0">
                  <mat-icon>shopping_bag</mat-icon>
                  <span>{{ p.quantity > 0 ? 'Buy Now' : 'Out of Stock' }}</span>
                </button>
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
        margin-bottom: 12px;
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

      .title {
        font-size: clamp(1.8rem, 3.5vw, 2.4rem);
        font-weight: 800;
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
        margin-top: 12px;
      }
      .edit-btn, .buy-btn {
        width: 100%;
        height: 48px;
        font-size: 15px !important;
        border-radius: var(--app-radius-sm) !important;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
      }
    `,
  ],
})
export class ProductDetailsPage {
  private readonly route = inject(ActivatedRoute);
  private readonly svc = inject(ProductService);
  private readonly userService = inject(UserService);
  readonly currentUser = inject(CurrentUserService);
  readonly previewOpen = signal(false);

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

  readonly active = signal(0);

  readonly activeImage = computed(
    () => this.product()?.images?.[this.active()]?.url ?? null,
  );

  readonly ownedByMe = computed(() => {
    const p = this.product();
    const u = this.currentUser.user();

    return !!p && !!u && p.userId === u.id;
  });
}
