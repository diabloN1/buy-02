import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { Category } from "@core/models/product.model";
import { API } from "@core/config/api.config";

@Injectable({
  providedIn: "root",
})
export class CategoryService {
  constructor(private http: HttpClient) {}

  getAll(): Observable<Category[]> {
    const url = `${API.base}${API.categories.root}`;

    return this.http.get<Category[]>(url);
  }
}
