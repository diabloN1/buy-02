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
      <div class="glass-card auth-card">
        <div class="auth-header">
          <div class="brand-badge">
            <mat-icon>storefront</mat-icon>
          </div>
          <h1>Welcome back</h1>
          <p class="muted">Sign in to manage your orders & products</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="submit()" class="stack">
          <mat-form-field appearance="outline">
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

          <mat-form-field appearance="outline">
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
            <span *ngIf="!loading()">Sign in to Marketplace</span>
            <span *ngIf="loading()">Signing in…</span>
          </button>
        </form>

        <div class="auth-footer">
          <p class="muted">
            Don't have an account?
            <a routerLink="/auth/register" class="auth-link">Create an account</a>
          </p>
        </div>
      </div>
    </section>
  `,
  styles: [
    `
      .auth-wrap {
        min-height: calc(100vh - 180px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 40px 16px;
        background: var(--app-gradient-hero);
      }

      .auth-card {
        width: 100%;
        max-width: 420px;
        padding: 40px 32px;
        box-shadow: var(--app-shadow-xl);
      }

      .auth-header {
        text-align: center;
        margin-bottom: 28px;
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      .brand-badge {
        width: 48px;
        height: 48px;
        border-radius: 14px;
        background: var(--app-gradient-primary);
        color: #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 16px;
        box-shadow: var(--app-glow);
      }
      .brand-badge mat-icon {
        font-size: 26px;
        width: 26px;
        height: 26px;
      }

      h1 {
        margin: 0 0 6px;
        font-size: 1.75rem;
        font-weight: 800;
        letter-spacing: -0.03em;
        color: var(--app-fg-heading);
      }

      p.muted {
        margin: 0;
        font-size: 14px;
      }

      .submit-btn {
        height: 46px;
        font-size: 15px !important;
        font-weight: 600 !important;
        border-radius: var(--app-radius-sm) !important;
        margin-top: 8px;
      }

      .auth-footer {
        margin-top: 24px;
        padding-top: 20px;
        border-top: 1px solid var(--app-border);
        text-align: center;
      }

      .auth-link {
        color: var(--app-primary);
        font-weight: 600;
        text-decoration: none;
        margin-left: 4px;
      }
      .auth-link:hover {
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
