import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  signal,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink } from "@angular/router";
import { MatTableModule } from "@angular/material/table";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatDialog, MatDialogModule } from "@angular/material/dialog";
import { MatPaginatorModule, PageEvent } from "@angular/material/paginator";
import { ProductService } from "@core/services/product.service";
import { AuthService } from "@core/services/auth.service";
import { NotificationService } from "@core/services/notification.service";
import { Product } from "@core/models/product.model";
import { ConfirmDialogComponent } from "@shared/components/confirm-dialog.component";
import { LoadingSpinnerComponent } from "@shared/components/loading-spinner.component";
import { EmptyStateComponent } from "@shared/components/empty-state.component";
import { CurrentUserService } from "@core/services/current-user.service";

@Component({
  selector: "app-seller-products",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterLink,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatPaginatorModule,
    LoadingSpinnerComponent,
    EmptyStateComponent,
  ],
  template: `
    <section class="container page-section">
      <div class="page-header">
        <div>
          <h1 class="page-title">My Store Products</h1>
          <p class="muted">Manage, edit, or delete items in your seller inventory.</p>
        </div>
        <a routerLink="/seller/products/new" class="btn btn-primary new-btn">
          <mat-icon>add</mat-icon>
          <span>New product</span>
        </a>
      </div>

      @if (loading()) {
        <app-loading-spinner label="Loading your store inventory…" />
      } @else if (!items().length) {
        <app-empty-state
          icon="inventory_2"
          title="No products yet"
          description="Create your first product."
        />
      } @else {
        <div class="app-card table-wrap">
          <table mat-table [dataSource]="items()" [trackBy]="trackById">
            <ng-container matColumnDef="thumb">
              <th mat-header-cell *matHeaderCellDef>Image</th>
              <td mat-cell *matCellDef="let p">
                @if (p.images && p.images[0]) {
                  <img [src]="p.images[0].url" alt="" class="thumb" />
                } @else {
                  <div class="thumb-placeholder">
                    <mat-icon>image</mat-icon>
                  </div>
                }
              </td>
            </ng-container>

            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Product Name</th>
              <td mat-cell *matCellDef="let p">
                <span class="cell-name">{{ p.name }}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="price">
              <th mat-header-cell *matHeaderCellDef>Price</th>
              <td mat-cell *matCellDef="let p">
                <span class="cell-price">{{ p.price | currency }}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="qty">
              <th mat-header-cell *matHeaderCellDef>Stock</th>
              <td mat-cell *matCellDef="let p">
                <span
                  class="cell-stock"
                  [class.low]="p.quantity > 0 && p.quantity < 10"
                  [class.out]="p.quantity === 0"
                >
                  {{ p.quantity }}
                </span>
              </td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let p">
                <div class="actions">
                  <a
                    mat-icon-button
                    [routerLink]="['/products', p.id]"
                    aria-label="View product"
                  >
                    <mat-icon>visibility</mat-icon>
                  </a>
                  <a
                    mat-icon-button
                    [routerLink]="['/seller/products', p.id, 'edit']"
                    aria-label="Edit product"
                  >
                    <mat-icon>edit</mat-icon>
                  </a>
                  <button
                    mat-icon-button
                    color="warn"
                    (click)="remove(p)"
                    aria-label="Delete product"
                  >
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="cols"></tr>
            <tr mat-row *matRowDef="let r; columns: cols" class="data-row"></tr>
          </table>

          <mat-paginator
            [length]="total()"
            [pageSize]="pageSize()"
            [pageIndex]="page() - 1"
            [pageSizeOptions]="[10, 25, 50]"
            (page)="onPage($event)"
          />
        </div>
      }
    </section>
  `,
  styles: [
    `
      .page-section {
        padding-top: 32px;
        padding-bottom: 64px;
      }

      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        gap: 16px;
        margin-bottom: 24px;
        flex-wrap: wrap;
      }

      .page-title {
        font-size: 1.85rem;
        font-weight: 800;
        letter-spacing: -0.025em;
        margin: 0 0 4px;
      }

      .new-btn {
        height: 42px;
        padding: 0 20px;
      }

      .table-wrap {
        overflow-x: auto;
        overflow-y: hidden;
        border: 1px solid var(--app-border);
        border-radius: var(--app-radius);
        box-shadow: var(--app-shadow-sm);
        margin-top: 16px;
        background: var(--app-surface);
      }

      table {
        width: 100%;
        min-width: 700px;
        border-collapse: separate;
        border-spacing: 0;
        background-color: transparent;
      }

      th.mat-mdc-header-cell {
        font-weight: 700;
        color: var(--app-fg-heading);
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        padding: 14px 16px !important;
        border-bottom: 1px solid var(--app-border);
        background: var(--app-bg-alt);
        white-space: nowrap;
      }

      th.mat-mdc-header-cell:first-of-type {
        padding-left: 24px !important;
      }

      th.mat-mdc-header-cell:last-of-type {
        padding-right: 24px !important;
      }

      tr.data-row {
        transition: background-color 0.15s ease;
      }

      tr.data-row:hover {
        background-color: var(--app-surface-hover);
      }

      td.mat-mdc-cell {
        padding: 12px 16px !important;
        font-size: 14px;
        color: var(--app-fg);
        border-bottom: 1px solid var(--app-border);
        vertical-align: middle;
      }

      td.mat-mdc-cell:first-of-type {
        padding-left: 24px !important;
      }

      td.mat-mdc-cell:last-of-type {
        padding-right: 24px !important;
      }

      tr.data-row:last-child td.mat-mdc-cell {
        border-bottom: none;
      }

      .thumb {
        width: 44px;
        height: 44px;
        object-fit: cover;
        border-radius: var(--app-radius-sm);
        border: 1px solid var(--app-border);
        display: block;
      }

      .thumb-placeholder {
        width: 44px;
        height: 44px;
        border-radius: var(--app-radius-sm);
        border: 1px dashed var(--app-border);
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--app-muted);
        background: var(--app-bg-alt);
      }

      .thumb-placeholder mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      .cell-name {
        font-weight: 600;
        color: var(--app-fg-heading);
      }

      .cell-price {
        font-weight: 700;
        color: var(--app-fg-heading);
        font-variant-numeric: tabular-nums;
      }

      .cell-stock {
        font-weight: 600;
        font-variant-numeric: tabular-nums;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 2px 10px;
        border-radius: 999px;
        background: var(--app-success-light);
        color: var(--app-success);
        font-size: 12px;
      }

      .cell-stock.low {
        background: var(--app-warning-light);
        color: var(--app-warning);
      }

      .cell-stock.out {
        background: var(--app-danger-light);
        color: var(--app-danger);
      }

      .actions {
        display: flex;
        align-items: center;
        gap: 4px;
        justify-content: flex-end;
      }

      .actions a[mat-icon-button],
      .actions button[mat-icon-button] {
        width: 34px;
        height: 34px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: var(--app-muted);
      }
      .actions a[mat-icon-button]:hover,
      .actions button[mat-icon-button]:hover {
        color: var(--app-primary);
        background: var(--app-surface-hover);
      }

      mat-paginator {
        border-top: 1px solid var(--app-border);
        background-color: transparent;
        min-width: 700px;
      }
    `,
  ],
})
export class SellerProductsPage {
  private readonly svc = inject(ProductService);
  private readonly auth = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  private readonly notify = inject(NotificationService);
  readonly currentUser = inject(CurrentUserService);

  readonly cols = ["thumb", "name", "price", "qty", "actions"];
  readonly items = signal<Product[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(10);
  readonly loading = signal(true);

  constructor() {
    effect(() => {
      const user = this.currentUser.user();

      if (!user) {
        return;
      }

      this.load();
    });
  }

  private load(): void {
    const user = this.currentUser.user();

    if (!user) {
      return;
    }

    this.loading.set(true);

    this.svc.listBySeller(this.page(), this.pageSize(), user.id).subscribe({
      next: (r) => {
        this.items.set(r.content);
        this.total.set(r.totalElements);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  trackById = (_: number, p: Product) => p.id;
  onPage(e: PageEvent) {
    this.page.set(e.pageIndex + 1);
    this.pageSize.set(e.pageSize);
    this.load();
  }

  remove(p: Product): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: "Delete product",
          message: `Delete "${p.name}"? This cannot be undone.`,
          danger: true,
          confirmLabel: "Delete",
        },
      })
      .afterClosed()
      .subscribe((ok) => {
        if (!ok) {
          return;
        }

        this.svc.delete(p.id).subscribe(() => {
          this.notify.success("Product deleted");
          this.load();
        });
      });
  }
}
