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
import { UserAvatarComponent } from "@shared/components/user-avatar.component";
import { applyFormErrors } from "@shared/utils/form-error.util";
import { AnalyticsService } from "@core/services/analytics.service";
import { AnalyticsDisplayComponent } from "@shared/components/analytics/analytics-display.component";
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
    UserAvatarComponent,
    AnalyticsDisplayComponent,
    UserAvatarComponent,
  ],
  template: `
    <div class="profile-page">
      <!-- Profile Hero Banner -->
      <header class="profile-hero">
        <div class="container hero-container">
          <div class="profile-identity">
            <!-- Single Interactive Avatar -->
            <div class="hero-avatar-wrap">
              <app-user-avatar
                [avatarUrl]="avatarUrl()"
                [name]="form.controls.name.value"
                [userId]="currentUser.user()?.id"
                [size]="88"
              />
              <button
                type="button"
                class="avatar-camera-btn"
                (click)="avatarFileInput.click()"
                [disabled]="uploading()"
                matTooltip="Change photo"
              >
                <mat-icon>{{ uploading() ? "sync" : "photo_camera" }}</mat-icon>
              </button>
            </div>

            <!-- Identity Info & Quick Actions -->
            <div class="identity-info">
              <div class="badge-row">
                <span class="role-badge">
                  <mat-icon>shield</mat-icon>
                  {{ currentUser.user()?.role || "Member" }}
                </span>
                <span class="status-pill">
                  <span class="status-dot"></span> Active Account
                </span>
              </div>

              <h1 class="user-heading">
                {{ form.controls.name.value || "Account User" }}
              </h1>
              <span class="user-subtext">{{ form.controls.email.value }}</span>

              <!-- Photo Action Buttons -->
              <div class="avatar-actions">
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  #avatarFileInput
                  (change)="uploadAvatar(avatarFileInput)"
                />

                <button
                  type="button"
                  class="btn btn-secondary btn-sm"
                  (click)="avatarFileInput.click()"
                  [disabled]="uploading()"
                >
                  <mat-icon>cloud_upload</mat-icon>
                  <span>{{ uploading() ? "Uploading…" : "Change Photo" }}</span>
                </button>

                @if (avatarUrl()) {
                  <button
                    type="button"
                    class="btn btn-ghost btn-sm remove-photo-btn"
                    (click)="deleteAvatar()"
                  >
                    <mat-icon>delete_outline</mat-icon>
                    <span>Remove</span>
                  </button>
                }
              </div>
            </div>
          </div>
        </div>
      </header>

      <!-- Main Profile Workspace -->
      <div class="container workspace-container">
        @if (loading()) {
          <div class="loading-wrap">
            <app-loading-spinner label="Loading account profile…" />
          </div>
        } @else {
          <div class="profile-stack">
            <!-- Personal Details Form -->
            <section class="app-card setting-card">
              <div class="card-title-wrap">
                <h2 class="card-title">Personal Details</h2>
                <p class="muted card-desc">
                  Update your display name and registered email address
                </p>
              </div>

              <form [formGroup]="form" (ngSubmit)="save()" class="details-form">
                <div class="form-fields-stack">
                  <!-- Full Name -->
                  <div class="field-item">
                    <mat-form-field appearance="outline" class="w-full">
                      <mat-label>Full Name</mat-label>
                      <mat-icon matPrefix>person_outline</mat-icon>
                      <input
                        matInput
                        formControlName="name"
                        placeholder="Your display name"
                      />
                    </mat-form-field>
                    <app-field-error [control]="form.controls.name" />
                  </div>

                  <!-- Email Address -->
                  <div class="field-item">
                    <mat-form-field appearance="outline" class="w-full">
                      <mat-label>Email Address</mat-label>
                      <mat-icon matPrefix>mail_outline</mat-icon>
                      <input
                        matInput
                        type="email"
                        formControlName="email"
                        maxlength="50"
                        placeholder="name@example.com"
                      />
                      <mat-hint
                        >Used for order updates and notifications</mat-hint
                      >
                    </mat-form-field>
                    <app-field-error [control]="form.controls.email" />
                  </div>
                </div>

                <div class="form-footer">
                  @if (form.dirty && form.valid) {
                    <span class="unsaved-hint">
                      <mat-icon>info</mat-icon> Unsaved changes detected
                    </span>
                  } @else {
                    <div class="grow"></div>
                  }

                  <button
                    type="submit"
                    class="btn btn-primary save-btn"
                    [disabled]="form.invalid || form.pristine || saving()"
                  >
                    <mat-icon>{{ saving() ? "sync" : "check" }}</mat-icon>
                    <span>{{
                      saving() ? "Saving changes…" : "Save Changes"
                    }}</span>
                  </button>
                </div>
              </form>
            </section>

            <!-- Analytics & Performance Drawer Card -->
            <section class="app-card setting-card analytics-card">
              <div
                class="analytics-card-header"
                (click)="toggleAnalyticsView()"
              >
                <div class="analytics-title-group">
                  <div class="analytics-icon-badge">
                    <mat-icon>analytics</mat-icon>
                  </div>
                  <div>
                    <h3 class="card-title">Activity & Performance Insights</h3>
                    <p class="muted card-desc">
                      View your purchase, sales, and catalog metrics
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  class="btn btn-secondary toggle-analytics-btn"
                  (click)="$event.stopPropagation(); toggleAnalyticsView()"
                >
                  <span>{{
                    showAnalytics() ? "Hide Analytics" : "View Insights"
                  }}</span>
                  <mat-icon
                    class="toggle-arrow"
                    [class.rotated]="showAnalytics()"
                  >
                    expand_more
                  </mat-icon>
                </button>
              </div>

              @if (showAnalytics()) {
                <div class="analytics-expanded-content">
                  @if (analyticsData()) {
                    <app-analytics-display
                      [userAnalytics]="userAnalytics()"
                      [sellerAnalytics]="sellerAnalytics()"
                    />
                  } @else {
                    <div class="analytics-loader">
                      <app-loading-spinner label="Analyzing account metrics…" />
                    </div>
                  }
                </div>
              }
            </section>
          </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .profile-page {
        min-height: calc(100vh - 60px);
        background: var(--app-bg);
      }

      /* Hero Header */
      .profile-hero {
        background: var(--app-surface);
        border-bottom: 1px solid var(--app-border);
        padding: 36px 0;
      }

      .hero-container {
        max-width: 820px;
        margin: 0 auto;
        padding-top: 0 !important;
        padding-bottom: 0 !important;
      }

      .profile-identity {
        display: flex;
        align-items: center;
        gap: 28px;
      }

      /* Hero Avatar */
      .hero-avatar-wrap {
        position: relative;
        flex-shrink: 0;
        border-radius: 50%;
        box-shadow: var(--app-shadow);
      }

      .avatar-camera-btn {
        position: absolute;
        bottom: 0;
        right: 0;
        width: 30px;
        height: 30px;
        border-radius: 50%;
        background: var(--app-primary);
        color: var(--app-primary-text);
        border: 2px solid var(--app-surface);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: var(--app-shadow-sm);
        transition:
          transform 0.15s ease,
          background-color 0.15s ease;
      }
      .avatar-camera-btn:hover {
        transform: scale(1.08);
      }
      .avatar-camera-btn mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }

      .identity-info {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .badge-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 2px;
      }

      .role-badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 2px 8px;
        border-radius: var(--app-radius-full);
        background: var(--app-primary-lighter);
        color: var(--app-fg-heading);
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        border: 1px solid var(--app-border);
      }
      .role-badge mat-icon {
        font-size: 13px;
        width: 13px;
        height: 13px;
      }

      .status-pill {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        font-weight: 500;
        color: var(--app-success);
      }

      .status-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: var(--app-success);
        box-shadow: 0 0 6px var(--app-success);
      }

      .user-heading {
        font-size: 1.65rem;
        font-weight: 800;
        letter-spacing: -0.03em;
        margin: 0;
        color: var(--app-fg-heading);
      }

      .user-subtext {
        font-size: 13.5px;
        color: var(--app-muted);
      }

      .avatar-actions {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 8px;
      }

      .btn-sm {
        height: 32px;
        padding: 0 12px;
        font-size: 12.5px;
        gap: 6px;
      }
      .btn-sm mat-icon {
        font-size: 15px;
        width: 15px;
        height: 15px;
      }

      .remove-photo-btn {
        color: var(--app-danger) !important;
      }

      /* Workspace Layout (Clean Focused Column) */
      .workspace-container {
        max-width: 820px;
        margin: 0 auto;
        padding-top: 28px;
        padding-bottom: 72px;
      }

      .profile-stack {
        display: flex;
        flex-direction: column;
        gap: 24px;
      }

      .setting-card {
        padding: 32px;
        border-radius: var(--app-radius-lg);
      }

      .card-title-wrap {
        margin-bottom: 24px;
      }

      .card-title {
        font-size: 1.25rem;
        font-weight: 700;
        letter-spacing: -0.02em;
        margin: 0 0 4px;
        color: var(--app-fg-heading);
      }

      .card-desc {
        font-size: 13.5px;
        margin: 0;
      }

      /* Details Form */
      .details-form {
        display: flex;
        flex-direction: column;
      }

      .form-fields-stack {
        display: flex;
        flex-direction: column;
        gap: 16px;
        margin-bottom: 24px;
      }

      .field-item {
        display: flex;
        flex-direction: column;
      }

      .w-full {
        width: 100%;
      }

      .form-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding-top: 20px;
        border-top: 1px solid var(--app-border);
      }

      .unsaved-hint {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 12.5px;
        color: var(--app-warning);
        font-weight: 500;
      }
      .unsaved-hint mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }

      .save-btn {
        height: 40px;
        padding: 0 24px;
      }

      /* Analytics Drawer Card */
      .analytics-card {
        padding: 0;
        overflow: hidden;
      }

      .analytics-card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 24px 32px;
        cursor: pointer;
        transition: background-color 0.15s ease;
      }
      .analytics-card-header:hover {
        background-color: var(--app-surface-hover);
      }

      .analytics-title-group {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .analytics-icon-badge {
        width: 42px;
        height: 42px;
        border-radius: var(--app-radius-sm);
        background: var(--app-primary-lighter);
        color: var(--app-fg-heading);
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px solid var(--app-border);
      }
      .analytics-icon-badge mat-icon {
        font-size: 22px;
        width: 22px;
        height: 22px;
      }

      .toggle-analytics-btn {
        height: 36px;
        padding: 0 12px 0 16px;
        font-size: 13px;
      }

      .toggle-arrow {
        transition: transform 0.2s ease;
        margin-left: 4px;
      }
      .toggle-arrow.rotated {
        transform: rotate(180deg);
      }

      .analytics-expanded-content {
        padding: 0 32px 32px;
        border-top: 1px solid var(--app-border);
        background: var(--app-surface);
      }

      .analytics-loader {
        padding: 36px 0;
        display: flex;
        justify-content: center;
      }

      .loading-wrap {
        padding: 64px 0;
        display: flex;
        justify-content: center;
      }

      /* Responsive Rules */
      @media (max-width: 768px) {
        .profile-identity {
          flex-direction: column;
          text-align: center;
        }

        .badge-row,
        .avatar-actions {
          justify-content: center;
        }

        .setting-card {
          padding: 20px;
        }

        .analytics-card-header {
          padding: 18px 20px;
          flex-direction: column;
          align-items: flex-start;
          gap: 16px;
        }

        .toggle-analytics-btn {
          width: 100%;
          justify-content: center;
        }

        .form-footer {
          flex-direction: column;
          gap: 12px;
        }

        .save-btn {
          width: 100%;
        }
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

  toggleAnalyticsView(): void {
    const current = this.showAnalytics();
    this.showAnalytics.set(!current);

    if (!current && !this.analyticsData()) {
      this.loadAnalytics();
    }
  }
}
