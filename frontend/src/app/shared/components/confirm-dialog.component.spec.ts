import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";

import { ConfirmDialogComponent, ConfirmData } from "./confirm-dialog.component";

describe("ConfirmDialogComponent", () => {
  let component: ConfirmDialogComponent;
  let fixture: ComponentFixture<ConfirmDialogComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<ConfirmDialogComponent>>;

  const mockData: ConfirmData = {
    title: "Delete Item",
    message: "Are you sure you want to delete this?",
    confirmLabel: "Yes, Delete",
    cancelLabel: "No, Keep",
    danger: true
  };

  beforeEach(async () => {
    dialogRefSpy = jasmine.createSpyObj("MatDialogRef", ["close"]);

    await TestBed.configureTestingModule({
      imports: [ConfirmDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: mockData }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create component and render title & message", () => {
    expect(component).toBeTruthy();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector("h2")?.textContent).toContain("Delete Item");
    expect(compiled.querySelector("mat-dialog-content")?.textContent).toContain("Are you sure you want to delete this?");
  });

  it("should close dialog with false on cancel click", () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const buttons = compiled.querySelectorAll("button");
    buttons[0].click();

    expect(dialogRefSpy.close).toHaveBeenCalledWith(false);
  });

  it("should close dialog with true on confirm click", () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const buttons = compiled.querySelectorAll("button");
    buttons[1].click();

    expect(dialogRefSpy.close).toHaveBeenCalledWith(true);
  });
});
