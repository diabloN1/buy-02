import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { provideRouter } from "@angular/router";
import { of } from "rxjs";

import { AdminDashboardPage } from "./admin-dashboard.page";
import { UserService } from "@core/services/user.service";
import { ProductService } from "@core/services/product.service";
import { MediaService } from "@core/services/media.service";

describe("AdminDashboardPage", () => {
  let component: AdminDashboardPage;
  let fixture: ComponentFixture<AdminDashboardPage>;
  let userSvcSpy: jasmine.SpyObj<UserService>;
  let productSvcSpy: jasmine.SpyObj<ProductService>;
  let mediaSvcSpy: jasmine.SpyObj<MediaService>;

  beforeEach(async () => {
    userSvcSpy = jasmine.createSpyObj("UserService", ["count"]);
    productSvcSpy = jasmine.createSpyObj("ProductService", ["count"]);
    mediaSvcSpy = jasmine.createSpyObj("MediaService", ["count"]);

    userSvcSpy.count.and.returnValue(of(10));
    productSvcSpy.count.and.returnValue(of(25));
    mediaSvcSpy.count.and.returnValue(of(50));

    await TestBed.configureTestingModule({
      imports: [AdminDashboardPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: UserService, useValue: userSvcSpy },
        { provide: ProductService, useValue: productSvcSpy },
        { provide: MediaService, useValue: mediaSvcSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminDashboardPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should load aggregated dashboard counts on init", () => {
    expect(component).toBeTruthy();
    expect(userSvcSpy.count).toHaveBeenCalled();
    expect(productSvcSpy.count).toHaveBeenCalled();
    expect(mediaSvcSpy.count).toHaveBeenCalled();
    expect(component.totalUsers()).toBe(10);
    expect(component.totalProducts()).toBe(25);
    expect(component.totalImages()).toBe(50);
    expect(component.loading()).toBeFalse();
  });
});
