import { TestBed } from "@angular/core/testing";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { provideHttpClient } from "@angular/common/http";

import { UserService } from "./user.service";
import { API } from "@core/config/api.config";
import { User } from "@core/models/user.model";
import { Paginated } from "@core/models/paginated.model";

describe("UserService", () => {
  let service: UserService;
  let httpMock: HttpTestingController;

  const mockUser: User = {
    id: "user-123",
    email: "test@example.com",
    name: "Test User",
    role: "USER",
  };

  const mockUserWidget = {
    id: "user-456",
    name: "Widget User",
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [UserService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  describe("list", () => {
    it("should return paginated list of users", () => {
      const mockResponse: Paginated<User> = {
        content: [mockUser],
        totalPages: 1,
        totalElements: 1,
        size: 10,
        number: 0,
      };

      service.list().subscribe((res) => {
        expect(res).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(
        (request) =>
          request.url === API.base + API.users.root &&
          request.params.get("page") === "0" &&
          request.params.get("size") === "10"
      );
      expect(req.request.method).toBe("GET");
      req.flush(mockResponse);
    });

    it("should send correct pagination params", () => {
      const mockResponse: Paginated<User> = {
        content: [],
        totalPages: 0,
        totalElements: 0,
        size: 5,
        number: 1,
      };

      service.list(2, 5).subscribe();

      const req = httpMock.expectOne(
        (request) =>
          request.url === API.base + API.users.root &&
          request.params.get("page") === "1" &&
          request.params.get("size") === "5"
      );
      expect(req.request.method).toBe("GET");
      req.flush(mockResponse);
    });
  });

  describe("get", () => {
    it("should return user by id", () => {
      const userId = "user-123";

      service.get(userId).subscribe((res) => {
        expect(res).toEqual(mockUser);
      });

      const req = httpMock.expectOne(API.base + API.users.byId(userId));
      expect(req.request.method).toBe("GET");
      req.flush(mockUser);
    });
  });

  describe("getWidget", () => {
    it("should return user widget by id", () => {
      const userId = "user-456";

      service.getWidget(userId).subscribe((res) => {
        expect(res).toEqual(mockUserWidget);
      });

      const req = httpMock.expectOne(API.base + API.users.widgetbyId(userId));
      expect(req.request.method).toBe("GET");
      req.flush(mockUserWidget);
    });
  });

  describe("delete", () => {
    it("should delete user by id", () => {
      const userId = "user-123";

      service.delete(userId).subscribe((res) => {
        expect(res).toBeNull();
      });

      const req = httpMock.expectOne(API.base + API.users.byId(userId));
      expect(req.request.method).toBe("DELETE");
      req.flush(null);
    });
  });

  describe("count", () => {
    it("should return user count", () => {
      const mockCount = 42;

      service.count().subscribe((res) => {
        expect(res).toBe(mockCount);
      });

      const req = httpMock.expectOne(API.base + API.users.count);
      expect(req.request.method).toBe("GET");
      req.flush(mockCount);
    });
  });

  describe("me", () => {
    it("should return current user profile", () => {
      service.me().subscribe((res) => {
        expect(res).toEqual(mockUser);
      });

      const req = httpMock.expectOne(API.base + API.profile.me);
      expect(req.request.method).toBe("GET");
      req.flush(mockUser);
    });
  });
});