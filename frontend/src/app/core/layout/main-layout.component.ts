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
            class="theme-toggle-btn desktop-theme"
            (click)="theme.toggle()"
            [attr.aria-label]="'Toggle theme mode'"
            [title]="theme.mode() === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
          >
            <mat-icon>
              {{ theme.mode() === "dark" ? "light_mode" : "dark_mode" }}
            </mat-icon>
          </button>

          @if (auth.isAuthenticated()) {
            <button
              type="button"
              class="user-profile-btn desktop-profile-button"
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

            <mat-menu #menu="matMenu" class="user-dropdown-menu">
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
            <div class="auth-buttons desktop-auth">
              <a routerLink="/auth/login" class="btn btn-ghost">
                Login
              </a>

              <a routerLink="/auth/register" class="btn btn-primary">
                Sign up
              </a>
            </div>
          }

          <!-- Mobile Hamburger Button -->
          <button
            type="button"
            class="mobile-menu-btn"
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
        <p class="muted copyright">© {{ year }} Marketplace Inc. All rights reserved.</p>
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

      .app-header {
        position: sticky;
        top: 0;
        z-index: 100;
        background: var(--app-glass-bg);
        backdrop-filter: var(--app-backdrop-blur);
        -webkit-backdrop-filter: var(--app-backdrop-blur);
        border-bottom: 1px solid var(--app-border);
        transition: background-color 0.25s ease, border-color 0.25s ease;
      }

      .header-container {
        height: 68px;
        padding-top: 0 !important;
        padding-bottom: 0 !important;
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .brand {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        text-decoration: none !important;
        color: var(--app-fg-heading);
        font-weight: 800;
        font-size: 1.25rem;
        letter-spacing: -0.03em;
        margin-right: 12px;
      }

      .brand-icon {
        width: 36px;
        height: 36px;
        border-radius: 10px;
        background: var(--app-gradient-primary);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #ffffff;
        box-shadow: var(--app-shadow-sm);
      }

      .brand-icon mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      .title-accent {
        color: var(--app-primary);
      }

      .nav-links {
        display: flex;
        gap: 4px;
        align-items: center;
      }

      .nav-link {
        font-weight: 500;
        font-size: 14px;
        color: var(--app-muted);
        transition: all 0.2s ease;
        border-radius: var(--app-radius-sm);
        padding: 0 14px;
        height: 38px;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        text-decoration: none !important;
      }

      .nav-link mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: var(--app-muted);
        transition: color 0.2s ease;
      }

      .nav-link:hover {
        color: var(--app-fg);
        background: var(--app-surface-hover);
      }

      .nav-link:hover mat-icon {
        color: var(--app-primary);
      }

      .nav-link.active {
        background: var(--app-primary-lighter) !important;
        color: var(--app-primary) !important;
        font-weight: 600;
      }

      .nav-link.active mat-icon {
        color: var(--app-primary) !important;
      }

      .grow {
        flex: 1;
      }

      .header-controls {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .theme-toggle-btn {
        width: 38px;
        height: 38px;
        border-radius: 50%;
        color: var(--app-fg);
        background: var(--app-surface);
        border: 1px solid var(--app-border);
        transition: all 0.2s ease;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        outline: none;
      }

      .theme-toggle-btn:hover {
        background: var(--app-surface-hover);
        border-color: var(--app-primary);
        color: var(--app-primary);
      }

      .theme-toggle-btn mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      .user-profile-btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 4px 12px 4px 6px;
        height: 38px;
        border-radius: 9999px;
        background: var(--app-surface);
        border: 1px solid var(--app-border);
        color: var(--app-fg);
        cursor: pointer;
        transition: all 0.2s ease;
        outline: none;
        font-family: inherit;
        font-size: 14px;
      }

      .user-profile-btn:hover {
        border-color: var(--app-primary);
        background: var(--app-surface-hover);
      }

      .avatar-circle {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: var(--app-gradient-primary);
        color: #ffffff;
        font-weight: 700;
        font-size: 13px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .user-name {
        font-weight: 600;
        font-size: 14px;
        white-space: nowrap;
      }

      .dropdown-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: var(--app-muted);
      }

      .auth-buttons {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .mobile-menu-btn {
        display: none;
        width: 38px;
        height: 38px;
        border-radius: 8px;
        background: var(--app-surface);
        border: 1px solid var(--app-border);
        color: var(--app-fg);
        align-items: center;
        justify-content: center;
        cursor: pointer;
      }

      .app-main {
        flex: 1;
        background: var(--app-bg);
      }

      .app-footer {
        padding: 36px 0;
        border-top: 1px solid var(--app-border);
        background: var(--app-surface);
        transition: background-color 0.25s ease, border-color 0.25s ease;
      }

      .footer-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
        text-align: center;
        padding-top: 0 !important;
        padding-bottom: 0 !important;
      }

      .footer-brand {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 700;
        font-size: 1rem;
        color: var(--app-fg);
      }

      .footer-brand mat-icon {
        color: var(--app-primary);
      }

      .copyright {
        font-size: 13px;
        margin: 0;
      }

      @media (max-width: 880px) {
        .nav-links {
          display: none;
        }

        .desktop-theme,
        .desktop-profile-button,
        .desktop-auth {
          display: none;
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
