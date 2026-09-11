import { TestBed } from "@angular/core/testing";
import { MatSnackBar } from "@angular/material/snack-bar";
import { NotificationService } from "./notification.service";

describe("NotificationService", () => {
  let service: NotificationService;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;

  beforeEach(() => {
    snackBarSpy = jasmine.createSpyObj("MatSnackBar", ["open"]);

    TestBed.configureTestingModule({
      providers: [
        NotificationService,
        { provide: MatSnackBar, useValue: snackBarSpy }
      ]
    });

    service = TestBed.inject(NotificationService);
  });

  it("should show success snackbar", () => {
    service.success("Saved successfully");
    expect(snackBarSpy.open).toHaveBeenCalledWith("Saved successfully", "OK", {
      duration: 3000,
      panelClass: "snack-success"
    });
  });

  it("should show error snackbar", () => {
    service.error("Operation failed");
    expect(snackBarSpy.open).toHaveBeenCalledWith("Operation failed", "Close", {
      duration: 5000,
      panelClass: "snack-error"
    });
  });

  it("should show info snackbar", () => {
    service.info("Information message");
    expect(snackBarSpy.open).toHaveBeenCalledWith("Information message", "OK", {
      duration: 3000
    });
  });
});
