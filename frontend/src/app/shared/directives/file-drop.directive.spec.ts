import { Component } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FileDropDirective } from "./file-drop.directive";

@Component({
  standalone: true,
  imports: [FileDropDirective],
  template: `<div appFileDrop (filesDropped)="onFiles($event)">Drop here</div>`
})
class TestHostComponent {
  files: FileList | null = null;
  onFiles(files: FileList) {
    this.files = files;
  }
}

describe("FileDropDirective", () => {
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
  });

  it("should create host component with directive", () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
