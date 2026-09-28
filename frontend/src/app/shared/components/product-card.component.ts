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
        <mat-icon>image</mat-icon>
        }
      </div>
      <div class="body">
        <h3>{{ product.name }}</h3>
        <p class="muted line-clamp">{{ product.description }}</p>
        <div class="foot">
          <span class="price-tag">{{ product.price | currency }}</span>
          <span class="qty-tag">Qty {{ product.quantity }}</span>
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
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        border: 1px solid var(--app-border);
        position: relative;
      }
      .card:hover {
        transform: translateY(-4px);
        border-color: var(--app-primary);
        box-shadow: 0 12px 24px -10px rgba(0, 0, 0, 0.08), var(--app-glow);
      }
      .thumb {
        aspect-ratio: 4/3;
        background: var(--app-bg);
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        transition: background 0.25s ease;
        position: relative;
      }
      .thumb img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.4s ease;
      }
      .card:hover .thumb img {
        transform: scale(1.05);
      }
      .thumb mat-icon {
        font-size: 32px;
        width: 32px;
        height: 32px;
        color: var(--app-muted);
        opacity: 0.5;
      }
      .body {
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        background: var(--app-surface);
      }
      h3 {
        margin: 0;
        font-size: 15px;
        font-weight: 600;
        color: var(--app-fg);
        letter-spacing: -0.01em;
        line-height: 1.4;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
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
      }
      .foot {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 8px;
        border-top: 1px solid var(--app-border);
        padding-top: 10px;
      }
      .price-tag {
        font-size: 16px;
        font-weight: 700;
        color: var(--app-fg);
      }
      .qty-tag {
        font-size: 12px;
        font-weight: 500;
        background: var(--app-primary-light);
        color: var(--app-primary);
        padding: 2px 8px;
        border-radius: 20px;
      }
    `,
  ],
})
export class ProductCardComponent {
  @Input({ required: true }) product!: Product;
}
