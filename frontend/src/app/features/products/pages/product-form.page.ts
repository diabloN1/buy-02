import {
  Component,
  inject,
  signal,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { ProductService } from "@core/services/product.service";
import { NotificationService } from "@core/services/notification.service";
import { FieldErrorComponent } from "@shared/components/field-error.component";
import { FileDropDirective } from "@shared/directives/file-drop.directive";
import { LoadingSpinnerComponent } from "@shared/components/loading-spinner.component";
import { ProductImage } from "@core/models/product.model";
import { applyFormErrors } from "@shared/utils/form-error.util";

const MAX_SIZE = 2 * 1024 * 1024;

@Component({
  selector: "app-product-form",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    FieldErrorComponent,
    FileDropDirective,
    LoadingSpinnerComponent,
  ],
  template: `
    <section class="container form-section">
      <a mat-button class="back-btn" routerLink="/seller/products">
        <mat-icon>arrow_back</mat-icon>
        <span>Back to my products</span>
      </a>

      <div class="glass-card panel">
        <div class="form-header">
          <h1>{{ id() ? "Edit Product" : "Create New Product" }}</h1>
          <p class="muted">Fill in the product details and upload product media assets.</p>
        </div>

        @if (loading()) {
          <app-loading-spinner label="Loading product data…" />
        } @else {
          <form [formGroup]="form" (ngSubmit)="submit()" class="stack">
            <mat-form-field appearance="outline">
              <mat-label>Product Name</mat-label>
              <mat-icon matPrefix>label</mat-icon>
              <input matInput formControlName="name" placeholder="e.g. Premium Wireless Headphones" />
            </mat-form-field>
            <app-field-error [control]="form.controls.name" />

            <mat-form-field appearance="outline">
              <mat-label>Description</mat-label>
              <textarea
                matInput
                rows="4"
                formControlName="description"
                placeholder="Provide a detailed product description…"
              ></textarea>
            </mat-form-field>
            <app-field-error [control]="form.controls.description" />

            <div class="row-inputs">
              <div class="field-half">
                <mat-form-field appearance="outline" class="w-full">
                  <mat-label>Price ($ USD)</mat-label>
                  <mat-icon matPrefix>attach_money</mat-icon>
                  <input matInput type="number" step="0.01" formControlName="price" placeholder="29.99" />
                </mat-form-field>
                <app-field-error [control]="form.controls.price" />
              </div>

              <div class="field-half">
                <mat-form-field appearance="outline" class="w-full">
                  <mat-label>Quantity in Stock</mat-label>
                  <mat-icon matPrefix>inventory_2</mat-icon>
                  <input matInput type="number" formControlName="quantity" placeholder="10" />
                </mat-form-field>
                <app-field-error [control]="form.controls.quantity" />
              </div>
            </div>

            <!-- Media Upload Area -->
            <div class="media-section">
              <label class="media-label">Product Media Images (Max 5)</label>

              @if (images().length < 5) {
                <label
                  class="dropzone"
                  appFileDrop
                  (filesDropped)="onFiles($event)"
                >
                  <input
                    type="file"
                    hidden
                    multiple
                    accept="image/*"
                    #f
                    (change)="onFiles(f.files!)"
                  />
                  <div class="drop-icon">
                    <mat-icon>cloud_upload</mat-icon>
                  </div>
                  <div class="drop-text">
                    <strong>Drag & drop images here</strong> or
                    <button
                      type="button"
                      mat-button
                      color="primary"
                      (click)="f.click()"
                    >
                      browse files
                    </button>
                  </div>
                  <small class="muted">PNG, JPG, WebP up to 2 MB each</small>
                </label>
              } @else {
                <div class="dropzone max-reached">
                  <mat-icon>block</mat-icon>
                  <div>Maximum of 5 images reached.</div>
                  <small class="muted">Remove an existing image to upload another.</small>
                </div>
              }

              @if (uploading()) {
                <div class="muted upload-progress">Uploading image assets… {{ progress() }}%</div>
              }

              @if (images().length) {
                <div class="thumbs-grid">
                  @for (image of images(); track image.url) {
                    <div class="thumb-card">
                      <img [src]="image.url" alt="" />
                      <button
                        mat-icon-button
                        type="button"
                        class="remove-img-btn"
                        (click)="removeImage(image)"
                        aria-label="Remove image"
                      >
                        <mat-icon>close</mat-icon>
                      </button>
                    </div>
                  }
                </div>
              }
            </div>

            <div class="form-actions">
              <a mat-outlined-button routerLink="/seller/products" class="cancel-btn">Cancel</a>
              <button
                mat-flat-button
                color="primary"
                class="save-btn"
                [disabled]="form.invalid || saving()"
              >
                <span *ngIf="!saving()">Save Product</span>
                <span *ngIf="saving()">Saving Product…</span>
              </button>
            </div>
          </form>
        }
      </div>
    </section>
  `,
  styles: [
    `
      .form-section {
        padding-top: 24px;
        padding-bottom: 64px;
      }

      .back-btn {
        margin-bottom: 20px;
        color: var(--app-muted) !important;
      }

      .panel {
        padding: 36px;
        max-width: 760px;
        width: 100%;
        margin: 0 auto;
        box-shadow: var(--app-shadow-lg);
      }

      .form-header {
        margin-bottom: 28px;
      }
      .form-header h1 {
        font-size: 1.75rem;
        font-weight: 800;
        letter-spacing: -0.025em;
        margin: 0 0 4px;
        color: var(--app-fg-heading);
      }

      .row-inputs {
        display: flex;
        gap: 16px;
      }
      .field-half {
        flex: 1;
      }
      .w-full {
        width: 100%;
      }

      .media-section {
        margin: 16px 0 24px;
      }

      .media-label {
        font-size: 13px;
        font-weight: 700;
        color: var(--app-fg-heading);
        margin-bottom: 8px;
        display: block;
      }

      .dropzone {
        padding: 36px 24px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        text-align: center;
        border: 2px dashed var(--app-border);
        border-radius: var(--app-radius);
        cursor: pointer;
        transition: all 0.25s ease;
        background: var(--app-bg-alt);
      }
      .dropzone:hover {
        border-color: var(--app-primary);
        background: var(--app-primary-lighter);
      }
      .dropzone.max-reached {
        cursor: not-allowed;
        opacity: 0.7;
      }

      .drop-icon mat-icon {
        font-size: 38px;
        width: 38px;
        height: 38px;
        color: var(--app-primary);
      }

      .thumbs-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
        gap: 14px;
        margin-top: 16px;
      }

      .thumb-card {
        position: relative;
        aspect-ratio: 1 / 1;
        border-radius: var(--app-radius-sm);
        overflow: hidden;
        border: 1px solid var(--app-border);
        box-shadow: var(--app-shadow-sm);
      }
      .thumb-card img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .remove-img-btn {
        position: absolute;
        top: 4px;
        right: 4px;
        background: rgba(15, 23, 42, 0.75);
        color: #ffffff;
        width: 28px !important;
        height: 28px !important;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
      }
      .remove-img-btn:hover {
        background: var(--app-danger);
      }

      .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        margin-top: 16px;
        padding-top: 20px;
        border-top: 1px solid var(--app-border);
      }

      .cancel-btn, .save-btn {
        height: 44px;
        border-radius: var(--app-radius-sm) !important;
        padding: 0 24px !important;
      }

      @media (max-width: 600px) {
        .panel {
          padding: 24px;
        }
        .row-inputs {
          flex-direction: column;
          gap: 0;
        }
      }
    `,
  ],
})
export class ProductFormPage {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly svc = inject(ProductService);
  private readonly notify = inject(NotificationService);

