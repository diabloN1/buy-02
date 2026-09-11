import { ComponentFixture, TestBed } from "@angular/core/testing";
import { EmptyStateComponent } from "./empty-state.component";

describe("EmptyStateComponent", () => {
  let component: EmptyStateComponent;
  let fixture: ComponentFixture<EmptyStateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmptyStateComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(EmptyStateComponent);
    component = fixture.componentInstance;
  });

  it("should render default icon and title", () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector("h3")?.textContent).toContain("Nothing here yet");
  });

  it("should render custom title, description, and action button", () => {
    component.title = "No search results";
    component.description = "Try searching for something else";
    component.actionLabel = "Clear Filter";
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector("h3")?.textContent).toContain("No search results");
    expect(compiled.querySelector("p")?.textContent).toContain("Try searching for something else");
    expect(compiled.querySelector("button")?.textContent).toContain("Clear Filter");
  });

  it("should emit action event when button is clicked", () => {
    component.actionLabel = "Clear Filter";
    fixture.detectChanges();

    spyOn(component.action, "emit");
    const button = fixture.nativeElement.querySelector("button");
    button.click();

    expect(component.action.emit).toHaveBeenCalled();
  });
});
