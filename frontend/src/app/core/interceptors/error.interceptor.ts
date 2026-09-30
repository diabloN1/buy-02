import { HttpErrorResponse, HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { Router } from "@angular/router";
import { catchError, throwError } from "rxjs";
import { AuthService } from "@core/services/auth.service";
import { NotificationService } from "@core/services/notification.service";

export interface ApiErrorResponse {
  code?: string;
  message?: string;
  details?: any;
  timestamp?: string;
}

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const notify = inject(NotificationService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      const errorBody: ApiErrorResponse | null =
        err.error && typeof err.error === "object" ? err.error : null;
      const backendMsg = errorBody?.message;

      if (err.status === 0) {
        notify.error("Network error. Please check your connection.");
      } else if (err.status === 401) {
        if (!req.url.includes("/users/auth/login")) {
          notify.error(backendMsg || "Session expired or invalid token. Please log in.");
        }
      } else if (err.status === 403) {
        notify.error(backendMsg || "You do not have permission to perform this action.");
      } else if (err.status === 404) {
        notify.error(backendMsg || "Requested resource not found.");
      } else if (err.status === 409) {
        notify.error(backendMsg || "Resource conflict occurred.");
      } else if (err.status === 429) {
        notify.error(backendMsg || "Too many requests. Please slow down and try again later.");
      } else if (err.status >= 500) {
        notify.error(backendMsg || "Server error. Please try again later.");
      } else if (err.status === 400) {
        if (
          backendMsg &&
          (!errorBody?.details ||
            typeof errorBody.details !== "object" ||
            Object.keys(errorBody.details).length === 0)
        ) {
          notify.error(backendMsg);
        }
      } else {
        const msg = backendMsg || err.message;
        if (msg) notify.error(msg);
      }

      return throwError(() => err);
    })
  );
};
