import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink } from "@angular/router";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatDialog, MatDialogModule } from "@angular/material/dialog";
import { MatPaginatorModule, PageEvent } from "@angular/material/paginator";
import { MatChipsModule } from "@angular/material/chips";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MediaService } from "@core/services/media.service";
import { NotificationService } from "@core/services/notification.service";
import { MediaImage } from "@core/models/media.model";
import { ConfirmDialogComponent } from "@shared/components/confirm-dialog.component";
import { LoadingSpinnerComponent } from "@shared/components/loading-spinner.component";
import { EmptyStateComponent } from "@shared/components/empty-state.component";
import { CurrentUserService } from "@core/services/current-user.service";
import { ImagePreviewComponent } from "@shared/components/image-preview.component";

@Component({
  selector: "app-media-management",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatPaginatorModule,
    MatChipsModule,
    MatTooltipModule,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    ImagePreviewComponent,
  ],
  template: `
    <section class="container">
      <div class="header-row">
        <div>
          <h1 class="page-title">Media Management</h1>
          <p class="page-subtitle">
            Inspect and clean up images uploaded across your posts and profile.
          </p>
        </div>
        <button mat-stroked-button (click)="load()" class="refresh-btn hide-small-screen">
          <mat-icon>refresh</mat-icon>Refresh
        </button>
      </div>

      @if (loading()) {
        <app-loading-spinner />
      } @else if (!items().length) {
        <app-empty-state
          icon="collections"
          title="No media files found"
          description="You haven't uploaded any media images yet."
        />
      } @else {
        <div class="media-grid">
          @for (item of items(); track item.id) {
            <div class="media-card app-card">
              <div class="media-preview-container">
                <img
                  [src]="getImageUrl(item.id)"
                  [alt]="item.id"
                  class="media-img"
                  loading="lazy"
                  (click)="previewImage(item)"
                />
                <div class="media-overlay">
                  <button
                    mat-mini-fab
                    color="primary"
                    (click)="previewImage(item)"
                    matTooltip="Inspect Image"
                  >
                    <mat-icon>visibility</mat-icon>
                  </button>
                  <button
                    mat-mini-fab
                    color="warn"
                    (click)="removeMedia(item)"
                    matTooltip="Delete Image"
                  >
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
              </div>

              <div class="media-info">
                <div class="info-row">
                  <span class="media-id" matTooltip="Media ID: {{ item.id }}">
                    <mat-icon inline>tag</mat-icon>
                    {{ item.id | slice: 0 : 12 }}...
                  </span>
                  @if (item.productId) {
                    <a
                      [routerLink]="['/products', item.productId]"
                      class="product-link-chip"
                      matTooltip="Linked Product: {{ item.productId }}"
                    >
                      <mat-icon inline>shopping_bag</mat-icon> Product
                    </a>
                  } @else {
                    <span class="avatar-chip">
                      <mat-icon inline>account_circle</mat-icon> User Media
                    </span>
                  }
                </div>

                <div class="actions-row">
                  <button
                    mat-button
                    color="accent"
                    class="action-btn"
                    (click)="previewImage(item)"
                  >
                    <mat-icon>zoom_in</mat-icon> Inspect
                  </button>
                  <button
                    mat-button
                    color="warn"
                    class="action-btn"
                    (click)="removeMedia(item)"
                  >
                    <mat-icon>delete_outline</mat-icon> Delete
                  </button>
                </div>
              </div>
            </div>
          }
        </div>

        <div class="paginator-wrap app-card">
          <mat-paginator
            [length]="total()"
            [pageSize]="pageSize()"
            [pageIndex]="page() - 1"
            [pageSizeOptions]="[12, 24, 48]"
            (page)="onPage($event)"
          />
        </div>
      }

      <!-- Lightbox Preview Modal -->
      <app-image-preview
        [open]="selectedImage() !== null"
        [imageUrl]="selectedImage() ? getImageUrl(selectedImage()!.id) : ''"
        title="Image Details"
        (closed)="closePreview()"
      >
        @if (selectedImage()) {
          <div class="meta-details">
            <p><strong>ID:</strong> {{ selectedImage()!.id }}</p>

            @if (selectedImage()!.productId) {
              <p>
                <strong>Linked Product ID:</strong>
                {{ selectedImage()!.productId }}
              </p>
            }
          </div>

          <button
            mat-flat-button
            color="warn"
            (click)="removeMedia(selectedImage()!); closePreview()"
          >
            <mat-icon>delete</mat-icon>
            Delete Image
          </button>
        }
      </app-image-preview>
    </section>
  `,
  styles: [
    `
      .container {
        padding: 24px;
        max-width: 1280px;
        margin: 0 auto;
      }
      .header-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 28px;
      }
      .page-title {
        font-size: 28px;
        font-weight: 700;
        margin: 0;
        color: var(--app-fg);
      }
      .page-subtitle {
        color: var(--app-fg-muted, #71717a);
        margin-top: 4px;
        font-size: 14px;
      }
      .refresh-btn {
        border-radius: var(--app-radius-sm, 8px);
      }
      .media-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
        gap: 20px;
        margin-bottom: 28px;
      }
      .media-card {
        border: 1px solid var(--app-border, #e4e4e7);
        border-radius: var(--app-radius, 12px);
        overflow: hidden;
        background: var(--app-surface, #ffffff);
        transition:
          transform 0.2s ease,
          box-shadow 0.2s ease;
        display: flex;
        flex-direction: column;
      }
      .media-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 12px 24px -10px rgba(0, 0, 0, 0.15);
      }
      .media-preview-container {
        position: relative;
        width: 100%;
        height: 180px;
        background: #0f172a;
        overflow: hidden;
        cursor: pointer;
      }
      .media-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.3s ease;
      }
      .media-card:hover .media-img {
        transform: scale(1.05);
      }
      .media-overlay {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.45);
        backdrop-filter: blur(2px);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        opacity: 0;
        transition: opacity 0.2s ease;
      }
      .media-preview-container:hover .media-overlay {
        opacity: 1;
      }
      .media-info {
        padding: 14px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        flex: 1;
      }
      .info-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
        font-size: 12px;
      }
      .media-id {
        font-family: monospace;
        color: var(--app-fg-muted, #64748b);
        display: flex;
        align-items: center;
        gap: 2px;
      }
      .product-link-chip {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 2px 8px;
        background: rgba(99, 102, 241, 0.12);
        color: #6366f1;
        border-radius: 12px;
        text-decoration: none;
        font-weight: 500;
        font-size: 11px;
      }
      .product-link-chip:hover {
        background: rgba(99, 102, 241, 0.25);
      }
      .avatar-chip {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 2px 8px;
        background: rgba(156, 163, 175, 0.15);
        color: #6b7280;
        border-radius: 12px;
        font-size: 11px;
      }
      .actions-row {
        display: flex;
        justify-content: space-between;
        border-top: 1px solid var(--app-border, #f1f5f9);
        padding-top: 8px;
      }
      .action-btn {
        font-size: 12px;
        padding: 0 8px;
      }
      .paginator-wrap {
        border: 1px solid var(--app-border, #e4e4e7);
        border-radius: var(--app-radius, 12px);
        background: var(--app-surface, #ffffff);
        overflow: hidden;
      }

      .lightbox-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.75);
        backdrop-filter: blur(4px);
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
      }
      .lightbox-content {
        background: var(--app-surface, #ffffff);
        border-radius: 16px;
        max-width: 800px;
        width: 100%;
        max-height: 90vh;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      }
      .lightbox-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 20px;
        border-bottom: 1px solid var(--app-border, #e2e8f0);
      }
      .lightbox-title {
        font-weight: 600;
        font-size: 18px;
      }
      .lightbox-body {
        padding: 20px;
        display: flex;
        justify-content: center;
        align-items: center;
        background: #090d16;
        overflow: auto;
      }
      .lightbox-img {
        max-width: 100%;
        max-height: 60vh;
        object-fit: contain;
        border-radius: 8px;
      }
      .lightbox-footer {
        padding: 16px 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-top: 1px solid var(--app-border, #e2e8f0);
        background: var(--app-surface, #ffffff);
      }
      .meta-details {
        font-size: 13px;
        color: var(--app-fg-muted, #64748b);
      }
      .meta-details p {
        margin: 2px 0;
      }
      mat-paginator {
        background-color: transparent;
      }

      .hide-small-screen {
        display: inline;
      }

      @media (max-width: 576px) {
        .hide-small-screen {
          display: none;
        }
      }
    `,
  ],
})
export class MediaManagementPage {
  private readonly mediaService = inject(MediaService);
  private readonly dialog = inject(MatDialog);
  private readonly notify = inject(NotificationService);
  readonly currentUser = inject(CurrentUserService);

