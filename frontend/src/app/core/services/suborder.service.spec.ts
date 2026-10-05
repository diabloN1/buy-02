import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import {
  provideHttpClient,
} from "@angular/common/http";
import { TestBed } from "@angular/core/testing";

import { SubOrderService } from "./suborder.service";
import { API } from "@core/config/api.config";
import { Order } from "@core/models/order.model";

describe("SubOrderService", () => {
  let service: SubOrderService;
  let httpMock: HttpTestingController;

  const order: Order = {
    id: "order-1",
    userId: "user-1",
    totalAmount: 100,
    shippingAddress: {
      street: "Street 1",
      city: "Oujda",
      state: "Oriental",
      zipCode: "60000",
      country: "Morocco",
      phone: "0600000000",
    },
    paymentMethod: "PAY_ON_DELIVERY",
    status: "PENDING",
    subOrders: [
      {
        id: "sub-1",
        orderId: "order-1",
        sellerId: "seller-1",
        items: [],
        totalAmount: 100,
        paymentMethod: "PAY_ON_DELIVERY",
        statusHistory: [],
        status: "SHIPPED",
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      },
    ],
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SubOrderService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(SubOrderService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it("should create", () => {
    expect(service).toBeTruthy();
  });

  it("should get a suborder and calculate its overall status", () => {
    service.getSubOrder("sub-1").subscribe((result) => {
      expect(result.id).toBe("order-1");
      expect(result.status).toBe("SHIPPED");
    });

    const req = httpMock.expectOne(
      API.base + API.subOrders.item("sub-1"),
    );

    expect(req.request.method).toBe("GET");

    req.flush(order);
  });

  it("should default status to PENDING when no status matches", () => {
    const pendingOrder: Order = {
      ...order,
      subOrders: [],
    };

    service.getSubOrder("sub-1").subscribe((result) => {
      expect(result.status).toBe("PENDING");
    });

    const req = httpMock.expectOne(
      API.base + API.subOrders.item("sub-1"),
    );

    req.flush(pendingOrder);
  });

  it("should get seller orders with pagination", () => {
    service.getOrdersBySeller(2, 20).subscribe((result) => {
      expect(result.content.length).toBe(1);
      expect(result.content[0].status).toBe("SHIPPED");
      expect(result.totalElements).toBe(1);
    });

    const req = httpMock.expectOne(
      (request) =>
        request.url === API.base + API.subOrders.root &&
        request.params.get("page") === "2" &&
        request.params.get("size") === "20",
    );

    expect(req.request.method).toBe("GET");

    req.flush({
      content: [order],
      totalElements: 1,
      totalPages: 1,
      size: 20,
      number: 2,
    });
  });

  it("should calculate status for every seller order", () => {
    const secondOrder: Order = {
      ...order,
      id: "order-2",
      subOrders: [
        {
          ...order.subOrders[0],
          status: "DELIVERED",
        },
      ],
    };

    service.getOrdersBySeller().subscribe((result) => {
      expect(result.content[0].status).toBe("SHIPPED");
      expect(result.content[1].status).toBe("DELIVERED");
    });

    const req = httpMock.expectOne(
      (request) =>
        request.url === API.base + API.subOrders.root &&
        request.params.get("page") === "0" &&
        request.params.get("size") === "10",
    );

    req.flush({
      content: [order, secondOrder],
      totalElements: 2,
      totalPages: 1,
      size: 10,
      number: 0,
    });
  });

  it("should update suborder status", () => {
    service
      .updateStatus("sub-1", "CONFIRMED")
      .subscribe((result) => {
        expect(result).toBeNull();
      });

    const req = httpMock.expectOne(
      (request) =>
        request.url === API.base + API.subOrders.status("sub-1") &&
        request.params.get("status") === "CONFIRMED",
    );

    expect(req.request.method).toBe("PATCH");
    expect(req.request.body).toEqual({});

    req.flush(null);
  });

  it("should delete a suborder", () => {
    service.deleteSubOrder("sub-1").subscribe((result) => {
      expect(result).toBeNull();
    });

    const req = httpMock.expectOne(
      API.base + API.subOrders.delete("sub-1"),
    );

    expect(req.request.method).toBe("DELETE");

    req.flush(null);
  });
});