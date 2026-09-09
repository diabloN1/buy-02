import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { provideRouter } from "@angular/router";
import { signal } from "@angular/core";

import { AppComponent } from "./app.component";
import { ThemeService } from "@core/services/theme.service";
import { AuthService } from "@core/services/auth.service";
import { CurrentUserService } from "@core/services/current-user.service";

describe("AppComponent", () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let themeServiceSpy: jasmine.SpyObj<ThemeService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let currentUserServiceSpy: jasmine.SpyObj<CurrentUserService>;

  beforeEach(async () => {
    themeServiceSpy = jasmine.createSpyObj("ThemeService", ["init", "toggle", "set"], {
      mode: signal("dark" as const)
    });

    authServiceSpy = jasmine.createSpyObj("AuthService", ["logout"], {
      isAuthenticated: signal(true),
      role: signal("USER" as const),
      userId: signal("1"),
      isAdmin: signal(false),
      isSeller: signal(false)
    });

    currentUserServiceSpy = jasmine.createSpyObj("CurrentUserService", ["clear", "load"], {
      user: signal({ id: "1", role: "USER", name: "User", email: "user@test.com" })
    });

    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ThemeService, useValue: themeServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: CurrentUserService, useValue: currentUserServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create the app and initialize theme", () => {
    expect(component).toBeTruthy();
    expect(themeServiceSpy.init).toHaveBeenCalled();
  });
});
