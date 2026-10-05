import { Component, inject, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";

import { OrderDetailsComponent } from "./order-details.component";

@Component({
  selector: "app-order-details-page",
  standalone: true,
  imports: [OrderDetailsComponent],
  template: ` <app-order-details [orderId]="orderId" [isSeller]="isSeller" /> `,
})
export class OrderDetailsPage implements OnInit {
  private readonly route = inject(ActivatedRoute);

  orderId = "";
  isSeller = false;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get("orderId");
    const subid = this.route.snapshot.paramMap.get("subOrderId");
    if (id) {
      this.orderId = id;
    } else if (subid) {
      this.orderId = subid;
      this.isSeller = true;
    }
  }
}
