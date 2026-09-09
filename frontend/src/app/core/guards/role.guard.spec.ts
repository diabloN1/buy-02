import { TestBed } from "@angular/core/testing";
import { Router } from "@angular/router";
import { signal } from "@angular/core";

import { roleGuard } from "./role.guard";
import { AuthService } from "@core/services/auth.service";
import { NotificationService } from "@core/services/notification.service";
import { UserRole } from "@core/models/user.model";

describe("roleGuard", () => {
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let notificationSpy: jasmine.SpyObj<NotificationService>;
  let roleSignal = signal<UserRole | null>("ADMIN");

  beforeEach(() => {
    roleSignal.set("ADMIN");
    authServiceSpy = jasmine.createSpyObj("AuthService", ["hasRole"], {
      role: roleSignal,
    });
    authServiceSpy.hasRole.and.callFake((roles: UserRole[]) => {
      const r = roleSignal();
      return !!r && roles.includes(r);
    });

    routerSpy = jasmine.createSpyObj("Router", ["parseUrl", "createUrlTree"]);
    routerSpy.createUrlTree.and.returnValue({} as any);
    notificationSpy = jasmine.createSpyObj("NotificationService", ["error"]);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: NotificationService, useValue: notificationSpy },
      ],
    });
  });

  it("should allow access if user has required role", () => {
    const guard = roleGuard(["ADMIN"]);
    const route: any = { data: { roles: ["ADMIN"] } };
    const state: any = { url: "/admin" };

    const result = TestBed.runInInjectionContext(() => guard(route, state));

    expect(result).toBeTrue();
  });

  it("should deny access and redirect if user lacks role", () => {
    roleSignal.set("USER");
    const guard = roleGuard(["ADMIN"]);
    const route: any = { data: { roles: ["ADMIN"] } };
    const state: any = { url: "/admin" };

    TestBed.runInInjectionContext(() => guard(route, state));

    expect(notificationSpy.error).toHaveBeenCalledWith("Access denied.");
    expect(routerSpy.createUrlTree).toHaveBeenCalledWith(["/"]);
  });
});
