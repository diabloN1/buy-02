import { Component, inject, OnInit, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ActivatedRoute, RouterModule } from "@angular/router";

import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatCardModule } from "@angular/material/card";
import { MatListModule } from "@angular/material/list";
import { MatChipsModule } from "@angular/material/chips";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatDividerModule } from "@angular/material/divider";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatDialog, MatDialogModule } from "@angular/material/dialog";

import { OrderService } from "@core/services/order.service";
import { SubOrderService } from "@core/services/suborder.service";
import { NotificationService } from "@core/services/notification.service";
import { ConfirmDialogComponent } from "@shared/components/confirm-dialog.component";
import { Order, OrderStatus } from "@core/models/order.model";
import { OrderStatusTimelineComponent } from "@shared/components/order-status-timeline.component";

@Component({
  selector: "app-order-details",
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatListModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatExpansionModule,
    MatDialogModule,
    OrderStatusTimelineComponent,
  ],
  template: `
    <section class="container">
      <div class="page-header">
        <button
          mat-stroked-button
          [routerLink]="isSeller() ? '/suborders' : '/orders'"
          class="back-btn"
        >
          <mat-icon>arrow_back</mat-icon>
          {{ isSeller() ? "Back to SubOrders" : "Back to Orders" }}
        </button>
      </div>

      @if (isLoading()) {
        <div class="loading-wrap">
          <mat-spinner [diameter]="40" />
          <span class="muted">Loading order…</span>
        </div>
      } @else if (order(); as currentOrder) {
        <mat-card class="order-card">
          <mat-card-content>
            <h2 mat-card-title>
              Order #{{ currentOrder.id }}
            </h2>

            <mat-divider></mat-divider>

            <div class="order-info">
              <div class="info-row">
                <span class="info-label">Order Date:</span>

                <span class="info-value">
                  {{ currentOrder.createdAt | date: "MMM d, y, h:mm a" }}
                </span>
              </div>

              <div class="info-row">
                <span class="info-label">Overall Status:</span>

                <span class="info-value">
                  <mat-chip
                    [color]="
                      orderSvc.getStatusColor(currentOrder.status)
                    "
                    selected
                  >
                    {{ currentOrder.status }}
                  </mat-chip>
                </span>
              </div>

              <div class="info-row">
                <span class="info-label">Payment:</span>

                <span class="info-value">
                  {{ currentOrder.paymentMethod }}
                </span>
              </div>

              <div class="info-row">
                <span class="info-label">Total:</span>

                <span class="info-value">
                  {{ currentOrder.totalAmount | currency: "USD" }}
                </span>
              </div>
            </div>

            <mat-divider></mat-divider>

            <mat-accordion>
              <mat-expansion-panel class="order-card">
                <mat-expansion-panel-header>
                  <mat-panel-title>
                    Shipping Address
                  </mat-panel-title>
                </mat-expansion-panel-header>

                <p class="shipping-address">
                  {{ currentOrder.shippingAddress.street }}<br />

                  {{ currentOrder.shippingAddress.city }},
                  {{ currentOrder.shippingAddress.country }}<br />

                  {{ currentOrder.shippingAddress.zipCode }}<br />


                  {{ currentOrder.shippingAddress.phone }}
                </p>
              </mat-expansion-panel>
            </mat-accordion>

            @if (!isSeller()) {
              <mat-divider></mat-divider>

              <div class="buyer-actions-panel">
                <h4>Actions</h4>

                <div class="actions-row">
                  <button
                    mat-flat-button
                    (click)="redoOrder(currentOrder.id)"
                    [disabled]="isLoading()"
                  >
                    <mat-icon>low_priority</mat-icon>
                    Redo Order
                  </button>

                  @if (orderSvc.canCancel(currentOrder.status)) {
                    <button
                      mat-flat-button
                      color="warn"
                      (click)="cancelOrder(currentOrder.id)"
                      [disabled]="isLoading()"
                    >
                      <mat-icon>cancel</mat-icon>
                      Cancel Order
                    </button>
                  }

                  @if (orderSvc.canDelete(currentOrder.status)) {
                    <button
                      mat-flat-button
                      color="warn"
                      (click)="deleteOrder(currentOrder.id)"
                      [disabled]="isLoading()"
                    >
                      <mat-icon>delete</mat-icon>
                      Delete Order
                    </button>
                  }
                </div>
              </div>
            }

            <h3 class="section-title">Items</h3>

            <div class="sub-orders">
              @for (
                subOrder of currentOrder.subOrders;
                track subOrder.id
              ) {
                <mat-card class="sub-order-card">
                  <mat-card-content>
                    <div class="seller-header">
                      <div>
                        <span class="seller-label">
                          Seller
                        </span>

                        <span class="seller-id">
                          {{ subOrder.sellerId }}
                        </span>
                      </div>

                      <mat-chip
                        [color]="
                          orderSvc.getStatusColor(subOrder.status)
                        "
                        selected
                      >
                        {{ subOrder.status }}
                      </mat-chip>
                    </div>

                    <mat-divider></mat-divider>

                    <app-order-status-timeline
                      [subOrder]="subOrder"
                      [createdAt]="currentOrder.createdAt"
                      [isSeller]="isSeller()"
                    />

                    <mat-divider></mat-divider>

                    <div class="items-list">
                      @for (
                        item of subOrder.items;
                        track item.productId
                      ) {
                        <div class="item-row">
                          @if (item.imageUrl) {
                            <img
                              class="item-image"
                              [src]="item.imageUrl"
                              [alt]="item.productName"
                            />
                          } @else {
                            <mat-icon class="item-icon">
                              shopping_bag
                            </mat-icon>
                          }

                          <div class="item-details">
                            <span class="item-name">
                              {{ item.productName }}
                            </span>

                            <span class="item-qty">
                              {{ item.quantity }} ×
                              {{ item.price | currency: "USD" }}
                            </span>
                          </div>

                          <span class="item-price">
                            {{
                              item.price * item.quantity
                                | currency: "USD"
                            }}
                          </span>
                        </div>

                        <mat-divider></mat-divider>
                      }
                    </div>

                    <div class="sub-order-total">
                      <span>Seller Total</span>

                      <strong>
                        {{
                          subOrder.totalAmount
                            | currency: "USD"
                        }}
                      </strong>
                    </div>

                    @if (
                      isSeller() &&
                      subOrder.id === currentOrder.subOrders[0].id
                    ) {
                      <mat-divider></mat-divider>

                      <div class="seller-actions-panel">
                        <h4>Seller Actions</h4>

                        <div class="actions-row">
                          @for (
                            status of
                            orderSvc.getAvailableStatusTransitions(
                              subOrder.status
                            );
                            track status
                          ) {
                            <button
                              mat-flat-button
                              [color]="getActionColor(status)"
                              (click)="
                                updateSubOrderStatus(
                                  subOrder.id,
                                  status
                                )
                              "
                              [disabled]="isLoading()"
                            >
                              <mat-icon>
                                {{
                                  orderSvc.getStatusIcon(status)
                                }}
                              </mat-icon>

                              {{ status }}
                            </button>
                          }

                          @if (
                            orderSvc.canDelete(
                              currentOrder.status
                            )
                          ) {
                            <button
                              mat-flat-button
                              color="warn"
                              (click)="
                                deleteSubOrder(subOrder.id)
                              "
                              [disabled]="isLoading()"
                            >
                              <mat-icon>delete</mat-icon>
                              Delete Suborder
                            </button>
                          }
                        </div>
                      </div>
                    }
                  </mat-card-content>
                </mat-card>
              }
            </div>
          </mat-card-content>
        </mat-card>
      } @else {
        <mat-card class="order-card not-found-card">
          <mat-card-content>
            <mat-icon class="not-found">
              error_outline
            </mat-icon>

            <p>Order not found</p>

            <button
              mat-raised-button
              color="primary"
              [routerLink]="isSeller() ? '/suborders' : '/orders'"
            >
              <mat-icon>receipt_long</mat-icon>
              Back to orders
            </button>
          </mat-card-content>
        </mat-card>
      }
    </section>
  `,

  styles: [
    `
      .container {
        max-width: 900px;
        margin: 0 auto;
        padding: 24px 16px;
      }

      .page-header {
        margin-bottom: 24px;
      }

      .back-btn {
        display: inline-flex;
        align-items: center;
        gap: 4px;
      }

      .loading-wrap {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        padding: 64px 0;
        color: var(--app-muted);
      }

      .order-card {
        background-color: var(--app-surface);
        box-shadow: var(--app-shadow);
        border-radius: var(--app-radius);
      }

      .order-card mat-card-title {
        font-size: 1.5rem;
        font-weight: 700;
        margin-bottom: 16px;
      }

      .not-found-card {
        text-align: center;
        padding: 48px 24px;
      }

      .not-found {
        font-size: 48px;
        width: 48px;
        height: 48px;
        color: var(--app-muted);
        margin-bottom: 16px;
      }

      .order-info {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 16px 0;
      }

      .info-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .info-label {
        color: var(--app-muted);
        font-weight: 500;
      }

      .info-value {
        font-weight: 600;
        text-align: right;
      }

      .shipping-address {
        white-space: pre-line;
        line-height: 1.6;
        padding: 16px;
        background: var(--app-bg);
        border-radius: 8px;
        margin: 16px 0;
      }

      .section-title {
        font-size: 1.1rem;
        font-weight: 600;
        margin: 20px 0 12px;
      }

      .sub-orders {
        display: flex;
        flex-direction: column;
        gap: 16px;
        margin: 16px 0;
      }

      .sub-order-card {
        background-color: var(--app-surface);
        border-radius: 12px;
        box-shadow: none;
        border: 1px solid var(--app-border, #ddd);
      }

      .seller-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        padding-bottom: 12px;
      }

      .seller-label {
        display: block;
        color: var(--app-muted);
        font-size: 0.8rem;
        margin-bottom: 4px;
      }

      .seller-id {
        font-weight: 600;
      }

      .items-list {
        margin: 4px 0;
      }

      .item-row {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 0;
      }

      .item-image {
        width: 56px;
        height: 56px;
        object-fit: cover;
        border-radius: 8px;
        flex-shrink: 0;
      }

      .item-icon {
        width: 56px;
        height: 56px;
        font-size: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--app-muted);
        flex-shrink: 0;
      }

      .item-details {
        display: flex;
        flex-direction: column;
        flex: 1;
        min-width: 0;
      }

      .item-name {
        font-weight: 500;
        color: var(--app-fg);
      }

      .item-qty {
        color: var(--app-muted);
        font-size: 0.875rem;
        margin-top: 4px;
      }

      .item-price {
        font-weight: 600;
        color: var(--app-fg);
        min-width: 100px;
        text-align: right;
      }

      .sub-order-total {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-top: 12px;
        margin-top: 4px;
      }

      .sub-order-total span {
        color: var(--app-muted);
        font-weight: 500;
      }

      .seller-actions-panel,
      .buyer-actions-panel {
        padding-top: 16px;
      }

      .seller-actions-panel h4,
      .buyer-actions-panel h4 {
        margin: 0 0 12px;
        font-size: 1rem;
        color: var(--app-fg);
      }

      .actions-row {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .actions-row button {
        display: inline-flex;
        align-items: center;
        gap: 8px;
      }

      .muted {
        color: var(--app-muted);
      }
    `,
  ],
})
export class OrderDetailsPage implements OnInit {
  private readonly route = inject(ActivatedRoute);