  readonly id = signal<string | null>(this.route.snapshot.paramMap.get("id"));
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly uploading = signal(false);
  readonly progress = signal(0);
  readonly images = signal<ProductImage[]>([]);
  readonly deletedImageIds = signal<string[]>([]);

  readonly form = this.fb.nonNullable.group({
    name: [
      "",
      [Validators.required, Validators.minLength(3), Validators.maxLength(100)],
    ],
    description: [
      "",
      [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(1000),
      ],
    ],
    price: [0, [Validators.required, Validators.min(0.01)]],
    quantity: [0, [Validators.required, Validators.min(0)]],
  });

  constructor() {
    const id = this.id();
    if (id) {
      this.loading.set(true);
      this.svc.get(id).subscribe({
        next: (p) => {
          this.form.patchValue({
            name: p.name,
            description: p.description,
            price: p.price,
            quantity: p.quantity,
          });
          this.images.set(
            (p.images ?? []).map((image) => ({
              id: image.id,
              url: image.url,
              existing: true,
            }))
          );
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
    }
  }

  onFiles(files: FileList) {
    if (this.images().length + files.length > 5) {
      this.notify.error("Maximum 5 images allowed");
      return;
    }

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) {
        this.notify.error(`${file.name} is not an image`);
        return;
      }

      if (file.size > MAX_SIZE) {
        this.notify.error(`${file.name} exceeds 2 MB`);
        return;
      }

      const url = URL.createObjectURL(file);
      this.images.update((images) => [
        ...images,
        {
          url,
          file,
          existing: false,
        },
      ]);
    });
  }

  removeImage(image: ProductImage) {
    if (image.existing && image.id) {
      this.deletedImageIds.update((ids) => [...ids, image.id!]);
    } else {
      URL.revokeObjectURL(image.url);
    }

    this.images.update((images) => images.filter((img) => img !== image));
  }

  submit() {
    if (this.form.invalid) return;

    this.saving.set(true);

    const body = this.form.getRawValue();

    const files = this.images()
      .filter((image) => !image.existing)
      .map((image) => image.file!);

    const req$ = this.id()
      ? this.svc.update(this.id()!, body, files, this.deletedImageIds())
      : this.svc.create(body, files);

    req$.subscribe({
      next: () => {
        this.saving.set(false);
        this.notify.success("Saved");
        this.router.navigateByUrl("/seller/products");
      },
      error: (err) => {
        this.saving.set(false);
        if (err.status === 400 && err.error?.details) {
          applyFormErrors(this.form, err.error.details);
        } else {
          this.notify.error(err.error?.message || "Failed to save product");
        }
      },
    });
  }
}
