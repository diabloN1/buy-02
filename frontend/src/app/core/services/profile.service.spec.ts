import { TestBed } from "@angular/core/testing";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { provideHttpClient } from "@angular/common/http";

import { ProfileService } from "./profile.service";
import { User } from "@core/models/user.model";
import { API } from "@core/config/api.config";

describe("ProfileService", () => {
  let service: ProfileService;
  let httpMock: HttpTestingController;

  const mockUser: User = {
    id: "user-1",
    email: "anasslazaar9@gmail.com",
    name: "Anass Lazaar",
    role: "USER",
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ProfileService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(ProfileService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it("should get current profile (me)", () => {
    service.me().subscribe((u) => {
      expect(u).toEqual(mockUser);
    });

    const req = httpMock.expectOne(API.base + API.profile.me);
    expect(req.request.method).toBe("GET");
    req.flush(mockUser);
  });

  it("should update profile", () => {
    const updatedUser = { ...mockUser, name: "Anass" };

    service.update({ name: "Anass" }).subscribe((u) => {
      expect(u).toEqual(updatedUser);
    });

    const req = httpMock.expectOne(API.base + API.profile.me);
    expect(req.request.method).toBe("PUT");
    expect(req.request.body).toEqual({ name: "Anass" });

    req.flush(updatedUser);
  });
});
