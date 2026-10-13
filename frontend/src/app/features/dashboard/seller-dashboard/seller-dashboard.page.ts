import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink } from "@angular/router";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { AuthService } from "@core/services/auth.service";
import { ProductService } from "@core/services/product.service";
import { Product } from "@core/models/product.model";
import { ProductCardComponent } from "@shared/components/product-card.component";
import { LoadingSpinnerComponent } from "@shared/components/loading-spinner.component";
import { CurrentUserService } from "@core/services/current-user.service";

@Component({
  selector: "app-seller-dashboard",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterLink,
    MatIconModule,
    MatButtonModule,
    ProductCardComponent,
    LoadingSpinnerComponent,
  ],
  template: `
    <section class="container dashboard-section">
      <!-- Welcome Header -->
      <div class="welcome-header animate-fade-in">
        <div class="welcome-text">
          <div class="welcome-tag animate-pop-in delay-1">Seller Portal</div>
          <h1 class="welcome-title delay-1">
            Welcome back, {{ currentUser.user()?.name }} 👋
          </h1>
          <p class="muted delay-2">
            Manage your store products, media assets, and inventory performance.
          </p>
        </div>

        <a
          routerLink="/seller/products/new"
          class="btn btn-primary create-btn delay-2"
        >
          <mat-icon>add</mat-icon>
          <span>Create New Product</span>
        </a>
      </div>

      <!-- Stat Cards -->
      <div class="stats-grid">
        <div class="app-card stat-card animate-fade-in delay-1">
          <div class="stat-icon p-icon"><mat-icon>inventory_2</mat-icon></div>
          <div class="stat-content">
            <div class="stat-label">Total Products</div>
            <div class="stat-value">{{ items().length }}</div>
          </div>
        </div>

        <div class="app-card stat-card animate-fade-in delay-2">
          <div class="stat-icon m-icon"><mat-icon>collections</mat-icon></div>
          <div class="stat-content">
            <div class="stat-label">Media Assets</div>
            <div class="stat-value">{{ totalImages() }}</div>
          </div>
        </div>

        <div class="app-card stat-card animate-fade-in delay-3">
          <div class="stat-icon l-icon"><mat-icon>schedule</mat-icon></div>
          <div class="stat-content">
            <div class="stat-label">Latest Item</div>
            <div
              class="stat-value text-truncate"
              [title]="items().length ? latest().name : '—'"
            >
              {{ items().length ? latest().name : "—" }}
            </div>
          </div>
        </div>
      </div>

      <!-- Secondary Navigation Shortcuts -->
      <div class="shortcuts-bar animate-fade-in delay-3">
        <a routerLink="/seller/products" class="btn btn-secondary">
          <mat-icon>list_alt</mat-icon>
          <span>Manage All Products</span>
        </a>

        <a routerLink="/seller/media" class="btn btn-secondary">
          <mat-icon>perm_media</mat-icon>
          <span>Media Gallery</span>
        </a>
      </div>

      <!-- Recent Products Grid -->
      <div class="recent-section">
        <div class="section-title-row animate-fade-in delay-3">
          <h2>Recent Products</h2>
          <a routerLink="/seller/products" class="btn btn-ghost link-btn">
            <span>View all</span>
            <mat-icon class="arrow-icon">arrow_forward</mat-icon>
          </a>
        </div>

        @if (loading()) {
          <app-loading-spinner label="Loading seller store items…" />
        } @else {
          <div class="grid">
            @for (p of items().slice(0, 4); track p.id) {
              <app-product-card [product]="p" />
            }
          </div>
        }
      </div>
    </section>
  `,
  styles: [
    `
      .dashboard-section {
        padding-top: 48px; /* Slightly increased for premium spacing */
        padding-bottom: 64px;
        display: flex;
        flex-direction: column;
        gap: 36px;
      }

      /* ==========================================================================
         Header
         ========================================================================== */
      .welcome-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 24px;
        flex-wrap: wrap;
      }

      .welcome-text {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .welcome-tag {
        display: inline-flex;
        align-items: center;
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--app-primary);
        background: var(--app-primary-lighter);
        padding: 4px 12px;
        border-radius: var(--app-radius-full);
        align-self: flex-start;
        margin-bottom: 4px;
        border: 1px solid var(--app-border);
      }

      .welcome-title {
        font-size: clamp(1.75rem, 3.5vw, 2.25rem);
        font-weight: 800;
        letter-spacing: -0.03em;
        margin: 0;
        color: var(--app-fg-heading);
      }

      .welcome-text .muted {
        margin: 0;
        font-size: 15px;
        max-width: 600px;
        line-height: 1.5;
      }

      .create-btn {
        height: 44px; /* Taller hero action button */
        padding: 0 24px;
      }

      /* ==========================================================================
         Stat Cards
         ========================================================================== */
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 20px;
      }

      .stat-card {
        padding: 24px;
        display: flex;
        align-items: center;
        gap: 20px;
        transition:
          transform var(--transition-normal),
          box-shadow var(--transition-normal);
        cursor: default; /* Indicates it's a data widget, not a link */
      }

      .stat-card:hover {
        transform: translateY(-3px);
        box-shadow: var(--app-shadow-lg);
      }

      .stat-icon {
        width: 56px;
        height: 56px;
        border-radius: var(--app-radius-lg);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        transition: transform var(--transition-spring);
      }

      .stat-card:hover .stat-icon {
        transform: scale(1.08); /* Icon pops slightly when card is hovered */
      }

      .stat-icon mat-icon {
        font-size: 26px;
        width: 26px;
        height: 26px;
      }

      /* Refined Pastel/Pro Icon Backgrounds */
      .p-icon {
        background: var(--app-primary-lighter);
        color: var(--app-primary);
      }
      .m-icon {
        background: var(--app-accent-light);
        color: var(--app-accent);
      }
      .l-icon {
        background: var(--app-success-light);
        color: var(--app-success);
      }

      .stat-content {
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-width: 0;
      }

      .stat-label {
        font-size: 13px;
        font-weight: 600;
        color: var(--app-muted);
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      .stat-value {
        font-size: 1.75rem;
        font-weight: 800;
        color: var(--app-fg-heading);
        letter-spacing: -0.03em;
        line-height: 1.1;
      }

      .stat-value.text-truncate {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      /* ==========================================================================
         Shortcuts Bar
         ========================================================================== */
      .shortcuts-bar {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
        padding-top: 8px;
        border-top: 1px solid var(--app-border); /* Subtle divider */
        margin-top: 8px;
      }

      /* ==========================================================================
         Recent Products Section
         ========================================================================== */
      .recent-section {
        display: flex;
        flex-direction: column;
        gap: 24px;
        padding-top: 24px;
      }

      .section-title-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .section-title-row h2 {
        font-size: 1.5rem;
        font-weight: 800;
        letter-spacing: -0.025em;
        margin: 0;
        color: var(--app-fg-heading);
      }

      .link-btn {
        color: var(--app-primary) !important;
        font-weight: 600;
        padding: 0 12px;
      }

      /* Micro-interaction: Arrow slides on hover */
      .arrow-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        transition: transform var(--transition-normal);
      }
      .link-btn:hover .arrow-icon {
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
    `,
  ],
})
export class SellerDashboardPage {
  readonly auth = inject(AuthService);
  private readonly svc = inject(ProductService);
  readonly currentUser = inject(CurrentUserService);

  readonly items = signal<Product[]>([]);
  readonly loading = signal(true);
  readonly totalImages = computed(() =>
    this.items().reduce((n, p) => n + p.images.length, 0),
  );
  readonly latest = computed(() => this.items()[0]);

  constructor() {
    effect(() => {
      const user = this.currentUser.user();

      if (!user) {
        return;
      }

      this.load();
    });
  }

  private load(): void {
    const user = this.currentUser.user();

    if (!user) {
      return;
    }

    this.loading.set(true);

    this.svc.listBySeller(1, 50, user.id).subscribe({
      next: (r) => {
        this.items.set(r.content);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
