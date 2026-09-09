import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ImagePreviewComponent } from "./image-preview.component";

describe("ImagePreviewComponent", () => {
  let component: ImagePreviewComponent;
  let fixture: ComponentFixture<ImagePreviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImagePreviewComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ImagePreviewComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("open", true);
    fixture.componentRef.setInput("imageUrl", "http://example.com/test.jpg");
    fixture.detectChanges();
  });

  it("should create and bind input signals", () => {
    expect(component).toBeTruthy();
    expect(component.open()).toBeTrue();
    expect(component.imageUrl()).toBe("http://example.com/test.jpg");
  });
});
