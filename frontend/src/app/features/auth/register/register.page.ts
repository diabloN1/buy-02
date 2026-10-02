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
    FieldErrorComponent,
  ],
  template: `
    <section class="auth-wrap">
      <div class="glass-card auth-card">
        <div class="auth-header">
          <div class="brand-badge">
            <mat-icon>person_add</mat-icon>
          </div>
          <h1>Create your account</h1>
          <p class="muted">Join Marketplace as a buyer or seller</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="submit()" class="stack">
          <mat-form-field appearance="outline">
            <mat-label>Full name</mat-label>
            <mat-icon matPrefix>person</mat-icon>
            <input matInput formControlName="name" placeholder="John Doe" autocomplete="name" />
          </mat-form-field>
          <app-field-error [control]="form.controls.name" />

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
              type="password"
              formControlName="password"
              placeholder="Min. 8 characters"
              autocomplete="new-password"
            />
          </mat-form-field>
          <app-field-error [control]="form.controls.password" />

          <mat-form-field appearance="outline">
            <mat-label>Account role</mat-label>
            <mat-icon matPrefix>badge</mat-icon>
            <mat-select formControlName="role">
              <mat-option value="USER">Client — Browse & Buy products</mat-option>
              <mat-option value="SELLER">Seller — List & Sell products</mat-option>
            </mat-select>
          </mat-form-field>

          <button
            mat-flat-button
            color="primary"
            class="submit-btn"
            [disabled]="form.invalid || loading()"
          >
            <span *ngIf="!loading()">Create Account</span>
            <span *ngIf="loading()">Creating account…</span>
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
        min-height: calc(100vh - 180px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 40px 16px;
        background: var(--app-gradient-hero);
      }

      .auth-card {
        width: 100%;
        max-width: 440px;
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
          this.notify.error(err.error?.message || "An error occurred during registration.");
        }
      },
    });
  }
}
