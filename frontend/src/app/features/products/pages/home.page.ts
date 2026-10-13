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
      <!-- Decorative Background Glow/Pattern (Pro Polish) -->
      <div class="hero-bg-pattern"></div>

      <div class="container hero-inner">
        <h1 class="hero-title animate-fade-in">
          Discover & Trade Products From <br />
          <span class="gradient-text">Independent Sellers</span>
        </h1>

        <p class="hero-subtitle animate-fade-in delay-1">
          A seamless marketplace designed for buyers and sellers. High
          performance, zero friction, and instant product discovery.
        </p>

        <div class="cta-group animate-fade-in delay-2">
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

      <!-- <div class="hero-banner animate-fade-in delay-3">
        <img
          src="/marketplace-banner.png.png"
          alt="Products available on the marketplace"
        />
      </div> -->
    </section>

    <!-- Latest Products Section -->
    <section class="container products-section">
      <div class="section-header animate-fade-in delay-2">
        <div>
          <div class="section-tag">Featured Catalog</div>
          <h2 class="section-title">Latest Arrivals</h2>
        </div>

        <a routerLink="/products" class="btn btn-ghost see-all-btn">
          <span>See all products</span>
          <mat-icon class="arrow-icon">arrow_forward</mat-icon>
        </a>
      </div>

      @if (loading()) {
        <app-loading-spinner label="Loading latest products…" />
      } @else if (!items().length) {
        <app-empty-state
          class="animate-fade-in"
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
      /* ==========================================================================
         Hero Section
         ========================================================================== */
      .hero {
        position: relative;
        background: var(--app-bg-alt);
        border-bottom: 1px solid var(--app-border);
        padding: 96px 0 80px; /* Increased padding for a more spacious, premium feel */
        overflow: hidden;
      }

      /* Pro Background Pattern */
      .hero-bg-pattern {
        position: absolute;
        inset: 0;
        z-index: 1;
        background-image: radial-gradient(
          var(--app-border-hover) 1px,
          transparent 1px
        );
        background-size: 24px 24px;
        mask-image: radial-gradient(
          circle at center,
          black 40%,
          transparent 80%
        );
        -webkit-mask-image: radial-gradient(
          circle at center,
          black 40%,
          transparent 80%
        );
        opacity: 0.5;
        pointer-events: none;
      }

      .hero-inner {
        position: relative;
        z-index: 2;
        text-align: center;
        max-width: 800px;
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      .hero-title {
        font-size: clamp(2.5rem, 5vw, 4rem); /* Slightly scaled up for impact */
        margin: 0 0 20px;
        line-height: 1.1;
        font-weight: 800;
        letter-spacing: -0.04em;
        color: var(--app-fg-heading);
      }

      /* Real CSS Gradient Text */
      .gradient-text {
        background: linear-gradient(
          135deg,
          var(--app-primary) 0%,
          var(--app-accent) 100%
        );
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        color: transparent;
        display: inline-block;
      }

      /* Fallback/adjustment for dark mode if needed */
      :host-context(.dark-theme) .gradient-text {
        background: linear-gradient(135deg, #ffffff 0%, var(--app-accent) 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }

      .hero-subtitle {
        font-size: clamp(1.1rem, 2vw, 1.25rem);
        line-height: 1.6;
        max-width: 640px;
        margin: 0 auto 36px;
        color: var(--app-muted);
      }

      .cta-group {
        display: flex;
        gap: 16px;
        justify-content: center;
        align-items: center;
        flex-wrap: wrap;
        margin-bottom: 24px; /* Reduced from 48px to balance larger padding */
      }

      .hero-btn {
        height: 48px; /* Slightly taller for hero prominence */
        padding: 0 28px;
        font-size: 15px;
        font-weight: 600;
        border-radius: var(--app-radius-sm);
      }

      /* Preserved Banner Styles (Optimized) */
      .hero-banner {
        width: 100%;
        margin-top: 60px;
        position: relative;
        z-index: 2;
        border-radius: var(--app-radius-lg);
        overflow: hidden;
        box-shadow: var(--app-shadow-lg);
        border: 1px solid var(--app-border);
      }
      .hero-banner img {
        display: block;
        width: 100%;
        height: auto;
        max-height: 400px;
        object-fit: cover;
        object-position: center;
      }

      /* ==========================================================================
         Preserved Features Grid (If you decide to use it)
         ========================================================================== */
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
        transition:
          transform var(--transition-normal),
          border-color var(--transition-normal);
      }
      .feature-card:hover {
        border-color: var(--app-border-hover);
        transform: translateY(-2px);
        box-shadow: var(--app-shadow);
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

      /* ==========================================================================
         Products Section
         ========================================================================== */
      .products-section {
        padding-top: 64px;
        padding-bottom: 80px;
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
        margin-bottom: 6px;
      }

      .section-title {
        font-size: 2rem;
        font-weight: 800;
        letter-spacing: -0.03em;
        margin: 0;
      }

      .see-all-btn {
        color: var(--app-primary) !important;
        font-weight: 600;
      }

      /* Micro-interaction: Arrow slides on hover */
      .arrow-icon {
        transition: transform var(--transition-normal);
      }
      .see-all-btn:hover .arrow-icon {
        transform: translateX(4px);
      }

      /* Pro stagger animation for the product cards as they render */
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
        gap: 24px;
      }
      .grid > * {
        animation: fadeInUp 0.4s var(--ease-out) forwards;
        opacity: 0;
      }
      .grid > *:nth-child(1) {
        animation-delay: 0ms;
      }
      .grid > *:nth-child(2) {
        animation-delay: 50ms;
      }
      .grid > *:nth-child(3) {
        animation-delay: 100ms;
      }
      .grid > *:nth-child(4) {
        animation-delay: 150ms;
      }
      .grid > *:nth-child(5) {
        animation-delay: 200ms;
      }
      .grid > *:nth-child(n + 6) {
        animation-delay: 250ms;
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
