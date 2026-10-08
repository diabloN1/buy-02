import { ChangeDetectionStrategy, Component, Input } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatIconModule } from "@angular/material/icon";
import { OrderStatus, StatusHistory, SubOrder } from "@core/models/order.model";

interface TimelineStep {
  status: OrderStatus;
  title: string;
  icon: string;
  timestamp?: string;
  changedBy?: string;
  isCompleted: boolean;
  isCurrent: boolean;
}

@Component({
  selector: "app-order-status-timeline",
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="timeline-container">
      <div class="timeline-header">
        <div class="timeline-title">
          <mat-icon>linear_scale</mat-icon>
          <span>Order Timeline</span>
        </div>
        <span class="status-pill" [class]="statusPillClass(subOrder.status)">
          {{ subOrder.status }}
        </span>
      </div>

      <div class="timeline-track">
        @for (step of steps; track step.status; let i = $index; let last = $last) {
          <div
            class="timeline-step"
            [class.completed]="step.isCompleted"
            [class.current]="step.isCurrent"
            [class.cancelled]="step.status === 'CANCELLED' && step.isCurrent"
          >
            <!-- Node Indicator -->
            <div class="step-node-wrapper">
              <div class="step-node">
                <mat-icon>{{ step.icon }}</mat-icon>
              </div>
              @if (!last) {
                <div class="step-connector"></div>
              }
            </div>

            <!-- Content Area -->
            <div class="step-body">
              <div class="step-header">
                <strong class="step-title">{{ step.title }}</strong>
                @if (step.isCurrent) {
                  <span class="current-tag">Current</span>
                }
              </div>

              @if (step.timestamp) {
                <div class="step-meta">
                  <span class="step-date">
                    {{ step.timestamp | date: "MMM d, y, h:mm a" }}
                  </span>
                  @if (step.changedBy) {
                    <span class="step-actor">by {{ step.changedBy }}</span>
                  }
                </div>
              } @else {
                <span class="step-pending">Pending</span>
              }
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        margin: 16px 0;
      }

      .timeline-container {
        background: var(--app-bg-alt);
        border: 1px solid var(--app-border);
        border-radius: var(--app-radius);
        padding: 20px;
      }

      .timeline-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 20px;
        padding-bottom: 12px;
        border-bottom: 1px solid var(--app-border);
      }

      .timeline-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 700;
        font-size: 0.95rem;
        color: var(--app-fg);
      }

      .timeline-title mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
        color: var(--app-muted);
      }

      .status-pill {
        display: inline-flex;
        align-items: center;
        padding: 4px 10px;
        border-radius: 9999px;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.03em;
        background: var(--app-surface);
        border: 1px solid var(--app-border);
        color: var(--app-fg);
      }

      .status-pill.pill-primary {
        background: rgba(16, 185, 129, 0.1);
        border-color: rgba(16, 185, 129, 0.3);
        color: #10b981;
      }

      .status-pill.pill-warn {
        background: rgba(239, 68, 68, 0.1);
        border-color: rgba(239, 68, 68, 0.3);
        color: #ef4444;
      }

      .timeline-track {
        display: flex;
        flex-direction: column;
        gap: 0;
      }

      .timeline-step {
        display: flex;
        gap: 16px;
        position: relative;
        min-height: 64px;
      }

      .step-node-wrapper {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 32px;
        flex-shrink: 0;
      }

      .step-node {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: var(--app-surface);
        border: 2px solid var(--app-border);
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--app-muted);
        z-index: 2;
        transition: all 0.2s ease;
      }

      .step-node mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }

      .step-connector {
        flex: 1;
        width: 2px;
        background: var(--app-border);
        margin-top: 4px;
        margin-bottom: 4px;
        z-index: 1;
      }

      /* Completed Step */
      .timeline-step.completed .step-node {
        background: var(--app-fg);
        border-color: var(--app-fg);
        color: var(--app-bg);
      }

      .timeline-step.completed .step-connector {
        background: var(--app-fg);
      }

      /* Current Step */
      .timeline-step.current .step-node {
        background: var(--app-fg);
        border-color: var(--app-fg);
        color: var(--app-bg);
        box-shadow: 0 0 0 4px var(--app-border);
      }

      .timeline-step.cancelled .step-node {
        background: #ef4444;
        border-color: #ef4444;
        color: #ffffff;
        box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.2);
      }

      .step-body {
        flex: 1;
        padding-bottom: 24px;
      }

      .step-header {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .step-title {
        font-size: 0.9rem;
        font-weight: 600;
        color: var(--app-fg);
      }

      .timeline-step:not(.completed):not(.current) .step-title {
        color: var(--app-muted);
      }

      .current-tag {
        font-size: 0.7rem;
        font-weight: 600;
        padding: 2px 8px;
        border-radius: 9999px;
        background: var(--app-fg);
        color: var(--app-bg);
      }

      .timeline-step.cancelled .current-tag {
        background: #ef4444;
        color: #ffffff;
      }

      .step-meta {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 4px;
        font-size: 0.8rem;
        color: var(--app-muted);
      }

      .step-actor {
        font-weight: 500;
        opacity: 0.8;
      }

      .step-pending {
        display: block;
        margin-top: 4px;
        font-size: 0.8rem;
        color: var(--app-muted);
        opacity: 0.5;
      }

      @media (min-width: 640px) {
        .timeline-track {
          flex-direction: row;
          align-items: flex-start;
          gap: 0;
        }

        .timeline-step {
          flex: 1;
          flex-direction: column;
          align-items: flex-start;
          min-height: auto;
          gap: 12px;
        }

        .step-node-wrapper {
          width: 100%;
          flex-direction: row;
          align-items: center;
        }

        .step-connector {
          width: 100%;
          height: 2px;
          margin-top: 0;
          margin-bottom: 0;
          margin-left: 4px;
          margin-right: 4px;
        }

        .step-body {
          padding-bottom: 0;
        }
      }
    `,
  ],
})
export class OrderStatusTimelineComponent {
  @Input({ required: true }) subOrder!: SubOrder;
  @Input({ required: true }) createdAt!: string;
  @Input({ required: true }) isSeller!: boolean;

  get steps(): TimelineStep[] {
    const historyMap = new Map<OrderStatus, StatusHistory>();
    this.subOrder.statusHistory?.forEach((h) => historyMap.set(h.status, h));

    const statusOrder: OrderStatus[] = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED"];
    const currentStatus = this.subOrder.status;

    if (currentStatus === "CANCELLED") {
      return [
        {
          status: "PENDING",
          title: "Order Placed",
          icon: "check",
          timestamp: this.createdAt,
          changedBy: "Buyer",
          isCompleted: true,
          isCurrent: false,
        },
        {
          status: "CANCELLED",
          title: "Order Cancelled",
          icon: "close",
          timestamp: historyMap.get("CANCELLED")?.timestamp || this.createdAt,
          changedBy: this.getChangedByLabel(historyMap.get("CANCELLED")),
          isCompleted: false,
          isCurrent: true,
        },
      ];
    }

    const currentIdx = statusOrder.indexOf(currentStatus);

    return statusOrder.map((status, index) => {
      const history = historyMap.get(status);
      const isCompleted = currentIdx > index;
      const isCurrent = currentStatus === status;

      let timestamp = history?.timestamp;
      if (status === "PENDING" && !timestamp) {
        timestamp = this.createdAt;
      }

      return {
        status,
        title: this.getStatusTitle(status),
        icon: isCompleted ? "check" : this.getStatusIcon(status),
        timestamp,
        changedBy: history ? this.getChangedByLabel(history) : status === "PENDING" ? "Buyer" : undefined,
        isCompleted,
        isCurrent,
      };
    });
  }

  statusPillClass(status: OrderStatus): string {
    if (status === "CANCELLED") return "pill-warn";
    if (status === "DELIVERED" || status === "SHIPPED" || status === "CONFIRMED") return "pill-primary";
    return "";
  }

  private getStatusTitle(status: OrderStatus): string {
    switch (status) {
      case "PENDING":
        return "Order Placed";
      case "CONFIRMED":
        return "Order Confirmed";
      case "SHIPPED":
        return "Dispatched & Shipped";
      case "DELIVERED":
        return "Order Delivered";
      case "CANCELLED":
        return "Order Cancelled";
    }
  }

  private getStatusIcon(status: OrderStatus): string {
    switch (status) {
      case "PENDING":
        return "schedule";
      case "CONFIRMED":
        return "check_circle_outline";
      case "SHIPPED":
        return "local_shipping";
      case "DELIVERED":
        return "done_all";
      case "CANCELLED":
        return "close";
    }
  }

  private getChangedByLabel(history?: StatusHistory): string | undefined {
    if (!history) return undefined;
    return history.changedBy === this.subOrder.sellerId ? "Seller" : "Buyer";
  }
}
