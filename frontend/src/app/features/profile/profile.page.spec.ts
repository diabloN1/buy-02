import { ComponentFixture, TestBed } from "@angular/core/testing";
import { of } from "rxjs";

import { ProfilePage } from "./profile.page";
import { ProfileService } from "@core/services/profile.service";
import { NotificationService } from "@core/services/notification.service";
import { MediaService } from "@core/services/media.service";
import { CurrentUserService } from "@core/services/current-user.service";

describe("ProfilePage", () => {
  let component: ProfilePage;
  let fixture: ComponentFixture<ProfilePage>;
  let profileSvcSpy: jasmine.SpyObj<ProfileService>;
  let notifySpy: jasmine.SpyObj<NotificationService>;
  let mediaSvcSpy: jasmine.SpyObj<MediaService>;
  let currentUserSpy: jasmine.SpyObj<CurrentUserService>;

  const mockUser = {
    id: "u1",
    email: "user@example.com",
    name: "User Name",
    role: "USER" as const,
    avatar: { id: "a1", url: "http://example.com/avatar.jpg" }
  };

  beforeEach(async () => {
    profileSvcSpy = jasmine.createSpyObj("ProfileService", ["me", "update", "uploadAvatar"]);
    notifySpy = jasmine.createSpyObj("NotificationService", ["success", "error"]);
    mediaSvcSpy = jasmine.createSpyObj("MediaService", ["deleteAvatar"]);
    currentUserSpy = jasmine.createSpyObj("CurrentUserService", ["load"]);

    profileSvcSpy.me.and.returnValue(of(mockUser as any));

    await TestBed.configureTestingModule({
      imports: [ProfilePage],
      providers: [
        { provide: ProfileService, useValue: profileSvcSpy },
        { provide: NotificationService, useValue: notifySpy },
        { provide: MediaService, useValue: mediaSvcSpy },
        { provide: CurrentUserService, useValue: currentUserSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProfilePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should load user profile details on init", () => {
    expect(component).toBeTruthy();
    expect(profileSvcSpy.me).toHaveBeenCalled();
    expect(component.form.controls.name.value).toBe("User Name");
    expect(component.form.controls.email.value).toBe("user@example.com");
    expect(component.avatarUrl()).toBe("http://example.com/avatar.jpg");
    expect(component.loading()).toBeFalse();
  });

  it("should update profile when form is saved", () => {
    profileSvcSpy.update.and.returnValue(of({ ...mockUser, name: "New Name" } as any));
    component.form.controls.name.setValue("New Name");

    component.save();

    expect(profileSvcSpy.update).toHaveBeenCalledWith({ name: "New Name", email: "user@example.com" });
    expect(notifySpy.success).toHaveBeenCalledWith("Profile saved");
    expect(component.saving()).toBeFalse();
  });

  it("should delete avatar when deleteAvatar is called", () => {
    mediaSvcSpy.deleteAvatar.and.returnValue(of(1));
    component.deleteAvatar();

    expect(mediaSvcSpy.deleteAvatar).toHaveBeenCalledWith("a1");
    expect(component.avatarId()).toBeUndefined();
    expect(component.avatarUrl()).toBeUndefined();
    expect(notifySpy.success).toHaveBeenCalledWith("Avatar removed");
  });
});
