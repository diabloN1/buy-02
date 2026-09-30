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
      <div class="app-card auth-card">
        <h1>Welcome back</h1>
        <p class="muted">Sign in to your account</p>
        <form [formGroup]="form" (ngSubmit)="submit()" class="stack">
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
              [type]="show() ? 'text' : 'password'"
              formControlName="password"
              autocomplete="current-password"
            />
            <button
              mat-icon-button
              matSuffix
              type="button"
              (click)="show.set(!show())"
              [attr.aria-label]="'Toggle password'"
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
            [disabled]="form.invalid || loading()"
          >
            {{ loading() ? "Signing in…" : "Sign in" }}
          </button>
        </form>
        <p class="muted center">
          No account? <a routerLink="/auth/register">Create one</a>
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
        max-width: 400px;
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
