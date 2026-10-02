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
import { forkJoin } from "rxjs";

import { UserService } from "@core/services/user.service";
import { MediaService } from "@core/services/media.service";
import { AuthService } from "@core/services/auth.service";
import { ProductService } from "@core/services/product.service";

import { LoadingSpinnerComponent } from "@shared/components/loading-spinner.component";
import { CurrentUserService } from "@core/services/current-user.service";

@Component({
  selector: "app-admin-dashboard",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    LoadingSpinnerComponent,
  ],
  template: `
    @if (loading()) {
      <app-loading-spinner label="Loading platform stats…" />
    } @else {
      <section class="container admin-dashboard">
        <div class="welcome-header">
          <div>
            <div class="admin-badge">System Administrator</div>
            <h1 class="welcome-title">Platform Overview</h1>
            <p class="muted">Monitor users, products, and media infrastructure across the marketplace.</p>
          </div>
        </div>

        <div class="stats-grid">
          <div class="app-card stat-card">
            <div class="stat-icon prod-icon"><mat-icon>inventory_2</mat-icon></div>
            <div class="stat-info">
              <div class="stat-label">Total Products</div>
              <div class="stat-val">{{ totalProducts() }}</div>
            </div>
          </div>

          <div class="app-card stat-card">
            <div class="stat-icon user-icon"><mat-icon>group</mat-icon></div>
            <div class="stat-info">
              <div class="stat-label">Registered Users</div>
              <div class="stat-val">{{ totalUsers() }}</div>
            </div>
          </div>

          <div class="app-card stat-card">
            <div class="stat-icon media-icon"><mat-icon>collections</mat-icon></div>
            <div class="stat-info">
              <div class="stat-label">Total Media Files</div>
              <div class="stat-val">{{ totalImages() }}</div>
            </div>
          </div>
        </div>

        <div class="actions-panel">
          <a routerLink="/admin/products" class="btn btn-primary admin-btn">
            <mat-icon>inventory_2</mat-icon>
            <span>Manage Products</span>
          </a>

          <a routerLink="/admin/users" class="btn btn-secondary admin-btn">
            <mat-icon>group</mat-icon>
            <span>Manage Users</span>
          </a>
        </div>
      </section>
    }
  `,
  styles: [
    `
      .admin-dashboard {
        padding-top: 32px;
        padding-bottom: 64px;
      }

      .admin-badge {
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

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 20px;
        margin: 32px 0 36px;
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

      .prod-icon {
        background: var(--app-primary-lighter);
        color: var(--app-primary);
      }
      .user-icon {
        background: rgba(59, 130, 246, 0.12);
        color: #3b82f6;
      }
      .media-icon {
        background: rgba(168, 85, 247, 0.12);
        color: #a855f7;
      }

      .stat-label {
        font-size: 12px;
        font-weight: 700;
        color: var(--app-muted);
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      .stat-val {
        font-size: 1.8rem;
        font-weight: 800;
        color: var(--app-fg-heading);
        margin-top: 2px;
        letter-spacing: -0.02em;
      }

      .actions-panel {
        display: flex;
        gap: 14px;
        flex-wrap: wrap;
      }

      .admin-btn {
        height: 44px;
        padding: 0 22px;
      }
    `,
  ],
})
export class AdminDashboardPage {
  readonly auth = inject(AuthService);
  private readonly productService = inject(ProductService);
  private readonly userService = inject(UserService);
  private readonly mediaService = inject(MediaService);
  readonly currentUser = inject(CurrentUserService);

  readonly loading = signal(true);

  readonly totalProducts = signal(0);
  readonly totalUsers = signal(0);
  readonly totalImages = signal(0);

  constructor() {
    forkJoin({
      products: this.productService.count(),
      users: this.userService.count(),
      images: this.mediaService.count(),
    }).subscribe({
      next: (counts) => {
        this.totalProducts.set(counts.products);
        this.totalUsers.set(counts.users);
        this.totalImages.set(counts.images);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
