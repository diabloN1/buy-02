import { ComponentFixture, TestBed } from "@angular/core/testing";

import { OrderStatusTimelineComponent } from "./order-status-timeline.component";
import { StatusHistory, SubOrder } from "@core/models/order.model";

describe("OrderStatusTimelineComponent", () => {
  let component: OrderStatusTimelineComponent;
  let fixture: ComponentFixture<OrderStatusTimelineComponent>;

  const sellerId = "seller-123";
  const createdAt = "2026-10-01T10:00:00";

  const history: StatusHistory[] = [
    {
      status: "CONFIRMED",
      timestamp: "2026-10-02T12:00:00",
      changedBy: "buyer-123",
    },
    {
      status: "SHIPPED",
      timestamp: "2026-10-03T12:00:00",
      changedBy: sellerId,
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
    createdAt,
    updatedAt: "2026-10-03T12:00:00",
  };

  // OnPush component: inputs must be changed through setInput so the view refreshes.
  function render(overrides: Partial<SubOrder> = {}): void {
    fixture.componentRef.setInput("subOrder", { ...subOrder, ...overrides });
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrderStatusTimelineComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(OrderStatusTimelineComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput("subOrder", subOrder);
    fixture.componentRef.setInput("createdAt", createdAt);
    fixture.componentRef.setInput("isSeller", false);
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  describe("steps (non-cancelled)", () => {
    it("should return the four steps in fixed order", () => {
      expect(component.steps.map((s) => s.status)).toEqual([
        "PENDING",
        "CONFIRMED",
        "SHIPPED",
        "DELIVERED",
      ]);
    });

    it("should use the expected titles", () => {
      expect(component.steps.map((s) => s.title)).toEqual([
        "Order Placed",
        "Order Confirmed",
        "Dispatched & Shipped",
        "Order Delivered",
      ]);
    });

    it("should mark earlier steps completed and the current step as current", () => {
      const steps = component.steps;

      expect(steps.map((s) => s.isCompleted)).toEqual([
        true,
        true,
        false,
        false,
      ]);
      expect(steps.map((s) => s.isCurrent)).toEqual([
        false,
        false,
        true,
        false,
      ]);
    });

    it("should use the check icon for completed steps", () => {
      const steps = component.steps;

      expect(steps[0].icon).toBe("check");
      expect(steps[1].icon).toBe("check");
    });

    it("should use the status icon for current and upcoming steps", () => {
      const steps = component.steps;

      expect(steps[2].icon).toBe("local_shipping");
      expect(steps[3].icon).toBe("done_all");
    });

    it("should use createdAt for the PENDING step when history has no PENDING entry", () => {
      const pending = component.steps[0];

      expect(pending.timestamp).toBe(createdAt);
      expect(pending.changedBy).toBe("Buyer");
    });

    it("should use the PENDING history timestamp when present", () => {
      render({
        statusHistory: [
          {
            status: "PENDING",
            timestamp: "2026-10-01T10:05:00",
            changedBy: "buyer-123",
          },
          ...history,
        ],
      });

      expect(component.steps[0].timestamp).toBe("2026-10-01T10:05:00");
    });

    it("should take timestamps from history for reached steps", () => {
      const steps = component.steps;

      expect(steps[1].timestamp).toBe("2026-10-02T12:00:00");
      expect(steps[2].timestamp).toBe("2026-10-03T12:00:00");
    });

    it("should leave future steps without timestamp or actor", () => {
      const delivered = component.steps[3];

      expect(delivered.timestamp).toBeUndefined();
      expect(delivered.changedBy).toBeUndefined();
    });

    it("should label the actor as Seller when changedBy matches the seller id", () => {
      expect(component.steps[2].changedBy).toBe("Seller");
    });

    it("should label the actor as Buyer when changedBy is not the seller id", () => {
      expect(component.steps[1].changedBy).toBe("Buyer");
    });

    it("should use the outline icon for an upcoming CONFIRMED step", () => {
      render({ status: "PENDING", statusHistory: [] });

      const steps = component.steps;

      expect(steps[0].isCurrent).toBe(true);
      expect(steps[0].icon).toBe("schedule");
      expect(steps[1].icon).toBe("check_circle_outline");
    });

    it("should mark everything completed except DELIVERED when delivered", () => {
      render({ status: "DELIVERED" });

      const steps = component.steps;

      expect(steps.map((s) => s.isCompleted)).toEqual([
        true,
        true,
        true,
        false,
      ]);
      expect(steps[3].isCurrent).toBe(true);
    });

    it("should handle undefined status history", () => {
      render({ statusHistory: undefined as unknown as StatusHistory[] });

      expect(component.steps.length).toBe(4);
      expect(component.steps[0].timestamp).toBe(createdAt);
    });

    it("should not mutate the original status history", () => {
      const original = [...subOrder.statusHistory];

      void component.steps;

      expect(subOrder.statusHistory).toEqual(original);
    });
  });

  describe("steps (cancelled)", () => {
    it("should return only the placed and cancelled steps", () => {
      render({
        status: "CANCELLED",
        statusHistory: [
          {
            status: "CANCELLED",
            timestamp: "2026-10-02T09:00:00",
            changedBy: sellerId,
          },
        ],
      });

      const steps = component.steps;

      expect(steps.map((s) => s.status)).toEqual(["PENDING", "CANCELLED"]);
      expect(steps[0].isCompleted).toBe(true);
      expect(steps[0].timestamp).toBe(createdAt);
      expect(steps[1].isCurrent).toBe(true);
      expect(steps[1].icon).toBe("close");
      expect(steps[1].timestamp).toBe("2026-10-02T09:00:00");
      expect(steps[1].changedBy).toBe("Seller");
    });

    it("should label a buyer cancellation as Buyer", () => {
      render({
        status: "CANCELLED",
        statusHistory: [
          {
            status: "CANCELLED",
            timestamp: "2026-10-02T09:00:00",
            changedBy: "buyer-123",
          },
        ],
      });

      expect(component.steps[1].changedBy).toBe("Buyer");
    });

    it("should fall back to createdAt and no actor when there is no cancel history", () => {
      render({ status: "CANCELLED", statusHistory: [] });

      const cancelled = component.steps[1];

      expect(cancelled.timestamp).toBe(createdAt);
      expect(cancelled.changedBy).toBeUndefined();
    });
  });

  describe("statusPillClass", () => {
    it("should return pill-warn for CANCELLED", () => {
      expect(component.statusPillClass("CANCELLED")).toBe("pill-warn");
    });

    it("should return pill-primary for CONFIRMED, SHIPPED and DELIVERED", () => {
      expect(component.statusPillClass("CONFIRMED")).toBe("pill-primary");
      expect(component.statusPillClass("SHIPPED")).toBe("pill-primary");
      expect(component.statusPillClass("DELIVERED")).toBe("pill-primary");
    });

    it("should return an empty string for PENDING", () => {
      expect(component.statusPillClass("PENDING")).toBe("");
    });
  });

  describe("template", () => {
    const el = (): HTMLElement => fixture.nativeElement as HTMLElement;

    it("should render one element per step", () => {
      expect(el().querySelectorAll(".timeline-step").length).toBe(4);
    });

    it("should render the sub-order status in the pill with the matching class", () => {
      const pill = el().querySelector(".status-pill") as HTMLElement;

      expect(pill.textContent?.trim()).toBe("SHIPPED");
      expect(pill.classList).toContain("pill-primary");
    });

    it("should flag completed and current steps", () => {
      expect(el().querySelectorAll(".timeline-step.completed").length).toBe(2);
      expect(el().querySelectorAll(".timeline-step.current").length).toBe(1);
      expect(el().querySelectorAll(".current-tag").length).toBe(1);
    });

    it("should show Pending for steps without a timestamp", () => {
      expect(el().querySelectorAll(".step-pending").length).toBe(1);
    });

    it("should not render a connector after the last step", () => {
      const steps = el().querySelectorAll(".timeline-step");

      expect(steps[0].querySelector(".step-connector")).not.toBeNull();
      expect(
        steps[steps.length - 1].querySelector(".step-connector"),
      ).toBeNull();
    });

    it("should render the cancelled layout", () => {
      render({ status: "CANCELLED", statusHistory: [] });

      expect(el().querySelectorAll(".timeline-step").length).toBe(2);
      expect(el().querySelector(".timeline-step.cancelled")).not.toBeNull();
      expect(el().querySelector(".status-pill")?.classList).toContain(
        "pill-warn",
      );
    });
  });
});
