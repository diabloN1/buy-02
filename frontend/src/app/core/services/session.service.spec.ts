import { TestBed } from "@angular/core/testing";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { provideHttpClient } from "@angular/common/http";
import { of } from "rxjs";

import { SessionService } from "./session.service";
import { AuthService } from "./auth.service";
import { AuthResponse, User } from "@core/models/user.model";

describe("SessionService", () => {
  let service: SessionService;
  let httpMock: HttpTestingController;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  const mockUser: User = {
    id: "u-1",
    email: "user@example.com",
    name: "User One",
    role: "USER"
  };

  const mockAuthResponse: AuthResponse = {
    accessToken: "refreshed-jwt",
    user: mockUser
  };

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj("AuthService", ["refresh", "token", "clearSession"]);

    TestBed.configureTestingModule({
      providers: [
        SessionService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authServiceSpy }
      ]
    });

    service = TestBed.inject(SessionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it("should initialize session when no token present", (done) => {
    authServiceSpy.token.and.returnValue(null);

    service.initialize().subscribe((res) => {
      expect(res).toBeUndefined();
      done();
    });
  });
});