  readonly orderSvc = inject(OrderService);
  private readonly subOrderSvc = inject(SubOrderService);
  private readonly notify = inject(NotificationService);
  private readonly dialog = inject(MatDialog);

  readonly order = signal<Order | null>(null);
  readonly isLoading = signal(false);

  readonly orderId = signal("");
  readonly isSeller = signal(false);

  ngOnInit(): void {
    this.resolveRoute();
    this.loadOrder();
  }

  private resolveRoute(): void {
    const orderId = this.route.snapshot.paramMap.get("orderId");
    const subOrderId =
      this.route.snapshot.paramMap.get("subOrderId");

    if (orderId) {
      this.orderId.set(orderId);
      this.isSeller.set(false);
      return;
    }

    if (subOrderId) {
      this.orderId.set(subOrderId);
      this.isSeller.set(true);
    }
  }

  loadOrder(): void {
    const id = this.orderId();

    if (!id) {
      this.order.set(null);
      return;
    }

    this.isLoading.set(true);

    const request = this.isSeller()
      ? this.subOrderSvc.getSubOrder(id)
      : this.orderSvc.getOrder(id);

    request.subscribe({
      next: (order) => {
        this.order.set(order);
        this.isLoading.set(false);
      },

      error: (err) => {
        this.order.set(null);
        this.isLoading.set(false);

        this.notify.error(
          err?.error?.message ??
            "Failed to load order. Please try again.",
        );
      },
    });
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
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }

        this.isLoading.set(true);

        this.orderSvc.cancelOrder(orderId).subscribe({
          next: () => {
            this.notify.success("Order cancelled");
            this.loadOrder();
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
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }

        this.isLoading.set(true);

        this.orderSvc.redoOrder(orderId).subscribe({
          next: () => {
            this.notify.success("Order redone");
            this.loadOrder();
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
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }

        this.isLoading.set(true);

        this.orderSvc.deleteOrder(orderId).subscribe({
          next: () => {
            this.notify.success("Order deleted");
            this.loadOrder();
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

          this.loadOrder();
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
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }

        this.isLoading.set(true);

        this.subOrderSvc
          .deleteSubOrder(subOrderId)
          .subscribe({
            next: () => {
              this.notify.success("Suborder deleted");
              this.loadOrder();
            },

            error: () => {
              this.isLoading.set(false);
            },
          });
      });
  }

  getActionColor(status: OrderStatus): string {
    return status === "CANCELLED" ? "warn" : "primary";
  }
}
