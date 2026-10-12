import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export interface ConfirmData { title: string; message: string; confirmLabel?: string; cancelLabel?: string; danger?: boolean; }

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="confirm-dialog-content">
      <h2 class="dialog-title">{{ data.title }}</h2>
      <p class="dialog-message">{{ data.message }}</p>
      <div class="dialog-actions">
        <button type="button" class="btn btn-outline" (click)="ref.close(false)">
          {{ data.cancelLabel || 'Cancel' }}
        </button>
        <button
          type="button"
          class="btn"
          [class.btn-danger]="data.danger"
          [class.btn-primary]="!data.danger"
          (click)="ref.close(true)"
        >
          {{ data.confirmLabel || 'Confirm' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .confirm-dialog-content {
      padding: 24px;
      background: var(--app-surface);
      color: var(--app-fg);
      border-radius: var(--app-radius);
    }
    .dialog-title {
      font-size: 1.15rem;
      font-weight: 700;
      margin: 0 0 8px;
      color: var(--app-fg-heading);
      letter-spacing: -0.015em;
    }
    .dialog-message {
      font-size: 14px;
      color: var(--app-muted);
      line-height: 1.5;
      margin: 0 0 24px;
    }
    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }
    .btn-danger {
      background: var(--app-danger);
      color: #ffffff !important;
      border: none;
    }
    .btn-danger:hover {
      opacity: 0.9;
    }
  `],
})
export class ConfirmDialogComponent {
  readonly ref = inject(MatDialogRef<ConfirmDialogComponent>);
  readonly data = inject<ConfirmData>(MAT_DIALOG_DATA);
}
