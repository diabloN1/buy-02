import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { ProfileService } from "@core/services/profile.service";
import { NotificationService } from "@core/services/notification.service";
import { FieldErrorComponent } from "@shared/components/field-error.component";
import { LoadingSpinnerComponent } from "@shared/components/loading-spinner.component";
import { MediaService } from "@core/services/media.service";
import { CurrentUserService } from "@core/services/current-user.service";
import { applyFormErrors } from "@shared/utils/form-error.util";
import { AnalyticsService } from "@core/services/analytics.service";
import { AnalyticsDisplayComponent } from "@shared/components/analytics/analytics-display/analytics-display.component";
import { UserAnalytics, SellerAnalytics } from "@core/models/analytics.model";

@Component({
  selector: "app-profile",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    FieldErrorComponent,
    LoadingSpinnerComponent,
    AnalyticsDisplayComponent,
  ],
  template: `
    <div class="profile-page">
      <!-- Profile Header Banner -->
      <div class="profile-banner">
        <div class="container banner-content">
          <div class="user-identity">
            <div class="banner-avatar">
              @if (avatarUrl()) {
                <img [src]="avatarUrl()!" alt="Profile Avatar" />
              } @else {
                <div class="avatar-fallback">
                  {{
                    (form.controls.name.value || "U").charAt(0).toUpperCase()
                  }}
                </div>
              }
            </div>

            <div class="identity-text">
              <div class="role-pill">
                <mat-icon>shield</mat-icon>
                <span>{{ currentUser.user()?.role || "User Account" }}</span>
              </div>
              <h1 class="user-display-name">
                {{ form.controls.name.value || "Account User" }}
              </h1>
              <p class="user-display-email">{{ form.controls.email.value }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Profile Settings Container -->
      <div class="container settings-container">
        @if (loading()) {
          <app-loading-spinner label="Loading account profile…" />
        } @else {
          <div class="settings-grid">
            <!-- Left Sidebar Card: Avatar & Quick Info -->
            <aside class="app-card side-card">
              <div class="card-header">
                <h3>Profile Picture</h3>
                <p class="muted">Upload your official account avatar.</p>
              </div>

              <div class="avatar-upload-box">
                <div class="preview-avatar">
                  @if (avatarUrl()) {
                    <img [src]="avatarUrl()!" alt="Avatar Preview" />
                  } @else {
                    <div class="avatar-fallback-lg">
                      {{
                        (form.controls.name.value || "U")
                          .charAt(0)
                          .toUpperCase()
                      }}
                    </div>
                  }
                </div>

                <div class="upload-controls">
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    #fileInput
                    (change)="uploadAvatar(fileInput)"
                  />
                  <button
                    type="button"
                    class="btn btn-secondary upload-btn"
                    (click)="fileInput.click()"
                    [disabled]="uploading()"
                  >
                    <mat-icon>cloud_upload</mat-icon>
                    <span>{{
                      uploading() ? "Uploading…" : "Upload new photo"
                    }}</span>
                  </button>

                  @if (avatarUrl()) {
                    <button
                      type="button"
                      class="btn btn-ghost remove-btn"
                      (click)="deleteAvatar()"
                    >
                      <mat-icon>delete</mat-icon>
                      <span>Remove photo</span>
                    </button>
                  }
                </div>

                <small class="muted format-hint">
                  Supports JPG, PNG or WebP. Maximum file size 2 MB.
                </small>
              </div>

              <div class="card-divider"></div>

              <div class="account-summary-list">
                <div class="summary-item">
                  <span class="summary-label">Account Type</span>
                  <span class="summary-val">{{
                    currentUser.user()?.role || "Standard"
                  }}</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">Status</span>
                  <span class="summary-val status-active">
                    <span class="status-dot"></span> Active
                  </span>
                </div>
              </div>
            </aside>

            <!-- Right Main Panel: Personal Information Form -->
            <main class="app-card main-form-card">
              <div class="card-header">
                <h2>Personal Details</h2>
                <p class="muted">
                  Update your display name and registered email address.
                </p>
              </div>

              <form [formGroup]="form" (ngSubmit)="save()" class="form-stack">
                <div class="form-group">
                  <label class="input-label">Full Name</label>
                  <mat-form-field appearance="outline" class="w-full">
                    <mat-icon matPrefix>person</mat-icon>
                    <input
                      matInput
                      formControlName="name"
                      placeholder="John Doe"
                    />
                  </mat-form-field>
                  <app-field-error [control]="form.controls.name" />
                </div>

                <div class="form-group">
                  <label class="input-label">Email Address</label>
                  <mat-form-field appearance="outline" class="w-full">
                    <mat-icon matPrefix>email</mat-icon>
                    <input
                      matInput
                      type="email"
                      formControlName="email"
                      maxlength="50"
                      placeholder="user@example.com"
                    />
                  </mat-form-field>
                  <app-field-error [control]="form.controls.email" />
                </div>

                <div class="form-actions-bar">
                  <div class="grow"></div>
                  <button
                    type="submit"
                    class="btn btn-primary submit-btn"
                    [disabled]="form.invalid || saving()"
                  >
                    <mat-icon>check</mat-icon>
                    <span>{{
                      saving() ? "Saving Changes…" : "Save Changes"
                    }}</span>
                  </button>
                </div>
              </form>
            </main>
          </div>
        }
      </div>

      <!-- Analytics Toggle -->
      @if (!showAnalytics()) {
        <div class="analytics-toggle">
          <button
            type="button"
            class="btn btn-secondary"
            (click)="loadAnalytics()"
          >
            <mat-icon>bar_chart</mat-icon>
            <span>Show Analytics</span>
          </button>
        </div>
      } @else {
        @if (analyticsData()) {
          <div class="container">
            <app-analytics-display
              [userAnalytics]="userAnalytics()"
              [sellerAnalytics]="sellerAnalytics()"
            />
          </div>
        } @else {
          <app-loading-spinner label="Loading analytics…" />
        }
      }
    </div>
  `,
  styles: [
    `
      .profile-page {
        min-height: calc(100vh - 68px);
        background: var(--app-bg);
      }

      .profile-banner {
        background: var(--app-gradient-hero);
        border-bottom: 1px solid var(--app-border);
        padding: 40px 0 32px;
      }

      .banner-content {
        padding-top: 0 !important;
        padding-bottom: 0 !important;
      }

      .user-identity {
        display: flex;
        align-items: center;
        gap: 24px;
      }

      .banner-avatar {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        background: var(--app-gradient-primary);
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        border: 3px solid var(--app-surface);
        box-shadow: var(--app-shadow-lg);
        flex-shrink: 0;
      }
      .banner-avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .avatar-fallback {
        color: #ffffff;
        font-size: 2rem;
        font-weight: 800;
      }

      .identity-text {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .role-pill {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--app-primary);
        background: var(--app-primary-lighter);
        padding: 3px 10px;
        border-radius: 9999px;
        width: fit-content;
      }
      .role-pill mat-icon {
        font-size: 14px;
        width: 14px;
        height: 14px;
      }

      .user-display-name {
        font-size: 1.75rem;
        font-weight: 800;
        letter-spacing: -0.025em;
        margin: 0;
        color: var(--app-fg-heading);
      }

      .user-display-email {
        font-size: 14px;
        color: var(--app-muted);
        margin: 0;
      }

      .settings-container {
        padding-top: 36px;
        padding-bottom: 64px;
      }

      .settings-grid {
        display: grid;
        grid-template-columns: 320px 1fr;
        gap: 28px;
        align-items: start;
      }

      .side-card {
        padding: 28px;
        background: var(--app-surface);
      }

      .main-form-card {
        padding: 36px;
        background: var(--app-surface);
      }

      .card-header {
        margin-bottom: 24px;
      }
      .card-header h2 {
        font-size: 1.4rem;
        font-weight: 800;
        letter-spacing: -0.02em;
        margin: 0 0 4px;
        color: var(--app-fg-heading);
      }
      .card-header h3 {
        font-size: 1.15rem;
        font-weight: 700;
        margin: 0 0 4px;
        color: var(--app-fg-heading);
      }

      .avatar-upload-box {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: 16px;
      }

      .preview-avatar {
        width: 96px;
        height: 96px;
        border-radius: 50%;
        background: var(--app-gradient-primary);
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        border: 2px solid var(--app-border);
      }
      .preview-avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .avatar-fallback-lg {
        color: #ffffff;
        font-size: 2.4rem;
        font-weight: 800;
      }

      .upload-controls {
        display: flex;
        flex-direction: column;
        gap: 8px;
        width: 100%;
      }

      .upload-btn {
        width: 100%;
        justify-content: center;
        height: 40px;
      }

      .remove-btn {
        width: 100%;
        justify-content: center;
        height: 36px;
        color: var(--app-danger) !important;
      }

      .format-hint {
        font-size: 12px;
        line-height: 1.4;
      }

      .card-divider {
        height: 1px;
        background: var(--app-border);
        margin: 24px 0;
      }

      .account-summary-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .summary-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 13px;
      }
      .summary-label {
        color: var(--app-muted);
        font-weight: 500;
      }
      .summary-val {
        font-weight: 600;
        color: var(--app-fg-heading);
      }

      .status-active {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        color: var(--app-success);
      }
      .status-dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: var(--app-success);
      }

      .form-stack {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      .input-label {
        font-size: 13px;
        font-weight: 700;
        color: var(--app-fg-heading);
        margin-bottom: 6px;
        display: block;
      }

      .w-full {
        width: 100%;
      }

      .form-actions-bar {
        display: flex;
        align-items: center;
        margin-top: 12px;
        padding-top: 20px;
        border-top: 1px solid var(--app-border);
      }

      .submit-btn {
        height: 44px;
        padding: 0 28px;
        font-size: 14px;
      }

      @media (max-width: 860px) {
        .settings-grid {
          grid-template-columns: 1fr;
        }
      }

      .analytics-toggle {
        padding: 20px 0;
        text-align: center;
        border-bottom: 1px solid var(--app-border);
      }
      .analytics-toggle .btn {
        background: var(--app-primary-lighter);
        color: var(--app-primary) !important;
        border: 1px solid var(--app-border);
      }
      .analytics-toggle .btn:hover {
        background: var(--app-primary);
        color: #ffffff !important;
      }
    `,
  ],
})
export class ProfilePage {
  private readonly fb = inject(FormBuilder);
  private readonly profile = inject(ProfileService);
  private readonly notify = inject(NotificationService);
  private readonly media = inject(MediaService);
  private readonly analytics = inject(AnalyticsService);
  readonly currentUser = inject(CurrentUserService);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly uploading = signal(false);
  readonly avatarId = signal<string | undefined>(undefined);
  readonly avatarUrl = signal<string | undefined>(undefined);
  readonly showAnalytics = signal(false);
  readonly analyticsData = signal<{
    user?: UserAnalytics;
    seller?: SellerAnalytics;
  } | null>(null);

