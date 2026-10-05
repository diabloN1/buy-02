import { Component, Input } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatIconModule } from "@angular/material/icon";
import { MatChipsModule } from "@angular/material/chips";
import { MatExpansionModule } from "@angular/material/expansion";

import { OrderStatus, StatusHistory, SubOrder } from "@core/models/order.model";

@Component({
  selector: "app-order-status-timeline",
  standalone: true,
  imports: [CommonModule, MatIconModule, MatChipsModule, MatExpansionModule],
  template: `
    <mat-expansion-panel class="timeline-panel">
      <mat-expansion-panel-header>
        <mat-panel-title>
          <mat-icon>timeline</mat-icon>
          Status Timeline
        </mat-panel-title>

        <mat-panel-description>
          {{ subOrder.status }}
        </mat-panel-description>
      </mat-expansion-panel-header>

      <div class="status-timeline">
        <div
          class="timeline-item"
          [class.completed]="timeline.length != 0"
          [class.current]="timeline.length == 0"
        >
          <div class="timeline-marker">
            <mat-icon>
              {{ getStatusIcon("PENDING") }}
            </mat-icon>
          </div>

          <div class="timeline-content">
            <div class="timeline-header">
              <strong>{{ "PENDING" }}</strong>

              @if (timeline.length == 0) {
                <mat-chip [color]="getStatusColor('PENDING')" selected>
                  Current
                </mat-chip>
              }
            </div>

            <span class="timeline-date">
              {{ createdAt | date: "MMM d, y, h:mm a" }}
            </span>

            <span class="timeline-user"> Created By Buyer </span>
          </div>
        </div>
        @for (
          history of timeline;
          track history.status + history.timestamp;
          let i = $index
        ) {
          <div
            class="timeline-item"
            [class.completed]="i < timeline.length - 1"
            [class.current]="i === timeline.length - 1"
          >
            <div class="timeline-marker">
              <mat-icon>
                {{ getStatusIcon(history.status) }}
              </mat-icon>
            </div>

            <div class="timeline-content">
              <div class="timeline-header">
                <strong>{{ history.status }}</strong>

                @if (i === timeline.length - 1) {
                  <mat-chip [color]="getStatusColor(history.status)" selected>
                    Current
                  </mat-chip>
                }
              </div>

              <span class="timeline-date">
                {{ history.timestamp | date: "MMM d, y, h:mm a" }}
              </span>

              <span class="timeline-user">
                Changed by {{ history.changedBy }}
              </span>
            </div>
          </div>
        }
      </div>
    </mat-expansion-panel>
  `,
  styles: [
    `
      .timeline-panel {
        background: transparent;
        box-shadow: none;
      }

      .timeline-panel mat-expansion-panel-header {
        padding: 0 8px;
      }

      .timeline-panel mat-panel-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 600;
      }

      .status-timeline {
        padding: 16px 8px 4px;
      }

      .timeline-item {
        position: relative;
        display: flex;
        gap: 14px;
        min-height: 72px;
      }

      .timeline-item:not(:last-child)::before {
        content: "";
        position: absolute;
        left: 15px;
        top: 32px;
        bottom: 0;
        width: 2px;
        background: var(--app-border, #ddd);
      }

      .timeline-marker {
        position: relative;
        z-index: 1;

        width: 32px;
        height: 32px;
        min-width: 32px;

        display: flex;
        align-items: center;
        justify-content: center;

        border-radius: 50%;
        background: var(--app-bg);
        color: var(--app-muted);
        border: 2px solid var(--app-border, #ddd);
      }

      .timeline-marker mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      .timeline-item.completed .timeline-marker {
        color: var(--app-primary);
        border-color: var(--app-primary);
      }

      .timeline-item.current .timeline-marker {
        color: var(--app-primary);
        border-color: var(--app-primary);
        background: var(--app-primary);
      }

      .timeline-item.current .timeline-marker mat-icon {
        color: white;
      }

      .timeline-content {
        flex: 1;
        padding-bottom: 20px;
      }

      .timeline-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 4px;
      }

      .timeline-header strong {
        font-size: 0.95rem;
      }

      .timeline-date,
      .timeline-user {
        display: block;
        color: var(--app-muted);
        font-size: 0.8rem;
      }

      .timeline-user {
        margin-top: 2px;
      }
    `,
  ],
})
export class OrderStatusTimelineComponent {
  @Input({ required: true }) subOrder!: SubOrder;
  @Input({ required: true }) createdAt!: string;

  get timeline(): StatusHistory[] {
    return [...this.subOrder.statusHistory].sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );
  }

  getStatusIcon(status: OrderStatus): string {
    switch (status) {
      case "PENDING":
        return "schedule";

      case "CONFIRMED":
        return "check_circle";

      case "SHIPPED":
        return "local_shipping";

      case "DELIVERED":
        return "done_all";

      case "CANCELLED":
        return "cancel";

      default:
        return "circle";
    }
  }

  getStatusColor(status: OrderStatus): string {
    switch (status) {
      case "CANCELLED":
        return "warn";

      case "DELIVERED":
      case "CONFIRMED":
      case "SHIPPED":
        return "primary";

      case "PENDING":
      default:
        return "accent";
    }
  }
}
