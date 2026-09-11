import { TestBed } from "@angular/core/testing";
import { DomSanitizer } from "@angular/platform-browser";
import { SafeUrlPipe } from "./safe-url.pipe";

describe("SafeUrlPipe", () => {
  let pipe: SafeUrlPipe;
  let sanitizer: DomSanitizer;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SafeUrlPipe]
    });

    pipe = TestBed.inject(SafeUrlPipe);
    sanitizer = TestBed.inject(DomSanitizer);
  });

  it("should return empty string if url is null or undefined or empty", () => {
    expect(pipe.transform(null)).toBe("");
    expect(pipe.transform(undefined)).toBe("");
    expect(pipe.transform("")).toBe("");
  });

  it("should bypass security trust for valid URL string", () => {
    const result = pipe.transform("blob:http://localhost/12345");
    expect(result).toBeTruthy();
  });
});
