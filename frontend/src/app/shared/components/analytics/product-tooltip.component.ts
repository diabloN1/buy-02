import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  inject,
  signal,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { ProductService } from "@core/services/product.service";
import { Product } from "@core/models/product.model";

export interface TooltipMetric {
  label: string;
  value: string;
}

@Component({
  selector: "app-product-tooltip",
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (visible) {
      <div
        class="product-tooltip-card"
        [style.left.px]="x + 15"
        [style.top.px]="y + 15"
      >
        @if (loading()) {
          <div class="loading-spinner"></div>
        } @else if (product()) {
          <div class="tooltip-header">
            <div class="tooltip-img-wrapper">
              @if (product()?.images?.[0]?.url; as url) {
                <img [src]="url" [alt]="product()?.name" />
              } @else {
                <div class="no-img"></div>
              }
            </div>
            <div class="tooltip-details">
              <span class="tooltip-name">{{ product()?.name }}</span>
              <span class="tooltip-price">{{
                product()?.price | currency
              }}</span>
            </div>
          </div>

          @if (metrics.length > 0) {
            <div class="tooltip-divider"></div>
            <div class="tooltip-metrics">
              @for (m of metrics; track m.label) {
                <div class="metric-row">
                  <span class="metric-dot"></span>
                  <span class="metric-label">{{ m.label }}:</span>
                  <span class="metric-value">{{ m.value }}</span>
                </div>
              }
            </div>
          }
        }
      </div>
    }
  `,
  styles: [
    `
      .product-tooltip-card {
        position: fixed;
        z-index: 9999;
        background: var(--app-surface-elevated, #ffffff);
        border: 1px solid var(--app-border, #e4e4e7);
        border-radius: var(--app-radius, 8px);
        box-shadow: var(--app-shadow-lg, 0 10px 15px -3px rgba(0, 0, 0, 0.15));
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        pointer-events: none; /* Crucial to prevent blocking hover events */
        width: max-content;
        max-width: 260px;
        transition: opacity 0.15s ease;
      }
      .tooltip-header {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .tooltip-img-wrapper {
        width: 40px;
        height: 40px;
        border-radius: 4px;
        overflow: hidden;
        background: var(--app-bg-alt, #f4f4f5);
        flex-shrink: 0;
      }
      .tooltip-img-wrapper img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .no-img {
        width: 100%;
        height: 100%;
        background: var(--app-border, #e4e4e7);
      }
      .tooltip-details {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .tooltip-name {
        font-size: 13px;
        font-weight: 600;
        color: var(--app-fg-heading, #09090b);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 160px;
      }
      .tooltip-price {
        font-size: 12px;
        font-weight: 700;
        color: var(--app-primary, #18181b);
      }
      .tooltip-divider {
        height: 1px;
        background: var(--app-border, #e4e4e7);
        width: 100%;
      }
      .tooltip-metrics {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .metric-row {
        display: flex;
        align-items: center;
        font-size: 12px;
      }
      .metric-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: var(--app-primary, #18181b);
        margin-right: 6px;
      }
      .metric-label {
        color: var(--app-muted, #71717a);
        margin-right: auto;
        padding-right: 12px;
      }
      .metric-value {
        font-weight: 700;
        color: var(--app-fg-heading, #09090b);
      }
      .loading-spinner {
        width: 24px;
        height: 24px;
        border: 2px solid var(--app-border, #e4e4e7);
        border-top-color: var(--app-primary, #18181b);
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
        margin: 12px 48px;
      }
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
    `,
  ],
})
export class ProductTooltipComponent implements OnChanges {
  @Input() productId: string | null = null;
  @Input() metrics: TooltipMetric[] = [];
  @Input() x = 0;
  @Input() y = 0;
  @Input() visible = false;

  private productService = inject(ProductService);
  private cache = new Map<string, Product>();

  readonly product = signal<Product | null>(null);
  readonly loading = signal(false);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["visible"] && !this.visible) {
      return;
    }

    if (changes["productId"] && this.productId && this.visible) {
      if (this.cache.has(this.productId)) {
        this.product.set(this.cache.get(this.productId)!);
        this.loading.set(false);
      } else {
        this.loading.set(true);
        this.productService.get(this.productId).subscribe({
          next: (p) => {
            this.cache.set(p.id, p);
            this.product.set(p);
            this.loading.set(false);
          },
          error: () => this.loading.set(false),
        });
      }
    }
  }
}
