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
  ],
  template: `
    <header class="app-header">
      <div class="container header-container">
        <!-- Brand Logo -->
        <a routerLink="/" class="brand">
          <div class="brand-icon">
            <mat-icon>storefront</mat-icon>
          </div>
          <span class="title">Market<span class="title-accent">place</span></span>
        </a>

        <!-- Main Navigation Links -->
        <nav class="nav-links">
          <a routerLink="/products" routerLinkActive="active" class="nav-link">
            <mat-icon>grid_view</mat-icon>
            <span>Products</span>
          </a>

          @if (auth.isSeller()) {
            <a routerLink="/dashboard" routerLinkActive="active" class="nav-link">
              <mat-icon>dashboard</mat-icon>
              <span>Dashboard</span>
            </a>

            <a routerLink="/seller/products" routerLinkActive="active" class="nav-link">
              <mat-icon>inventory_2</mat-icon>
              <span>My Products</span>
            </a>

            <a routerLink="/seller/media" routerLinkActive="active" class="nav-link">
              <mat-icon>perm_media</mat-icon>
              <span>Media</span>
            </a>
          }

          @if (auth.isAdmin()) {
            <a routerLink="/admin/dashboard" routerLinkActive="active" class="nav-link">
              <mat-icon>admin_panel_settings</mat-icon>
              <span>Dashboard</span>
            </a>

            <a routerLink="/admin/products" routerLinkActive="active" class="nav-link">
              <mat-icon>inventory</mat-icon>
              <span>Products</span>
            </a>

            <a routerLink="/admin/users" routerLinkActive="active" class="nav-link">
              <mat-icon>group</mat-icon>
              <span>Users</span>
            </a>
          }
        </nav>

        <div class="grow"></div>

        <!-- Right Side Header Controls -->
        <div class="header-controls">
          <!-- Theme Toggle Circular Button -->
          <button
            type="button"
            class="icon-btn hide-on-mobile"
            (click)="theme.toggle()"
            [attr.aria-label]="'Toggle theme mode'"
            [title]="theme.mode() === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
          >
            <mat-icon>
              {{ theme.mode() === "dark" ? "light_mode" : "dark_mode" }}
            </mat-icon>
          </button>

          @if (auth.isAuthenticated()) {
            <a
              class="icon-btn hide-on-mobile cart-btn"
              routerLink="/cart"
              aria-label="View Cart"
            >
              <mat-icon>shopping_cart</mat-icon>
            </a>

            <button
              type="button"
              class="user-profile-btn hide-on-mobile"
              [matMenuTriggerFor]="menu"
              aria-label="User menu"
            >
              <div class="avatar-circle">
                {{ (currentUser.user()?.name || 'U').charAt(0).toUpperCase() }}
              </div>
              <span class="user-name">
                {{ currentUser.user()?.name }}
              </span>
              <mat-icon class="dropdown-icon">expand_more</mat-icon>
            </button>

            <mat-menu
              #menu="matMenu"
              class="user-dropdown-menu"
              xPosition="before"
            >
              <a mat-menu-item routerLink="/profile">
                <mat-icon>person</mat-icon>
                <span>My Profile</span>
              </a>

              <mat-divider />

              <button mat-menu-item (click)="logout()" class="logout-item">
                <mat-icon>logout</mat-icon>
                <span>Log out</span>
              </button>
            </mat-menu>
          } @else {
            <div class="auth-buttons hide-on-mobile">
              <a routerLink="/auth/login" class="btn btn-ghost">Login</a>
              <a routerLink="/auth/register" class="btn btn-primary">Sign up</a>
            </div>
          }

          <!-- Mobile Hamburger Button -->
          <button
            type="button"
            class="icon-btn mobile-menu-btn"
            [matMenuTriggerFor]="mobileMenu"
            aria-label="Open navigation menu"
          >
            <mat-icon>menu</mat-icon>
          </button>
        </div>

        <!-- Mobile Dropdown Menu -->
        <mat-menu #mobileMenu="matMenu" class="mobile-dropdown-menu">
          <a mat-menu-item routerLink="/products">
            <mat-icon>storefront</mat-icon>
            <span>Products</span>
          </a>

          @if (auth.isSeller()) {
            <mat-divider />
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
              <span>Media Management</span>
            </a>
          }

          @if (auth.isAdmin()) {
            <mat-divider />
            <a mat-menu-item routerLink="/admin/dashboard">
              <mat-icon>dashboard</mat-icon>
              <span>Dashboard</span>
            </a>
            <a mat-menu-item routerLink="/admin/products">
              <mat-icon>inventory_2</mat-icon>
              <span>Products</span>
            </a>
            <a mat-menu-item routerLink="/cart">
              <mat-icon>shopping_cart</mat-icon>
              <span>Cart</span>
            </a>
            <a mat-menu-item routerLink="/admin/users">
              <mat-icon>group</mat-icon>
              <span>Users</span>
            </a>
          }

          <mat-divider />

          <button mat-menu-item (click)="theme.toggle()">
            <mat-icon>
              {{ theme.mode() === "dark" ? "light_mode" : "dark_mode" }}
            </mat-icon>
            <span>
              {{ theme.mode() === "dark" ? "Light Mode" : "Dark Mode" }}
            </span>
          </button>

          @if (auth.isAuthenticated()) {
            <a mat-menu-item routerLink="/profile">
              <mat-icon>person</mat-icon>
              <span>Profile</span>
            </a>
            <mat-divider />
            <button mat-menu-item (click)="logout()">
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
              <span>Sign up</span>
            </a>
          }
        </mat-menu>
      </div>
    </header>

    <main class="app-main">
      <ng-content />
    </main>

    <footer class="app-footer">
      <div class="container footer-content">
        <div class="footer-brand">
          <mat-icon>storefront</mat-icon>
          <span>Marketplace</span>
        </div>
        <p class="muted copyright">
          © {{ year }} Marketplace Inc. All rights reserved.
        </p>
      </div>
    </footer>
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
      }

      /* Pro App Header (Shadcn/Vercel) */
      .app-header {
        position: sticky;
        top: 0;
        z-index: 50;
        background: var(--app-glass-bg);
        backdrop-filter: var(--app-backdrop-blur);
        -webkit-backdrop-filter: var(--app-backdrop-blur);
        border-bottom: 1px solid var(--app-border);
        transition: background-color 0.25s ease, border-color 0.25s ease;
      }

      .header-container {
        height: 64px; /* Crisp Shadcn standard height */
        padding-top: 0 !important;
        padding-bottom: 0 !important;
        display: flex;
        align-items: center;
        gap: 24px;
      }

      /* Minimalist Brand Logo */
      .brand {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        color: var(--app-fg-heading);
        font-weight: 700;
        font-size: 1.125rem;
        letter-spacing: -0.04em;
        margin-right: 8px;
        transition: opacity 0.2s ease;
      }
      .brand:hover {
        opacity: 0.85;
      }

      .brand-icon {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        background: var(--app-fg-heading); /* High contrast logo */
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--app-bg);
      }
      .brand-icon mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      /* Pro App Navigation Links */
      .nav-links {
        display: flex;
        gap: 6px;
        align-items: center;
      }

      .nav-link {
        font-weight: 500;
        font-size: 14px;
        color: var(--app-muted);
        transition:
          color 0.15s ease,
          background-color 0.15s ease;
        border-radius: var(--app-radius-sm);
        padding: 0 12px;
        height: 36px;
        display: inline-flex;
        align-items: center;
        gap: 8px;
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
      }
      .nav-link:hover mat-icon {
        color: var(--app-fg-heading);
      }

      /* Subtle Shadcn Active State */
      .nav-link.active {
        background: var(--app-surface-hover);
        color: var(--app-fg-heading) !important;
      }
      .nav-link.active mat-icon {
        color: var(--app-fg-heading) !important;
      }

      .grow {
        flex: 1;
      }

      /* Controls Section */
      .header-controls {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      /* Standardized Icon Buttons (Replacing MDC defaults) */
      .icon-btn {
        width: 36px;
        height: 36px;
        border-radius: var(--app-radius-sm);
        background: transparent;
        border: 1px solid transparent;
        color: var(--app-muted);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.15s ease;
      }
      .icon-btn mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
      .icon-btn:hover {
        background: var(--app-surface-hover);
        color: var(--app-fg-heading);
      }
      .icon-btn:focus-visible {
        outline: none;
        box-shadow: var(--app-glow);
        border-color: var(--app-primary);
      }

      /* Cart Button Special Polish */
      .cart-btn {
        border: 1px solid var(--app-border);
        background: var(--app-surface);
      }

      /* User Profile Pill Dropdown */
      .user-profile-btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 4px 12px 4px 4px;
        height: 36px;
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
      }
      .user-profile-btn:focus-visible {
        outline: none;
        box-shadow: var(--app-glow);
      }

      .avatar-circle {
        width: 26px;
        height: 26px;
        border-radius: 50%;
        background: var(--app-gradient-primary);
        color: #ffffff;
        font-weight: 600;
        font-size: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      .user-name {
        font-weight: 500;
        font-size: 14px;
        white-space: nowrap;
      }
      .dropdown-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
        color: var(--app-muted);
      }

      .auth-buttons {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .mobile-menu-btn {
        display: none;
        border: 1px solid var(--app-border);
        background: var(--app-surface);
      }

      .app-main {
        flex: 1;
        background: var(--app-bg);
      }

      /* Clean Shadcn Footer */
      .app-footer {
        padding: 40px 0;
        border-top: 1px solid var(--app-border);
        background: var(--app-surface);
        transition: background-color 0.25s ease, border-color 0.25s ease;
        background: var(--app-bg);
        transition:
          background-color 0.25s ease,
          border-color 0.25s ease;
      }

      .footer-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        text-align: center;
      }

      .footer-brand {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 700;
        font-size: 14px;
        color: var(--app-fg-heading);
      }
      .footer-brand mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      .copyright {
        font-size: 13px;
        margin: 0;
      }

      /* Responsive Setup */
      @media (max-width: 900px) {
        .nav-links,
        .hide-on-mobile {
          display: none !important;
        }
        .mobile-menu-btn {
          display: inline-flex;
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