  readonly form = this.fb.nonNullable.group({
    name: ["", [Validators.required, Validators.maxLength(25)]],
    email: ["", [Validators.required, Validators.email]],
  });

  constructor() {
    this.profile.me().subscribe({
      next: (u) => {
        this.form.patchValue({ name: u.name, email: u.email });
        this.avatarId.set(u.avatar?.id);
        this.avatarUrl.set(u.avatar?.url);
        this.loading.set(false);
        this.currentUser.load();
      },
      error: () => this.loading.set(false),
    });
  }

  loadAnalytics(): void {
    const role = this.currentUser.user()?.role;
    this.showAnalytics.set(true);
    if (role === "SELLER") {
      this.analytics.getSellerAnalytics().subscribe({
        next: (data) => {
          this.analyticsData.update((old) => {
            return { ...old, seller: data };
          });
        },
        error: (err) => {
          this.notify.error(
            err.error?.message || "Failed to load seller analytics",
          );
        },
      });
    }
    this.analytics.getUserAnalytics().subscribe({
      next: (data) => {
        this.analyticsData.update((old) => {
          return { ...old, user: data };
        });
      },
      error: (err) => {
        this.notify.error(
          err.error?.message || "Failed to load user analytics",
        );
      },
    });
  }

  // Helper getters for type narrowing
  readonly userAnalytics = (): UserAnalytics | null => {
    return this.analyticsData()?.user ?? null;
  };

