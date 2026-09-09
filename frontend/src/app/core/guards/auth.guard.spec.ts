import { TestBed } from "@angular/core/testing";
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from "@angular/router";

import { authGuard } from "./auth.guard";
import { AuthService } from "@core/services/auth.service";

describe("authGuard", () => {
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  const dummyRoute = {} as ActivatedRouteSnapshot;
  const dummyState = { url: "/protected/page" } as RouterStateSnapshot;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj("AuthService", ["isAuthenticated"]);
    routerSpy = jasmine.createSpyObj("Router", ["createUrlTree"]);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });
  });

  it("should allow navigation if user is authenticated", () => {
    authServiceSpy.isAuthenticated.and.returnValue(true);

    const result = TestBed.runInInjectionContext(() => authGuard(dummyRoute, dummyState));

    expect(result).toBeTrue();
  });

  it("should redirect to /auth/login with returnUrl if unauthenticated", () => {
    authServiceSpy.isAuthenticated.and.returnValue(false);
    const mockUrlTree = {} as UrlTree;
    routerSpy.createUrlTree.and.returnValue(mockUrlTree);

    const result = TestBed.runInInjectionContext(() => authGuard(dummyRoute, dummyState));

    expect(result).toBe(mockUrlTree);
    expect(routerSpy.createUrlTree).toHaveBeenCalledWith(["/auth/login"], {
      queryParams: { returnUrl: "/protected/page" }
    });
  });
});
