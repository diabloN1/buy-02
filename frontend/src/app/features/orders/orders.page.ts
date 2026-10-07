import { Component, inject, OnInit, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ActivatedRoute, RouterModule } from "@angular/router";

import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatCardModule } from "@angular/material/card";
import { MatTableModule } from "@angular/material/table";
import { MatPaginatorModule, PageEvent } from "@angular/material/paginator";
import { MatSortModule, Sort } from "@angular/material/sort";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatChipsModule } from "@angular/material/chips";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatDialog, MatDialogModule } from "@angular/material/dialog";

import { OrderService } from "@core/services/order.service";
import { SubOrderService } from "@core/services/suborder.service";
import { NotificationService } from "@core/services/notification.service";
import { ConfirmDialogComponent } from "@shared/components/confirm-dialog.component";
import { Order, OrderStatus } from "@core/models/order.model";

@Component({
  selector: "app-orders",
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
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
  ],
  template: `
    <section class="container">
      <div class="page-header">
        <h1 class="page-title">
          {{ isSeller ? "Seller Orders" : "My Orders" }}
        </h1>
      </div>

      @if (isLoading()) {
        <div class="loading-wrap">
          <mat-spinner [diameter]="40" />
          <span class="muted">Loading orders…</span>
        </div>
      } @else if (orders().length === 0) {
        <mat-card class="orders-card">
          <mat-card-content class="empty-state">
            <mat-icon class="icon-xl">
              {{ isSeller ? "receipt_long" : "shopping_bag" }}
            </mat-icon>

            <p>No orders found</p>

            <p class="muted">
              {{
                isSeller
                  ? "You will see orders from buyers here."
                  : "Start shopping to see your orders here."
              }}
            </p>

            @if (!isSeller) {
              <a class="btn btn-primary" routerLink="/products">
                <mat-icon>shopping_bag</mat-icon>
                Browse Products
              </a>
            }
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
                    {{ order.createdAt | date: "MMM d, y, h:mm a" }}
                  </td>
                </ng-container>

                <!-- Status -->
                <ng-container matColumnDef="status">
                  <th mat-header-cell *matHeaderCellDef mat-sort-header>
                    Status
                  </th>

                  <td mat-cell *matCellDef="let order">
                    <mat-chip-set>
                      <mat-chip
                        [color]="orderSvc.getStatusColor(order.status)"
                        selected
                      >
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
                      {{ order.totalAmount | currency: "USD" }}
                    </span>
                  </td>
                </ng-container>

                <!-- Items -->
                <ng-container matColumnDef="itemsCount">
                  <th mat-header-cell *matHeaderCellDef>
                    Items
                  </th>

                  <td mat-cell *matCellDef="let order">
                    {{ countTotalItems(order) }}
                  </td>
                </ng-container>

                <!-- Actions -->
                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef>
                    Actions
                  </th>

                  <td mat-cell *matCellDef="let order">
                    @if (isSeller) {
                      <!-- Seller actions -->
                      <div class="seller-actions">
                        <button
                          mat-icon-button
                          [routerLink]="[
                            '/suborders',
                            order.subOrders[0].id
                          ]"
                          matTooltip="View Details"
                          [disabled]="isLoading()"
                        >
                          <mat-icon>visibility</mat-icon>
                        </button>

                        @for (
                          status of orderSvc.getAvailableStatusTransitions(
                            order.status
                          );
                          track status
                        ) {
                          <button
                            mat-icon-button
                            (click)="
                              updateSubOrderStatus(
                                order.subOrders[0].id,
                                status
                              )
                            "
                            matTooltip="Update to {{ status }}"
                            [disabled]="isLoading()"
                          >
                            <mat-icon>
                              {{ orderSvc.getStatusIcon(status) }}
                            </mat-icon>
                          </button>
                        }

                        @if (orderSvc.canDelete(order.status)) {
                          <button
                            mat-icon-button
                            color="warn"
                            (click)="
                              deleteSubOrder(order.subOrders[0].id)
                            "
                            matTooltip="Delete Suborder"
                            [disabled]="isLoading()"
                          >
                            <mat-icon>delete</mat-icon>
                          </button>
                        }
                      </div>
                    } @else {
                      <!-- Buyer actions -->

                      <button
                        mat-icon-button
                        [routerLink]="['/orders', order.id]"
                        matTooltip="View Details"
                        [disabled]="isLoading()"
                      >
                        <mat-icon>visibility</mat-icon>
                      </button>

                      <button
                        mat-icon-button
                        (click)="redoOrder(order.id)"
                        matTooltip="Redo Order"
                        [disabled]="isLoading()"
                      >
                        <mat-icon>low_priority</mat-icon>
                      </button>

                      @if (orderSvc.canCancel(order.status)) {
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

                      @if (orderSvc.canDelete(order.status)) {
                        <button
                          mat-icon-button
                          color="warn"
                          (click)="deleteOrder(order.id)"
                          matTooltip="Delete Order"
                          [disabled]="isLoading()"
                        >
                          <mat-icon>delete</mat-icon>
                        </button>
                      }
                    }
                  </td>
                </ng-container>

                <tr
                  mat-header-row
                  *matHeaderRowDef="displayedColumns"
                ></tr>

                <tr
                  mat-row
                  *matRowDef="
                    let row;
                    columns: displayedColumns
                  "
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

      .seller-actions {
        display: flex;
        gap: 8px;
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

      .empty-state {
        text-align: center;
        padding: 64px 24px;
      }

      .icon-xl {
        font-size: 64px;
        width: 64px;
        height: 64px;
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
  private readonly route = inject(ActivatedRoute);
  readonly orderSvc = inject(OrderService);
  private readonly subOrderSvc = inject(SubOrderService);
  private readonly notify = inject(NotificationService);
  private readonly dialog = inject(MatDialog);

  readonly orders = signal<Order[]>([]);
  readonly isLoading = signal(false);

  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  readonly totalOrders = signal(0);

  readonly displayedColumns = [
    "orderNumber",
    "createdAt",
    "status",
    "totalAmount",
    "itemsCount",
    "actions",
  ];

  get isSeller(): boolean {
    return this.route.snapshot.data["type"] === "suborders";
  }

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.isLoading.set(true);

    const request = this.isSeller
      ? this.subOrderSvc.getOrdersBySeller(
          this.pageIndex(),
          this.pageSize(),
        )
      : this.orderSvc.getUserOrders(
          this.pageIndex(),
          this.pageSize(),
        );

    request.subscribe({
      next: (response) => {
        this.orders.set(response.content);
        this.totalOrders.set(response.totalElements);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);

        this.notify.error(
          err?.error?.message ??
            "Failed to load orders. Please try again.",
        );
      },
    });
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);

    this.loadOrders();
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

        this.isLoading.set(true);

        this.orderSvc.cancelOrder(orderId).subscribe({
          next: () => {
            this.updateOrderStatus(orderId, "CANCELLED");
            this.notify.success("Order cancelled");
            this.isLoading.set(false);
          },
          error: () => {
            this.isLoading.set(false);
          },
        });
      });
  }

  redoOrder(orderId: string): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: "Redo order",
          message: `Do you want to redo "#${orderId}"?`,
          danger: true,
          confirmLabel: "Confirm",
        },
      })
      .afterClosed()
      .subscribe((ok) => {
        if (!ok) {
          return;
        }

        this.isLoading.set(true);

        this.orderSvc.redoOrder(orderId).subscribe({
          next: () => {
            this.notify.success("Order Redone");
            this.isLoading.set(false);
            this.loadOrders();
          },
          error: () => {
            this.isLoading.set(false);
          },
        });
      });
  }

  deleteOrder(orderId: string): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: "Delete order",
          message: `Do you want to delete "#${orderId}"? This cannot be undone.`,
          danger: true,
          confirmLabel: "Delete",
        },
      })
      .afterClosed()
      .subscribe((ok) => {
        if (!ok) {
          return;
        }

        this.isLoading.set(true);

        this.orderSvc.deleteOrder(orderId).subscribe({
          next: () => {
            this.notify.success("Order deleted");
            this.isLoading.set(false);
            this.loadOrders();
          },
          error: () => {
            this.isLoading.set(false);
          },
        });
      });
  }

  updateSubOrderStatus(
    subOrderId: string,
    newStatus: OrderStatus,
  ): void {
    this.isLoading.set(true);

    this.subOrderSvc
      .updateStatus(subOrderId, newStatus)
      .subscribe({
        next: () => {
          this.notify.success(
            `Status updated to ${newStatus}`,
          );

          this.isLoading.set(false);
          this.loadOrders();
        },
        error: () => {
          this.isLoading.set(false);
        },
      });
  }

  deleteSubOrder(subOrderId: string): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: "Delete suborder",
          message:
            "Do you want to delete this suborder? This cannot be undone.",
          danger: true,
          confirmLabel: "Delete",
        },
      })
      .afterClosed()
      .subscribe((ok) => {
        if (!ok) {
          return;
        }

        this.isLoading.set(true);

        this.subOrderSvc
          .deleteSubOrder(subOrderId)
          .subscribe({
            next: () => {
              this.notify.success("Suborder deleted");
              this.isLoading.set(false);
              this.loadOrders();
            },
            error: () => {
              this.isLoading.set(false);
            },
          });
      });
  }

  private updateOrderStatus(
    orderId: string,
    status: OrderStatus,
  ): void {
    this.orders.update((orders) =>
      orders.map((order) =>
        order.id === orderId
          ? {
              ...order,
              status,
            }
          : order,
      ),
    );
  }

  countTotalItems(order: Order): number {
    return order.subOrders.reduce(
      (total, subOrder) =>
        total +
        subOrder.items.reduce(
          (sum, item) => sum + item.quantity,
          0,
        ),
      0,
    );
  }
}
