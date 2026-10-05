import { ComponentFixture, TestBed } from "@angular/core/testing";

import { OrderStatusTimelineComponent } from "./order-status-timeline.component";
import {
  OrderStatus,
  StatusHistory,
  SubOrder,
} from "@core/models/order.model";

describe("OrderStatusTimelineComponent", () => {
  let component: OrderStatusTimelineComponent;
  let fixture: ComponentFixture<OrderStatusTimelineComponent>;

  const sellerId = "seller-123";

  const history: StatusHistory[] = [
    {
      status: "SHIPPED",
      timestamp: "2026-10-03T12:00:00",
      changedBy: sellerId,
    },
    {
      status: "CONFIRMED",
      timestamp: "2026-10-02T12:00:00",
      changedBy: "buyer-123",
    },
  ];

  const subOrder: SubOrder = {
    id: "sub-1",
    orderId: "order-1",
    sellerId,
    items: [],
    totalAmount: 100,
    paymentMethod: "PAY_ON_DELIVERY",
    status: "SHIPPED",
    statusHistory: history,
    createdAt: "2026-10-01T10:00:00",
    updatedAt: "2026-10-03T12:00:00",
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrderStatusTimelineComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(
      OrderStatusTimelineComponent,
    );

    component = fixture.componentInstance;

    component.subOrder = subOrder;
    component.createdAt = "2026-10-01T10:00:00";
    component.isSeller = false;

    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should return timeline sorted by timestamp", () => {
    const timeline = component.timeline;

    expect(timeline.length).toBe(2);
    expect(timeline[0].status).toBe("CONFIRMED");
    expect(timeline[1].status).toBe("SHIPPED");
  });

  it("should not mutate the original status history", () => {
    const original = [...subOrder.statusHistory];

    component.timeline;

    expect(subOrder.statusHistory).toEqual(original);
  });

  it("should return PENDING icon", () => {
    expect(component.getStatusIcon("PENDING")).toBe(
      "schedule",
    );
  });

  it("should return CONFIRMED icon", () => {
    expect(component.getStatusIcon("CONFIRMED")).toBe(
      "check_circle",
    );
  });

  it("should return SHIPPED icon", () => {
    expect(component.getStatusIcon("SHIPPED")).toBe(
      "local_shipping",
    );
  });

  it("should return DELIVERED icon", () => {
    expect(component.getStatusIcon("DELIVERED")).toBe(
      "done_all",
    );
  });

  it("should return CANCELLED icon", () => {
    expect(component.getStatusIcon("CANCELLED")).toBe(
      "cancel",
    );
  });

  it("should return primary color for confirmed", () => {
    expect(component.getStatusColor("CONFIRMED")).toBe(
      "primary",
    );
  });

  it("should return primary color for shipped", () => {
    expect(component.getStatusColor("SHIPPED")).toBe(
      "primary",
    );
  });

  it("should return primary color for delivered", () => {
    expect(component.getStatusColor("DELIVERED")).toBe(
      "primary",
    );
  });

  it("should return warn color for cancelled", () => {
    expect(component.getStatusColor("CANCELLED")).toBe(
      "warn",
    );
  });

  it("should return accent color for pending", () => {
    expect(component.getStatusColor("PENDING")).toBe(
      "accent",
    );
  });

  it("should identify seller changes", () => {
    const sellerHistory: StatusHistory = {
      status: "SHIPPED",
      timestamp: "2026-10-03T12:00:00",
      changedBy: sellerId,
    };

    expect(
      component.getChangedByLabel(sellerHistory),
    ).toBe("Seller");
  });

  it("should identify buyer changes", () => {
    const buyerHistory: StatusHistory = {
      status: "CONFIRMED",
      timestamp: "2026-10-02T12:00:00",
      changedBy: "buyer-123",
    };

    expect(
      component.getChangedByLabel(buyerHistory),
    ).toBe("Buyer");
  });

  it("should return empty timeline when there is no history", () => {
    component.subOrder = {
      ...subOrder,
      statusHistory: [],
    };

    expect(component.timeline).toEqual([]);
  });

  it("should handle multiple history entries in chronological order", () => {
    component.subOrder = {
      ...subOrder,
      statusHistory: [
        {
          status: "DELIVERED",
          timestamp: "2026-10-05T10:00:00",
          changedBy: sellerId,
        },
        {
          status: "PENDING",
          timestamp: "2026-10-01T10:00:00",
          changedBy: "buyer-123",
        },
        {
          status: "SHIPPED",
          timestamp: "2026-10-04T10:00:00",
          changedBy: sellerId,
        },
        {
          status: "CONFIRMED",
          timestamp: "2026-10-02T10:00:00",
          changedBy: "buyer-123",
        },
      ],
    };

    expect(component.timeline.map((item) => item.status)).toEqual([
      "PENDING",
      "CONFIRMED",
      "SHIPPED",
      "DELIVERED",
    ]);
  });
});