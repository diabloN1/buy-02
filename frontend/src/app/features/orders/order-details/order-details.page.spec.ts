import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ActivatedRoute } from "@angular/router";
import { MatDialog } from "@angular/material/dialog";
import { of, throwError } from "rxjs";

import { OrderDetailsPage } from "./order-details.page";
import { OrderService } from "@core/services/order.service";
import { SubOrderService } from "@core/services/suborder.service";
import { NotificationService } from "@core/services/notification.service";
import {
  Order,
  OrderStatus,
} from "@core/models/order.model";

describe("OrderDetailsPage", () => {
  let component: OrderDetailsPage;
  let fixture: ComponentFixture<OrderDetailsPage>;

  let orderSvc: jasmine.SpyObj<OrderService>;
  let subOrderSvc: jasmine.SpyObj<SubOrderService>;
  let notify: jasmine.SpyObj<NotificationService>;
  let dialog: jasmine.SpyObj<MatDialog>;

  let routeData: {
    snapshot: {
      paramMap: {
        get: jasmine.Spy;
      };
    };
  };

  const order: Order = {
    id: "order-1",
    userId: "user-1",
    totalAmount: 150,
    shippingAddress: {
      street: "123 Street",
      city: "Oujda",
      state: "Oriental",
      zipCode: "60000",
      country: "Morocco",
      phone: "0600000000",
    },
    paymentMethod: "PAY_ON_DELIVERY",
    status: "PENDING",
    createdAt: "2026-10-01T10:00:00",
    updatedAt: "2026-10-01T10:00:00",
    subOrders: [
      {
        id: "sub-1",
        orderId: "order-1",
        sellerId: "seller-1",
        totalAmount: 150,
        paymentMethod: "PAY_ON_DELIVERY",
        status: "PENDING",
        statusHistory: [],
        createdAt: "2026-10-01T10:00:00",
        updatedAt: "2026-10-01T10:00:00",
        items: [
          {
            productId: "product-1",
            productName: "Product 1",
            price: 50,
            quantity: 2,
          },
          {
            productId: "product-2",
            productName: "Product 2",
            price: 50,
            quantity: 1,
          },
        ],
      },
    ],
  };

  beforeEach(async () => {
    orderSvc = jasmine.createSpyObj<OrderService>(
      "OrderService",
      [
        "getOrder",
        "cancelOrder",
        "redoOrder",
        "deleteOrder",
        "canCancel",
        "canDelete",
        "getAvailableStatusTransitions",
        "getStatusIcon",
        "getStatusColor",
      ],
    );

    subOrderSvc = jasmine.createSpyObj<SubOrderService>(
      "SubOrderService",
      [
        "getSubOrder",
        "updateStatus",
        "deleteSubOrder",
      ],
    );

    notify = jasmine.createSpyObj<NotificationService>(
      "NotificationService",
      ["success", "error"],
    );

    dialog = jasmine.createSpyObj<MatDialog>(
      "MatDialog",
      ["open"],
    );

    routeData = {
      snapshot: {
        paramMap: {
          get: jasmine.createSpy("get"),
        },
      },
    };

    orderSvc.getOrder.and.returnValue(of(order));
    orderSvc.cancelOrder.and.returnValue(of({}));
    orderSvc.redoOrder.and.returnValue(of({}));
    orderSvc.deleteOrder.and.returnValue(of({}));

    subOrderSvc.getSubOrder.and.returnValue(of(order));
    subOrderSvc.updateStatus.and.returnValue(of({}));
    subOrderSvc.deleteSubOrder.and.returnValue(of({}));

    orderSvc.canCancel.and.returnValue(true);
    orderSvc.canDelete.and.returnValue(false);
    orderSvc.getAvailableStatusTransitions.and.returnValue([
      "CONFIRMED",
    ]);
    orderSvc.getStatusIcon.and.returnValue("check_circle");
    orderSvc.getStatusColor.and.returnValue("primary");

    await TestBed.configureTestingModule({
      imports: [OrderDetailsPage],
      providers: [
        {
          provide: OrderService,
          useValue: orderSvc,
        },
        {
          provide: SubOrderService,
          useValue: subOrderSvc,
        },
        {
          provide: NotificationService,
          useValue: notify,
        },
        {
          provide: ActivatedRoute,
          useValue: routeData,
        },
      ],
    }).compileComponents();

    TestBed.overrideProvider(MatDialog, {
      useValue: dialog,
    });

    fixture = TestBed.createComponent(OrderDetailsPage);
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should resolve buyer order route", () => {
    routeData.snapshot.paramMap.get.and.callFake(
      (key: string) =>
        key === "orderId" ? "order-1" : null,
    );

    component.ngOnInit();

    expect(component.orderId()).toBe("order-1");
    expect(component.isSeller()).toBeFalse();
    expect(orderSvc.getOrder).toHaveBeenCalledWith("order-1");
  });

  it("should resolve seller suborder route", () => {
    routeData.snapshot.paramMap.get.and.callFake(
      (key: string) =>
        key === "subOrderId" ? "sub-1" : null,
    );

    component.ngOnInit();

    expect(component.orderId()).toBe("sub-1");
    expect(component.isSeller()).toBeTrue();
    expect(subOrderSvc.getSubOrder).toHaveBeenCalledWith(
      "sub-1",
    );
  });

  it("should load buyer order", () => {
    component.orderId.set("order-1");
    component.isSeller.set(false);

    component.loadOrder();

    expect(orderSvc.getOrder).toHaveBeenCalledWith("order-1");
    expect(component.order()).toEqual(order);
    expect(component.isLoading()).toBeFalse();
  });

  it("should load seller suborder", () => {
    component.orderId.set("sub-1");
    component.isSeller.set(true);

    component.loadOrder();

    expect(subOrderSvc.getSubOrder).toHaveBeenCalledWith(
      "sub-1",
    );
    expect(component.order()).toEqual(order);
    expect(component.isLoading()).toBeFalse();
  });

  it("should not load when order id is missing", () => {
    component.orderId.set("");

    component.loadOrder();

    expect(component.order()).toBeNull();
    expect(orderSvc.getOrder).not.toHaveBeenCalled();
    expect(subOrderSvc.getSubOrder).not.toHaveBeenCalled();
  });

  it("should handle load error with backend message", () => {
    component.orderId.set("order-1");

    orderSvc.getOrder.and.returnValue(
      throwError(() => ({
        error: {
          message: "Order not found",
        },
      })),
    );

    component.loadOrder();

    expect(component.order()).toBeNull();
    expect(component.isLoading()).toBeFalse();
    expect(notify.error).toHaveBeenCalledWith(
      "Order not found",
    );
  });

  it("should handle load error without backend message", () => {
    component.orderId.set("order-1");

    orderSvc.getOrder.and.returnValue(
      throwError(() => ({})),
    );

    component.loadOrder();

    expect(component.order()).toBeNull();
    expect(component.isLoading()).toBeFalse();
    expect(notify.error).toHaveBeenCalledWith(
      "Failed to load order. Please try again.",
    );
  });

  it("should cancel pending order after confirmation", () => {
    component.order.set({
      ...order,
      status: "PENDING",
    });

    dialog.open.and.returnValue({
      afterClosed: () => of(true),
    } as any);

    spyOn(component, "loadOrder");

    component.cancelOrder("order-1");

    expect(dialog.open).toHaveBeenCalled();
    expect(orderSvc.cancelOrder).toHaveBeenCalledWith(
      "order-1",
    );
    expect(notify.success).toHaveBeenCalledWith(
      "Order cancelled",
    );
    expect(component.loadOrder).toHaveBeenCalled();
  });

  it("should not cancel when confirmation is rejected", () => {
    dialog.open.and.returnValue({
      afterClosed: () => of(false),
    } as any);

    component.cancelOrder("order-1");

    expect(orderSvc.cancelOrder).not.toHaveBeenCalled();
  });

  it("should redo order after confirmation", () => {
    dialog.open.and.returnValue({
      afterClosed: () => of(true),
    } as any);

    spyOn(component, "loadOrder");

    component.redoOrder("order-1");

    expect(orderSvc.redoOrder).toHaveBeenCalledWith(
      "order-1",
    );
    expect(notify.success).toHaveBeenCalledWith(
      "Order redone",
    );
    expect(component.loadOrder).toHaveBeenCalled();
  });

  it("should not redo order when confirmation is rejected", () => {
    dialog.open.and.returnValue({
      afterClosed: () => of(false),
    } as any);

    component.redoOrder("order-1");

    expect(orderSvc.redoOrder).not.toHaveBeenCalled();
  });

  it("should delete order after confirmation", () => {
    dialog.open.and.returnValue({
      afterClosed: () => of(true),
    } as any);

    spyOn(component, "loadOrder");

    component.deleteOrder("order-1");

    expect(orderSvc.deleteOrder).toHaveBeenCalledWith(
      "order-1",
    );
    expect(notify.success).toHaveBeenCalledWith(
      "Order deleted",
    );
    expect(component.loadOrder).toHaveBeenCalled();
  });

  it("should not delete order when confirmation is rejected", () => {
    dialog.open.and.returnValue({
      afterClosed: () => of(false),
    } as any);

    component.deleteOrder("order-1");

    expect(orderSvc.deleteOrder).not.toHaveBeenCalled();
  });

  it("should update suborder status", () => {
    spyOn(component, "loadOrder");

    component.updateSubOrderStatus(
      "sub-1",
      "CONFIRMED",
    );

    expect(subOrderSvc.updateStatus).toHaveBeenCalledWith(
      "sub-1",
      "CONFIRMED",
    );

    expect(notify.success).toHaveBeenCalledWith(
      "Status updated to CONFIRMED",
    );

    expect(component.loadOrder).toHaveBeenCalled();
  });

  it("should delete suborder after confirmation", () => {
    dialog.open.and.returnValue({
      afterClosed: () => of(true),
    } as any);

    spyOn(component, "loadOrder");

    component.deleteSubOrder("sub-1");

    expect(subOrderSvc.deleteSubOrder).toHaveBeenCalledWith(
      "sub-1",
    );

    expect(notify.success).toHaveBeenCalledWith(
      "Suborder deleted",
    );

    expect(component.loadOrder).toHaveBeenCalled();
  });

  it("should not delete suborder when confirmation is rejected", () => {
    dialog.open.and.returnValue({
      afterClosed: () => of(false),
    } as any);

    component.deleteSubOrder("sub-1");

    expect(subOrderSvc.deleteSubOrder).not.toHaveBeenCalled();
  });

  it("should stop loading when cancel fails", () => {
    dialog.open.and.returnValue({
      afterClosed: () => of(true),
    } as any);

    orderSvc.cancelOrder.and.returnValue(
      throwError(() => new Error("Cancel failed")),
    );

    component.cancelOrder("order-1");

    expect(component.isLoading()).toBeFalse();
  });

  it("should stop loading when redo fails", () => {
    dialog.open.and.returnValue({
      afterClosed: () => of(true),
    } as any);

    orderSvc.redoOrder.and.returnValue(
      throwError(() => new Error("Redo failed")),
    );

    component.redoOrder("order-1");

    expect(component.isLoading()).toBeFalse();
  });

  it("should stop loading when delete fails", () => {
    dialog.open.and.returnValue({
      afterClosed: () => of(true),
    } as any);

    orderSvc.deleteOrder.and.returnValue(
      throwError(() => new Error("Delete failed")),
    );

    component.deleteOrder("order-1");

    expect(component.isLoading()).toBeFalse();
  });

  it("should stop loading when suborder status update fails", () => {
    subOrderSvc.updateStatus.and.returnValue(
      throwError(() => new Error("Update failed")),
    );

    component.updateSubOrderStatus(
      "sub-1",
      "CONFIRMED",
    );

    expect(component.isLoading()).toBeFalse();
  });

  it("should stop loading when suborder deletion fails", () => {
    dialog.open.and.returnValue({
      afterClosed: () => of(true),
    } as any);

    subOrderSvc.deleteSubOrder.and.returnValue(
      throwError(() => new Error("Delete failed")),
    );

    component.deleteSubOrder("sub-1");

    expect(component.isLoading()).toBeFalse();
  });

  it("should return warn for cancelled action", () => {
    expect(
      component.getActionColor("CANCELLED"),
    ).toBe("warn");
  });

  it("should return primary for normal status", () => {
    expect(
      component.getActionColor("CONFIRMED"),
    ).toBe("primary");
  });
});