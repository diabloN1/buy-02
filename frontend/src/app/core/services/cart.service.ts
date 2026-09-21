import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";

import { API } from "@core/config/api.config";
import {
  AddToCartItem,
  Cart,
  UpdateCartItem,
} from "@core/models/cart.model";

@Injectable({ providedIn: "root" })
export class CartService {
  private readonly http = inject(HttpClient);

  getCart(): Observable<Cart> {
    return this.http.get<Cart>(API.base + API.carts.root);
  }

  addToCart(body: AddToCartItem): Observable<Cart> {
    return this.http.post<Cart>(API.base + API.carts.root, body);
  }

  updateItemQuantity(
    productId: string,
    quantity: number,
  ): Observable<Cart> {
    return this.http.put<Cart>(API.base + API.carts.item(productId), {
      quantity,
    } satisfies UpdateCartItem);
  }

  removeCartItem(productId: string): Observable<Cart> {
    return this.http.delete<Cart>(API.base + API.carts.item(productId));
  }

  clearCart(): Observable<void> {
    return this.http.delete<void>(API.base + API.carts.root);
  }
}
