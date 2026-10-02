import { ChangeDetectionStrategy, Component, Input } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink } from "@angular/router";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { Product } from "@core/models/product.model";
import { SafeUrlPipe } from "@shared/pipes/safe-url.pipe";

@Component({
  selector: "app-product-card",
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    SafeUrlPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a class="card app-card" [routerLink]="['/products', product.id]">
      <div class="thumb">
        @if (product.images.length) {
          <img
            [src]="product.images[0].url | safeUrl"
            [alt]="product.name"
            loading="lazy"
          />
        } @else {
          <div class="thumb-placeholder">
            <mat-icon>storefront</mat-icon>
            <span>No Image</span>
          </div>
        }
        <span class="qty-pill" [class.low-stock]="product.quantity <= 3">
          {{ product.quantity > 0 ? (product.quantity + ' in stock') : 'Out of stock' }}
        </span>
      </div>
      <div class="body">
        <h3 class="product-title" [title]="product.name">{{ product.name }}</h3>
        <p class="muted line-clamp">{{ product.description || 'No description provided.' }}</p>
        <div class="foot">
          <div class="price-container">
            <span class="currency-symbol">$</span>
            <span class="price-value">{{ product.price | number:'1.2-2' }}</span>
          </div>
          <button mat-icon-button class="view-btn" aria-label="View product details">
            <mat-icon>arrow_forward</mat-icon>
          </button>
        </div>
      </div>
    </a>
  `,
  styles: [
    `
      .card {
        display: flex;
        flex-direction: column;
        text-decoration: none;
        color: inherit;
        overflow: hidden;
        border-radius: var(--app-radius);
        background: var(--app-surface);
        border: 1px solid var(--app-border);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        height: 100%;
      }
      .card:hover {
        transform: translateY(-5px);
        border-color: var(--app-primary);
        box-shadow: var(--app-shadow-lg), var(--app-glow);
      }

      .thumb {
        aspect-ratio: 4 / 3;
        background: var(--app-bg-alt);
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        position: relative;
      }
      .thumb img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.5s ease;
      }
      .card:hover .thumb img {
        transform: scale(1.06);
      }

      .thumb-placeholder {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        color: var(--app-muted-light);
      }
      .thumb-placeholder mat-icon {
        font-size: 36px;
        width: 36px;
        height: 36px;
      }
      .thumb-placeholder span {
        font-size: 12px;
        font-weight: 500;
      }

      .qty-pill {
        position: absolute;
        top: 10px;
        right: 10px;
        background: var(--app-glass-bg);
        backdrop-filter: var(--app-backdrop-blur);
        -webkit-backdrop-filter: var(--app-backdrop-blur);
        border: 1px solid var(--app-glass-border);
        color: var(--app-fg);
        padding: 4px 10px;
        border-radius: var(--app-radius-full);
        font-size: 11px;
        font-weight: 600;
        box-shadow: var(--app-shadow-sm);
      }
      .qty-pill.low-stock {
        background: var(--app-warning-light);
        color: var(--app-warning);
        border-color: rgba(245, 158, 11, 0.3);
      }

      .body {
        padding: 18px;
        display: flex;
        flex-direction: column;
        flex: 1;
        gap: 8px;
        background: var(--app-surface);
      }

      .product-title {
        margin: 0;
        font-size: 1.05rem;
        font-weight: 700;
        color: var(--app-fg-heading);
        letter-spacing: -0.01em;
        line-height: 1.35;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .line-clamp {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        font-size: 13px;
        margin: 0;
        line-height: 1.5;
        color: var(--app-muted);
        flex: 1;
      }

      .foot {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 12px;
        border-top: 1px solid var(--app-border);
        padding-top: 12px;
      }

      .price-container {
        display: flex;
        align-items: baseline;
        gap: 2px;
        color: var(--app-primary);
        font-weight: 800;
      }
      .currency-symbol {
        font-size: 14px;
        font-weight: 600;
      }
      .price-value {
        font-size: 1.25rem;
        letter-spacing: -0.02em;
      }

      .view-btn {
        width: 34px;
        height: 34px;
        border-radius: 50%;
        background: var(--app-primary-light);
        color: var(--app-primary);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      }
      .card:hover .view-btn {
        background: var(--app-gradient-primary);
        color: #ffffff;
        box-shadow: var(--app-glow);
      }
    `,
  ],
})
export class ProductCardComponent {
  @Input({ required: true }) product!: Product;
}
