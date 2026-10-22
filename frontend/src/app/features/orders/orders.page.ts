import { Component, inject, OnInit, OnDestroy, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormControl, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { ActivatedRoute, RouterModule } from "@angular/router";
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from "rxjs";

import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatCardModule } from "@angular/material/card";
import { MatTableModule } from "@angular/material/table";
import { MatPaginatorModule, PageEvent } from "@angular/material/paginator";
import { MatSortModule } from "@angular/material/sort";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatChipsModule } from "@angular/material/chips";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatDialog, MatDialogModule } from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { provideNativeDateAdapter } from "@angular/material/core";

import { OrderService } from "@core/services/order.service";
import { SubOrderService } from "@core/services/suborder.service";
import { NotificationService } from "@core/services/notification.service";
import { ConfirmDialogComponent } from "@shared/components/confirm-dialog.component";
import {
  Order,
  OrderStatus,
  OrderSearchFilter,
} from "@core/models/order.model";

@Component({
  selector: "app-orders",
  standalone: true,
  providers: [provideNativeDateAdapter()],
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
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
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
  ],
  template: `
    <section class="container">
      <div class="page-header">
        <h1 class="page-title">
          {{ isSeller ? "Seller Orders" : "My Orders" }}
        </h1>
      </div>

      <!-- Filters Section -->
      <mat-card class="filter-card">
        <form [formGroup]="filterForm" class="filter-form">
          <!-- Product Name Search -->
          <mat-form-field appearance="outline" class="filter-field grow">
            <mat-label>Search by product name</mat-label>
            <mat-icon matPrefix>search</mat-icon>
            <input
              matInput
              formControlName="productName"
              placeholder="e.g. Wireless Mouse"
            />
            @if (filterForm.get("productName")?.value) {
              <button
                mat-icon-button
                matSuffix
                type="button"
                (click)="filterForm.get('productName')?.reset()"
              >
                <mat-icon>close</mat-icon>
              </button>
            }
          </mat-form-field>

          <!-- Status Filter -->
          <mat-form-field
            appearance="outline"
            class="filter-field status-field"
          >
            <mat-label>Status</mat-label>
            <mat-select formControlName="status">
              <mat-option value="">All Statuses</mat-option>
              @for (status of statusOptions; track status) {
                <mat-option [value]="status">{{ status }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <!-- Start Date Filter -->
          <mat-form-field appearance="outline" class="filter-field date-field">
            <mat-label>From Date</mat-label>
            <input
              matInput
              [matDatepicker]="picker"
              formControlName="startDate"
              placeholder="Choose date"
            />
            <mat-datepicker-toggle matIconSuffix [for]="picker" />
            <mat-datepicker #picker />
          </mat-form-field>

          <!-- Clear Filters Button -->
          @if (hasActiveFilters()) {
            <button
              mat-button
              type="button"
              class="clear-btn"
              (click)="resetFilters()"
            >
              <mat-icon>filter_alt_off</mat-icon>
              Reset
            </button>
          }
        </form>
      </mat-card>

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
                hasActiveFilters()
                  ? "Try adjusting your search criteria."
                  : isSeller
                    ? "You will see orders from buyers here."
                    : "Start shopping to see your orders here."
              }}
            </p>

            @if (hasActiveFilters()) {
              <button mat-stroked-button (click)="resetFilters()">
                Clear Filters
              </button>
            } @else if (!isSeller) {
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
                    <span class="order-number">{{ order.id }}</span>
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
                  <th mat-header-cell *matHeaderCellDef>Items</th>
                  <td mat-cell *matCellDef="let order">
                    {{ countTotalItems(order) }}
                  </td>
                </ng-container>

                <!-- Actions -->
                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef>Actions</th>
                  <td mat-cell *matCellDef="let order">
                    @if (isSeller) {
                      <div class="seller-actions">
                        <button
                          mat-icon-button
                          [routerLink]="['/suborders', order.subOrders[0]?.id]"
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
                                order.subOrders[0]?.id,
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
                            (click)="deleteSubOrder(order.subOrders[0]?.id)"
                            matTooltip="Delete Suborder"
                            [disabled]="isLoading()"
                          >
                            <mat-icon>delete</mat-icon>
                          </button>
                        }
                      </div>
                    } @else {
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
        margin-bottom: 20px;
      }

      .page-title {
        font-size: 1.75rem;
        font-weight: 800;
        color: var(--app-fg);
        margin: 0;
      }

      /* Filter Bar Styling */
      .filter-card {
        background: var(--app-surface);
        border: 1px solid var(--app-border);
        border-radius: var(--app-radius);
        box-shadow: var(--app-shadow-sm);
        padding: 16px;
        margin-bottom: 20px;
      }

      .filter-form {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        align-items: center;
      }

      .filter-field {
        margin-bottom: -1.25em; /* Compensate for material subscript spacing */
      }

      .grow {
        flex: 1 1 240px;
      }

      .status-field {
        flex: 0 1 180px;
      }

      .date-field {
        flex: 0 1 180px;
      }

      .clear-btn {
        height: 48px;
        color: var(--app-muted);
        align-self: flex-start;
      }

      .clear-btn:hover {
        color: var(--app-danger);
      }

      .seller-actions {
        display: flex;
        gap: 8px;
      }

      .orders-card {
        background: var(--app-surface);
        border: 1px solid var(--app-border);
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

        .status-field,
        .date-field,
        .grow {
          flex: 1 1 100%;
        }

        .orders-table {
          min-width: 100%;
        }
      }
    `,
  ],
})
export class OrdersPage implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  readonly orderSvc = inject(OrderService);
  private readonly subOrderSvc = inject(SubOrderService);
  private readonly notify = inject(NotificationService);
  private readonly dialog = inject(MatDialog);

  private readonly destroy$ = new Subject<void>();

  readonly orders = signal<Order[]>([]);
  readonly isLoading = signal(false);

  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  readonly totalOrders = signal(0);

  readonly statusOptions: OrderStatus[] = [
    "PENDING",
    "CONFIRMED",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
  ];

  readonly filterForm = new FormGroup({
    productName: new FormControl<string>(""),
    status: new FormControl<OrderStatus | "">(""),
    startDate: new FormControl<Date | null>(null),
  });

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
    this.setupFilterListeners();
    this.loadOrders();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupFilterListeners(): void {
    this.filterForm.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
        takeUntil(this.destroy$),
      )
      .subscribe(() => {
        this.pageIndex.set(0);
        this.loadOrders();
      });
  }

  hasActiveFilters(): boolean {
    const { productName, status, startDate } = this.filterForm.value;
    return Boolean(productName?.trim() || status || startDate);
  }

  resetFilters(): void {
    this.filterForm.reset({
      productName: "",
      status: "",
      startDate: null,
    });
  }

  loadOrders(): void {
    this.isLoading.set(true);

    const isFiltered = this.hasActiveFilters();
    let request;

    if (this.isSeller) {
      if (isFiltered) {
        const filter = this.buildSearchFilter();
        request = this.subOrderSvc.searchOrdersBySeller(
          filter,
          this.pageIndex(),
          this.pageSize(),
        );
      } else {
        request = this.subOrderSvc.getOrdersBySeller(
          this.pageIndex(),
          this.pageSize(),
        );
      }
    } else {
      if (isFiltered) {
        const filter = this.buildSearchFilter();
        request = this.orderSvc.searchOrders(
          filter,
          this.pageIndex(),
          this.pageSize(),
        );
      } else {
        request = this.orderSvc.getUserOrders(
          this.pageIndex(),
          this.pageSize(),
        );
      }
    }

    request.subscribe({
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

  private buildSearchFilter(): OrderSearchFilter {
    const formValues = this.filterForm.value;
    let formattedDate: string | null = null;
    if (formValues.startDate) {
      const d = new Date(formValues.startDate);
      formattedDate = d.toISOString().replace("Z", "");
    }
    return {
      productName: formValues.productName?.trim() || undefined,
      status: formValues.status || undefined,
      startDate: formattedDate,
    };
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
        if (!ok) return;

        this.isLoading.set(true);
        this.orderSvc.cancelOrder(orderId).subscribe({
          next: () => {
            this.updateOrderStatus(orderId, "CANCELLED");
            this.notify.success("Order cancelled");
            this.isLoading.set(false);
          },
          error: () => this.isLoading.set(false),
        });
      });
  }

  private updateOrderStatus(orderId: string, status: OrderStatus): void {
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
        if (!ok) return;

        this.isLoading.set(true);
        this.orderSvc.redoOrder(orderId).subscribe({
          next: () => {
            this.notify.success("Order Redone");
            this.isLoading.set(false);
            this.loadOrders();
          },
          error: () => this.isLoading.set(false),
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
        if (!ok) return;

        this.isLoading.set(true);
        this.orderSvc.deleteOrder(orderId).subscribe({
          next: () => {
            this.notify.success("Order deleted");
            this.isLoading.set(false);
            this.loadOrders();
          },
          error: () => this.isLoading.set(false),
        });
      });
  }

  updateSubOrderStatus(subOrderId: string, newStatus: OrderStatus): void {
    this.isLoading.set(true);
    this.subOrderSvc.updateStatus(subOrderId, newStatus).subscribe({
      next: () => {
        this.notify.success(`Status updated to ${newStatus}`);
        this.isLoading.set(false);
        this.loadOrders();
      },
      error: () => this.isLoading.set(false),
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
        if (!ok) return;

        this.isLoading.set(true);
        this.subOrderSvc.deleteSubOrder(subOrderId).subscribe({
          next: () => {
            this.notify.success("Suborder deleted");
            this.isLoading.set(false);
            this.loadOrders();
          },
          error: () => this.isLoading.set(false),
        });
      });
  }

  countTotalItems(order: Order): number {
    return order.subOrders.reduce(
      (total, subOrder) =>
        total + subOrder.items.reduce((sum, item) => sum + item.quantity, 0),
      0,
    );
  }
}
