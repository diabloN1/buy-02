import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { Router, RouterLink, ActivatedRoute } from "@angular/router";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { AuthService } from "@core/services/auth.service";
import { NotificationService } from "@core/services/notification.service";
import { FieldErrorComponent } from "@shared/components/field-error.component";
import { applyFormErrors } from "@shared/utils/form-error.util";

@Component({
  selector: "app-login",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    FieldErrorComponent,
  ],
  template: `
    <section class="auth-wrap">
      <!-- Premium Ambient Background -->
      <div class="auth-bg-pattern"></div>
      <div class="auth-ambient-glow"></div>

      <div class="glass-card auth-card animate-pop-in">
        <div class="auth-header">
          <div class="brand-badge">
            <mat-icon>storefront</mat-icon>
          </div>
          <h1>Welcome back</h1>
          <p class="muted">Sign in to manage your orders & products</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="submit()" class="stack auth-form">
          <!-- subscriptSizing="dynamic" fixes the ugly bottom spacing! -->
          <mat-form-field appearance="outline" subscriptSizing="dynamic">
            <mat-label>Email address</mat-label>
            <mat-icon matPrefix>email</mat-icon>
            <input
              matInput
              type="email"
              formControlName="email"
              placeholder="you@example.com"
              autocomplete="email"
            />
          </mat-form-field>
          <app-field-error [control]="form.controls.email" />

          <mat-form-field appearance="outline" subscriptSizing="dynamic">
            <mat-label>Password</mat-label>
            <mat-icon matPrefix>lock</mat-icon>
            <input
              matInput
              [type]="show() ? 'text' : 'password'"
              formControlName="password"
              placeholder="••••••••"
              autocomplete="current-password"
            />
            <button
              mat-icon-button
              matSuffix
              type="button"
              (click)="show.set(!show())"
              [attr.aria-label]="'Toggle password visibility'"
            >
              <mat-icon>{{
                show() ? "visibility_off" : "visibility"
              }}</mat-icon>
            </button>
          </mat-form-field>
          <app-field-error [control]="form.controls.password" />

          <button
            mat-flat-button
            color="primary"
            class="submit-btn"
            [disabled]="form.invalid || loading()"
          >
            @if (!loading()) {
              <span>Sign in to Marketplace</span>
            } @else {
              <mat-icon class="spinner-icon">autorenew</mat-icon>
              <span>Signing in…</span>
            }
          </button>
        </form>

        <div class="auth-footer">
          <p class="muted">
            Don't have an account?
            <a routerLink="/auth/register" class="auth-link"
              >Create an account</a
            >
          </p>
        </div>
      </div>
    </section>
  `,
  styles: [
    `
      .auth-wrap {
        position: relative;
        min-height: calc(100vh - 68px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 40px 16px;
        background: var(--app-bg-alt);
        overflow: hidden;
      }

      /* Premium Background Effects */
      .auth-bg-pattern {
        position: absolute;
        inset: 0;
        z-index: 1;
        background-image: radial-gradient(
          var(--app-border-hover) 1px,
          transparent 1px
        );
        background-size: 24px 24px;
        opacity: 0.6;
        pointer-events: none;
      }

      .auth-ambient-glow {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 80vw;
        height: 80vh;
        background: radial-gradient(
          circle,
          var(--app-primary-light) 0%,
          transparent 60%
        );
        opacity: 0.5;
        filter: blur(60px);
        z-index: 1;
        pointer-events: none;
      }

      /* Dark mode adjustment for ambient glow */
      :host-context(.dark-theme) .auth-ambient-glow {
        opacity: 0.1;
      }

      .auth-card {
        position: relative;
        z-index: 2;
        width: 100%;
        max-width: 420px;
        padding: 40px 32px;
        background: var(--app-glass-bg);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid var(--app-glass-border);
        box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.1);
        border-radius: var(--app-radius-lg);
      }

      .auth-header {
        text-align: center;
        margin-bottom: 32px;
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      .brand-badge {
        width: 56px;
        height: 56px;
        border-radius: 16px;
        background: linear-gradient(
          135deg,
          var(--app-primary) 0%,
          var(--app-primary-hover) 100%
        );
        color: #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 20px;
        box-shadow:
          0 8px 16px -4px rgba(0, 0, 0, 0.2),
          inset 0 1px 1px rgba(255, 255, 255, 0.2);
      }
      .brand-badge mat-icon {
        font-size: 28px;
        width: 28px;
        height: 28px;
      }

      h1 {
        margin: 0 0 8px;
        font-size: 1.75rem;
        font-weight: 800;
        letter-spacing: -0.03em;
        color: var(--app-fg-heading);
      }

      p.muted {
        margin: 0;
        font-size: 14px;
        line-height: 1.5;
      }

      .auth-form {
        display: flex;
        flex-direction: column;
        gap: 20px; /* Perfectly spaces fields now that subscriptSizing="dynamic" is used */
      }

      .submit-btn {
        height: 46px;
        font-size: 15px !important;
        font-weight: 600 !important;
        border-radius: var(--app-radius-sm) !important;
        margin-top: 12px;
        transition: transform var(--transition-fast) !important;
      }
      .submit-btn:active {
        transform: scale(0.98) !important;
      }

      .spinner-icon {
        animation: spin 1s linear infinite;
        margin-right: 8px;
      }
      @keyframes spin {
        100% {
          transform: rotate(360deg);
        }
      }

      .auth-footer {
        margin-top: 28px;
        padding-top: 24px;
        border-top: 1px solid var(--app-border);
        text-align: center;
      }

      .auth-link {
        color: var(--app-primary);
        font-weight: 600;
        text-decoration: none;
        margin-left: 4px;
        transition: color var(--transition-fast);
      }
      .auth-link:hover {
        color: var(--app-accent);
        text-decoration: underline;
      }
    `,
  ],
})
export class LoginPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly notify = inject(NotificationService);
  readonly loading = signal(false);
  readonly show = signal(false);

  readonly form = this.fb.nonNullable.group({
    email: ["", [Validators.required, Validators.email]],
    password: ["", [Validators.required]],
  });

  submit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => {
        this.loading.set(false);
        this.notify.success("Welcome back!");
        const returnUrl =
          this.route.snapshot.queryParamMap.get("returnUrl") ?? "/";
        this.router.navigateByUrl(returnUrl);
      },
      error: (err) => {
        this.loading.set(false);
        if (err.status === 400 && err.error?.details) {
          applyFormErrors(this.form, err.error.details);
        } else if (err.status === 401) {
          this.notify.error("Invalid email or password");
        } else if (err.error?.message) {
          this.notify.error(err.error.message);
        } else {
          this.notify.error("An error occurred, please try again later!");
        }
      },
    });
  }
}