  readonly sellerAnalytics = (): SellerAnalytics | null => {
    return this.analyticsData()?.seller ?? null;
  };

  uploadAvatar(input: HTMLInputElement) {
    const file = input.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      return this.notify.error("Not an image");
    }

    if (file.size > 2 * 1024 * 1024) {
      return this.notify.error("Max 2 MB");
    }

    this.uploading.set(true);

    this.profile.uploadAvatar(file).subscribe({
      next: (user) => {
        this.avatarUrl.set(user.avatar?.url);
        this.avatarId.set(user.avatar?.id);
        this.notify.success("Avatar updated");
        this.uploading.set(false);

        input.value = "";
      },
      error: (err) => {
        this.notify.error(err.error?.message || "Failed to upload avatar");
        this.uploading.set(false);

        input.value = "";
      },
    });
  }

  deleteAvatar() {
    const id = this.avatarId();

    if (!id) {
      return;
    }

    this.media.deleteAvatar(id).subscribe({
      next: () => {
        this.avatarId.set(undefined);
        this.avatarUrl.set(undefined);

        this.notify.success("Avatar removed");
      },
      error: () => {
        this.notify.error("Failed to remove avatar");
      },
    });
  }

  save() {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.profile
      .update({
        name: this.form.controls.name.value,
        email: this.form.controls.email.value,
      })
      .subscribe({
        next: (user) => {
          this.form.patchValue({
            name: user.name,
            email: user.email,
          });

          this.avatarUrl.set(user.avatar?.url);
          this.avatarId.set(user.avatar?.id);

          this.saving.set(false);

          this.notify.success("Profile saved");
        },
        error: (err) => {
          this.saving.set(false);
          if (err.status === 400 && err.error?.details) {
            applyFormErrors(this.form, err.error.details);
          } else {
            this.notify.error(err.error?.message || "Failed to update profile");
          }
        },
      });
  }
}
