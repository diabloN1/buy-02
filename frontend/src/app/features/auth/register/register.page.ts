import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatButtonModule } from "@angular/material/button";
import { MatSelectModule } from "@angular/material/select";
import { MatIconModule } from "@angular/material/icon";
import { AuthService } from "@core/services/auth.service";
import { NotificationService } from "@core/services/notification.service";
import { FieldErrorComponent } from "@shared/components/field-error.component";
import { passwordStrength } from "@shared/validators/validators";
import { applyFormErrors } from "@shared/utils/form-error.util";

@Component({
  selector: "app-register",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    FieldErrorComponent, // Removed the duplicate MatIconModule import
  ],
  template: `
    <section class="auth-wrap animate-fade-in">
      <!-- Premium Ambient Background -->
      <div class="auth-bg-pattern"></div>
      <div class="auth-ambient-glow"></div>

      <!-- Card Entrance Animation -->
      <div class="glass-card auth-card animate-pop-in delay-1">
        <div class="auth-header">
          <div class="brand-badge">
            <mat-icon>person_add</mat-icon>
          </div>
          <h1>Create your account</h1>
          <p class="muted">Join Marketplace as a buyer or seller</p>
        </div>

        <form
          [formGroup]="form"
          (ngSubmit)="submit()"
          class="auth-form animate-fade-in delay-2"
        >
          <div class="field-group">
            <mat-form-field appearance="outline" subscriptSizing="dynamic">
              <mat-label>Full name</mat-label>
              <mat-icon matPrefix>person</mat-icon>
              <input
                matInput
                formControlName="name"
                placeholder="John Doe"
                autocomplete="name"
              />
            </mat-form-field>
            <app-field-error [control]="form.controls.name" />
          </div>

          <div class="field-group">
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
          </div>

          <div class="field-group">
            <mat-form-field appearance="outline" subscriptSizing="dynamic">
              <mat-label>Password</mat-label>
              <mat-icon matPrefix>lock</mat-icon>
              <input
                matInput
                type="password"
                formControlName="password"
                placeholder="Min. 8 characters"
                autocomplete="new-password"
              />
            </mat-form-field>
            <app-field-error [control]="form.controls.password" />
          </div>

          <div class="field-group">
            <mat-form-field appearance="outline" subscriptSizing="dynamic">
              <mat-label>Account role</mat-label>
              <mat-icon matPrefix>badge</mat-icon>
              <mat-select formControlName="role">
                <mat-option value="USER"
                  >Client — Browse & Buy products</mat-option
                >
                <mat-option value="SELLER"
                  >Seller — List & Sell products</mat-option
                >
              </mat-select>
            </mat-form-field>
          </div>

          <!-- FIXED BUTTON CONTENT PROJECTION -->
          <button
            mat-flat-button
            color="primary"
            class="submit-btn"
            [disabled]="form.invalid || loading()"
          >
            @if (loading()) {
              <mat-icon class="spinner-icon">autorenew</mat-icon>
            }
            <span>{{
              loading() ? "Creating account…" : "Create Account"
            }}</span>
          </button>
        </form>

        <div class="auth-footer">
          <p class="muted">
            Already have an account?
            <a routerLink="/auth/login" class="auth-link">Sign in</a>
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

      :host-context(.dark-theme) .auth-ambient-glow {
        opacity: 0.1;
      }

      .auth-card {
        position: relative;
        z-index: 2;
        width: 100%;
        max-width: 440px;
        padding: 40px 32px;
        background: var(--app-glass-bg);
        backdrop-filter: var(--app-backdrop-blur);
        -webkit-backdrop-filter: var(--app-backdrop-blur);
        border: 1px solid var(--app-glass-border);
        box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.1);
        border-radius: var(--app-radius-lg);
      }

      @media (max-width: 640px) {
        .auth-card {
          padding: 32px 24px;
        }
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
        color: var(--app-primary-text);
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

      /* Form Fields Layout */
      .auth-form {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      .field-group {
        display: flex;
        flex-direction: column;
        gap: 6px; /* Precise spacing between input and error text */
      }

      mat-form-field {
        width: 100%;
      }

      .submit-btn {
        height: 48px; /* Taller button for prominent primary action */
        font-size: 15px !important;
        font-weight: 600 !important;
        border-radius: var(--app-radius-sm) !important;
        margin-top: 8px;
      }

      .spinner-icon {
        animation: spin 1s linear infinite;
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
export class RegisterPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notify = inject(NotificationService);
  readonly loading = signal(false);

  readonly form = this.fb.nonNullable.group({
    name: [
      "",
      [Validators.required, Validators.minLength(3), Validators.maxLength(25)],
    ],
    email: ["", [Validators.required, Validators.email]],
    password: [
      "",
      [
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(30),
        passwordStrength,
      ],
    ],
    role: ["USER" as "USER" | "SELLER", [Validators.required]],
  });

  submit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.auth.register(this.form.getRawValue()).subscribe({
      next: () => {
        this.loading.set(false);
        this.notify.success("Account created successfully!");
        this.router.navigateByUrl("/");
      },
      error: (err) => {
        this.loading.set(false);
        if (err.status === 400 && err.error?.details) {
          applyFormErrors(this.form, err.error.details);
        } else {
          this.notify.error(
            err.error?.message || "An error occurred during registration.",
          );
        }
      },
    });
  }
}
