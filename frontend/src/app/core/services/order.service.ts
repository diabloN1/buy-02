import { Injectable, inject } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable } from "rxjs";
import { map } from "rxjs";

import { API } from "@core/config/api.config";
import {
  CreateOrderRequest,
  CreateOrderResponse,
  Order,
  OrderStatus,
  PageResponse,
} from "@core/models/checkout.model";

const STATUS_FLOW: OrderStatus[] = [
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
    return this.http.get<Order>(API.base + API.orders.item(orderId)).pipe(
      map((order) => ({
        ...order,
          // lowest status in sub orders
          status:
            STATUS_FLOW.find((status) =>
              order.subOrders.some((sub) => sub.status === status),
            ) ?? "PENDING",
      })),
    );
  }

  getUserOrders(
    page = 0,
    size = 10,
    sort = "createdAt,desc",
  ): Observable<PageResponse<Order>> {
    const params = new HttpParams()
      .set("page", page)
      .set("size", size)
      .set("sort", sort);

    return this.http
      .get<PageResponse<Order>>(API.base + API.orders.root, { params })
      .pipe(
        map((page) => ({
          ...page,
          content: page.content.map((order) => ({
            ...order,
            // lowest status in sub orders
            status:
              STATUS_FLOW.find((status) =>
                order.subOrders.some((sub) => sub.status === status),
              ) ?? "PENDING",
          })),
        })),
      );
  }

  cancelOrder(orderId: string) {
    return this.http.patch(API.base + API.orders.cancel(orderId), {});
  }
}
