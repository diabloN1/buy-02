import { TestBed } from "@angular/core/testing";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { provideHttpClient } from "@angular/common/http";

import { OrderService } from "./order.service";
import { API } from "@core/config/api.config";
import {
  CreateOrderRequest,
  CreateOrderResponse,
  Order,
} from "@core/models/order.model";
import { Paginated } from "@core/models/paginated.model";

describe("OrderService", () => {
  let service: OrderService;
  let httpMock: HttpTestingController;

  const mockAddress = {
    street: "123 Main Street",
    city: "Oujda",
    zipCode: "60000",
    country: "Morocco",
    phone: "0612345678",
  };

  const mockOrder: Order = {
    id: "order-123",
    userId: "user-123",
    totalAmount: 150,
    shippingAddress: mockAddress,
    paymentMethod: "PAY_ON_DELIVERY",
    status: "PENDING",
    createdAt: "2026-10-05T10:00:00",
    updatedAt: "2026-10-05T10:00:00",
    subOrders: [
      {
        id: "suborder-123",
        orderId: "order-123",
        sellerId: "seller-123",
        items: [],
        totalAmount: 150,
        paymentMethod: "PAY_ON_DELIVERY",
        statusHistory: [],
        status: "PENDING",
        createdAt: "2026-10-05T10:00:00",
        updatedAt: "2026-10-05T10:00:00",
      },
    ],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        OrderService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(OrderService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  describe("createOrder", () => {
    it("should create an order", () => {
      const request: CreateOrderRequest = {
        shippingAddress: mockAddress,
        paymentMethod: "PAY_ON_DELIVERY",
        totalAmount: 150,
      };

      const response: CreateOrderResponse = {
        id: "order-123",
      };

      service.createOrder(request).subscribe((res) => {
        expect(res).toEqual(response);
      });

      const req = httpMock.expectOne(API.base + API.orders.root);

      expect(req.request.method).toBe("POST");
      expect(req.request.body).toEqual(request);

      req.flush(response);
    });
  });

  describe("getOrder", () => {
    it("should return an order with its overall status", () => {
      service.getOrder("order-123").subscribe((res) => {
        expect(res).toEqual({
          ...mockOrder,
          status: "PENDING",
        });
      });

      const req = httpMock.expectOne(API.base + API.orders.item("order-123"));

      expect(req.request.method).toBe("GET");

      req.flush(mockOrder);
    });

    it("should calculate overall status from sub-orders", () => {
      const order: Order = {
        ...mockOrder,
        status: "PENDING",
        subOrders: [
          {
            ...mockOrder.subOrders[0],
            status: "SHIPPED",
          },
          {
            ...mockOrder.subOrders[0],
            id: "suborder-456",
            status: "CONFIRMED",
          },
        ],
      };

      service.getOrder(order.id).subscribe((res) => {
        expect(res.status).toBe("CONFIRMED");
      });

      const req = httpMock.expectOne(API.base + API.orders.item(order.id));

      expect(req.request.method).toBe("GET");

      req.flush(order);
    });

    it("should use the earliest status in the status flow", () => {
      const order: Order = {
        ...mockOrder,
        subOrders: [
          {
            ...mockOrder.subOrders[0],
            status: "DELIVERED",
          },
          {
            ...mockOrder.subOrders[0],
            id: "suborder-456",
            status: "SHIPPED",
          },
        ],
      };

      service.getOrder(order.id).subscribe((res) => {
        expect(res.status).toBe("SHIPPED");
      });

      const req = httpMock.expectOne(API.base + API.orders.item(order.id));

      expect(req.request.method).toBe("GET");

      req.flush(order);
    });

    it("should default overall status to PENDING when there are no sub-orders", () => {
      const order: Order = {
        ...mockOrder,
        subOrders: [],
      };

      service.getOrder(order.id).subscribe((res) => {
        expect(res.status).toBe("PENDING");
      });

      const req = httpMock.expectOne(API.base + API.orders.item(order.id));

      expect(req.request.method).toBe("GET");

      req.flush(order);
    });
  });

  describe("getUserOrders", () => {
    it("should return paginated orders with overall statuses", () => {
      const mockResponse: Paginated<Order> = {
        content: [
          {
            ...mockOrder,
            status: "PENDING",
          },
        ],
        totalPages: 1,
        totalElements: 1,
        size: 10,
        number: 0,
      };

      service.getUserOrders().subscribe((res) => {
        expect(res).toEqual(mockResponse);
        expect(res.content[0].status).toBe("PENDING");
      });

      const req = httpMock.expectOne(
        (request) =>
          request.url === API.base + API.orders.root &&
          request.params.get("page") === "0" &&
          request.params.get("size") === "10",
      );

      expect(req.request.method).toBe("GET");

      req.flush(mockResponse);
    });

    it("should send correct pagination parameters", () => {
      const mockResponse: Paginated<Order> = {
        content: [],
        totalPages: 0,
        totalElements: 0,
        size: 5,
        number: 2,
      };

      service.getUserOrders(2, 5).subscribe();

      const req = httpMock.expectOne(
        (request) =>
          request.url === API.base + API.orders.root &&
          request.params.get("page") === "2" &&
          request.params.get("size") === "5",
      );

      expect(req.request.method).toBe("GET");

      req.flush(mockResponse);
    });

    it("should calculate overall status for every order", () => {
      const firstOrder: Order = {
        ...mockOrder,
        id: "order-1",
        subOrders: [
          {
            ...mockOrder.subOrders[0],
            status: "DELIVERED",
          },
        ],
      };

      const secondOrder: Order = {
        ...mockOrder,
        id: "order-2",
        subOrders: [
          {
            ...mockOrder.subOrders[0],
            status: "SHIPPED",
          },
        ],
      };

      const response: Paginated<Order> = {
        content: [firstOrder, secondOrder],
        totalPages: 1,
        totalElements: 2,
        size: 10,
        number: 0,
      };

      service.getUserOrders().subscribe((res) => {
        expect(res.content[0].status).toBe("DELIVERED");
        expect(res.content[1].status).toBe("SHIPPED");
      });

      const req = httpMock.expectOne(
        (request) =>
          request.url === API.base + API.orders.root &&
          request.params.get("page") === "0" &&
          request.params.get("size") === "10",
      );

      expect(req.request.method).toBe("GET");

      req.flush(response);
    });
  });

  describe("cancelOrder", () => {
    it("should cancel an order", () => {
      const orderId = "order-123";

      service.cancelOrder(orderId).subscribe((res) => {
        expect(res).toBeNull();
      });

      const req = httpMock.expectOne(API.base + API.orders.cancel(orderId));

      expect(req.request.method).toBe("PATCH");
      expect(req.request.body).toEqual({});

      req.flush(null);
    });
  });

  describe("redoOrder", () => {
    it("should redo an order", () => {
      const orderId = "order-123";

      service.redoOrder(orderId).subscribe((res) => {
        expect(res).toBeNull();
      });

      const req = httpMock.expectOne(API.base + API.orders.redo(orderId));

      expect(req.request.method).toBe("POST");
      expect(req.request.body).toEqual({});

      req.flush(null);
    });
  });

  describe("deleteOrder", () => {
    it("should delete an order", () => {
      const orderId = "order-123";

      service.deleteOrder(orderId).subscribe((res) => {
        expect(res).toBeNull();
      });

      const req = httpMock.expectOne(API.base + API.orders.delete(orderId));

      expect(req.request.method).toBe("DELETE");
      req.flush(null);
    });
  });

  describe("canCancel", () => {
    it("should allow cancellation only for PENDING orders", () => {
      expect(service.canCancel("PENDING")).toBeTrue();

      expect(service.canCancel("CONFIRMED")).toBeFalse();
      expect(service.canCancel("SHIPPED")).toBeFalse();
      expect(service.canCancel("DELIVERED")).toBeFalse();
      expect(service.canCancel("CANCELLED")).toBeFalse();
    });
  });

  describe("canDelete", () => {
    it("should allow deletion of CANCELLED and DELIVERED orders", () => {
      expect(service.canDelete("CANCELLED")).toBeTrue();
      expect(service.canDelete("DELIVERED")).toBeTrue();

      expect(service.canDelete("PENDING")).toBeFalse();
      expect(service.canDelete("CONFIRMED")).toBeFalse();
      expect(service.canDelete("SHIPPED")).toBeFalse();
    });
  });

  describe("getAvailableStatusTransitions", () => {
    it("should allow PENDING to transition to CONFIRMED or CANCELLED", () => {
      expect(service.getAvailableStatusTransitions("PENDING")).toEqual([
        "CONFIRMED",
        "CANCELLED",
      ]);
    });

    it("should allow CONFIRMED to transition to SHIPPED", () => {
      expect(service.getAvailableStatusTransitions("CONFIRMED")).toEqual([
        "SHIPPED",
      ]);
    });

    it("should allow SHIPPED to transition to DELIVERED", () => {
      expect(service.getAvailableStatusTransitions("SHIPPED")).toEqual([
        "DELIVERED",
      ]);
    });

    it("should not allow transitions from DELIVERED", () => {
      expect(service.getAvailableStatusTransitions("DELIVERED")).toEqual([]);
    });

    it("should not allow transitions from CANCELLED", () => {
      expect(service.getAvailableStatusTransitions("CANCELLED")).toEqual([]);
    });
  });

  describe("getStatusIcon", () => {
    it("should return the correct icon for each status", () => {
      expect(service.getStatusIcon("PENDING")).toBe("hourglass_empty");
      expect(service.getStatusIcon("CONFIRMED")).toBe("check_circle");
      expect(service.getStatusIcon("SHIPPED")).toBe("local_shipping");
      expect(service.getStatusIcon("DELIVERED")).toBe("check_box");
      expect(service.getStatusIcon("CANCELLED")).toBe("cancel");
    });
  });

  describe("getStatusColor", () => {
    it("should return the correct color for each status", () => {
      expect(service.getStatusColor("PENDING")).toBe("warn");
      expect(service.getStatusColor("CONFIRMED")).toBe("primary");
      expect(service.getStatusColor("SHIPPED")).toBe("accent");
      expect(service.getStatusColor("DELIVERED")).toBe("primary");
      expect(service.getStatusColor("CANCELLED")).toBe("warn");
    });
  });
});