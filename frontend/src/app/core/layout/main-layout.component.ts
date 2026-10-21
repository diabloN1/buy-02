import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink, RouterLinkActive } from "@angular/router";
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatMenuModule } from "@angular/material/menu";
import { MatDividerModule } from "@angular/material/divider";
import { AuthService } from "@core/services/auth.service";
import { ThemeService } from "@core/services/theme.service";
import { CurrentUserService } from "@core/services/current-user.service";
import { UserAvatarComponent } from "@shared/components/user-avatar.component";

@Component({
  selector: "app-main-layout",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
    UserAvatarComponent,
  ],
  template: `
    <header class="app-header">
      <div class="container header-container">
        <!-- Brand Logo -->
        <a routerLink="/" class="brand" aria-label="Marketplace Home">
          <div class="brand-icon">
            <mat-icon>storefront</mat-icon>
          </div>
          <span class="brand-text">
            Market<span class="brand-accent">place</span>
          </span>
        </a>

        <!-- Main Desktop Navigation -->
        <nav class="nav-links">
          <a routerLink="/products" routerLinkActive="active" class="nav-link">
            <mat-icon>grid_view</mat-icon>
            <span>Products</span>
          </a>

          @if (auth.isSeller()) {
            <a
              routerLink="/dashboard"
              routerLinkActive="active"
              class="nav-link"
            >
              <mat-icon>dashboard</mat-icon>
              <span>Dashboard</span>
            </a>

            <a
              routerLink="/seller/products"
              routerLinkActive="active"
              class="nav-link"
            >
              <mat-icon>inventory_2</mat-icon>
              <span>Products</span>
            </a>

            <a
              routerLink="/seller/media"
              routerLinkActive="active"
              class="nav-link"
            >
              <mat-icon>perm_media</mat-icon>
              <span>Media</span>
            </a>

            <a
              routerLink="/suborders"
              routerLinkActive="active"
              class="nav-link"
            >
              <mat-icon>sell</mat-icon>
              <span>My Sales</span>
            </a>
          }

          @if (auth.isAdmin()) {
            <a
              routerLink="/admin/dashboard"
              routerLinkActive="active"
              class="nav-link"
            >
              <mat-icon>admin_panel_settings</mat-icon>
              <span>Admin</span>
            </a>

            <a
              routerLink="/admin/products"
              routerLinkActive="active"
              class="nav-link"
            >
              <mat-icon>inventory</mat-icon>
              <span>Inventory</span>
            </a>

            <a
              routerLink="/admin/users"
              routerLinkActive="active"
              class="nav-link"
            >
              <mat-icon>group</mat-icon>
              <span>Users</span>
            </a>
          }

          @if (auth.isAuthenticated()) {
            <a routerLink="/orders" routerLinkActive="active" class="nav-link">
              <mat-icon>receipt_long</mat-icon>
              <span>Orders</span>
            </a>
          }
        </nav>

        <div class="nav-spacer"></div>

        <!-- Right Side Header Controls -->
        <div class="header-controls">
          <!-- Theme Toggle -->
          <button
            type="button"
            class="header-btn"
            (click)="theme.toggle()"
            [attr.aria-label]="'Toggle theme'"
            [title]="
              theme.mode() === 'dark'
                ? 'Switch to Light Mode'
                : 'Switch to Dark Mode'
            "
          >
            <mat-icon class="theme-icon">
              {{ theme.mode() === "dark" ? "light_mode" : "dark_mode" }}
            </mat-icon>
          </button>

          @if (auth.isAuthenticated()) {
            <!-- Cart Link -->
            <a
              routerLink="/cart"
              routerLinkActive="active"
              class="header-btn cart-btn"
              aria-label="View Shopping Cart"
            >
              <mat-icon>shopping_cart</mat-icon>
            </a>

            <!-- User Menu Pill -->
            <button
              type="button"
              class="user-profile-btn"
              [matMenuTriggerFor]="userMenu"
              aria-label="User account menu"
            >
              <app-user-avatar [user]="currentUser.user()" [size]="28" />
              <span class="user-display-name">
                {{ currentUser.user()?.name }}
              </span>
              <mat-icon class="chevron-icon">expand_more</mat-icon>
            </button>

            <!-- User Dropdown Menu -->
            <mat-menu
              #userMenu="matMenu"
              class="modern-dropdown-menu"
              xPosition="before"
            >
              <div class="menu-user-header">
                <span class="menu-user-name">{{
                  currentUser.user()?.name
                }}</span>
                <span class="menu-user-email">{{
                  currentUser.user()?.email
                }}</span>
              </div>
              <mat-divider />

              <a mat-menu-item routerLink="/profile">
                <mat-icon>person</mat-icon>
                <span>My Profile</span>
              </a>

              <a mat-menu-item routerLink="/orders">
                <mat-icon>receipt_long</mat-icon>
                <span>My Orders</span>
              </a>

              @if (auth.isSeller()) {
                <a mat-menu-item routerLink="/suborders">
                  <mat-icon>sell</mat-icon>
                  <span>Seller Sales</span>
                </a>
              }

              <mat-divider />

              <button mat-menu-item (click)="logout()" class="logout-menu-item">
                <mat-icon>logout</mat-icon>
                <span>Log out</span>
              </button>
            </mat-menu>
          } @else {
            <div class="auth-group">
              <a routerLink="/auth/login" class="btn btn-ghost login-btn"
                >Login</a
              >
              <a
                routerLink="/auth/register"
                class="btn btn-primary register-btn"
                >Sign up</a
              >
            </div>
          }

          <!-- Mobile Menu Trigger -->
          <button
            type="button"
            class="header-btn mobile-menu-btn"
            [matMenuTriggerFor]="mobileNavMenu"
            aria-label="Open mobile menu"
          >
            <mat-icon>menu</mat-icon>
          </button>
        </div>

        <!-- Comprehensive Mobile Dropdown Menu -->
        <mat-menu
          #mobileNavMenu="matMenu"
          class="modern-dropdown-menu mobile-menu-panel"
        >
          @if (auth.isAuthenticated()) {
            <div class="menu-user-header">
              <span class="menu-user-name">{{ currentUser.user()?.name }}</span>
              <span class="menu-user-email">{{
                currentUser.user()?.email
              }}</span>
            </div>
            <mat-divider />
          }

          <a mat-menu-item routerLink="/products">
            <mat-icon>storefront</mat-icon>
            <span>Browse Products</span>
          </a>

          @if (auth.isAuthenticated()) {
            <a mat-menu-item routerLink="/cart">
              <mat-icon>shopping_cart</mat-icon>
              <span>Cart</span>
            </a>
            <a mat-menu-item routerLink="/orders">
              <mat-icon>receipt_long</mat-icon>
              <span>My Orders</span>
            </a>
            <a mat-menu-item routerLink="/profile">
              <mat-icon>person</mat-icon>
              <span>My Profile</span>
            </a>
          }

          @if (auth.isSeller()) {
            <mat-divider />
            <div class="menu-section-label">Seller Hub</div>
            <a mat-menu-item routerLink="/dashboard">
              <mat-icon>dashboard</mat-icon>
              <span>Dashboard</span>
            </a>
            <a mat-menu-item routerLink="/seller/products">
              <mat-icon>inventory_2</mat-icon>
              <span>My Products</span>
            </a>
            <a mat-menu-item routerLink="/seller/media">
              <mat-icon>perm_media</mat-icon>
              <span>Media Library</span>
            </a>
            <a mat-menu-item routerLink="/suborders">
              <mat-icon>sell</mat-icon>
              <span>Sales & Fulfillment</span>
            </a>
          }

          @if (auth.isAdmin()) {
            <mat-divider />
            <div class="menu-section-label">Admin Console</div>
            <a mat-menu-item routerLink="/admin/dashboard">
              <mat-icon>admin_panel_settings</mat-icon>
              <span>Overview</span>
            </a>
            <a mat-menu-item routerLink="/admin/products">
              <mat-icon>inventory</mat-icon>
              <span>Catalog Management</span>
            </a>
            <a mat-menu-item routerLink="/admin/users">
              <mat-icon>group</mat-icon>
              <span>User Directory</span>
            </a>
          }

          <mat-divider />

          <button mat-menu-item (click)="theme.toggle()">
            <mat-icon>
              {{ theme.mode() === "dark" ? "light_mode" : "dark_mode" }}
            </mat-icon>
            <span>{{
              theme.mode() === "dark" ? "Light Mode" : "Dark Mode"
            }}</span>
          </button>

          @if (auth.isAuthenticated()) {
            <mat-divider />
            <button mat-menu-item (click)="logout()" class="logout-menu-item">
              <mat-icon>logout</mat-icon>
              <span>Log out</span>
            </button>
          } @else {
            <mat-divider />
            <a mat-menu-item routerLink="/auth/login">
              <mat-icon>login</mat-icon>
              <span>Login</span>
            </a>
            <a mat-menu-item routerLink="/auth/register">
              <mat-icon>person_add</mat-icon>
              <span>Create Account</span>
            </a>
          }
        </mat-menu>
      </div>
    </header>

    <!-- Main View Outlet Container -->
    <main class="app-main">
      <ng-content />
    </main>

    <!-- Polished Modern Footer -->
    <footer class="app-footer">
      <div class="container footer-container">
        <div class="footer-top">
          <div class="footer-brand-wrap">
            <div class="brand">
              <div class="brand-icon sm">
                <mat-icon>storefront</mat-icon>
              </div>
              <span class="brand-text"
                >Market<span class="brand-accent">place</span></span
              >
            </div>
            <p class="muted footer-tagline">
              Modern, multi-vendor e-commerce platform built for scale.
            </p>
          </div>

          <div class="footer-links-grid">
            <div class="footer-column">
              <span class="footer-heading">Platform</span>
              <a routerLink="/products" class="footer-link">Products</a>
              <a routerLink="/orders" class="footer-link">Track Orders</a>
              <a routerLink="/cart" class="footer-link">Cart</a>
            </div>

            <div class="footer-column">
              <span class="footer-heading">Portals</span>
              @if (auth.isSeller()) {
                <a routerLink="/seller/products" class="footer-link"
                  >Seller Center</a
                >
                <a routerLink="/suborders" class="footer-link">My Sells</a>
              } @else {
                <a routerLink="/auth/register" class="footer-link"
                  >Become a Seller</a
                >
              }
              @if (auth.isAdmin()) {
                <a routerLink="/admin/dashboard" class="footer-link"
                  >Administration</a
                >
              }
            </div>
          </div>
        </div>

        <div class="footer-bottom">
          <p class="muted copyright">
            &copy; {{ year }} Marketplace, Inc. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
        background: var(--app-bg);
      }

      /* ==========================================================================
         Header & Navigation (Glassmorphic Shadcn/Vercel Aesthetic)
         ========================================================================== */
      .app-header {
        position: sticky;
        top: 0;
        z-index: 100;
        background: var(--app-glass-bg);
        backdrop-filter: var(--app-backdrop-blur);
        -webkit-backdrop-filter: var(--app-backdrop-blur);
        border-bottom: 1px solid var(--app-border);
        transition:
          border-color 0.2s ease,
          background-color 0.2s ease;
      }

      .header-container {
        height: 60px;
        display: flex;
        align-items: center;
        gap: 20px;
      }

      /* Brand Styling */
      .brand {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        text-decoration: none !important;
        flex-shrink: 0;
      }

      .brand-icon {
        width: 32px;
        height: 32px;
        border-radius: var(--app-radius-sm);
        background: var(--app-fg);
        color: var(--app-bg);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: var(--app-shadow-sm);
      }
      .brand-icon.sm {
        width: 26px;
        height: 26px;
      }
      .brand-icon mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      .brand-text {
        font-weight: 700;
        font-size: 1.05rem;
        letter-spacing: -0.035em;
        color: var(--app-fg-heading);
      }

      .brand-accent {
        color: var(--app-muted);
        font-weight: 500;
      }

      /* Center Desktop Nav */
      .nav-links {
        display: flex;
        align-items: center;
        gap: 4px;
        overflow-x: auto;
        scrollbar-width: none;
      }
      .nav-links::-webkit-scrollbar {
        display: none;
      }

      .nav-link {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 0 10px;
        height: 34px;
        border-radius: var(--app-radius-sm);
        font-size: 13.5px;
        font-weight: 500;
        color: var(--app-muted);
        text-decoration: none !important;
        white-space: nowrap;
        transition:
          color 0.15s ease,
          background-color 0.15s ease;
      }

      .nav-link mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
        color: var(--app-muted);
        transition: color 0.15s ease;
      }

      .nav-link:hover {
        color: var(--app-fg-heading);
        background: var(--app-surface-hover);
      }
      .nav-link:hover mat-icon {
        color: var(--app-fg-heading);
      }

      .nav-link.active {
        color: var(--app-fg-heading);
        background: var(--app-surface-hover);
        font-weight: 600;
      }
      .nav-link.active mat-icon {
        color: var(--app-fg-heading);
      }

      .nav-spacer {
        flex: 1;
      }

      /* Header Controls */
      .header-controls {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-shrink: 0;
      }

      .header-btn {
        width: 36px;
        height: 36px;
        border-radius: var(--app-radius-sm);
        border: 1px solid var(--app-border);
        background: var(--app-surface);
        color: var(--app-muted);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.15s ease;
      }
      .header-btn:hover {
        background: var(--app-surface-hover);
        color: var(--app-fg-heading);
        border-color: var(--app-border-hover);
      }
      .header-btn mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      .cart-btn.active {
        border-color: var(--app-primary);
        color: var(--app-primary);
      }

      /* User Profile Pill */
      .user-profile-btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        height: 36px;
        padding: 0 10px 0 4px;
        border-radius: var(--app-radius-full);
        background: var(--app-surface);
        border: 1px solid var(--app-border);
        color: var(--app-fg-heading);
        cursor: pointer;
        transition: all 0.15s ease;
        font-family: inherit;
      }
      .user-profile-btn:hover {
        background: var(--app-surface-hover);
        border-color: var(--app-border-hover);
      }

      .user-display-name {
        font-size: 13.5px;
        font-weight: 500;
        max-width: 120px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .chevron-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
        color: var(--app-muted);
      }

      /* Auth Buttons */
      .auth-group {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .login-btn,
      .register-btn {
        height: 34px !important;
        font-size: 13.5px !important;
        padding: 0 14px !important;
      }

      .mobile-menu-btn {
        display: none;
      }

      /* Modern Dropdown & Menu Panel Overrides */
      .modern-dropdown-menu {
        min-width: 200px;
      }

      .menu-user-header {
        display: flex;
        flex-direction: column;
        padding: 10px 14px 8px;
      }
      .menu-user-name {
        font-weight: 600;
        font-size: 13.5px;
        color: var(--app-fg-heading);
      }
      .menu-user-email {
        font-size: 12px;
        color: var(--app-muted);
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .menu-section-label {
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--app-muted-light);
        padding: 8px 14px 4px;
      }

      .logout-menu-item {
        color: var(--app-danger) !important;
      }
      .logout-menu-item mat-icon {
        color: var(--app-danger) !important;
      }

      /* ==========================================================================
         Main Content Wrapper
         ========================================================================== */
      .app-main {
        flex: 1;
        display: flex;
        flex-direction: column;
      }

      /* ==========================================================================
         Footer (Clean, Balanced & Informative)
         ========================================================================== */
      .app-footer {
        border-top: 1px solid var(--app-border);
        background: var(--app-surface);
        padding: 48px 0 24px;
        margin-top: auto;
      }

      .footer-container {
        display: flex;
        flex-direction: column;
        gap: 32px;
      }

      .footer-top {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        flex-wrap: wrap;
        gap: 32px;
      }

      .footer-brand-wrap {
        max-width: 320px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .footer-tagline {
        font-size: 13.5px;
        line-height: 1.5;
        margin: 0;
      }

      .footer-links-grid {
        display: flex;
        gap: 48px;
        flex-wrap: wrap;
      }

      .footer-column {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .footer-heading {
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--app-fg-heading);
      }

      .footer-link {
        font-size: 13.5px;
        color: var(--app-muted);
        text-decoration: none;
        transition: color 0.15s ease;
      }
      .footer-link:hover {
        color: var(--app-fg-heading);
      }

      .footer-bottom {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding-top: 24px;
        border-top: 1px solid var(--app-border);
        flex-wrap: wrap;
        gap: 16px;
      }

      .copyright {
        font-size: 13px;
        margin: 0;
      }

      .footer-status-pill {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 10px;
        border-radius: var(--app-radius-full);
        background: var(--app-bg-alt);
        border: 1px solid var(--app-border);
        font-size: 12px;
        font-weight: 500;
        color: var(--app-muted);
      }

      .status-indicator {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: var(--app-success);
        box-shadow: 0 0 6px var(--app-success);
      }

      /* ==========================================================================
         Responsive Breakpoints
         ========================================================================== */
      @media (max-width: 980px) {
        .nav-links,
        .user-display-name,
        .auth-group {
          display: none !important;
        }

        .mobile-menu-btn {
          display: inline-flex;
        }

        .user-profile-btn {
          padding: 0 4px;
        }
        .user-profile-btn .chevron-icon {
          display: none;
        }
      }

      @media (max-width: 640px) {
        .header-container {
          padding-left: 14px;
          padding-right: 14px;
        }
        .footer-top {
          flex-direction: column;
          gap: 24px;
        }
        .footer-links-grid {
          gap: 36px;
        }
      }
    `,
  ],
})
export class MainLayoutComponent {
  readonly auth = inject(AuthService);
  readonly theme = inject(ThemeService);
  readonly year = new Date().getFullYear();
  readonly currentUser = inject(CurrentUserService);

  constructor() {
    let loaded = false;

    effect(() => {
      if (!this.auth.isAuthenticated()) {
        loaded = false;
        this.currentUser.clear();
        return;
      }

      if (!loaded) {
        loaded = true;
        this.currentUser.load();
      }
    });
  }

  logout() {
    this.auth.logout().subscribe();
  }
}
