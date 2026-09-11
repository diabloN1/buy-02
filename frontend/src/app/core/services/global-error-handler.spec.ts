import { TestBed } from "@angular/core/testing";
import { GlobalErrorHandler } from "./global-error-handler";
import { NotificationService } from "./notification.service";

describe("GlobalErrorHandler", () => {
  let handler: GlobalErrorHandler;
  let notifySpy: jasmine.SpyObj<NotificationService>;

  beforeEach(() => {
    notifySpy = jasmine.createSpyObj("NotificationService", ["error"]);

    TestBed.configureTestingModule({
      providers: [
        GlobalErrorHandler,
        { provide: NotificationService, useValue: notifySpy }
      ]
    });

    handler = TestBed.inject(GlobalErrorHandler);
  });

  it("should handle Error object and notify error message", () => {
    const error = new Error("Something went wrong");
    handler.handleError(error);

    expect(notifySpy.error).toHaveBeenCalledWith("Something went wrong");
  });

  it("should handle non-Error objects and notify generic message", () => {
    handler.handleError("String error");

    expect(notifySpy.error).toHaveBeenCalledWith("Unexpected error");
  });
});
