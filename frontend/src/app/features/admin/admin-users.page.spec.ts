import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MatDialog } from "@angular/material/dialog";
import { of } from "rxjs";

import { AdminUsersPage } from "./admin-users.page";
import { UserService } from "@core/services/user.service";
import { NotificationService } from "@core/services/notification.service";
import { Paginated } from "@core/models/paginated.model";
import { User } from "@core/models/user.model";

describe("AdminUsersPage", () => {
  let component: AdminUsersPage;
  let fixture: ComponentFixture<AdminUsersPage>;
  let userSvcSpy: jasmine.SpyObj<UserService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let notifySpy: jasmine.SpyObj<NotificationService>;

  const mockPaginated: Paginated<User> = {
    content: [
      { id: "u1", email: "user@example.com", name: "User One", role: "USER" }
    ],
    number: 0,
    size: 10,
    totalElements: 1,
    totalPages: 1
  };

  beforeEach(async () => {
    userSvcSpy = jasmine.createSpyObj("UserService", ["list", "delete"]);
    dialogSpy = jasmine.createSpyObj("MatDialog", ["open"]);
    notifySpy = jasmine.createSpyObj("NotificationService", ["success"]);

    userSvcSpy.list.and.returnValue(of(mockPaginated));

    await TestBed.configureTestingModule({
      imports: [AdminUsersPage],
      providers: [
        { provide: UserService, useValue: userSvcSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: NotificationService, useValue: notifySpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminUsersPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should load users on init", () => {
    expect(component).toBeTruthy();
    expect(userSvcSpy.list).toHaveBeenCalledWith(1, 10);
    expect(component.items().length).toBe(1);
    expect(component.loading()).toBeFalse();
  });
});
