import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ActivatedRoute } from "@angular/router";
import { MatDialog } from "@angular/material/dialog";
import { PageEvent } from "@angular/material/paginator";
import { of, throwError } from "rxjs";

import { OrdersPage } from "./orders.page";
import { OrderService } from "@core/services/order.service";
import { SubOrderService } from "@core/services/suborder.service";
import { NotificationService } from "@core/services/notification.service";
import { Order, OrderStatus } from "@core/models/order.model";

describe("OrdersPage", () => {
  let component: OrdersPage;
  let fixture: ComponentFixture<OrdersPage>;

  let orderSvc: jasmine.SpyObj<OrderService>;
  let subOrderSvc: jasmine.SpyObj<SubOrderService>;
  let notify: jasmine.SpyObj<NotificationService>;
  let dialog: jasmine.SpyObj<MatDialog>;

  const order: Order = {
    id: "order-1",
    userId: "user-1",
    totalAmount: 150,
    shippingAddress: {
      street: "123 Street",
      city: "Oujda",
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

  const page = {
    content: [order],
    totalElements: 1,
    totalPages: 1,
    size: 10,
    number: 0,
  };

  beforeEach(async () => {
    orderSvc = jasmine.createSpyObj<OrderService>("OrderService", [
      "getUserOrders",
      "cancelOrder",
      "redoOrder",
      "deleteOrder",
      "canCancel",
      "canDelete",
      "getAvailableStatusTransitions",
      "getStatusIcon",
      "getStatusColor",
    ]);

    subOrderSvc = jasmine.createSpyObj<SubOrderService>("SubOrderService", [
      "getOrdersBySeller",
      "updateStatus",
      "deleteSubOrder",
    ]);

    notify = jasmine.createSpyObj<NotificationService>("NotificationService", [
      "success",
      "error",
    ]);

    dialog = jasmine.createSpyObj<MatDialog>("MatDialog", ["open"]);

    orderSvc.getUserOrders.and.returnValue(of(page));
    orderSvc.cancelOrder.and.returnValue(of({}));
    orderSvc.redoOrder.and.returnValue(of({}));
    orderSvc.deleteOrder.and.returnValue(of({}));

    subOrderSvc.getOrdersBySeller.and.returnValue(of(page));
    subOrderSvc.updateStatus.and.returnValue(of({}));
    subOrderSvc.deleteSubOrder.and.returnValue(of({}));

    await TestBed.configureTestingModule({
      imports: [OrdersPage],
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
          useValue: {
            snapshot: {
              data: {},
            },
          },
        },
      ],
    }).compileComponents();

    TestBed.overrideProvider(MatDialog, {
      useValue: dialog,
    });

    fixture = TestBed.createComponent(OrdersPage);
    component = fixture.componentInstance;

    expect(TestBed.inject(MatDialog)).toBe(dialog);
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should be in buyer mode by default", () => {
    expect(component.isSeller).toBeFalse();
  });

  it("should load buyer orders", () => {
    component.loadOrders();

    expect(orderSvc.getUserOrders).toHaveBeenCalledWith(0, 10);
    expect(component.orders()).toEqual([order]);
    expect(component.totalOrders()).toBe(1);
    expect(component.isLoading()).toBeFalse();
  });

  it("should load orders on init", () => {
    component.ngOnInit();

    expect(orderSvc.getUserOrders).toHaveBeenCalledWith(0, 10);
  });

  it("should show backend error when loading fails", () => {
    orderSvc.getUserOrders.and.returnValue(
      throwError(() => ({
        error: {
          message: "Server error",
        },
      })),
    );

    component.loadOrders();

    expect(component.isLoading()).toBeFalse();
    expect(notify.error).toHaveBeenCalledWith("Server error");
  });

  it("should show default error when loading fails without message", () => {
    orderSvc.getUserOrders.and.returnValue(throwError(() => ({})));

    component.loadOrders();

    expect(component.isLoading()).toBeFalse();
    expect(notify.error).toHaveBeenCalledWith(
      "Failed to load orders. Please try again.",
    );
  });

  it("should change page", () => {
    const event: PageEvent = {
      pageIndex: 2,
      pageSize: 20,
      length: 100,
      previousPageIndex: 1,
    };

    component.onPageChange(event);

    expect(component.pageIndex()).toBe(2);
    expect(component.pageSize()).toBe(20);
    expect(orderSvc.getUserOrders).toHaveBeenCalledWith(2, 20);
  });

  it("should count total items", () => {
    expect(component.countTotalItems(order)).toBe(3);
  });

  it("should return zero for an order with no items", () => {
    const emptyOrder = {
      ...order,
      subOrders: [],
    };

    expect(component.countTotalItems(emptyOrder)).toBe(0);
  });

  it("should cancel pending order after confirmation", () => {
    component.orders.set([
      {
        ...order,
        status: "PENDING",
      },
    ]);

    dialog.open.and.returnValue({
      afterClosed: () => of(true),
    } as any);

    component.cancelOrder("order-1");

    expect(dialog.open).toHaveBeenCalled();
    expect(orderSvc.cancelOrder).toHaveBeenCalledWith("order-1");
    expect(notify.success).toHaveBeenCalledWith("Order cancelled");
    expect(component.isLoading()).toBeFalse();
    expect(component.orders()[0].status).toBe("CANCELLED");
  });
  
  it("should not cancel when dialog is rejected", () => {
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

    component.redoOrder("order-1");

    expect(dialog.open).toHaveBeenCalled();
    expect(orderSvc.redoOrder).toHaveBeenCalledWith("order-1");
    expect(notify.success).toHaveBeenCalledWith("Order Redone");
    expect(component.isLoading()).toBeFalse();
  });

  it("should delete order after confirmation", () => {
    dialog.open.and.returnValue({
      afterClosed: () => of(true),
    } as any);

    component.deleteOrder("order-1");

    expect(dialog.open).toHaveBeenCalled();
    expect(orderSvc.deleteOrder).toHaveBeenCalledWith("order-1");
    expect(notify.success).toHaveBeenCalledWith("Order deleted");
    expect(component.isLoading()).toBeFalse();
  });

  it("should update suborder status", () => {
    component.updateSubOrderStatus("sub-1", "CONFIRMED");

    expect(subOrderSvc.updateStatus).toHaveBeenCalledWith("sub-1", "CONFIRMED");

    expect(notify.success).toHaveBeenCalledWith("Status updated to CONFIRMED");

    expect(component.isLoading()).toBeFalse();
  });

  it("should delete suborder after confirmation", () => {
    dialog.open.and.returnValue({
      afterClosed: () => of(true),
    } as any);

    component.deleteSubOrder("sub-1");

    expect(dialog.open).toHaveBeenCalled();
    expect(subOrderSvc.deleteSubOrder).toHaveBeenCalledWith("sub-1");
    expect(notify.success).toHaveBeenCalledWith("Suborder deleted");
    expect(component.isLoading()).toBeFalse();
  });

  it("should not delete suborder when dialog is rejected", () => {
    dialog.open.and.returnValue({
      afterClosed: () => of(false),
    } as any);

    component.deleteSubOrder("sub-1");

    expect(subOrderSvc.deleteSubOrder).not.toHaveBeenCalled();
  });

  it("should stop loading when an action fails", () => {
    dialog.open.and.returnValue({
      afterClosed: () => of(true),
    } as any);

    orderSvc.deleteOrder.and.returnValue(
      throwError(() => new Error("Delete failed")),
    );

    component.deleteOrder("order-1");

    expect(component.isLoading()).toBeFalse();
  });

  it("should use seller service in seller mode", async () => {
    TestBed.resetTestingModule();

    await TestBed.configureTestingModule({
      imports: [OrdersPage],
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
          provide: MatDialog,
          useValue: dialog,
        },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              data: {
                type: "suborders",
              },
            },
          },
        },
      ],
    }).compileComponents();

    const sellerFixture = TestBed.createComponent(OrdersPage);

    const sellerComponent = sellerFixture.componentInstance;

    sellerComponent.loadOrders();

    expect(sellerComponent.isSeller).toBeTrue();
    expect(subOrderSvc.getOrdersBySeller).toHaveBeenCalledWith(0, 10);

    sellerFixture.destroy();
  });
});
