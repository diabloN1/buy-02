import { Component, inject, OnInit, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatCardModule } from "@angular/material/card";
import { MatTableModule } from "@angular/material/table";
import { MatPaginatorModule, PageEvent } from "@angular/material/paginator";
import { MatSortModule, Sort } from "@angular/material/sort";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatChipsModule } from "@angular/material/chips";
import { MatTooltipModule } from "@angular/material/tooltip";
import { RouterModule } from "@angular/router";

import { OrderService } from "@core/services/order.service";
import { NotificationService } from "@core/services/notification.service";
import { Order, OrderStatus } from "@core/models/checkout.model";
import { ConfirmDialogComponent } from "@shared/components/confirm-dialog.component";
import { MatDialog, MatDialogModule } from "@angular/material/dialog";

@Component({
  selector: "app-orders",
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatDialogModule,
    MatSortModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTooltipModule,
    RouterModule,
  ],
  template: `
    <section class="container">
      <div class="page-header">
        <h1 class="page-title">My Orders</h1>
      </div>

      @if (isLoading()) {
        <div class="loading-wrap">
          <mat-spinner [diameter]="40" />
          <span class="muted">Loading orders…</span>
        </div>
      } @else if (orders().length === 0) {
        <mat-card class="empty-card">
          <mat-card-content class="empty-state">
            <mat-icon>receipt_long</mat-icon>
            <p>No orders found</p>
            <p class="muted">Start shopping to see your orders here.</p>

            <a mat-raised-button color="primary" routerLink="/products">
              <mat-icon>shopping_bag</mat-icon>
              Browse Products
            </a>
          </mat-card-content>
        </mat-card>
      } @else {
        <mat-card class="orders-card">
          <mat-card-content>
            <div class="table-container">
              <table
                mat-table
                [dataSource]="orders()"
                class="orders-table"
                matSort
                (matSortChange)="onSortChange($event)"
              >
                <!-- Order Number -->
                <ng-container matColumnDef="orderNumber">
                  <th mat-header-cell *matHeaderCellDef mat-sort-header>
                    Order #
                  </th>

                  <td mat-cell *matCellDef="let order">
                    <span class="order-number">
                      {{ order.id }}
                    </span>
                  </td>
                </ng-container>

                <!-- Date -->
                <ng-container matColumnDef="createdAt">
                  <th mat-header-cell *matHeaderCellDef mat-sort-header>
                    Date
                  </th>

                  <td mat-cell *matCellDef="let order">
                    {{ formatDate(order.createdAt) }}
                  </td>
                </ng-container>

                <!-- Status -->
                <ng-container matColumnDef="status">
                  <th mat-header-cell *matHeaderCellDef mat-sort-header>
                    Status
                  </th>

                  <td mat-cell *matCellDef="let order">
                    <mat-chip-set>
                      <mat-chip [color]="getStatusColor(order.status)" selected>
                        {{ order.status }}
                      </mat-chip>
                    </mat-chip-set>
                  </td>
                </ng-container>

                <!-- Total -->
                <ng-container matColumnDef="totalAmount">
                  <th mat-header-cell *matHeaderCellDef mat-sort-header>
                    Total
                  </th>

                  <td mat-cell *matCellDef="let order">
                    <span class="amount">
                      {{ formatCurrency(order.totalAmount) }}
                    </span>
                  </td>
                </ng-container>

                <!-- Items -->
                <ng-container matColumnDef="itemsCount">
                  <th mat-header-cell *matHeaderCellDef>Items</th>

                  <td mat-cell *matCellDef="let order">
                    {{ countTotalItems(order) }}
                  </td>
                </ng-container>

                <!-- Actions -->
                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef>Actions</th>

                  <td mat-cell *matCellDef="let order">
                    <button
                      mat-icon-button
                      [routerLink]="['/orders', order.id]"
                      matTooltip="View Details"
                      [disabled]="isLoading()"
                    >
                      <mat-icon>visibility</mat-icon>
                    </button>

                    @if (canCancel(order.status)) {
                      <button
                        mat-icon-button
                        color="warn"
                        (click)="cancelOrder(order.id)"
                        matTooltip="Cancel Order"
                        [disabled]="isLoading()"
                      >
                        <mat-icon>cancel</mat-icon>
                      </button>
                    }
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>

                <tr
                  mat-row
                  *matRowDef="let row; columns: displayedColumns"
                ></tr>
              </table>
            </div>

            <mat-paginator
              [length]="totalOrders()"
              [pageSize]="pageSize()"
              [pageSizeOptions]="[5, 10, 20, 50]"
              [pageIndex]="pageIndex()"
              (page)="onPageChange($event)"
              class="paginator"
              showFirstLastButtons
              aria-label="Select page of orders"
            />
          </mat-card-content>
        </mat-card>
      }
    </section>
  `,

  styles: [
    `
      .container {
        max-width: 1000px;
        margin: 0 auto;
        padding: 24px 16px;
      }

      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
      }

      .page-title {
        font-size: 1.75rem;
        font-weight: 800;
        color: var(--app-fg);
        margin: 0;
      }

      .orders-card {
        background: var(--app-surface);
        border-radius: var(--app-radius);
        box-shadow: var(--app-shadow);
      }

      .table-container {
        overflow-x: auto;
      }

      .orders-table {
        width: 100%;
        min-width: 700px;
        background-color: var(--app-surface);
      }

      .order-number {
        font-family: monospace;
        font-size: 0.875rem;
        color: var(--app-primary);
      }

      .amount {
        font-weight: 600;
        color: var(--app-fg);
      }

      .empty-card {
        margin-top: 24px;
      }

      .empty-state {
        text-align: center;
        padding: 64px 24px;
        color: var(--app-muted);
      }

      .empty-state mat-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        color: var(--app-bg);
        margin-bottom: 16px;
      }

      .empty-state p {
        margin: 8px 0;
      }

      .empty-state .muted {
        font-size: 0.875rem;
      }

      .loading-wrap {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        padding: 64px 0;
        color: var(--app-muted);
      }

      .paginator {
        background-color: var(--app-surface);
      }

      @media (max-width: 768px) {
        .container {
          padding: 16px 12px;
        }

        .orders-table {
          min-width: 100%;
        }
      }
    `,
  ],
})
export class OrdersPage implements OnInit {
  private readonly orderSvc = inject(OrderService);
  private readonly notify = inject(NotificationService);
  private readonly dialog = inject(MatDialog);

