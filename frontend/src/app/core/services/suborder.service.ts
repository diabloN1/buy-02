import { Injectable, inject } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

import { API } from "@core/config/api.config";
import {
  Order,
  OrderStatus,
  OrderSearchFilter,
} from "@core/models/order.model";
import { Paginated } from "@core/models/paginated.model";

const STATUS_FLOW: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

@Injectable({ providedIn: "root" })
export class SubOrderService {
  private readonly http = inject(HttpClient);

  getSubOrder(subOrderId: string): Observable<Order> {
    return this.http.get<Order>(API.base + API.subOrders.item(subOrderId)).pipe(
      map((order) => ({
        ...order,
        status:
          STATUS_FLOW.find((status) =>
            order.subOrders.some((sub) => sub.status === status),
          ) ?? "PENDING",
      })),
    );
  }

  getOrdersBySeller(page = 0, size = 10): Observable<Paginated<Order>> {
    const params = new HttpParams().set("page", page).set("size", size);
    return this.http
      .get<Paginated<Order>>(API.base + API.subOrders.root, { params })
      .pipe(map((p) => this.mapSubOrderStatus(p)));
  }

  searchOrdersBySeller(
    filter: OrderSearchFilter,
    page = 0,
    size = 10,
  ): Observable<Paginated<Order>> {
    let params = new HttpParams().set("page", page).set("size", size);

    if (filter.productName?.trim()) {
      params = params.set("productName", filter.productName.trim());
    }
    if (filter.status) {
      params = params.set("status", filter.status);
    }
    if (filter.startDate) {
      params = params.set("startDate", filter.startDate);
    }

    return this.http
      .get<Paginated<Order>>(API.base + API.subOrders.search, { params })
      .pipe(map((p) => this.mapSubOrderStatus(p)));
  }

  updateStatus(subOrderId: string, status: OrderStatus) {
    const params = new HttpParams().set("status", status);
    return this.http.patch(
      API.base + API.subOrders.status(subOrderId),
      {},
      { params },
    );
  }

  deleteSubOrder(subOrderId: string) {
    return this.http.delete(API.base + API.subOrders.delete(subOrderId), {});
  }

  private mapSubOrderStatus(page: Paginated<Order>): Paginated<Order> {
    return {
      ...page,
      content: page.content.map((order) => ({
        ...order,
        status:
          STATUS_FLOW.find((status) =>
            order.subOrders?.some((sub) => sub.status === status),
          ) ?? "PENDING",
      })),
    };
  }
}
