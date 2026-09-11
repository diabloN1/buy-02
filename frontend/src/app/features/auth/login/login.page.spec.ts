import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter, Router } from "@angular/router";
import { of } from "rxjs";

import { LoginPage } from "./login.page";
import { AuthService } from "@core/services/auth.service";
import { NotificationService } from "@core/services/notification.service";
import { AuthResponse } from "@core/models/user.model";

describe("LoginPage", () => {
  let component: LoginPage;
  let fixture: ComponentFixture<LoginPage>;
  let authSvcSpy: jasmine.SpyObj<AuthService>;
  let notifySpy: jasmine.SpyObj<NotificationService>;
  let routerSpy: jasmine.SpyObj<Router>;

  const mockResponse: AuthResponse = {
    accessToken: "token-123",
    user: { id: "u1", email: "user@example.com", name: "User One", role: "USER" }
  };

  beforeEach(async () => {
    authSvcSpy = jasmine.createSpyObj("AuthService", ["login"]);
    notifySpy = jasmine.createSpyObj("NotificationService", ["success", "error"]);

    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authSvcSpy },
        { provide: NotificationService, useValue: notifySpy }
      ]
    }).compileComponents();

    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    spyOn(routerSpy, "navigateByUrl");

    fixture = TestBed.createComponent(LoginPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should initialize with empty invalid form", () => {
    expect(component).toBeTruthy();
    expect(component.form.invalid).toBeTrue();
  });

  it("should login successfully and navigate", () => {
    authSvcSpy.login.and.returnValue(of(mockResponse));
    component.form.setValue({
      email: "user@example.com",
      password: "password123"
    });

    component.submit();

    expect(authSvcSpy.login).toHaveBeenCalledWith({ email: "user@example.com", password: "password123" });
    expect(notifySpy.success).toHaveBeenCalledWith("Welcome back!");
    expect(routerSpy.navigateByUrl).toHaveBeenCalledWith("/");
  });
});
