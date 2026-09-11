import { TestBed } from "@angular/core/testing";
import { ThemeService } from "./theme.service";
import { STORAGE_KEYS } from "@core/constants/storage.keys";

describe("ThemeService", () => {
  let service: ThemeService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ThemeService]
    });
    service = TestBed.inject(ThemeService);
    localStorage.clear();
    document.body.classList.remove("dark-theme");
  });

  afterEach(() => {
    localStorage.clear();
    document.body.classList.remove("dark-theme");
  });

  it("should initialize default light theme", () => {
    service.init();
    expect(service.mode()).toBe("light");
    expect(document.body.classList.contains("dark-theme")).toBeFalse();
  });

  it("should initialize saved dark theme from localStorage", () => {
    localStorage.setItem(STORAGE_KEYS.theme, "dark");
    service.init();
    expect(service.mode()).toBe("dark");
    expect(document.body.classList.contains("dark-theme")).toBeTrue();
  });

  it("should toggle theme mode", () => {
    service.set("light");
    service.toggle();
    expect(service.mode()).toBe("dark");
    expect(document.body.classList.contains("dark-theme")).toBeTrue();

    service.toggle();
    expect(service.mode()).toBe("light");
    expect(document.body.classList.contains("dark-theme")).toBeFalse();
  });
});
