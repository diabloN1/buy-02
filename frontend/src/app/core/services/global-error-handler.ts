import { ErrorHandler, Injectable, inject } from '@angular/core';
import { NotificationService } from './notification.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private readonly notify = inject(NotificationService);
  handleError(error: Error): void {
    console.error('[GlobalError]', error);
    const msg = error && error.message ? error.message : 'Unexpected error';
    this.notify.error(msg);
  }
}
