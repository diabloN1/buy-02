import { TestBed } from "@angular/core/testing";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { provideHttpClient } from "@angular/common/http";
import { provideRouter } from "@angular/router";

import { AuthService } from "./auth.service";
import { TokenStorage } from "./token.storage";
import { AuthResponse, LoginRequest, RegisterRequest, User } from "@core/models/user.model";
import { API } from "@core/config/api.config";

describe("AuthService", () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let tokenStorageSpy: jasmine.SpyObj<TokenStorage>;

  const mockUser: User = {
    id: "user-123",
    email: "test@example.com",
    name: "Test User",
    role: "USER"
  };

  const mockAuthResponse: AuthResponse = {
    accessToken: "jwt-token-123",
    user: mockUser
  };

  beforeEach(() => {
    tokenStorageSpy = jasmine.createSpyObj("TokenStorage", ["getToken", "setToken", "clear"]);

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: TokenStorage, useValue: tokenStorageSpy }
      ]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  describe("login", () => {
    it("should send POST request to /api/v1/auth/login and save token", () => {
      const loginRequest: LoginRequest = {
        email: "test@example.com",
        password: "password123"
      };

      service.login(loginRequest).subscribe((res) => {
        expect(res).toEqual(mockAuthResponse);
        expect(tokenStorageSpy.setToken).toHaveBeenCalledWith("jwt-token-123");
      });

      const req = httpMock.expectOne(API.base + API.auth.login);
      expect(req.request.method).toBe("POST");
      expect(req.request.body).toEqual(loginRequest);

      req.flush(mockAuthResponse);
    });
  });

  describe("register", () => {
    it("should send POST request to /api/v1/auth/register and save token", () => {
      const registerRequest: RegisterRequest = {
        name: "Test User",
        email: "test@example.com",
        password: "password123",
        role: "SELLER"
      };

      const sellerResponse: AuthResponse = {
        accessToken: "jwt-seller-token",
        user: { ...mockUser, role: "SELLER" }
      };

      service.register(registerRequest).subscribe((res) => {
        expect(res).toEqual(sellerResponse);
        expect(tokenStorageSpy.setToken).toHaveBeenCalledWith("jwt-seller-token");
      });

      const req = httpMock.expectOne(API.base + API.auth.register);
      expect(req.request.method).toBe("POST");
      expect(req.request.body).toEqual(registerRequest);

      req.flush(sellerResponse);
    });
  });

  describe("logout", () => {
    it("should send POST request to /api/v1/auth/logout and clear storage", () => {
      service.logout().subscribe(() => {
        expect(tokenStorageSpy.clear).toHaveBeenCalled();
      });

      const req = httpMock.expectOne(API.base + API.auth.logout);
      expect(req.request.method).toBe("POST");
      req.flush(null);
    });
  });
});
