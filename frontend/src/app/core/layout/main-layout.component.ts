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
    <mat-toolbar class="app-toolbar">
      <a routerLink="/" class="brand">
        <mat-icon>storefront</mat-icon>
        <span class="title">Marketplace</span>
      </a>

      <nav class="nav">
        <a mat-button routerLink="/products" routerLinkActive="active">
          Products
        </a>

        @if (auth.isSeller()) {
          <a mat-button routerLink="/dashboard" routerLinkActive="active">
            Dashboard
          </a>

          <a mat-button routerLink="/seller/products" routerLinkActive="active">
            My Products
          </a>

          <a
            mat-stroked-button
            routerLink="/seller/media"
            routerLinkActive="active"
          >
            Media management
          </a>
        }

        @if (auth.isAdmin()) {
          <a mat-button routerLink="/admin/dashboard" routerLinkActive="active">
            Dashboard
          </a>

          <a mat-button routerLink="/admin/products" routerLinkActive="active">
            Products
          </a>

          <a mat-button routerLink="/admin/users" routerLinkActive="active">
            Users
          </a>
        }
      </nav>

      <span class="grow"></span>

      <button
        matMiniFab
        class="theme desktop-theme"
        (click)="theme.toggle()"
        [attr.aria-label]="'Toggle theme'"
      >
        <mat-icon>
          {{ theme.mode() === "dark" ? "light_mode" : "dark_mode" }}
        </mat-icon>
      </button>

      <button
        matMiniFab
        class="theme desktop-theme"
        routerLink="/cart"
        [attr.aria-label]="'Toggle theme'"
      >
        <mat-icon>shopping_cart</mat-icon>
      </button>

      @if (auth.isAuthenticated()) {
        <button
          mat-button
          class="desktop-profile-button"
          [matMenuTriggerFor]="menu"
        >
          <mat-icon>account_circle</mat-icon>
          <span class="user-name">
            {{ currentUser.user()?.name }}
          </span>
        </button>

        <mat-menu #menu="matMenu">
          <a mat-menu-item routerLink="/profile">
            <mat-icon>person</mat-icon>
            <span>Profile</span>
          </a>

          <mat-divider />

          <button mat-menu-item (click)="logout()">
            <mat-icon>logout</mat-icon>
            <span>Log out</span>
          </button>
        </mat-menu>
      } @else {
        <a mat-button class="desktop-auth-button" routerLink="/auth/login">
          Login
        </a>

        <a
          mat-flat-button
          color="primary"
          class="desktop-auth-button"
          routerLink="/auth/register"
        >
          Sign up
        </a>
      }

      <button
        mat-icon-button
        class="mobile-menu-button"
        [matMenuTriggerFor]="mobileMenu"
        aria-label="Open navigation menu"
      >
        <mat-icon>menu</mat-icon>
      </button>

      <mat-menu #mobileMenu="matMenu">
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

        @if (auth.isAuthenticated()) {
          <a mat-menu-item routerLink="/profile">
            <mat-icon>person</mat-icon>
            <span>Profile</span>
          </a>

          <button mat-menu-item (click)="theme.toggle()">
            <mat-icon>
              {{ theme.mode() === "dark" ? "light_mode" : "dark_mode" }}
            </mat-icon>
            <span>
              {{ theme.mode() === "dark" ? "Light mode" : "Dark mode" }}
            </span>
          </button>

          <mat-divider />

          <button mat-menu-item (click)="logout()">
            <mat-icon>logout</mat-icon>
            <span>Log out</span>
          </button>
        } @else {
          <button mat-menu-item (click)="theme.toggle()">
            <mat-icon>
              {{ theme.mode() === "dark" ? "light_mode" : "dark_mode" }}
            </mat-icon>
            <span>
              {{ theme.mode() === "dark" ? "Light mode" : "Dark mode" }}
            </span>
          </button>

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
    </mat-toolbar>

    <main class="app-main">
      <ng-content />
    </main>

    <footer class="app-footer muted">© {{ year }} Marketplace</footer>
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
      }

      .app-toolbar {
        position: sticky;
        top: 0;
        z-index: 10;
        gap: 8px;
        background: var(--app-surface);
        border-bottom: 1px solid var(--app-border);
        color: var(--app-fg);
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
      }

      .brand {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        text-decoration: none;
        color: var(--app-fg);
        font-weight: 800;
        font-size: 1.15rem;
        letter-spacing: -0.02em;
      }

      .brand mat-icon {
        color: var(--app-primary);
        font-size: 24px;
        width: 24px;
        height: 24px;
      }

      .nav {
        display: flex;
        gap: 6px;
        margin-left: 20px;
      }

      .nav a {
        font-weight: 500;
        font-size: 13.5px;
        opacity: 0.85;
        transition: all 0.2s ease;
        border-radius: var(--app-radius-sm);
      }

      .nav a:hover {
        opacity: 1;
        background: rgba(99, 102, 241, 0.04);
      }

      .nav .active {
        background: var(--app-primary-light);
        color: var(--app-primary);
        opacity: 1;
      }

      .grow {
        flex: 1;
      }

      .user-name {
        margin-left: 6px;
        font-weight: 500;
      }

      .app-main {
        flex: 1;
        background: var(--app-bg);
      }

      .app-footer {
        text-align: center;
        padding: 32px 24px;
        font-size: 12px;
        border-top: 1px solid var(--app-border);
        background: var(--app-surface);
        letter-spacing: 0.05em;
        font-weight: 500;
        text-transform: uppercase;
      }

      .theme {
        box-shadow: none;
        color: var(--app-fg);
        background-color: transparent;
      }

      .mobile-menu-button {
        display: none;
      }

      @media (max-width: 820px) {
        .nav {
          display: none;
        }

        .desktop-theme,
        .desktop-profile-button,
        .desktop-auth-button {
          display: none;
        }

        .mobile-menu-button {
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
