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
    <section class="container">
      <a mat-button routerLink="/seller/products"
        ><mat-icon>arrow_back</mat-icon> Back</a
      >
      <div class="app-card panel">
        <h1>{{ id() ? "Edit product" : "New product" }}</h1>

        @if (loading()) {
        <app-loading-spinner />
        } @else {
        <form [formGroup]="form" (ngSubmit)="submit()" class="stack">
          <mat-form-field appearance="outline"
            ><mat-label>Name</mat-label> <input matInput formControlName="name"
          /></mat-form-field>
          <app-field-error [control]="form.controls.name" />

          <mat-form-field appearance="outline"
            ><mat-label>Description</mat-label>
            <textarea
              matInput
              rows="4"
              formControlName="description"
            ></textarea>
          </mat-form-field>
          <app-field-error [control]="form.controls.description" />

          <div class="row">
            <mat-form-field appearance="outline" class="grow"
              ><mat-label>Price</mat-label>
              <input matInput type="number" step="0.01" formControlName="price"
            /></mat-form-field>
            <mat-form-field appearance="outline" class="grow"
              ><mat-label>Quantity</mat-label>
              <input matInput type="number" formControlName="quantity"
            /></mat-form-field>
          </div>
          <app-field-error [control]="form.controls.price" />
          <app-field-error [control]="form.controls.quantity" />

          @if (images().length < 5) {
          <label
            class="drop app-card"
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
            <mat-icon>cloud_upload</mat-icon>
            <div>
              Drag & drop images here, or
              <button
                type="button"
                mat-button
                color="primary"
                (click)="f.click()"
              >
                browse
              </button>
            </div>
            <small class="muted">image/* up to 2 MB each (Max 5 images)</small>
          </label>
          } @else {
          <div class="app-card drop" style="cursor: not-allowed; opacity: 0.7;">
            <mat-icon>block</mat-icon>
            <div>Maximum of 5 images reached.</div>
            <small class="muted">Remove an image to upload another.</small>
          </div>
          }

          @if (uploading()) {
          <div class="muted">Uploading… {{ progress() }}%</div>
          } @if (images().length) {
          <div class="thumbs">
            @for (image of images(); track image.url) {
            <div class="thumb">
              <img [src]="image.url" alt="product image" />
              <button
                mat-icon-button
                type="button"
                (click)="removeImage(image)"
                aria-label="Remove"
              >
                <mat-icon>close</mat-icon>
              </button>
            </div>
            }
          </div>
          }

          <div class="row">
            <span class="grow"></span>
            <a mat-button routerLink="/seller/products">Cancel</a>
            <button
              mat-flat-button
              color="primary"
              [disabled]="form.invalid || saving()"
            >
              {{ saving() ? "Saving…" : "Save" }}
            </button>
          </div>
        </form>
        }
      </div>
    </section>
  `,
  styles: [
    `
      .panel {
        padding: 32px;
        margin-top: 24px;
        max-width: 800px;
      }
      .drop {
        padding: 48px 32px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        text-align: center;
        border: 2px dashed var(--app-border);
        border-radius: var(--app-radius);
        cursor: pointer;
        transition: all 0.25s ease;
        background: var(--app-bg);
      }
      .drop:hover {
        border-color: var(--app-primary);
        background: rgba(99, 102, 241, 0.02);
      }
      .drop.is-dragover {
        border-color: var(--app-primary);
        background: rgba(99, 102, 241, 0.06);
        box-shadow: var(--app-glow);
      }
      .drop mat-icon {
        font-size: 40px;
        width: 40px;
        height: 40px;
        color: var(--app-primary);
        opacity: 0.8;
      }
      .thumbs {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
        gap: 12px;
        margin-top: 16.5px;
      }
      .thumb {
        position: relative;
        aspect-ratio: 1/1;
        border-radius: var(--app-radius-sm);
        overflow: hidden;
        border: 1px solid var(--app-border);
        box-shadow: var(--app-shadow);
      }
      .thumb img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .thumb button {
        position: absolute;
        top: 4px;
        right: 4px;
        background: rgba(15, 23, 42, 0.75);
        color: #fff;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
      }
      .thumb button:hover {
        background: #ef4444;
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
