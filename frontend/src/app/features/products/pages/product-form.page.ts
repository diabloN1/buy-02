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
    <section class="container form-section animate-fade-in">
      <!-- Pro Back Button -->
      <a class="btn btn-ghost back-btn" routerLink="/seller/products">
        <mat-icon class="back-icon">arrow_back</mat-icon>
        <span>Back to my products</span>
      </a>

      <!-- Glass/App Card Panel with Staggered Entry -->
      <div class="app-card panel animate-fade-in delay-1">
        <div class="form-header">
          <h1>{{ id() ? "Edit Product" : "Create New Product" }}</h1>
          <p class="muted">
            Fill in the product details and upload product media assets.
          </p>
        </div>

        @if (loading()) {
          <div class="loading-wrapper animate-pop-in">
            <app-loading-spinner label="Loading product data…" />
          </div>
        } @else {
          <!-- Stack class handles vertical rhythm perfectly -->
          <form
            [formGroup]="form"
            (ngSubmit)="submit()"
            class="form-body stack delay-2"
          >
            <div class="field-group">
              <mat-form-field
                appearance="outline"
                subscriptSizing="dynamic"
                class="w-full"
              >
                <mat-label>Product Name</mat-label>
                <mat-icon matPrefix>label</mat-icon>
                <input
                  matInput
                  formControlName="name"
                  placeholder="e.g. Premium Wireless Headphones"
                />
              </mat-form-field>
              <app-field-error [control]="form.controls.name" />
            </div>

            <div class="field-group">
              <mat-form-field
                appearance="outline"
                subscriptSizing="dynamic"
                class="w-full"
              >
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

            <div class="field-group">
              <mat-form-field
                appearance="outline"
                subscriptSizing="dynamic"
                class="w-full"
              >
                <mat-label>Description</mat-label>
                <textarea
                  matInput
                  rows="5"
                  formControlName="description"
                  placeholder="Provide a detailed product description…"
                ></textarea>
              </mat-form-field>
              <app-field-error [control]="form.controls.description" />
            </div>

            <!-- Responsive Grid for Row Inputs -->
            <div class="row-inputs">
              <div class="field-group">
                <mat-form-field
                  appearance="outline"
                  subscriptSizing="dynamic"
                  class="w-full"
                >
                  <mat-label>Price ($ USD)</mat-label>
                  <mat-icon matPrefix>attach_money</mat-icon>
                  <input
                    matInput
                    type="number"
                    step="0.01"
                    formControlName="price"
                    placeholder="29.99"
                  />
                </mat-form-field>
                <app-field-error [control]="form.controls.price" />
              </div>

              <div class="field-group">
                <mat-form-field
                  appearance="outline"
                  subscriptSizing="dynamic"
                  class="w-full"
                >
                  <mat-label>Quantity in Stock</mat-label>
                  <mat-icon matPrefix>inventory_2</mat-icon>
                  <input
                    matInput
                    type="number"
                    formControlName="quantity"
                    placeholder="10"
                  />
                </mat-form-field>
                <app-field-error [control]="form.controls.quantity" />
              </div>
            </div>

            <!-- Enhanced Media Upload Area -->
            <div class="media-section">
              <div class="media-header">
                <label class="media-label">Product Media Images</label>
                <span
                  class="media-counter"
                  [class.maxed]="images().length >= 5"
                >
                  {{ images().length }} / 5
                </span>
              </div>

              @if (images().length < 5) {
                <label
                  class="dropzone animate-fade-in"
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
                    <span class="highlight">Click to upload</span> or drag and
                    drop
                  </div>
                  <p class="drop-hint">SVG, PNG, JPG or GIF (max. 2MB)</p>
                </label>
              } @else {
                <div class="dropzone max-reached animate-fade-in">
                  <div class="drop-icon">
                    <mat-icon>block</mat-icon>
                  </div>
                  <div class="drop-text">Maximum image limit reached</div>
                  <p class="drop-hint">Remove an image to upload another.</p>
                </div>
              }

              @if (uploading()) {
                <div class="upload-progress animate-pop-in">
                  <mat-icon class="spinner">sync</mat-icon>
                  <span>Uploading image assets… {{ progress() }}%</span>
                </div>
              }

              @if (images().length) {
                <div class="thumbs-grid animate-fade-in delay-1">
                  @for (image of images(); track image.url) {
                    <div
                      class="thumb-card animate-pop-in"
                      [style.animation-delay]="$index * 50 + 'ms'"
                    >
                      <img [src]="image.url" alt="Product thumbnail" />
                      <div class="thumb-overlay">
                        <button
                          type="button"
                          class="remove-img-btn"
                          (click)="removeImage(image)"
                          aria-label="Remove image"
                          matTooltip="Remove image"
                        >
                          <mat-icon>delete_outline</mat-icon>
                        </button>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>

            <!-- Standardized Form Actions -->
            <div class="form-actions">
              <a
                routerLink="/seller/products"
                class="btn btn-outline cancel-btn"
              >
                Cancel
              </a>
              <button
                type="submit"
                class="btn btn-primary save-btn"
                [disabled]="form.invalid || saving()"
              >
                @if (saving()) {
                  <mat-icon class="spinner">sync</mat-icon>
                  <span>Saving…</span>
                } @else {
                  <mat-icon>save</mat-icon>
                  <span>Save Product</span>
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
      /* Layout & Spacing */
      .form-section {
        padding-top: 32px;
        padding-bottom: 80px;
        max-width: 840px; /* Constrain width for optimal reading experience */
      }

      .panel {
        padding: 40px;
        width: 100%;
        margin: 0 auto;
      }

      @media (max-width: 640px) {
        .form-section {
          padding-top: 24px;
        }
        .panel {
          padding: 24px 20px;
        }
      }

      .loading-wrapper {
        padding: 48px 0;
        display: flex;
        justify-content: center;
      }

      /* Back Button Micro-interaction */
      .back-btn {
        margin-bottom: 24px;
        padding-left: 8px !important; /* Tighten left padding */
        color: var(--app-muted) !important;
        font-weight: 600;
      }
      .back-btn:hover {
        color: var(--app-fg-heading) !important;
        background: transparent !important;
      }
      .back-icon {
        margin-right: 4px;
        transition: transform var(--transition-normal);
      }
      .back-btn:hover .back-icon {
        transform: translateX(-4px);
      }

      /* Header */
      .form-header {
        margin-bottom: 32px;
      }
      .form-header h1 {
        font-size: clamp(1.5rem, 4vw, 2rem);
        font-weight: 800;
        letter-spacing: -0.03em;
        margin: 0 0 8px;
        color: var(--app-fg-heading);
      }

      /* Form Fields */
      .form-body {
        gap: 24px; /* Increased stack gap since subscriptSizing is dynamic */
      }

      .w-full {
        width: 100%;
      }

      .field-group {
        display: flex;
        flex-direction: column;
        gap: 6px; /* Space between input and error */
      }

      .row-inputs {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 24px;
      }

      @media (max-width: 640px) {
        .row-inputs {
          grid-template-columns: 1fr;
        }
      }

      /* Textarea tweak */
      textarea {
        resize: vertical;
        min-height: 120px;
      }

      /* ==========================================================================
         Pro Media Dropzone (Shadcn aesthetic)
         ========================================================================== */
      .media-section {
        margin: 8px 0 0;
      }

      .media-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
      }

      .media-label {
        font-size: 14px;
        font-weight: 600;
        color: var(--app-fg-heading);
      }

      .media-counter {
        font-size: 12px;
        font-weight: 600;
        color: var(--app-muted);
        background: var(--app-bg-alt);
        padding: 2px 8px;
        border-radius: var(--app-radius-full);
      }
      .media-counter.maxed {
        background: var(--app-warning-light);
        color: var(--app-warning);
      }

      .dropzone {
        padding: 40px 24px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 12px;
        text-align: center;
        background: var(--app-bg-alt);
        border: 2px dashed var(--app-border);
        border-radius: var(--app-radius);
        cursor: pointer;
        transition: all var(--transition-normal);
        outline: none;
      }

      .dropzone:hover {
        border-color: var(--app-primary);
        background: var(--app-primary-lighter);
      }

      .dropzone:focus-visible {
        box-shadow: var(--app-glow);
        border-color: var(--app-primary);
      }

      .dropzone.max-reached {
        cursor: not-allowed;
        opacity: 0.8;
        background: var(--app-bg-alt);
        border-color: var(--app-border);
      }
      .dropzone.max-reached:hover {
        border-color: var(--app-border);
      }

      .drop-icon {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: var(--app-surface);
        box-shadow: var(--app-shadow-sm);
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--app-muted);
        transition:
          color var(--transition-fast),
          transform var(--transition-normal);
      }

      .dropzone:hover:not(.max-reached) .drop-icon {
        color: var(--app-primary);
        transform: translateY(-2px);
      }

      .drop-text {
        font-size: 15px;
        color: var(--app-fg);
        font-weight: 500;
      }
      .drop-text .highlight {
        color: var(--app-primary);
        font-weight: 600;
      }

      .drop-hint {
        font-size: 13px;
        color: var(--app-muted);
        margin: 0;
      }

      /* Upload Progress indicator */
      .upload-progress {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 16px;
        padding: 12px 16px;
        background: var(--app-primary-lighter);
        color: var(--app-primary);
        border-radius: var(--app-radius-sm);
        font-size: 14px;
        font-weight: 500;
      }

      /* ==========================================================================
         Thumbnails Grid
         ========================================================================== */
      .thumbs-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
        gap: 16px;
        margin-top: 24px;
      }

      .thumb-card {
        position: relative;
        aspect-ratio: 1 / 1;
        border-radius: var(--app-radius-sm);
        overflow: hidden;
        border: 1px solid var(--app-border);
        background: var(--app-surface);
        box-shadow: var(--app-shadow-sm);
      }

      .thumb-card img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform var(--transition-normal);
      }

      .thumb-overlay {
        position: absolute;
        inset: 0;
        background: rgba(9, 9, 11, 0.4);
        opacity: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: opacity var(--transition-fast);
      }

      .thumb-card:hover .thumb-overlay {
        opacity: 1;
      }

      .thumb-card:hover img {
        transform: scale(1.05);
      }

      /* Glassmorphism delete button */
      .remove-img-btn {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        border: none;
        background: rgba(255, 255, 255, 0.2);
        backdrop-filter: blur(4px);
        -webkit-backdrop-filter: blur(4px);
        color: #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all var(--transition-fast);
        transform: scale(0.9);
      }

      .remove-img-btn:hover {
        background: var(--app-danger);
        transform: scale(1);
        box-shadow: 0 4px 12px rgba(220, 38, 38, 0.4);
      }

      /* Form Actions */
      .form-actions {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 16px;
        margin-top: 24px;
        padding-top: 24px;
        border-top: 1px solid var(--app-border);
      }

      .cancel-btn,
      .save-btn {
        min-width: 120px;
        height: 44px; /* Slightly taller for primary form actions */
      }

      /* Spinner animation for saving/uploading states */
      .spinner {
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        100% {
          transform: rotate(360deg);
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