  readonly orders = signal<Order[]>([]);
  readonly isLoading = signal(false);

  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  readonly totalOrders = signal(0);

  readonly sortActive = signal("createdAt");
  readonly sortDirection = signal<"asc" | "desc">("desc");

  readonly displayedColumns = [
    "orderNumber",
    "createdAt",
    "status",
    "totalAmount",
    "itemsCount",
    "actions",
  ];

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.isLoading.set(true);

    this.orderSvc
      .getUserOrders(
        this.pageIndex(),
        this.pageSize(),
        `${this.sortActive()},${this.sortDirection()}`,
      )
      .subscribe({
        next: (response) => {
          this.orders.set(response.content);
          this.totalOrders.set(response.totalElements);
          this.isLoading.set(false);
        },
        error: (err) => {
          this.isLoading.set(false);

          this.notify.error(
            err?.error?.message ?? "Failed to load orders. Please try again.",
          );
        },
      });
  }

  onSortChange(event: Sort): void {
    this.sortActive.set(event.active);
    this.sortDirection.set(event.direction === "asc" ? "asc" : "desc");

    this.loadOrders();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);

    this.loadOrders();
  }

  canCancel(status: OrderStatus): boolean {
    return status === "PENDING";
  }

  cancelOrder(orderId: string): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: "Cancel order",
          message: `Do you want to cancel "#${orderId}"? This cannot be undone.`,
          danger: true,
          confirmLabel: "Confirm",
        },
      })
      .afterClosed()
      .subscribe((ok) => {
        if (!ok) {
          return;
        }

        // this.isLoading.set(true);
        // this.svc.delete(p.id).subscribe(() => {
        //   this.notify.success("Product deleted");
        //   this.load();
        //   this.isLoading.set(false);
        // });
      });
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);

    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
    }).format(amount);
  }

  getStatusColor(status: OrderStatus): string {
    const colors: Record<OrderStatus, string> = {
      PENDING: "warn",
      CONFIRMED: "primary",
      SHIPPED: "accent",
      DELIVERED: "primary",
      CANCELLED: "warn",
    };

    return colors[status] || "primary";
  }

  countTotalItems(order: Order): number {
    return order.subOrders.reduce(
      (total, subOrder) =>
        total + subOrder.items.reduce((sum, item) => sum + item.quantity, 0),
      0,
    );
  }
}
