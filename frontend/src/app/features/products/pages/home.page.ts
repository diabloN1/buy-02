import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink } from "@angular/router";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { ProductService } from "@core/services/product.service";
import { Product } from "@core/models/product.model";
import { ProductCardComponent } from "@shared/components/product-card.component";
import { LoadingSpinnerComponent } from "@shared/components/loading-spinner.component";
import { EmptyStateComponent } from "@shared/components/empty-state.component";
import { AuthService } from "@core/services/auth.service";

@Component({
  selector: "app-home",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    ProductCardComponent,
    LoadingSpinnerComponent,
    EmptyStateComponent,
  ],
  template: `
    <!-- Hero Section -->
    <section class="hero">
      <div class="container hero-inner">
        <h1 class="hero-title">
          Discover & Trade Products From
          <span class="gradient-text">Independent Sellers</span>
        </h1>

        <p class="hero-subtitle">
          A seamless marketplace designed for buyers and sellers. High
          performance, zero friction, and instant product discovery.
        </p>

        <div class="cta-group">
          <a routerLink="/products" class="btn btn-primary hero-btn">
            <mat-icon>storefront</mat-icon>
            <span>Browse Catalog</span>
          </a>

          @if (authSvc.isAuthenticated()) {
            <a routerLink="/profile" class="btn btn-secondary hero-btn">
              <mat-icon>person</mat-icon>
              <span>View Profile</span>
            </a>
          } @else {
            <a routerLink="/auth/register" class="btn btn-secondary hero-btn">
              <mat-icon>store</mat-icon>
              <span>Become a Seller</span>
            </a>
          }
        </div>
      </div>

      <!-- <div class="hero-banner">
        <img
          src="/marketplace-banner.png.png"
          alt="Products available on the marketplace"
        />
      </div> -->
    </section>

    <!-- Latest Products Section -->
    <section class="container products-section">
      <div class="section-header">
        <div>
          <div class="section-tag">Featured Catalog</div>
          <h2 class="section-title">Latest Arrivals</h2>
        </div>

        <a routerLink="/products" class="btn btn-ghost see-all-btn">
          <span>See all products</span>
          <mat-icon>arrow_forward</mat-icon>
        </a>
      </div>

      @if (loading()) {
        <app-loading-spinner label="Loading latest products…" />
      } @else if (!items().length) {
        <app-empty-state
          icon="storefront"
          title="No products yet"
          description="Check back soon for new arrivals."
        />
      } @else {
        <div class="grid">
          @for (p of items(); track p.id) {
            <app-product-card [product]="p" />
          }
        </div>
      }
    </section>
  `,
  styles: [
    `
      .hero {
        position: relative;
        background: var(--app-gradient-hero);
        border-bottom: 1px solid var(--app-border);
        padding: 64px 0 52px;
      }

      .hero-inner {
        position: relative;
        z-index: 2;
        text-align: center;
        max-width: 880px;
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      .hero-badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 6px 16px;
        border-radius: var(--app-radius-full);
        background: var(--app-surface);
        border: 1px solid var(--app-border);
        box-shadow: var(--app-shadow-sm);
        font-size: 13px;
        font-weight: 600;
        color: var(--app-fg);
        margin-bottom: 24px;
      }

      .badge-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--app-primary);
      }

      .hero-title {
        font-size: clamp(2.2rem, 5vw, 3.6rem);
        margin: 0 0 20px;
        line-height: 1.15;
        font-weight: 800;
        letter-spacing: -0.035em;
        color: var(--app-fg-heading);
      }

      .gradient-text {
        background: var(--app-gradient-primary);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }

      .hero-subtitle {
        font-size: clamp(1.05rem, 1.8vw, 1.2rem);
        line-height: 1.6;
        max-width: 640px;
        margin: 0 auto 32px;
        color: var(--app-muted);
      }

      .cta-group {
        display: flex;
        gap: 14px;
        justify-content: center;
        align-items: center;
        flex-wrap: wrap;
        margin-bottom: 48px;
      }

      .hero-btn {
        height: 46px;
        padding: 0 26px;
        font-size: 15px;
        border-radius: var(--app-radius-sm);
      }

      .hero {
        overflow: hidden;
        padding-top: 80px;
      }

      .hero-inner {
        text-align: center;
        position: relative;
        z-index: 2;
      }

      .hero-banner {
        width: 100%;
        margin-top: 70px;
        line-height: 0;
        position: relative;

        img {
          display: block;
          width: 100%;
          height: auto;
          max-height: 360px;
          object-fit: cover;
          object-position: center;
        }
      }

      .features-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 16px;
        width: 100%;
        margin-top: 8px;
      }

      .feature-card {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 16px 20px;
        background: var(--app-surface);
        border: 1px solid var(--app-border);
        border-radius: var(--app-radius);
        text-align: left;
        box-shadow: var(--app-shadow-sm);
        transition: all 0.2s ease;
      }

      .feature-card:hover {
        border-color: var(--app-border-hover);
        transform: translateY(-2px);
      }

      .feature-icon {
        width: 40px;
        height: 40px;
        border-radius: 10px;
        background: var(--app-primary-lighter);
        color: var(--app-primary);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      .feature-icon mat-icon {
        font-size: 22px;
        width: 22px;
        height: 22px;
      }

      .feature-info h4 {
        margin: 0 0 2px;
        font-size: 14px;
        font-weight: 700;
        color: var(--app-fg-heading);
      }

      .feature-info p {
        margin: 0;
        font-size: 12px;
        color: var(--app-muted);
        line-height: 1.4;
      }

      .products-section {
        padding-top: 48px;
        padding-bottom: 64px;
      }

      .section-header {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        margin-bottom: 32px;
        flex-wrap: wrap;
        gap: 16px;
      }

      .section-tag {
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--app-primary);
        margin-bottom: 4px;
      }

      .section-title {
        font-size: 1.85rem;
        font-weight: 800;
        letter-spacing: -0.025em;
        margin: 0;
      }

      .see-all-btn {
        color: var(--app-primary) !important;
        font-weight: 600;
      }

      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
        gap: 24px;
      }
    `,
  ],
})
export class HomePage {
  private readonly svc = inject(ProductService);
  readonly authSvc = inject(AuthService);
  readonly items = signal<Product[]>([]);
  readonly loading = signal(true);

  constructor() {
    this.svc.list(1, 8).subscribe({
      next: (r) => {
        this.items.set(r.content);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
