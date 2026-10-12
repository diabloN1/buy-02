import { Component, Input } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { RouterModule } from "@angular/router";

@Component({
  selector: "app-confirmation-step",
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, RouterModule],
  template: `
    <div class="confirmation">
      <mat-icon class="check-icon">check_circle</mat-icon>

      <h2>Order placed!</h2>

      <p>
        Your order has been placed successfully. Payment will be collected on
        delivery.
      </p>

      @if (orderId) {
        <p class="order-id">Order #{{ orderId }}</p>
      }

      <div class="actions">
        <a class="btn btn-primary" routerLink="/orders">
          <mat-icon>receipt</mat-icon>
          View my orders
        </a>

        <a class="btn btn-outline" routerLink="/products">
          <mat-icon>shopping_bag</mat-icon>
          Continue shopping
        </a>
      </div>
    </div>
  `,
  styles: `
    .confirmation {
      text-align: center;
      padding: 32px 16px;
    }

    .check-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: var(--app-primary);
      margin-bottom: 16px;
    }

    .confirmation h2 {
      color: var(--app-fg);
      margin-bottom: 8px;
    }

    .confirmation p {
      color: var(--app-muted);
      font-size: 0.95rem;
    }

    .order-id {
      font-weight: 700;
      color: var(--app-primary);
      font-size: 1.1rem;
      margin: 8px 0 24px;
    }

    .actions {
      display: flex;
      gap: 8px;
      justify-content: center;
      margin-top: 16px;
    }

    .actions button {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    @media (max-width: 600px) {
      .actions {
        flex-direction: column;
      }

      .actions button {
        width: 100%;
        justify-content: center;
      }
    }
  `,
})
export class ConfirmationStepComponent {
  @Input() orderId: string | null = null;
}
