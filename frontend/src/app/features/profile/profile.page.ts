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
  ],
  template: `
    <section class="container">
      <h1>Profile</h1>
      @if (loading()) {
        <app-loading-spinner />
      } @else {
        <div class="app-card panel">
          <div class="avatar-row">
            <div class="avatar">
              @if (avatarUrl()) {
                <img [src]="avatarUrl()!" alt="avatar" />
              } @else {
                <mat-icon>person</mat-icon>
              }
            </div>
            @if (avatarUrl()) {
              <button mat-button color="warn" (click)="deleteAvatar()">
                <mat-icon>delete</mat-icon>
                Remove avatar
              </button>
            }
            <div>
              <input
                type="file"
                hidden
                accept="image/*"
                #f
                (change)="uploadAvatar(f)"
              />
              <button
                mat-stroked-button
                (click)="f.click()"
                [disabled]="uploading()"
              >
                <mat-icon>photo_camera</mat-icon>
                {{ uploading() ? "Uploading…" : "Change avatar" }}
              </button>
            </div>
          </div>

          <form [formGroup]="form" (ngSubmit)="save()" class="stack">
            <mat-form-field appearance="outline"
              ><mat-label>Name</mat-label>
              <input matInput formControlName="name"
            /></mat-form-field>
            <app-field-error [control]="form.controls.name" />

            <mat-form-field appearance="outline">
              <mat-label>Email</mat-label>
              <input
                matInput
                type="email"
                formControlName="email"
                maxlength="30"
              />
            </mat-form-field>

            <app-field-error [control]="form.controls.email" />

            <div class="row">
              <span class="grow"></span>
              <button
                mat-flat-button
                color="primary"
                [disabled]="form.invalid || saving()"
              >
                {{ saving() ? "Saving…" : "Save changes" }}
              </button>
            </div>
          </form>
        </div>
      }
    </section>
  `,
  styles: [
    `
      .panel {
        padding: 32px;
        margin-top: 24px;
        max-width: 640px;
        width: 100%;
        box-sizing: border-box;
      }

      .avatar-row {
        display: flex;
        gap: 20px;
        align-items: center;
        margin-bottom: 28px;
        flex-wrap: wrap;
      }

      .avatar {
        width: 90px;
        height: 90px;
        flex: 0 0 90px;
        border-radius: 50%;
        background: var(--app-bg);
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        border: 2px solid var(--app-border);
        box-shadow: var(--app-shadow);
        transition: all 0.25s ease;
      }

      .avatar:hover {
        border-color: var(--app-primary);
        transform: scale(1.02);
      }

      .avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .avatar mat-icon {
        font-size: 44px;
        width: 44px;
        height: 44px;
        color: var(--app-muted);
        opacity: 0.7;
      }

      .stack {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .row {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-top: 12px;
      }

      .grow {
        flex: 1;
      }

      @media (max-width: 768px) {
        .panel {
          padding: 24px;
        }

        .avatar-row {
          gap: 16px;
        }
      }

      @media (max-width: 600px) {
        .panel {
          padding: 20px;
          margin-top: 16px;
        }

        .avatar-row {
          flex-direction: column;
          align-items: stretch;
          gap: 12px;
        }

        .avatar {
          align-self: center;
          width: 80px;
          height: 80px;
          flex-basis: 80px;
        }

        .avatar-row > button,
        .avatar-row > div:last-child {
          width: 100%;
        }

        .avatar-row > button,
        .avatar-row > div:last-child button {
          width: 100%;
        }

        .row {
          flex-direction: column-reverse;
          align-items: stretch;
        }

        .row button {
          width: 100%;
        }
      }
      mat-form-field {
        width: 100%;
      }

      .mat-mdc-input-element {
        overflow: hidden;
        text-overflow: ellipsis;
      }
    `,
  ],
})
export class ProfilePage {
  private readonly fb = inject(FormBuilder);
  private readonly profile = inject(ProfileService);
  private readonly notify = inject(NotificationService);
  private readonly media = inject(MediaService);
  private readonly currentUser = inject(CurrentUserService);

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
