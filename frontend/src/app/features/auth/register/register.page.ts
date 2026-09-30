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
    FieldErrorComponent,
  ],
  template: `
    <section class="auth-wrap">
      <div class="app-card auth-card">
        <h1>Create your account</h1>
        <p class="muted">Join the marketplace</p>
        <form [formGroup]="form" (ngSubmit)="submit()" class="stack">
          <mat-form-field appearance="outline">
            <mat-label>Name</mat-label>
            <input matInput formControlName="name" autocomplete="name" />
          </mat-form-field>
          <app-field-error [control]="form.controls.name" />

          <mat-form-field appearance="outline">
            <mat-label>Email</mat-label>
            <input
              matInput
              type="email"
              formControlName="email"
              autocomplete="email"
            />
          </mat-form-field>
          <app-field-error [control]="form.controls.email" />

          <mat-form-field appearance="outline">
            <mat-label>Password</mat-label>
            <input
              matInput
              type="password"
              formControlName="password"
              autocomplete="new-password"
            />
          </mat-form-field>
          <app-field-error [control]="form.controls.password" />

          <mat-form-field appearance="outline">
            <mat-label>Account type</mat-label>
            <mat-select formControlName="role">
              <mat-option value="USER">Client — I want to browse</mat-option>
              <mat-option value="SELLER">Seller — I want to sell</mat-option>
            </mat-select>
          </mat-form-field>

          <button
            mat-flat-button
            color="primary"
            [disabled]="form.invalid || loading()"
          >
            {{ loading() ? "Creating…" : "Create account" }}
          </button>
        </form>
        <p class="muted center">
          Have an account? <a routerLink="/auth/login">Sign in</a>
        </p>
      </div>
    </section>
  `,
  styles: [
    `
      .auth-wrap {
        display: flex;
        justify-content: center;
        padding: 80px 16px;
        background: radial-gradient(
          circle at 50% 50%,
          rgba(99, 102, 241, 0.05) 0%,
          transparent 50%
        );
      }
      .auth-card {
        width: 100%;
        max-width: 440px;
        padding: 40px;
        border: 1px solid var(--app-border);
        box-shadow: var(--app-shadow);
      }
      h1 {
        margin: 0 0 6px;
        font-weight: 800;
        letter-spacing: -0.02em;
        text-align: center;
      }
      p.muted {
        text-align: center;
        margin-bottom: 24px;
      }
      .center {
        text-align: center;
        margin-top: 24px;
      }
      .center a {
        color: var(--app-primary);
        font-weight: 600;
        text-decoration: none;
      }
      .center a:hover {
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
        this.notify.success("Account created");
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
