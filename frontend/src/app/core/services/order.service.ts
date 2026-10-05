import { Injectable, inject } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable, map } from "rxjs";

import { API } from "@core/config/api.config";
import {
  CreateOrderRequest,
  CreateOrderResponse,
  Order,
  OrderStatus,
} from "@core/models/order.model";
import { Paginated } from "@core/models/paginated.model";

export const STATUS_FLOW: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

@Injectable({ providedIn: "root" })
export class OrderService {
  private readonly http = inject(HttpClient);

  createOrder(body: CreateOrderRequest): Observable<CreateOrderResponse> {
    return this.http.post<CreateOrderResponse>(
      API.base + API.orders.root,
      body,
    );
  }

  getOrder(orderId: string): Observable<Order> {
    return this.http
      .get<Order>(API.base + API.orders.item(orderId))
      .pipe(map((order) => this.withOverallStatus(order)));
  }

  getUserOrders(page = 0, size = 10): Observable<Paginated<Order>> {
    const params = new HttpParams().set("page", page).set("size", size);

    return this.http
      .get<Paginated<Order>>(API.base + API.orders.root, { params })
      .pipe(map((page) => this.withOverallStatusForPage(page)));
  }

  cancelOrder(orderId: string) {
    return this.http.patch(API.base + API.orders.cancel(orderId), {});
  }

  redoOrder(orderId: string) {
    return this.http.post(API.base + API.orders.redo(orderId), {});
  }

  deleteOrder(orderId: string) {
    return this.http.delete(API.base + API.orders.delete(orderId), {});
  }

  ///////////////////////
  // Helpers
  ///////////////////////
  private withOverallStatus(order: Order): Order {
    return {
      ...order,
      status: this.getOverallStatus(order),
    };
  }

  private withOverallStatusForPage(page: Paginated<Order>): Paginated<Order> {
    return {
      ...page,
      content: page.content.map((order) => this.withOverallStatus(order)),
    };
  }

  private getOverallStatus(order: Order): OrderStatus {
    return (
      STATUS_FLOW.find((status) =>
        order.subOrders.some((subOrder) => subOrder.status === status),
      ) ?? "PENDING"
    );
  }

  canCancel(status: OrderStatus): boolean {
    return status === "PENDING";
  }

  canDelete(status: OrderStatus): boolean {
    return status === "CANCELLED" || status === "DELIVERED";
  }

  getAvailableStatusTransitions(currentStatus: OrderStatus): OrderStatus[] {
    const FLOW_WITHOUT_CANCELED = STATUS_FLOW.slice(0, -1);
    const index = FLOW_WITHOUT_CANCELED.indexOf(currentStatus);

    if (
      index < 0 ||
      currentStatus === "DELIVERED" ||
      currentStatus === "CANCELLED"
    ) {
      return [];
    }

    const transitions: OrderStatus[] = [];

    if (index + 1 < STATUS_FLOW.length) {
      transitions.push(STATUS_FLOW[index + 1]);
    }

    if (currentStatus === "PENDING") {
      transitions.push("CANCELLED");
    }

    return transitions;
  }

  getStatusIcon(status: OrderStatus): string {
    const icons: Record<OrderStatus, string> = {
      PENDING: "hourglass_empty",
      CONFIRMED: "check_circle",
      SHIPPED: "local_shipping",
      DELIVERED: "check_box",
      CANCELLED: "cancel",
    };

    return icons[status] || "help";
  }

  getStatusColor(status: OrderStatus): string {
    const colors: Record<OrderStatus, string> = {
      PENDING: "warn",
      CONFIRMED: "primary",
      SHIPPED: "accent",
      DELIVERED: "primary",
      CANCELLED: "warn",
    };

    return colors[status] || "primary";
  }
}
