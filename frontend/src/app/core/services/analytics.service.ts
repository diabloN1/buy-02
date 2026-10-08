import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { API } from "@core/config/api.config";
import { UserAnalytics, SellerAnalytics } from "@core/models/analytics.model";

@Injectable({ providedIn: "root" })
export class AnalyticsService {
  private readonly http = inject(HttpClient);

  getUserAnalytics(): Observable<UserAnalytics> {
    return this.http.get<UserAnalytics>(API.base + API.analytics.user, {});
  }

  getSellerAnalytics(): Observable<SellerAnalytics> {
    return this.http.get<SellerAnalytics>(API.base + API.analytics.seller, {});
  }
}