import { TestBed } from "@angular/core/testing";
import { of, throwError, NEVER } from "rxjs";
import { delay } from "rxjs/operators";

import { CurrentUserService } from "./current-user.service";
import { User } from "@core/models/user.model";
import { UserService } from "./user.service";

describe("CurrentUserService", () => {
  let service: CurrentUserService;
  let userServiceSpy: jasmine.SpyObj<UserService>;

  const mockUser: User = {
    id: "user-123",
    email: "test@example.com",
    name: "Test User",
    role: "USER",
  };

  beforeEach(() => {
    userServiceSpy = jasmine.createSpyObj("UserService", ["me"]);

    TestBed.configureTestingModule({
      providers: [
        CurrentUserService,
         { provide: UserService, useValue: userServiceSpy }
        ],
    });

    service = TestBed.inject(CurrentUserService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  describe("load", () => {
    it("should not call userService.me when already loading", () => {
      userServiceSpy.me.and.returnValue(NEVER);

      service.load();
      service.load();

      expect(userServiceSpy.me).toHaveBeenCalledTimes(1);
    });

    it("should call userService.me when force=true even if user is already loaded", () => {
      userServiceSpy.me.and.returnValue(of(mockUser));

      service.load();
      service.refresh();

      expect(userServiceSpy.me).toHaveBeenCalledTimes(2);
    });
  });

  describe("clear", () => {
    it("should set user to null", () => {
      userServiceSpy.me.and.returnValue(of(mockUser));

      service.load();
      expect(service.user()).toEqual(mockUser);

      service.clear();
      expect(service.user()).toBeNull();
    });
  });
});