import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { MatDialog } from "@angular/material/dialog";
import { of } from "rxjs";
import { signal } from "@angular/core";

import { MediaManagementPage } from "./media-management.page";
import { MediaService } from "@core/services/media.service";
import { NotificationService } from "@core/services/notification.service";
import { CurrentUserService } from "@core/services/current-user.service";
import { Paginated } from "@core/models/paginated.model";
import { MediaImage } from "@core/models/media.model";

describe("MediaManagementPage", () => {
  let component: MediaManagementPage;
  let fixture: ComponentFixture<MediaManagementPage>;
  let mediaSvcSpy: jasmine.SpyObj<MediaService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let notifySpy: jasmine.SpyObj<NotificationService>;
  let currentUserSpy: jasmine.SpyObj<CurrentUserService>;

  const mockPaginated: Paginated<MediaImage> = {
    content: [{ id: "m1", url: "http://example.com/m1.png", contentType: "image/png", size: 500, userId: "u1", productId: "p1" }],
    number: 0,
    size: 12,
    totalElements: 1,
    totalPages: 1
  };

  beforeEach(async () => {
    mediaSvcSpy = jasmine.createSpyObj("MediaService", ["getMediaByUser", "getImageUrl", "deleteMedia"]);
    dialogSpy = jasmine.createSpyObj("MatDialog", ["open"]);
    notifySpy = jasmine.createSpyObj("NotificationService", ["success", "error"]);
    currentUserSpy = jasmine.createSpyObj("CurrentUserService", ["clear"], {
      user: signal({ id: "u1", email: "user@test.com", name: "User 1", role: "USER" })
    });

    mediaSvcSpy.getMediaByUser.and.returnValue(of(mockPaginated));
    mediaSvcSpy.getImageUrl.and.returnValue("http://example.com/m1");

    await TestBed.configureTestingModule({
      imports: [MediaManagementPage],
      providers: [
        provideRouter([]),
        { provide: MediaService, useValue: mediaSvcSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: NotificationService, useValue: notifySpy },
        { provide: CurrentUserService, useValue: currentUserSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MediaManagementPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should load user media on init", () => {
    expect(component).toBeTruthy();
    expect(mediaSvcSpy.getMediaByUser).toHaveBeenCalledWith("u1", 0, 12);
    expect(component.items().length).toBe(1);
    expect(component.loading()).toBeFalse();
  });
});
