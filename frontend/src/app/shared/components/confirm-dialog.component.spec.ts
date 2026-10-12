import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";

import {
  ConfirmDialogComponent,
  ConfirmData,
} from "./confirm-dialog.component";

describe("ConfirmDialogComponent", () => {
  let component: ConfirmDialogComponent;
  let fixture: ComponentFixture<ConfirmDialogComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<ConfirmDialogComponent>>;

  const mockData: ConfirmData = {
    title: "Delete Item",
    message: "Are you sure you want to delete this?",
    confirmLabel: "Yes, Delete",
    cancelLabel: "No, Keep",
    danger: true,
  };

  async function setup(data: ConfirmData): Promise<void> {
    dialogRefSpy = jasmine.createSpyObj("MatDialogRef", ["close"]);

    await TestBed.configureTestingModule({
      imports: [ConfirmDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: data },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  const el = (): HTMLElement => fixture.nativeElement as HTMLElement;

  describe("with custom data", () => {
    beforeEach(async () => {
      await setup(mockData);
    });

    it("should create component and render title & message", () => {
      expect(component).toBeTruthy();
      expect(el().querySelector(".dialog-title")?.textContent).toContain(
        "Delete Item",
      );
      expect(el().querySelector(".dialog-message")?.textContent).toContain(
        "Are you sure you want to delete this?",
      );
    });

    it("should render custom button labels", () => {
      const buttons = el().querySelectorAll("button");

      expect(buttons[0].textContent?.trim()).toBe("No, Keep");
      expect(buttons[1].textContent?.trim()).toBe("Yes, Delete");
    });

    it("should use the danger style when danger is true", () => {
      const confirm = el().querySelectorAll("button")[1];

      expect(confirm.classList).toContain("btn-danger");
      expect(confirm.classList).not.toContain("btn-primary");
    });

    it("should close dialog with false on cancel click", () => {
      el().querySelectorAll("button")[0].click();

      expect(dialogRefSpy.close).toHaveBeenCalledWith(false);
    });

    it("should close dialog with true on confirm click", () => {
      el().querySelectorAll("button")[1].click();

      expect(dialogRefSpy.close).toHaveBeenCalledWith(true);
    });
  });

  describe("with default labels", () => {
    beforeEach(async () => {
      await setup({ title: "Title", message: "Message" });
    });

    it("should fall back to Cancel and Confirm labels", () => {
      const buttons = el().querySelectorAll("button");

      expect(buttons[0].textContent?.trim()).toBe("Cancel");
      expect(buttons[1].textContent?.trim()).toBe("Confirm");
    });

    it("should use the primary style when danger is not set", () => {
      const confirm = el().querySelectorAll("button")[1];

      expect(confirm.classList).toContain("btn-primary");
      expect(confirm.classList).not.toContain("btn-danger");
    });
  });
});
