import { Injectable, inject } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable } from "rxjs";
import { API } from "@core/config/api.config";
import {
  Product,
  ProductUpsert,
  ProductSearchFilter,
} from "@core/models/product.model";
import { Paginated } from "@core/models/paginated.model";

@Injectable({ providedIn: "root" })
export class ProductService {
  private readonly http = inject(HttpClient);

  search(
    page = 1,
    pageSize = 12,
    filters: ProductSearchFilter = {},
  ): Observable<Paginated<Product>> {
    let params = new HttpParams()
      .set("page", page - 1) 
      .set("size", pageSize);

    if (filters.keyword) params = params.set("keyword", filters.keyword);
    if (filters.minPrice != null)
      params = params.set("minPrice", filters.minPrice);
    if (filters.maxPrice != null)
      params = params.set("maxPrice", filters.maxPrice);
    if (filters.categoryId)
      params = params.set("categoryId", filters.categoryId);
    if (filters.sellerId) params = params.set("sellerId", filters.sellerId);
    if (filters.startDate) params = params.set("startDate", filters.startDate);
    if (filters.endDate) params = params.set("endDate", filters.endDate);

    return this.http.get<Paginated<Product>>(
      API.base + API.products.root + "/search",
      {
        params,
      },
    );
  }

  list(page = 1, pageSize = 12): Observable<Paginated<Product>> {
    let params = new HttpParams().set("page", page - 1).set("size", pageSize);
    return this.http.get<Paginated<Product>>(API.base + API.products.root, {
      params,
    });
  }

  listBySeller(
    page = 1,
    pageSize = 12,
    sellerId: string,
  ): Observable<Paginated<Product>> {
    let params = new HttpParams().set("page", page - 1).set("size", pageSize);
    return this.http.get<Paginated<Product>>(
      API.base + API.products.bySeller(sellerId),
      {
        params,
      },
    );
  }

  get(id: string): Observable<Product> {
    return this.http.get<Product>(API.base + API.products.byId(id));
  }

  create(body: ProductUpsert, images: File[]): Observable<Product> {
    const formData = new FormData();

    formData.append(
      "product",
      new Blob([JSON.stringify(body)], {
        type: "application/json",
      }),
    );

    images.forEach((file) => {
      formData.append("images", file);
    });

    return this.http.post<Product>(API.base + API.products.root, formData);
  }

  update(
    id: string,
    body: ProductUpsert,
    images: File[],
    deletedImageIds: string[],
  ): Observable<Product> {
    const formData = new FormData();

    formData.append(
      "product",
      new Blob([JSON.stringify(body)], {
        type: "application/json",
      }),
    );

    images.forEach((image) => {
      formData.append("images", image);
    });

    deletedImageIds.forEach((id) => {
      formData.append("deletedImageIds", id);
    });

    return this.http.put<Product>(API.base + API.products.byId(id), formData);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(API.base + API.products.byId(id));
  }

  count(): Observable<number> {
    return this.http.get<number>(API.base + API.products.count);
  }
}
