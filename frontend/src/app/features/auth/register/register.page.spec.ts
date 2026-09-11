import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter, Router } from "@angular/router";
import { of } from "rxjs";

import { RegisterPage } from "./register.page";
import { AuthService } from "@core/services/auth.service";
import { NotificationService } from "@core/services/notification.service";
import { AuthResponse } from "@core/models/user.model";

describe("RegisterPage", () => {
  let component: RegisterPage;
  let fixture: ComponentFixture<RegisterPage>;
  let authSvcSpy: jasmine.SpyObj<AuthService>;
  let notifySpy: jasmine.SpyObj<NotificationService>;
  let routerSpy: jasmine.SpyObj<Router>;

  const mockResponse: AuthResponse = {
    accessToken: "reg-token",
    user: { id: "u1", email: "user@example.com", name: "User One", role: "USER" }
  };

  beforeEach(async () => {
    authSvcSpy = jasmine.createSpyObj("AuthService", ["register"]);
    notifySpy = jasmine.createSpyObj("NotificationService", ["error"]);

    await TestBed.configureTestingModule({
      imports: [RegisterPage],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authSvcSpy },
        { provide: NotificationService, useValue: notifySpy }
      ]
    }).compileComponents();

    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    spyOn(routerSpy, "navigateByUrl");

    fixture = TestBed.createComponent(RegisterPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should initialize with empty invalid form", () => {
    expect(component).toBeTruthy();
    expect(component.form.invalid).toBeTrue();
  });
});
