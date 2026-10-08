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
      <div class="welcome-header">
        <div class="welcome-text">
          <div class="welcome-tag">Seller Portal</div>
          <h1 class="welcome-title">
            Welcome back, {{ currentUser.user()?.name }} 👋
          </h1>
          <p class="muted">
            Manage your store products, media assets, and inventory performance.
          </p>
        </div>

        <a routerLink="/seller/products/new" class="btn btn-primary">
          <mat-icon>add</mat-icon>
          <span>Create New Product</span>
        </a>
      </div>

      <!-- Stat Cards -->
      <div class="stats-grid">
        <div class="app-card stat-card">
          <div class="stat-icon p-icon"><mat-icon>inventory_2</mat-icon></div>
          <div class="stat-content">
            <div class="stat-label">Total Products</div>
            <div class="stat-value">{{ items().length }}</div>
          </div>
        </div>

        <div class="app-card stat-card">
          <div class="stat-icon m-icon"><mat-icon>collections</mat-icon></div>
          <div class="stat-content">
            <div class="stat-label">Media Assets</div>
            <div class="stat-value">{{ totalImages() }}</div>
          </div>
        </div>

        <div class="app-card stat-card">
          <div class="stat-icon l-icon"><mat-icon>schedule</mat-icon></div>
          <div class="stat-content">
            <div class="stat-label">Latest Item</div>
            <div class="stat-value text-truncate">
              {{ items().length ? latest().name : "—" }}
            </div>
          </div>
        </div>
      </div>

      <!-- Secondary Navigation Shortcuts -->
      <div class="shortcuts-bar">
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
        <div class="section-title-row">
          <h2>Recent Products</h2>
          <a routerLink="/seller/products" class="btn btn-ghost link-btn">
            <span>View all</span>
            <mat-icon>arrow_forward</mat-icon>
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
        padding-top: 40px;
        padding-bottom: 64px;
        display: flex;
        flex-direction: column;
        gap: 32px;
      }

      .welcome-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 20px;
        flex-wrap: wrap;
      }

      .welcome-text {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .welcome-tag {
        display: inline-flex;
        align-items: center;
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--app-primary);
        background: var(--app-primary-lighter);
        padding: 4px 10px;
        border-radius: var(--app-radius-full);
        align-self: flex-start;
        margin-bottom: 4px;
      }

      .welcome-title {
        font-size: clamp(1.5rem, 3vw, 2rem);
        margin: 0;
      }

      .welcome-text .muted {
        margin: 0;
        font-size: 15px;
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
        gap: 16px;
      }

      .stat-card {
        padding: 24px;
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .stat-icon {
        width: 48px;
        height: 48px;
        border-radius: var(--app-radius);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .stat-icon mat-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
      }

  
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
        gap: 2px;
        min-width: 0; 
      }

      .stat-label {
        font-size: 13px;
        font-weight: 500;
        color: var(--app-muted);
      }

      .stat-value {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--app-fg-heading);
        letter-spacing: -0.025em;
        line-height: 1.2;
      }

      .stat-value.text-truncate {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .shortcuts-bar {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
        padding-top: 8px;
      }

      .recent-section {
        display: flex;
        flex-direction: column;
        gap: 20px;
        padding-top: 16px;
      }

      .section-title-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .section-title-row h2 {
        margin: 0;
      }

      .link-btn {
        color: var(--app-primary) !important;
        font-weight: 600;
        padding: 0 8px;
      }
      .link-btn mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
        gap: 24px;
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
