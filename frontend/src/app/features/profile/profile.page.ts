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
    UserAvatarComponent,
  ],
  template: `
    <div class="profile-page animate-fade-in">
      <!-- Profile Header Banner (Upgraded with premium ambient glow) -->
      <div class="profile-banner">
        <div class="banner-ambient-glow"></div>
        <div class="container banner-content">
          <div class="user-identity">
            <div class="banner-avatar">
              <app-user-avatar
                [avatarUrl]="avatarUrl()"
                [name]="form.controls.name.value"
                [userId]="currentUser.user()?.id"
                [size]="84"
              />
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
            <aside class="app-card side-card delay-1">
              <div class="card-header">
                <h3>Profile Picture</h3>
                <p class="muted">Upload your official account avatar.</p>
              </div>

              <div class="avatar-upload-box">
                <div class="preview-avatar">
                  <app-user-avatar
                    [avatarUrl]="avatarUrl()"
                    [name]="form.controls.name.value"
                    [userId]="currentUser.user()?.id"
                    [size]="100"
                  />
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
                  Supports JPG, PNG or WebP. <br />Maximum file size 2 MB.
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
            <main class="app-card main-form-card delay-2">
              <div class="card-header">
                <h2>Personal Details</h2>
                <p class="muted">
                  Update your display name and registered email address.
                </p>
              </div>

              <form [formGroup]="form" (ngSubmit)="save()" class="form-stack">
                <div class="form-group">
                  <label class="input-label">Full Name</label>
                  <mat-form-field
                    appearance="outline"
                    class="w-full"
                    subscriptSizing="dynamic"
                  >
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
                  <mat-form-field
                    appearance="outline"
                    class="w-full"
                    subscriptSizing="dynamic"
                  >
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
    </div>
  `,
  styles: [
    `
      .profile-page {
        min-height: calc(100vh - 68px);
        background: var(--app-bg);
      }

      /* ==========================================================================
         Profile Banner (Premium Styling)
         ========================================================================== */
      .profile-banner {
        position: relative;
        background: linear-gradient(
          180deg,
          var(--app-primary-lighter) 0%,
          var(--app-bg) 100%
        );
        border-bottom: 1px solid var(--app-border);
        padding: 56px 0 40px;
        overflow: hidden;
      }

      /* Abstract Mesh Glow Effect */
      .banner-ambient-glow {
        position: absolute;
        top: -50%;
        right: 10%;
        width: 600px;
        height: 600px;
        background: radial-gradient(
          circle,
          var(--app-accent-light) 0%,
          transparent 60%
        );
        opacity: 0.6;
        filter: blur(40px);
        z-index: 0;
        pointer-events: none;
      }

      /* Dark mode adjustment for ambient glow */
      :host-context(.dark-theme) .banner-ambient-glow {
        opacity: 0.15;
      }

      .banner-content {
        position: relative;
        z-index: 1;
        padding-top: 0 !important;
        padding-bottom: 0 !important;
      }

      .user-identity {
        display: flex;
        align-items: center;
        gap: 28px;
      }

      .banner-avatar {
        width: 84px;
        height: 84px;
        border-radius: 50%;
        background: var(--app-surface);
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        /* Pro inner/outer border stack */
        border: 4px solid var(--app-surface);
        box-shadow:
          0 0 0 1px var(--app-border),
          var(--app-shadow-lg);
        flex-shrink: 0;
        transition: transform var(--transition-normal);
      }
      .banner-avatar:hover {
        transform: scale(1.05);
      }

      .identity-text {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .role-pill {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--app-primary);
        background: var(--app-bg);
        border: 1px solid var(--app-border);
        padding: 4px 12px;
        border-radius: var(--app-radius-full);
        width: fit-content;
        box-shadow: var(--app-shadow-sm);
      }
      .role-pill mat-icon {
        font-size: 14px;
        width: 14px;
        height: 14px;
      }

      .user-display-name {
        font-size: 2rem;
        font-weight: 800;
        letter-spacing: -0.03em;
        margin: 0;
        color: var(--app-fg-heading);
        line-height: 1.1;
      }

      .user-display-email {
        font-size: 15px;
        color: var(--app-muted);
        margin: 0;
        font-weight: 500;
      }

      /* ==========================================================================
         Settings Layout & Cards
         ========================================================================== */
      .settings-container {
        padding-top: 40px;
        padding-bottom: 80px;
      }

      .settings-grid {
        display: grid;
        grid-template-columns: 320px 1fr;
        gap: 32px;
        align-items: start;
      }

      .side-card {
        padding: 32px 28px;
        background: var(--app-surface);
        /* Adding initial opacity for our stagger animation */
        opacity: 0;
        animation: fadeInUp 0.4s var(--ease-out) forwards;
      }

      .main-form-card {
        padding: 40px 36px;
        background: var(--app-surface);
        opacity: 0;
        animation: fadeInUp 0.4s var(--ease-out) forwards;
      }

      .card-header {
        margin-bottom: 28px;
      }
      .card-header h2 {
        font-size: 1.5rem;
        font-weight: 800;
        letter-spacing: -0.025em;
        margin: 0 0 6px;
        color: var(--app-fg-heading);
      }
      .card-header h3 {
        font-size: 1.2rem;
        font-weight: 700;
        letter-spacing: -0.01em;
        margin: 0 0 4px;
        color: var(--app-fg-heading);
      }
      .card-header p {
        margin: 0;
        font-size: 14px;
        line-height: 1.5;
      }

      /* ==========================================================================
         Sidebar Elements
         ========================================================================== */
      .avatar-upload-box {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: 20px;
      }

      .preview-avatar {
        width: 100px;
        height: 100px;
        border-radius: 50%;
        background: var(--app-surface-hover);
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        border: 1px solid var(--app-border);
        box-shadow: var(--app-shadow-sm);
        transition:
          transform var(--transition-normal),
          box-shadow var(--transition-normal);
      }
      .preview-avatar:hover {
        transform: scale(1.05);
        box-shadow: var(--app-shadow);
      }

      .upload-controls {
        display: flex;
        flex-direction: column;
        gap: 10px;
        width: 100%;
      }

      .upload-btn {
        width: 100%;
        justify-content: center;
      }

      .remove-btn {
        width: 100%;
        justify-content: center;
        color: var(--app-danger) !important;
      }

      .format-hint {
        font-size: 12px;
        line-height: 1.5;
        color: var(--app-muted-light);
      }

      .card-divider {
        height: 1px;
        background: var(--app-border);
        margin: 32px 0;
      }

      /* Premium Summary Widget */
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
        padding: 12px 16px;
        background: var(--app-bg-alt);
        border: 1px solid var(--app-border);
        border-radius: var(--app-radius-sm);
        transition: background-color var(--transition-fast);
      }
      .summary-item:hover {
        background: var(--app-surface-hover);
      }

      .summary-label {
        color: var(--app-muted);
        font-weight: 600;
      }

      .summary-val {
        font-weight: 700;
        color: var(--app-fg-heading);
      }

      .status-active {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        color: var(--app-success);
      }
      .status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--app-success);
        box-shadow: 0 0 0 2px var(--app-success-light);
      }

      /* ==========================================================================
         Main Form
         ========================================================================== */
      .form-stack {
        display: flex;
        flex-direction: column;
        gap: 24px;
      }

      .form-group {
        display: flex;
        flex-direction: column;
      }

      .input-label {
        font-size: 14px;
        font-weight: 600;
        color: var(--app-fg-heading);
        margin-bottom: 8px;
        display: block;
      }

      .w-full {
        width: 100%;
      }

      .form-actions-bar {
        display: flex;
        align-items: center;
        margin-top: 16px;
        padding-top: 24px;
        border-top: 1px solid var(--app-border);
      }

      .submit-btn {
        height: 44px;
        padding: 0 32px;
        font-size: 14px;
        font-weight: 600;
      }

      @media (max-width: 860px) {
        .settings-grid {
          grid-template-columns: 1fr;
        }
        .user-identity {
          flex-direction: column;
          text-align: center;
          gap: 16px;
        }
        .role-pill {
          margin: 0 auto;
        }
        .banner-ambient-glow {
          top: -20%;
          right: 0;
          left: 0;
          margin: 0 auto;
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
  readonly currentUser = inject(CurrentUserService);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly uploading = signal(false);
  readonly avatarId = signal<string | undefined>(undefined);
  readonly avatarUrl = signal<string | undefined>(undefined);

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
