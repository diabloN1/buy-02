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
        <div>
          <div class="welcome-tag">Seller Portal</div>
          <h1 class="welcome-title">Welcome back, {{ currentUser.user()?.name }} 👋</h1>
          <p class="muted">Manage your store products, media assets, and inventory performance.</p>
        </div>

        <a routerLink="/seller/products/new" class="btn btn-primary create-btn">
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
            <div class="stat-value text-truncate">{{ items().length ? latest().name : '—' }}</div>
          </div>
        </div>
      </div>

      <!-- Secondary Navigation Shortcuts -->
      <div class="shortcuts-bar">
        <a routerLink="/seller/products" class="btn btn-secondary shortcut-btn">
          <mat-icon>list_alt</mat-icon>
          <span>Manage All Products</span>
        </a>

        <a routerLink="/seller/media" class="btn btn-secondary shortcut-btn">
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
        padding-top: 32px;
        padding-bottom: 64px;
      }

      .welcome-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        gap: 20px;
        margin-bottom: 32px;
        flex-wrap: wrap;
      }

      .welcome-tag {
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--app-primary);
        margin-bottom: 4px;
      }

      .welcome-title {
        font-size: clamp(1.8rem, 3.5vw, 2.4rem);
        font-weight: 800;
        letter-spacing: -0.03em;
        margin: 0 0 4px;
        color: var(--app-fg-heading);
      }

      .create-btn {
        height: 44px;
        padding: 0 22px;
        font-size: 15px;
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 20px;
        margin-bottom: 28px;
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
        border-radius: 12px;
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
        background: rgba(168, 85, 247, 0.12);
        color: #a855f7;
      }
      .l-icon {
        background: rgba(16, 185, 129, 0.12);
        color: #10b981;
      }

      .stat-label {
        font-size: 12px;
        font-weight: 700;
        color: var(--app-muted);
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      .stat-value {
        font-size: 1.8rem;
        font-weight: 800;
        color: var(--app-fg-heading);
        margin-top: 2px;
        letter-spacing: -0.02em;
      }
      .stat-value.text-truncate {
        font-size: 1.05rem;
        font-weight: 700;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 170px;
      }

      .shortcuts-bar {
        display: flex;
        gap: 12px;
        margin-bottom: 40px;
        flex-wrap: wrap;
      }

      .recent-section {
        margin-top: 16px;
      }
      .section-title-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
      }
      .section-title-row h2 {
        font-size: 1.5rem;
        font-weight: 800;
        margin: 0;
      }

      .link-btn {
        color: var(--app-primary) !important;
        font-weight: 600;
      }

      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
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
    this.items().reduce((n, p) => n + p.images.length, 0)
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
