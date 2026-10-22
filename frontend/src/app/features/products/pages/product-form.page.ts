import { Component, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";

import { ProductService } from "@core/services/product.service";
import { CategoryService } from "@core/services/category.service";
import { NotificationService } from "@core/services/notification.service";
import { FieldErrorComponent } from "@shared/components/field-error.component";
import { FileDropDirective } from "@shared/directives/file-drop.directive";
import { LoadingSpinnerComponent } from "@shared/components/loading-spinner.component";
import { ProductImage, Category } from "@core/models/product.model";
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
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    FieldErrorComponent,
    FileDropDirective,
    LoadingSpinnerComponent,
  ],
  template: `
    <section class="container form-section">
      <!-- Back Navigation Link -->
      <a class="back-link" routerLink="/seller/products">
        <mat-icon>arrow_back</mat-icon>
        <span>Back to my products</span>
      </a>

      <div class="form-card">
        <!-- Form Header -->
        <div class="form-header">
          <div class="header-titles">
            <h1 class="page-title">
              {{ id() ? "Edit Product" : "Create New Product" }}
            </h1>
            <p class="muted">
              Configure product details, manage inventory, and upload
              high-resolution media.
            </p>
          </div>
          <span class="status-badge status-badge-outline">
            {{ id() ? "Editing Mode" : "Draft" }}
          </span>
        </div>

        @if (loading()) {
          <div class="loading-wrapper">
            <app-loading-spinner label="Loading product data…" />
          </div>
        } @else {
          <form [formGroup]="form" (ngSubmit)="submit()" class="form-body">
            <!-- SECTION 1: General Information -->
            <div class="form-section-block">
              <div class="section-title-wrap">
                <span class="section-title">General Information</span>
                <span class="section-subtitle"
                  >Basic identifiers visible to buyers in the catalog</span
                >
              </div>

              <!-- Product Name -->
              <div class="field-wrap">
                <mat-form-field appearance="outline" class="w-full">
                  <mat-label>Product Name</mat-label>
                  <mat-icon matPrefix>label</mat-icon>
                  <input
                    matInput
                    formControlName="name"
                    placeholder="e.g. Premium Wireless Noise-Cancelling Headphones"
                  />
                </mat-form-field>
                <app-field-error [control]="form.controls.name" />
              </div>

              <!-- Category -->
              <div class="field-wrap">
                <mat-form-field appearance="outline" class="w-full">
                  <mat-label>Category</mat-label>
                  <mat-icon matPrefix>category</mat-icon>
                  <mat-select
                    formControlName="categoryId"
                    placeholder="Select a category"
                  >
                    @for (cat of categories(); track cat.id) {
                      <mat-option [value]="cat.id">{{ cat.name }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
                <app-field-error [control]="form.controls.categoryId" />
              </div>

              <!-- Description -->
              <div class="field-wrap">
                <mat-form-field appearance="outline" class="w-full">
                  <mat-label>Detailed Description</mat-label>
                  <textarea
                    matInput
                    rows="4"
                    formControlName="description"
                    placeholder="Describe materials, specifications, warranty, and key features…"
                  ></textarea>
                </mat-form-field>
                <app-field-error [control]="form.controls.description" />
              </div>
            </div>

            <!-- SECTION 2: Pricing & Stock -->
            <div class="form-section-block">
              <div class="section-title-wrap">
                <span class="section-title">Pricing & Inventory</span>
                <span class="section-subtitle"
                  >Manage unit cost and available warehouse quantity</span
                >
              </div>

              <div class="grid-2-col">
                <!-- Price -->
                <div class="field-wrap">
                  <mat-form-field appearance="outline" class="w-full">
                    <mat-label>Price (USD)</mat-label>
                    <mat-icon matPrefix>attach_money</mat-icon>
                    <input
                      matInput
                      type="number"
                      step="0.01"
                      formControlName="price"
                      placeholder="0.00"
                    />
                  </mat-form-field>
                  <app-field-error [control]="form.controls.price" />
                </div>

                <!-- Quantity -->
                <div class="field-wrap">
                  <mat-form-field appearance="outline" class="w-full">
                    <mat-label>Quantity in Stock</mat-label>
                    <mat-icon matPrefix>inventory_2</mat-icon>
                    <input
                      matInput
                      type="number"
                      formControlName="quantity"
                      placeholder="0"
                    />
                  </mat-form-field>
                  <app-field-error [control]="form.controls.quantity" />
                </div>
              </div>
            </div>

            <!-- SECTION 3: Media Upload -->
            <div class="form-section-block">
              <div class="media-header">
                <div class="section-title-wrap">
                  <span class="section-title">Product Media</span>
                  <span class="section-subtitle"
                    >Upload up to 5 images (first image is used as the
                    cover)</span
                  >
                </div>
                <span class="media-counter">
                  {{ images().length }} / 5 uploaded
                </span>
              </div>

              @if (images().length < 5) {
                <label
                  class="dropzone-area"
                  appFileDrop
                  (filesDropped)="onFiles($event)"
                >
                  <input
                    type="file"
                    hidden
                    multiple
                    accept="image/*"
                    #fileInput
                    (change)="onFiles(fileInput.files!)"
                  />
                  <div class="dropzone-icon-wrap">
                    <mat-icon>cloud_upload</mat-icon>
                  </div>
                  <div class="dropzone-text">
                    <span class="drop-primary">
                      <strong>Click to upload</strong> or drag and drop
                    </span>
                    <span class="drop-secondary"
                      >PNG, JPG, WebP up to 2 MB each</span
                    >
                  </div>
                </label>
              } @else {
                <div class="dropzone-area max-limit">
                  <mat-icon>check_circle</mat-icon>
                  <span class="drop-primary">Maximum of 5 images reached</span>
                  <span class="drop-secondary"
                    >Delete an existing image below to upload a
                    replacement.</span
                  >
                </div>
              }

              @if (uploading()) {
                <div class="upload-progress-card">
                  <mat-icon class="spin-icon">sync</mat-icon>
                  <span>Uploading media assets… {{ progress() }}%</span>
                </div>
              }

              <!-- Image Gallery Preview Grid -->
              @if (images().length) {
                <div class="gallery-grid">
                  @for (image of images(); track image.url; let idx = $index) {
                    <div class="image-preview-card">
                      <img
                        [src]="image.url"
                        alt="Product image preview"
                        loading="lazy"
                      />

                      @if (idx === 0) {
                        <span class="cover-badge">Cover</span>
                      }

                      <button
                        mat-icon-button
                        type="button"
                        class="delete-image-btn"
                        (click)="removeImage(image)"
                        matTooltip="Delete image"
                        aria-label="Remove image"
                      >
                        <mat-icon>close</mat-icon>
                      </button>
                    </div>
                  }
                </div>
              }
            </div>

            <!-- Form Actions -->
            <div class="form-actions-bar">
              <a
                routerLink="/seller/products"
                class="btn btn-outline action-btn cancel-btn"
              >
                Cancel
              </a>
              <button
                type="submit"
                class="btn btn-primary action-btn submit-btn"
                [disabled]="form.invalid || saving()"
              >
                @if (saving()) {
                  <mat-icon class="btn-spinner">sync</mat-icon>
                  <span>Saving Product…</span>
                } @else {
                  <mat-icon>save</mat-icon>
                  <span>{{ id() ? "Update Product" : "Publish Product" }}</span>
                }
              </button>
            </div>
          </form>
        }
      </div>
    </section>
  `,
  styles: [
    `
      /* Container & Layout */
      .form-section {
        max-width: 820px;
        margin: 0 auto;
        padding-top: 24px;
        padding-bottom: 80px;
      }

      .back-link {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        font-size: 13.5px;
        font-weight: 500;
        color: var(--app-muted);
        text-decoration: none !important;
        margin-bottom: 20px;
        transition:
          color 0.15s ease,
          transform 0.15s ease;
      }
      .back-link:hover {
        color: var(--app-fg-heading);
        transform: translateX(-2px);
      }
      .back-link mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      /* Form Main Card */
      .form-card {
        background: var(--app-surface);
        border: 1px solid var(--app-border);
        border-radius: var(--app-radius-lg);
        box-shadow: var(--app-shadow-sm);
        padding: 36px;
      }

      /* Header */
      .form-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
        padding-bottom: 24px;
        border-bottom: 1px solid var(--app-border);
        margin-bottom: 28px;
      }

      .header-titles {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .page-title {
        font-size: 1.6rem;
        font-weight: 700;
        letter-spacing: -0.03em;
        margin: 0;
        color: var(--app-fg-heading);
      }

      .muted {
        color: var(--app-muted);
        font-size: 14px;
        margin: 0;
      }

      /* Section Blocks */
      .form-body {
        display: flex;
        flex-direction: column;
        gap: 32px;
      }

      .form-section-block {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .section-title-wrap {
        display: flex;
        flex-direction: column;
        gap: 2px;
        margin-bottom: 4px;
      }

      .section-title {
        font-size: 14px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--app-fg-heading);
      }

      .section-subtitle {
        font-size: 12.5px;
        color: var(--app-muted);
      }

      .field-wrap {
        display: flex;
        flex-direction: column;
      }

      .w-full {
        width: 100%;
      }

      /* Grid Row Inputs */
      .grid-2-col {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
      }

      /* Media Section */
      .media-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
      }

      .media-counter {
        font-size: 12px;
        font-weight: 600;
        color: var(--app-muted);
        background: var(--app-bg-alt);
        border: 1px solid var(--app-border);
        padding: 2px 8px;
        border-radius: var(--app-radius-full);
      }

      .dropzone-area {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 12px;
        padding: 32px 24px;
        border: 2px dashed var(--app-border);
        border-radius: var(--app-radius);
        background: var(--app-bg-alt);
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .dropzone-area:hover {
        border-color: var(--app-primary);
        background: var(--app-surface-hover);
      }

      .dropzone-area.max-limit {
        cursor: not-allowed;
        background: var(--app-bg-alt);
        border-style: solid;
        border-color: var(--app-border);
        color: var(--app-muted);
      }

      .dropzone-icon-wrap {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: var(--app-surface);
        border: 1px solid var(--app-border);
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--app-fg-heading);
      }

      .dropzone-icon-wrap mat-icon {
        font-size: 22px;
        width: 22px;
        height: 22px;
      }

      .dropzone-text {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        text-align: center;
      }

      .drop-primary {
        font-size: 13.5px;
        color: var(--app-fg-heading);
      }

      .drop-secondary {
        font-size: 12px;
        color: var(--app-muted);
      }

      /* Upload Progress Card */
      .upload-progress-card {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 14px;
        border-radius: var(--app-radius-sm);
        background: var(--app-primary-lighter);
        border: 1px solid var(--app-border);
        font-size: 13px;
        color: var(--app-fg-heading);
      }

      .spin-icon {
        animation: spin 1s linear infinite;
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      @keyframes spin {
        100% {
          transform: rotate(360deg);
        }
      }

      /* Image Gallery Grid */
      .gallery-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
        gap: 14px;
      }

      .image-preview-card {
        position: relative;
        aspect-ratio: 1 / 1;
        border-radius: var(--app-radius-sm);
        border: 1px solid var(--app-border);
        background: var(--app-bg-alt);
        overflow: hidden;
        box-shadow: var(--app-shadow-sm);
        transition:
          transform 0.15s ease,
          border-color 0.15s ease;
      }

      .image-preview-card:hover {
        border-color: var(--app-border-hover);
        transform: translateY(-1px);
      }

      .image-preview-card img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .cover-badge {
        position: absolute;
        bottom: 6px;
        left: 6px;
        background: rgba(9, 9, 11, 0.85);
        color: #ffffff;
        font-size: 10.5px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        padding: 2px 6px;
        border-radius: var(--app-radius-sm);
        backdrop-filter: blur(4px);
      }

      .delete-image-btn {
        position: absolute;
        top: 6px;
        right: 6px;
        width: 26px !important;
        height: 26px !important;
        background: rgba(9, 9, 11, 0.75);
        color: #ffffff !important;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: background-color 0.15s ease;
      }

      .delete-image-btn:hover {
        background: var(--app-danger);
      }

      .delete-image-btn mat-icon {
        font-size: 15px;
        width: 15px;
        height: 15px;
      }

      /* Form Actions Bar */
      .form-actions-bar {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 12px;
        padding-top: 24px;
        border-top: 1px solid var(--app-border);
      }

      .action-btn {
        height: 40px;
        padding: 0 20px;
        font-size: 13.5px;
      }

      .btn-spinner {
        animation: spin 1s linear infinite;
        font-size: 16px;
        width: 16px;
        height: 16px;
        margin-right: 6px;
      }

      .loading-wrapper {
        padding: 48px 0;
        display: flex;
        justify-content: center;
      }

      /* Responsive Breakpoints */
      @media (max-width: 640px) {
        .form-section {
          padding-top: 16px;
        }

        .form-card {
          padding: 20px;
          border-radius: var(--app-radius);
        }

        .form-header {
          flex-direction: column;
          align-items: flex-start;
          gap: 12px;
        }

        .grid-2-col {
          grid-template-columns: 1fr;
          gap: 0;
        }

        .form-actions-bar {
          flex-direction: column-reverse;
          gap: 10px;
        }

        .action-btn {
          width: 100%;
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
  private readonly catSvc = inject(CategoryService);
  private readonly notify = inject(NotificationService);

  readonly id = signal<string | null>(this.route.snapshot.paramMap.get("id"));
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly uploading = signal(false);
  readonly progress = signal(0);

  readonly images = signal<ProductImage[]>([]);
  readonly deletedImageIds = signal<string[]>([]);
  readonly categories = signal<Category[]>([]);

  readonly form = this.fb.nonNullable.group({
    name: [
      "",
      [Validators.required, Validators.minLength(3), Validators.maxLength(100)],
    ],
    categoryId: ["", [Validators.required]],
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
    this.catSvc.getAll().subscribe({
      next: (cats) => this.categories.set(cats),
      error: () => this.notify.error("Failed to load categories"),
    });

    const id = this.id();
    if (id) {
      this.loading.set(true);
      this.svc.get(id).subscribe({
        next: (p) => {
          this.form.patchValue({
            name: p.name,
            categoryId: p.categoryId,
            description: p.description,
            price: p.price,
            quantity: p.quantity,
          });
          this.images.set(
            (p.images ?? []).map((image) => ({
              id: image.id,
              url: image.url,
              existing: true,
            })),
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
