import { TestBed } from "@angular/core/testing";
import { TokenStorage } from "./token.storage";
import { STORAGE_KEYS } from "@core/constants/storage.keys";

describe("TokenStorage", () => {
  let service: TokenStorage;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TokenStorage]
    });
    service = TestBed.inject(TokenStorage);
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should store and retrieve token", () => {
    service.setToken("my-test-token");
    expect(service.getToken()).toBe("my-test-token");
    expect(localStorage.getItem(STORAGE_KEYS.token)).toBe("my-test-token");
  });

  it("should clear token from localStorage", () => {
    service.setToken("token-to-delete");
    service.clear();
    expect(service.getToken()).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.token)).toBeNull();
  });
});
