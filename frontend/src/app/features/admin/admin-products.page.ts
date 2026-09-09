import {
  ChangeDetectionStrategy,
  Component,
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
import { NotificationService } from "@core/services/notification.service";
import { Product } from "@core/models/product.model";
import { ConfirmDialogComponent } from "@shared/components/confirm-dialog.component";
import { LoadingSpinnerComponent } from "@shared/components/loading-spinner.component";
import { EmptyStateComponent } from "@shared/components/empty-state.component";

@Component({
  selector: "app-admin-products",
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
    <section class="container">
      <div class="row">
        <h1 class="grow">All products</h1>
      </div>

      @if (loading()) { <app-loading-spinner /> } @else if (!items().length) {
      <app-empty-state
        icon="inventory_2"
        title="No products yet"
        description="No Product were found."
      />
      } @else {
      <div class="app-card table-wrap">
        <table mat-table [dataSource]="items()" [trackBy]="trackById">
          <ng-container matColumnDef="thumb"
            ><th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let p">
              @if (p.images.length) {
              <img [src]="p.images[0].url" alt="" class="thumb" />
              } @else {
              <mat-icon>image</mat-icon>
              }
            </td></ng-container
          >
          <ng-container matColumnDef="name"
            ><th mat-header-cell *matHeaderCellDef>Name</th>
            <td mat-cell *matCellDef="let p">{{ p.name }}</td></ng-container
          >
          <ng-container matColumnDef="price"
            ><th mat-header-cell *matHeaderCellDef>Price</th>
            <td mat-cell *matCellDef="let p">
              {{ p.price | currency }}
            </td></ng-container
          >
          <ng-container matColumnDef="qty"
            ><th mat-header-cell *matHeaderCellDef>Qty</th>
            <td mat-cell *matCellDef="let p">{{ p.quantity }}</td></ng-container
          >
          <ng-container matColumnDef="actions"
            ><th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let p">
              <div class="actions">
                <a
                  mat-icon-button
                  [routerLink]="['/products', p.id]"
                  aria-label="View"
                >
                  <mat-icon>visibility</mat-icon>
                </a>

                <button
                  mat-icon-button
                  color="warn"
                  (click)="remove(p)"
                  aria-label="Delete"
                >
                  <mat-icon>delete</mat-icon>
                </button>
              </div>
            </td></ng-container
          >
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
      .table-wrap {
        overflow-x: auto;
        overflow-y: hidden;
        border: 1px solid var(--app-border);
        border-radius: var(--app-radius);
        box-shadow: var(--app-shadow);
        margin-top: 24px;
        background: var(--app-surface);
      }

      table {
        width: 100%;
        min-width: 700px;
        border-collapse: separate;
        border-spacing: 0;
        background-color: transparent;
      }

      /* Header */
      th.mat-mdc-header-cell {
        font-weight: 600;
        color: var(--app-fg);
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.4px;
        padding: 14px 16px !important;
        border-bottom: 1px solid var(--app-border);
        background: rgba(0, 0, 0, 0.02);
        white-space: nowrap;
      }

      th.mat-mdc-header-cell:first-of-type {
        padding-left: 24px !important;
        border-top-left-radius: var(--app-radius);
      }

      th.mat-mdc-header-cell:last-of-type {
        padding-right: 24px !important;
        border-top-right-radius: var(--app-radius);
      }

      /* Rows */
      tr.data-row {
        transition: background-color 0.15s ease;
      }

      tr.data-row:hover {
        background: rgba(0, 0, 0, 0.03);
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
        width: 48px;
        height: 48px;
        object-fit: cover;
        border-radius: var(--app-radius-sm);
        border: 1px solid var(--app-border);
        display: block;
      }

      .actions {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 4px;
      }

      .actions a[mat-icon-button],
      .actions button[mat-icon-button] {
        --mdc-icon-button-state-layer-size: 36px;
        width: 36px;
        height: 36px;
        padding: 6px;
      }

      mat-paginator {
        border-top: 1px solid var(--app-border);
        background: transparent;
        min-width: 700px;
      }
    `,
  ],
})
export class AdminProductsPage {
  private readonly svc = inject(ProductService);
  private readonly dialog = inject(MatDialog);
  private readonly notify = inject(NotificationService);

  readonly cols = ["thumb", "name", "price", "qty", "actions"];
  readonly items = signal<Product[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(10);
  readonly loading = signal(true);

  constructor() {
    this.load();
  }
  trackById = (_: number, p: Product) => p.id;
  onPage(e: PageEvent) {
    this.page.set(e.pageIndex + 1);
    this.pageSize.set(e.pageSize);
    this.load();
  }

  private load() {
    this.loading.set(true);

    this.svc.list(this.page(), this.pageSize()).subscribe({
      next: (r) => {
        this.items.set(r.content);
        this.total.set(r.totalElements);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  remove(p: Product) {
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
        if (!ok) return;
        this.svc.delete(p.id).subscribe(() => {
          this.notify.success("Product deleted");
          this.load();
        });
      });
  }
}