  readonly items = signal<MediaImage[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(12);
  readonly loading = signal(true);
  readonly selectedImage = signal<MediaImage | null>(null);

  constructor() {
    this.load();
  }

  load(): void {
    const user = this.currentUser.user();
    if (!user) return;

    this.loading.set(true);
    this.mediaService
      .getMediaByUser(user.id, this.page() - 1, this.pageSize())
      .subscribe({
        next: (res) => {
          this.items.set(res.content);
          this.total.set(res.totalElements);
          this.loading.set(false);
        },
        error: (err) => {
          this.notify.error("Failed to load media files.");
          this.loading.set(false);
        },
      });
  }

  onPage(e: PageEvent): void {
    this.page.set(e.pageIndex + 1);
    this.pageSize.set(e.pageSize);
    this.load();
  }

  getImageUrl(id: string): string {
    return this.mediaService.getImageUrl(id);
  }

  previewImage(item: MediaImage): void {
    this.selectedImage.set(item);
  }

  closePreview(): void {
    this.selectedImage.set(null);
  }

  removeMedia(item: MediaImage): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: "Delete Image",
          message:
            "Are you sure you want to delete this media image? If it is used in a product, it will be unlinked automatically.",
          danger: true,
          confirmLabel: "Delete",
        },
      })
      .afterClosed()
      .subscribe((ok) => {
        if (!ok) return;

        this.mediaService.deleteMedia(item.id).subscribe({
          next: () => {
            this.notify.success("Image deleted successfully.");
            this.load();
          },
          error: (err) => {
            this.notify.error("Failed to delete image.");
          },
        });
      });
  }
}
