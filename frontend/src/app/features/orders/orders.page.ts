import { Component, inject } from "@angular/core";

import { OrderListComponent } from "./order-list/order-list.component";
import { ActivatedRoute } from "@angular/router";

@Component({
  selector: "app-orders",
  standalone: true,
  imports: [OrderListComponent],
  template: ` <app-order-list [isSeller]="isSeller" /> `,
})
export class OrdersPage {
  private route = inject(ActivatedRoute);

  type = this.route.snapshot.data["type"];

  isSeller = false;
  ngOnInit() {
    if (this.type === "suborders") {
      this.isSeller = true;
    }
  }
}
